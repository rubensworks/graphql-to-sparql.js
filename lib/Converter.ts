import {
  BooleanValueNode,
  DefinitionNode, DocumentNode, EnumValueNode, FieldNode, FloatValueNode, FragmentDefinitionNode, FragmentSpreadNode,
  IntValueNode,
  NameNode,
  OperationDefinitionNode, parse,
  SelectionNode,
  StringValueNode,
  ValueNode, VariableNode,
} from "graphql";
import * as DefaultDataFactory from "rdf-data-model";
import * as RDF from "rdf-js";
import {Algebra, Factory} from "sparqlalgebrajs";

/**
 * Translate GraphQL queries into SPARQL algebra.
 */
export class Converter {

  private readonly dataFactory: RDF.DataFactory;
  private readonly operationFactory: Factory;

  constructor(dataFactory?: RDF.DataFactory) {
    this.dataFactory = dataFactory || DefaultDataFactory;
    this.operationFactory = new Factory(this.dataFactory);
  }

  /**
   * Translates a GraphQL query into SPARQL algebra.
   * @param {string} graphqlQuery A GraphQL query string.
   * @param {IContext} context A JSON-LD context.
   * @return {Operation}
   */
  public graphqlToSparqlAlgebra(graphqlQuery: string, context: IContext): Algebra.Operation {
    const document: DocumentNode = parse(graphqlQuery);

    const queryParseContext: IConvertContext = {
      context,
      fragmentDefinitions: this.indexFragments(document),
      path: [],
      terminalVariables: [],
    };
    return this.operationFactory.createProject(
      <Algebra.Operation> document.definitions.map(this.definitionToPattern.bind(this, queryParseContext)).reduce(
      (prev: Algebra.Operation, current: Algebra.Operation) => {
        if (!prev) {
          return current;
        }
        return this.operationFactory.createUnion(prev, current);
      }, null), queryParseContext.terminalVariables);
  }

  /**
   * Create an index of all fragment definitions in the given document.
   *
   * This will assign a new array of definition nodes without fragment definition.
   *
   * @param {DocumentNode} document A document node.
   * @return {{[p: string]: FragmentDefinitionNode}} An index of fragment definition nodes.
   */
  public indexFragments(document: DocumentNode): {[name: string]: FragmentDefinitionNode} {
    const fragmentDefinitions: {[name: string]: FragmentDefinitionNode} = {};
    const newDefinitions: DefinitionNode[] = [];
    for (const definition of document.definitions) {
      if (definition.kind === 'FragmentDefinition') {
        fragmentDefinitions[definition.name.value] = definition;
      } else {
        newDefinitions.push(definition);
      }
    }
    (<any> document).definitions = newDefinitions;
    return fragmentDefinitions;
  }

  /**
   * Convert a GraphQL definition node into an algebra operation.
   * @param {IConvertContext} convertContext A convert context.
   * @param {DefinitionNode} definition A GraphQL definition node.
   * @return {Operation} A SPARQL algebra operation.
   */
  public definitionToPattern(convertContext: IConvertContext, definition: DefinitionNode): Algebra.Operation {
    switch (definition.kind) {
    case 'OperationDefinition':
      const operationDefinition: OperationDefinitionNode = <OperationDefinitionNode> definition;
      if (operationDefinition.operation !== 'query') {
        throw new Error('Unsupported definition operation: ' + operationDefinition.operation);
      }
      // We ignore the query name, as SPARQL doesn't support naming queries.

      const subject: RDF.Term = this.dataFactory.blankNode();

      // TODO: variables, directives, selections

      return this.operationFactory.createBgp([].concat.apply([], operationDefinition.selectionSet.selections
        .map(this.selectionToPatterns.bind(this, convertContext, subject))));
    case 'FragmentDefinition':
      throw new Error('Illegal state: fragment definitions must be indexed and removed before processing');
    default:
      throw new Error('Unsupported definition node: ' + definition.kind);
    }
  }

