import {
  BooleanValueNode,
  DefinitionNode, DocumentNode, EnumValueNode, FieldNode, FloatValueNode, IntValueNode, NameNode,
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

    const queryParseContext: IConvertContext = { path: [], terminalVariables: [], context };
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
      const subject: RDF.Term = this.dataFactory.blankNode();
      return this.operationFactory.createBgp([].concat.apply([], operationDefinition.selectionSet.selections
        .map(this.selectionToPatterns.bind(this, convertContext, subject))));
    case 'FragmentDefinition':
      throw new Error('Not implemented yet'); // TODO
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
    switch (selectionNode.kind) {
    case 'Field':
      const fieldNode: FieldNode = <FieldNode> selectionNode;
      const predicate: RDF.NamedNode = this.valueToNamedNode(fieldNode.name.value, convertContext.context);
      const object: RDF.Variable = this.nameToVariable(fieldNode.alias ? fieldNode.alias : fieldNode.name,
        convertContext);
      let patterns: Algebra.Pattern[] = [
        this.operationFactory.createPattern(subject, predicate, object),
      ];

      if (fieldNode.arguments && fieldNode.arguments.length) {
        for (const argument of fieldNode.arguments) {
          patterns.push(this.operationFactory.createPattern(object,
            this.valueToNamedNode(argument.name.value, convertContext.context),
            this.valueToTerm(argument.value, convertContext.context)));
        }
      }

      if (fieldNode.selectionSet && fieldNode.selectionSet.selections.length) {
        const pathSubValue: string = fieldNode.alias ? fieldNode.alias.value : fieldNode.name.value;
        const subConvertContext: IConvertContext = Object.assign(Object.assign({}, convertContext),
          { path: convertContext.path.concat([pathSubValue]) });
        for (const subPatterns of fieldNode.selectionSet.selections
          .map(this.selectionToPatterns.bind(this, subConvertContext, object))) {
          patterns = patterns.concat(<Algebra.Pattern[]> subPatterns);
        }
      } else {
        convertContext.terminalVariables.push(object);
      }

      // TODO: directives

      return patterns;
    case 'FragmentSpread':
      throw new Error('Not implemented yet'); // TODO
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
}

/**
 * A JSON-LD context.
 */
export interface IContext {
  [id: string]: string;
}
