import * as DefaultDataFactory from "@rdfjs/data-model";
import {ArgumentNode, FieldNode, NamedTypeNode, NameNode, ValueNode} from "graphql/language";
import {ContextParser, IJsonLdContextNormalized} from "jsonld-context-parser";
import * as RDF from "rdf-js";
import {Algebra, Factory} from "sparqlalgebrajs";
import {IValueNodeHandlerOutput, NodeHandlerAdapter, NodeValueHandlerAdapter} from "./handler";
import {IConvertContext} from "./IConvertContext";
import {IConvertSettings} from "./IConvertSettings";
import {
  DirectiveNodeHandlerAdapter,
  IDirectiveContext,
  IDirectiveNodeHandlerOutput
} from "./handler/directivenode/DirectiveNodeHandlerAdapter";

/**
 * Utilities for conversion.
 */
export class Util {

  public readonly dataFactory: RDF.DataFactory;
  public readonly operationFactory: Factory;
  public readonly contextParser: ContextParser;

  protected readonly settings: IConvertSettings;

  private readonly nodeHandlers: {[kind: string]: NodeHandlerAdapter<any>} = {};
  private readonly nodeValueHandlers: {[kind: string]: NodeValueHandlerAdapter<any>} = {};
  private readonly directiveNodeHandlers: {[kind: string]: DirectiveNodeHandlerAdapter} = {};

  constructor(settings: IConvertSettings) {
    this.settings = settings;
    this.dataFactory = settings.dataFactory || DefaultDataFactory;
    this.operationFactory = new Factory(this.dataFactory);
    this.contextParser = new ContextParser();
  }

  /**
   * Register a new {@link NodeHandlerAdapter}.
   * @param {NodeHandlerAdapter<any>} nodeHandler A handler for converting GraphQL nodes to operations.
   */
  public registerNodeHandler(nodeHandler: NodeHandlerAdapter<any>) {
    this.nodeHandlers[nodeHandler.targetKind] = nodeHandler;
  }

  /**
   * Register a new {@link NodeValueHandlerAdapter}
   * @param {NodeValueHandlerAdapter<any>} nodeValueHandler A handler for converting GraphQL value nodes
   *                                                        to terms and patterns.
   */
  public registerNodeValueHandler(nodeValueHandler: NodeValueHandlerAdapter<any>) {
    this.nodeValueHandlers[nodeValueHandler.targetKind] = nodeValueHandler;
  }

  /**
   * Register a new {@link DirectiveNodeHandlerAdapter}
   * @param {DirectiveNodeHandlerAdapter} directiveNodeHandler A handler for handling GraphQL directives.
   */
  public registerDirectiveNodeHandler(directiveNodeHandler: DirectiveNodeHandlerAdapter) {
    this.directiveNodeHandlers[directiveNodeHandler.targetKind] = directiveNodeHandler;
  }

  /**
   * Get the operation for the given GraphQL node.
   * @param {T} node A GraphQL node.
   * @param {IConvertContext} convertContext A conversion context.
   * @return {Operation} A SPARQL algebra operation.
   */
  public handleNode<T extends { kind: string }>(node: T, convertContext: IConvertContext): Algebra.Operation {
    const nodeHandler = this.nodeHandlers[node.kind];
    if (!nodeHandler) {
      throw new Error(`Unsupported GraphQL node '${node.kind}'`);
    }
    return nodeHandler.handle(node, convertContext);
  }

  /**
   * Get the terms and patterns for the given value node.
   * @param {T} node A GraphQL node.
   * @param {string} fieldName The name of the field or argument in which the value was encapsulated.
   * @param {IConvertContext} convertContext A conversion context.
   * @return {IValueNodeHandlerOutput} The RDF terms and patterns.
   */
  public handleNodeValue<T extends ValueNode>(node: T, fieldName: string,
                                              convertContext: IConvertContext): IValueNodeHandlerOutput {
    const nodeValueHandler = this.nodeValueHandlers[node.kind];
    if (!nodeValueHandler) {
      throw new Error(`Unsupported GraphQL value node '${node.kind}'`);
    }
    return nodeValueHandler.handle(node, fieldName, convertContext);
  }

  /**
   * Get the handler output for the given directive.
   * @param {IDirectiveContext} directiveContext The current directive context.
   * @param {IConvertContext} convertContext A conversion context.
   * @return {IDirectiveNodeHandlerOutput} The directive node handler output or null.
   */
  public handleDirectiveNode(directiveContext: IDirectiveContext, convertContext: IConvertContext)
    : IDirectiveNodeHandlerOutput {
    const directiveNodeHandler = this.directiveNodeHandlers[directiveContext.directive.name.value];
    if (!directiveNodeHandler) {
      return null;
    }
    return directiveNodeHandler.handle(directiveContext, convertContext);
  }

