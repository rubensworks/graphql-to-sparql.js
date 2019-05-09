import {FieldNode, IntValueNode, SelectionNode} from "graphql/language";
import * as RDF from "rdf-js";
import {Algebra} from "sparqlalgebrajs";
import {IConvertContext, SingularizeState} from "../IConvertContext";
import {IConvertSettings} from "../IConvertSettings";
import {Util} from "../Util";
import {INodeQuadContext, NodeHandlerAdapter} from "./NodeHandlerAdapter";

/**
 * A handler for converting GraphQL selection nodes to operations.
 */
export abstract class NodeHandlerSelectionAdapter<T extends SelectionNode> extends NodeHandlerAdapter<T> {

  constructor(targetKind: T['kind'], util: Util, settings: IConvertSettings) {
    super(targetKind, util, settings);
  }

  /**
   * Get the quad context of a field node that should be used for the whole definition node.
   * @param {FieldNode} field A field node.
   * @param {string} fieldLabel A field label.
   * @param {IConvertContext} convertContext A convert context.
   * @return {INodeQuadContext | null} The subject and optional auxiliary patterns.
   */
  public getNodeQuadContextFieldNode(field: FieldNode, fieldLabel: string, convertContext: IConvertContext)
    : INodeQuadContext | null {
    return this.getNodeQuadContextSelectionSet(field.selectionSet, fieldLabel, {
      ...convertContext,
      path: this.util.appendFieldToPath(convertContext.path, fieldLabel),
    });
  }