  /**
   * Convert a GraphQL selection node into an algebra operation.
   * @param {IConvertContext} convertContext A convert context.
   * @param {Term} subject The RDF term that should be used as subject.
   * @param {SelectionNode} selectionNode A GraphQL selection node.
   * @return {Pattern[]} An array of quad patterns.
   */
  public selectionToPatterns(convertContext: IConvertContext, subject: RDF.Term,
                             selectionNode: SelectionNode): Algebra.Pattern[] {
    let nest: boolean = true;
    switch (selectionNode.kind) {
    case 'FragmentSpread':
      const fragmentSpreadNode: FragmentSpreadNode = <FragmentSpreadNode> selectionNode;
      const fragmentDefinitionNode: FragmentDefinitionNode = convertContext
        .fragmentDefinitions[fragmentSpreadNode.name.value];
      if (!fragmentDefinitionNode) {
        throw new Error('Undefined fragment definition: ' + fragmentSpreadNode.name.value);
      }

      // TODO: handle typeCondition

      const newFieldNode: FieldNode = {
        alias: null,
        arguments: null,
        directives: fragmentDefinitionNode.directives,
        kind: 'Field',
        name: fragmentSpreadNode.name,
        selectionSet: fragmentDefinitionNode.selectionSet,
      };
      nest = false;
      selectionNode = newFieldNode;
      // No break, continue as field.
    case 'Field':
      const fieldNode: FieldNode = <FieldNode> selectionNode;
      const predicate: RDF.NamedNode = this.valueToNamedNode(fieldNode.name.value, convertContext.context);
      // Aliases change the variable name (and path name)
      const object: RDF.Variable = this.nameToVariable(fieldNode.alias ? fieldNode.alias : fieldNode.name,
        convertContext);
      // Create at least a pattern for the parent node and the current path.
      let patterns: Algebra.Pattern[] = [];
      if (nest) {
        patterns = [
          this.operationFactory.createPattern(subject, predicate, object),
        ];
      }

      // Create patterns for the node's arguments
      if (fieldNode.arguments && fieldNode.arguments.length) {
        for (const argument of fieldNode.arguments) {
          patterns.push(this.operationFactory.createPattern(object,
            this.valueToNamedNode(argument.name.value, convertContext.context),
            this.valueToTerm(argument.value, convertContext.context)));
        }
      }

      // Recursive call for nested selection sets
      if (fieldNode.selectionSet && fieldNode.selectionSet.selections.length) {
        // Change path value when there was an alias on this node.
        const pathSubValue: string = fieldNode.alias ? fieldNode.alias.value : fieldNode.name.value;
        const subConvertContext: IConvertContext = nest ? Object.assign(Object.assign({}, convertContext),
          { path: convertContext.path.concat([pathSubValue]) }) : convertContext;
        for (const subPatterns of fieldNode.selectionSet.selections
          .map(this.selectionToPatterns.bind(this, subConvertContext, nest ? object : subject))) {
          patterns = patterns.concat(<Algebra.Pattern[]> subPatterns);
        }
      } else if (nest) {
        // If no nested selection sets exist,
        // consider the object variable as a terminal variable that should be selected.
        convertContext.terminalVariables.push(object);
      }

      // TODO: directives

      return patterns;
    case 'InlineFragment':
      throw new Error('Not implemented yet'); // TODO
    }
  }

  /**
   * Convert a name node to a variable built from the node name and the current path inside the context.
   * @param {NameNode} name A name node.
   * @param {IConvertContext} convertContext A convert context.
   * @return {Variable} A variable.
   */
  public nameToVariable(name: NameNode, convertContext: IConvertContext): RDF.Variable {
    return this.dataFactory.variable((convertContext.path.length ? convertContext.path.join('_') + '_' : '')
      + name.value);
  }

  /**
   * Convert a GraphQL term into a URI using the given context.
   * @param {string} value A GraphQL term.
   * @param {IContext} context A JSON-LD context.
   * @return {NamedNode} A named node.
   */
  public valueToNamedNode(value: string, context: IContext): RDF.NamedNode {
    return this.dataFactory.namedNode(context[value] || value);
  }

  /**
   * Convert a GraphQL value into an RDF term.
   * @param {ValueNode} valueNode A GraphQL value node.
   * @param {IContext} context A JSON-LD context.
   * @return {Term} An RDF term.
   */
  public valueToTerm(valueNode: ValueNode, context: IContext): RDF.Term {
    switch (valueNode.kind) {
    case 'Variable':
      return this.dataFactory.variable((<VariableNode> valueNode).name.value);
    case 'IntValue':
      return this.dataFactory.literal((<IntValueNode> valueNode).value,
        this.dataFactory.namedNode('http://www.w3.org/2001/XMLSchema#integer'));
    case 'FloatValue':
      return this.dataFactory.literal((<FloatValueNode> valueNode).value,
        this.dataFactory.namedNode('http://www.w3.org/2001/XMLSchema#float'));
    case 'StringValue':
      return this.dataFactory.literal((<StringValueNode> valueNode).value);
    case 'BooleanValue':
      return this.dataFactory.literal((<BooleanValueNode> valueNode).value ? 'true' : 'false',
        this.dataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean'));
    case 'NullValue':
      return this.dataFactory.blankNode(); // TODO: Not sure about this one yet...
    case 'EnumValue':
      return this.valueToNamedNode((<EnumValueNode> valueNode).value, context);
    case 'ListValue':
      throw new Error('Not implemented yet'); // TODO
    case 'ObjectValue':
      throw new Error('Not implemented yet'); // TODO
    }
  }

}

/**
 * A context object that is passed through conversion steps.
 */
export interface IConvertContext {
  /**
   * A JSON-LD context.
   */
  context: IContext;
  /**
   * The current JSON path within the GraphQL query.
   */
  path: string[];
  /**
   * All variables that have no deeper child and should be selected withing the GraphQL query.
   */
  terminalVariables: RDF.Variable[];
  /**
   * All available fragment definitions.
   */
  fragmentDefinitions: {[name: string]: FragmentDefinitionNode};
}

/**
 * A JSON-LD context.
 */
export interface IContext {
  [id: string]: string;
}