  /**
   * Join the given array of operations.
   * If all operations are BGPs, then a single big BGP with all patterns from the given BGPs will be created.
   * @param {Operation[]} operations An array of operations.
   * @return {Operation} A single joined operation.
   */
  public joinOperations(operations: Algebra.Operation[]): Algebra.Operation {
    if (!operations.length) {
      throw new Error('Can not make a join of no operations');
    }
    if (operations.length === 1) {
      return operations[0];
    }

    // Check if all operations are BGPs
    let bgps: boolean = true;
    for (const operation of operations) {
      if (operation.type !== 'bgp') {
        bgps = false;
        break;
      }
    }

    if (bgps) {
      // Create a big BGP from all BGPs
      return this.operationFactory.createBgp([].concat.apply([], operations
        .map((op) => (<Algebra.Bgp> op).patterns)));
    } else {
      // Create nested joins
      return operations.reverse().reduce((prev, cur) => prev ? this.operationFactory.createJoin(cur, prev) : cur, null);
    }
  }

  /**
   * Append a field's label to a path.
   * @param {string[]} path A path.
   * @param {string} fieldLabel A field label.
   * @return {string[]} A new path array.
   */
  public appendFieldToPath(path: string[], fieldLabel: string): string[] {
    return path.concat([fieldLabel]);
  }

  /**
   * Get the label of a field by taking into account the alias.
   * @param {FieldNode} field A field node.
   * @return {string} The field name or alias.
   */
  public getFieldLabel(field: FieldNode): string {
    return (field.alias ? field.alias : field.name).value;
  }

  /**
   * Convert a field node to a variable built from the node name and the current path inside the context.
   * @param {string} fieldLabel A field label.
   * @param {IConvertContext} convertContext A convert context.
   * @param {string} variableDelimiter A variable delimiter.
   * @return {Variable} A variable.
   */
  public nameToVariable(fieldLabel: string, convertContext: IConvertContext): RDF.Variable {
    return this.dataFactory.variable((convertContext.path.length
      ? convertContext.path.join(this.settings.variableDelimiter) + this.settings.variableDelimiter : '') + fieldLabel);
  }

  /**
   * Convert a GraphQL term into a URI using the given context.
   * @param {string} value A GraphQL term.
   * @param {IContext} context A JSON-LD context.
   * @return {NamedNode} A named node.
   */
  public valueToNamedNode(value: string, context: IJsonLdContextNormalized): RDF.NamedNode {
    let contextValue: any = context[value];
    if (this.settings.requireContext && !contextValue) {
      throw new Error('No context entry was found for ' + value);
    }
    if (contextValue && !(typeof contextValue === 'string')) {
      contextValue = contextValue['@id'];
    }
    return this.dataFactory.namedNode(contextValue || value);
  }

  /**
   * Get an argument by name.
   * This will return null if the argument could not be found.
   * @param {ReadonlyArray<ArgumentNode>} args Arguments or null.
   * @param {string} name The name of an argument.
   * @return {ArgumentNode} The named argument.
   */
  public getArgument(args: ReadonlyArray<ArgumentNode> | null, name: string): ArgumentNode {
    if (args) {
      for (const argument of args) {
        if (argument.name.value === name) {
          return argument;
        }
      }
    }
    return null;
  }

  /**
   * Create a pattern with an rdf:type predicate.
   * @param {Term} subject The subject.
   * @param {NamedTypeNode} typeCondition The object name.
   * @param {IConvertContext} convertContext A convert context.
   * @return {Pattern} A pattern.
   */
  public newTypePattern(subject: RDF.Term, typeCondition: NamedTypeNode, convertContext: IConvertContext) {
    return this.operationFactory.createPattern(
      subject,
      this.dataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      this.valueToNamedNode(typeCondition.name.value, convertContext.context),
      convertContext.graph);
  }

  /**
   * Create a quad pattern when the predicate is a name node that needs to be translated using the context.
   * @param {Term} subject The subject.
   * @param {NameNode} predicateName The name node for the predicate.
   * @param {Term} object The object.
   * @param {Term} graph The graph.
   * @param {IContext} context A context.
   * @return {Pattern} A quad pattern.
   */
  public createQuadPattern(subject: RDF.Term, predicateName: NameNode, object: RDF.Term, graph: RDF.Term,
                           context: IJsonLdContextNormalized): Algebra.Pattern {
    const predicate: RDF.NamedNode = this.valueToNamedNode(predicateName.value, context);
    if (context && context[predicateName.value]
      && (<any> context[predicateName.value])['@reverse']) {
      return this.operationFactory.createPattern(object, predicate, subject, graph);
    }
    return this.operationFactory.createPattern(subject, predicate, object, graph);
  }

}