  /**
   * Convert a field node to an operation.
   * @param {IConvertContext} convertContext A convert context.
   * @param {FieldNode} fieldNode The field node to convert.
   * @param {boolean} pushTerminalVariables If terminal variables should be created.
   * @param {Pattern[]} auxiliaryPatterns Optional patterns that should be part of the BGP.
   * @return {Operation} The reslting operation.
   */
  public fieldToOperation(convertContext: IConvertContext, fieldNode: FieldNode,
                          pushTerminalVariables: boolean, auxiliaryPatterns?: Algebra.Pattern[]): Algebra.Operation {
    // If a deeper node is being selected, and if the current object should become the next subject
    const nesting = pushTerminalVariables;

    // Offset and limit can be changed using the magic arguments 'first' and 'offset'.
    let offset = 0;
    let limit;

    // Ignore 'id' and 'graph' fields, because we have processed them earlier in getNodeQuadContextSelectionSet.
    if (fieldNode.name.value === 'id' || fieldNode.name.value === 'graph') {
      pushTerminalVariables = false;
    }

    // Determine the field label for variable naming, taking into account aliases
    const fieldLabel: string = this.util.getFieldLabel(fieldNode);

    // Handle the singular/plural scope
    if (convertContext.singularizeState === SingularizeState.SINGLE) {
      convertContext.singularizeVariables[this.util.nameToVariable(fieldLabel, convertContext).value] = true;
    }

    // Handle meta fields
    if (pushTerminalVariables) {
      const operationOverride = this.handleMetaField(convertContext, fieldLabel, auxiliaryPatterns);
      if (operationOverride) {
        return operationOverride;
      }
    }

    let patterns: Algebra.Pattern[] = auxiliaryPatterns ? auxiliaryPatterns.concat([]) : [];

    // Define subject and object
    const subjectOutput = this.getNodeQuadContextFieldNode(fieldNode, fieldLabel, convertContext);
    let object: RDF.Term = subjectOutput.subject || this.util.nameToVariable(fieldLabel, convertContext);
    let graph: RDF.Term = subjectOutput.graph || convertContext.graph;
    if (subjectOutput.auxiliaryPatterns) {
      patterns = patterns.concat(subjectOutput.auxiliaryPatterns);
    }

    // Check if there is a '_' argument
    // We do this before handling all other arguments so that the order of final triple patterns is sane.
    let overrideObjectTerms: RDF.Term[] = null;
    if (pushTerminalVariables && fieldNode.arguments && fieldNode.arguments.length) {
      for (const argument of fieldNode.arguments) {
        if (argument.name.value === '_') {
          // '_'-arguments do not create an additional predicate link, but set the value directly.
          const valueOutput = this.util.handleNodeValue(argument.value, fieldNode.name.value, convertContext);
          overrideObjectTerms = valueOutput.terms;
          valueOutput.terms.forEach((term) => patterns.push(this.util.createQuadPattern(
            convertContext.subject, fieldNode.name, term, convertContext.graph, convertContext.context)));
          if (valueOutput.auxiliaryPatterns) {
            patterns = patterns.concat(valueOutput.auxiliaryPatterns);
          }
          pushTerminalVariables = false;
          break;
        } else if (argument.name.value === 'graph') {
          // 'graph'-arguments do not create an additional predicate link, but set the graph.
          const valueOutput = this.util.handleNodeValue(argument.value, fieldNode.name.value, convertContext);
          if (valueOutput.terms.length !== 1) {
            throw new Error(`Only single values can be set as graph, but got ${valueOutput.terms
              .length} at ${fieldNode.name.value}`);
          }
          graph = valueOutput.terms[0];
          convertContext = { ...convertContext, graph };
          if (valueOutput.auxiliaryPatterns) {
            patterns = patterns.concat(valueOutput.auxiliaryPatterns);
          }
          break;
        }
      }
    }

    // Create at least a pattern for the parent node and the current path.
    if (pushTerminalVariables) {
      patterns.push(this.util.createQuadPattern(convertContext.subject, fieldNode.name, object,
        convertContext.graph, convertContext.context));
    }

    // Create patterns for the node's arguments
    if (fieldNode.arguments && fieldNode.arguments.length) {
      for (const argument of fieldNode.arguments) {
        if (argument.name.value === '_' || argument.name.value === 'graph') {
          // no-op
        } else if (argument.name.value === 'first') {
          if (argument.value.kind !== 'IntValue') {
            throw new Error('Invalid value type for \'first\' argument: ' + argument.value.kind);
          }
          limit = parseInt((<IntValueNode> argument.value).value, 10);
        } else if (argument.name.value === 'offset') {
          if (argument.value.kind !== 'IntValue') {
            throw new Error('Invalid value type for \'offset\' argument: ' + argument.value.kind);
          }
          offset = parseInt((<IntValueNode> argument.value).value, 10);
        } else {
          const valueOutput = this.util.handleNodeValue(argument.value, argument.name.value, convertContext);
          for (const term of valueOutput.terms) {
            patterns.push(this.util.createQuadPattern(
              object, argument.name, term, convertContext.graph, convertContext.context));
          }
          if (valueOutput.auxiliaryPatterns) {
            patterns = patterns.concat(valueOutput.auxiliaryPatterns);
          }
        }
      }
    }

    // Directives
    const directivesOverride = this.getDirectivesOverride(fieldNode.directives, fieldLabel, convertContext);
    if (directivesOverride) {
      return directivesOverride;
    }

    // Recursive call for nested selection sets
    let operation: Algebra.Operation = this.util.operationFactory.createBgp(patterns);
    if (fieldNode.selectionSet && fieldNode.selectionSet.selections.length) {
      // Override the object if needed
      if (overrideObjectTerms) {
        if (overrideObjectTerms.length !== 1) {
          throw new Error(`Only single values can be set as id, but got ${overrideObjectTerms
            .length} at ${fieldNode.name.value}`);
        }
        object = overrideObjectTerms[0];
      }

      // Change path value when there was an alias on this node.
      const subConvertContext: IConvertContext = {
        ...convertContext,
        ...nesting ? { path: this.util.appendFieldToPath(convertContext.path, fieldLabel) } : {},
        graph,
        subject: nesting ? object : convertContext.subject,
      };

      // If the magic keyword 'totalCount' is present, include a count aggregator.
      let totalCount: boolean = false;
      const selections: ReadonlyArray<SelectionNode> = fieldNode.selectionSet.selections
        .filter((selection) => {
          if (selection.kind === 'Field' && selection.name.value === 'totalCount') {
            totalCount = true;
            return false;
          }
          return true;
        });

      let joinedOperation = this.util.joinOperations([operation]
        .concat(selections.map((selectionNode) => this.util.handleNode(selectionNode, subConvertContext))));

      // Modify the operation if there was a count selection
      if (totalCount) {
        // Create to a count aggregation
        const expressionVariable = this.util.dataFactory.variable('var' + this.settings.expressionVariableCounter++);
        const countOverVariable: RDF.Variable = this.util.dataFactory
          .variable(object.value + this.settings.variableDelimiter + 'totalCount');
        const aggregator: Algebra.BoundAggregate = this.util.operationFactory.createBoundAggregate(expressionVariable,
          'count', this.util.operationFactory.createTermExpression(object), false);

        const countProject = this.util.operationFactory.createProject(
          this.util.operationFactory.createExtend(
            this.util.operationFactory.createGroup(operation, [], [aggregator]), countOverVariable,
            this.util.operationFactory.createTermExpression(expressionVariable),
          ),
          [countOverVariable],
        );
        convertContext.terminalVariables.push(countOverVariable);

        // If no other selections exist (next to totalCount),
        // then we just return the count operations as-is,
        // otherwise, we join the count operation with all other selections
        if (!selections.length) {
          joinedOperation = countProject;
        } else {
          joinedOperation = this.util.operationFactory.createJoin(
            this.util.operationFactory.createProject(joinedOperation, []),
            countProject,
          );
        }
      }

      operation = joinedOperation;
    } else if (pushTerminalVariables && object.termType === 'Variable') {
      // If no nested selection sets exist,
      // consider the object variable as a terminal variable that should be selected.
      convertContext.terminalVariables.push(object);
    }

    // Wrap the operation in a slice if a 'first' or 'offset' argument was provided.
    if (offset || limit) {
      operation = this.util.operationFactory
        .createSlice(this.util.operationFactory.createProject(operation, []), offset, limit);
    }

    return operation;
  }

  /**
   * Check if the given node is a meta field, for things like introspection.
   * If so, return a new operation for this, otherwise, null is returned.
   * @param {IConvertContext} convertContext A convert context.
   * @param {Term} subject The subject.
   * @param {string} fieldLabel The field label to convert.
   * @param {Pattern[]} auxiliaryPatterns Optional patterns that should be part of the BGP.
   * @return {Operation} An operation or null.
   */
  public handleMetaField(convertContext: IConvertContext, fieldLabel: string,
                         auxiliaryPatterns?: Algebra.Pattern[]): Algebra.Operation {
    // TODO: in the future, we should add support for GraphQL wide range of introspection features:
    // http://graphql.org/learn/introspection/
    if (fieldLabel === '__typename') {
      const object: RDF.Variable = this.util.nameToVariable(fieldLabel, convertContext);
      convertContext.terminalVariables.push(object);
      return this.util.operationFactory.createBgp([
        this.util.operationFactory.createPattern(
          convertContext.subject,
          this.util.dataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          this.util.nameToVariable(fieldLabel, convertContext),
          convertContext.graph,
        ),
      ].concat(auxiliaryPatterns || []));
    }
    return null;
  }

}
