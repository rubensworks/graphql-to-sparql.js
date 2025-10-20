import {DataFactory} from "rdf-data-factory";
import {ArgumentNode, FieldNode, ListValueNode, NamedTypeNode, NameNode, ValueNode} from "graphql/language";
import {ContextParser, JsonLdContextNormalized} from "jsonld-context-parser";
import * as RDF from "@rdfjs/types";
import type {Algebra} from "@traqula/algebra-transformations-1-2";
import {AlgebraFactory} from "@traqula/algebra-transformations-1-2";
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
  public readonly operationFactory: AlgebraFactory;
  public readonly contextParser: ContextParser;

  protected readonly settings: IConvertSettings;

  private readonly nodeHandlers: {[kind: string]: NodeHandlerAdapter<any>} = {};
  private readonly nodeValueHandlers: {[kind: string]: NodeValueHandlerAdapter<any>} = {};
  private readonly directiveNodeHandlers: {[kind: string]: DirectiveNodeHandlerAdapter} = {};

  constructor(settings: IConvertSettings) {
    this.settings = settings;
    this.dataFactory = settings.dataFactory || new DataFactory();
    this.operationFactory = new AlgebraFactory(this.dataFactory);
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
    : IDirectiveNodeHandlerOutput | null {
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
    if (operations.length === 1) {
      return operations[0];
    }

    // Check if which operations are BGPs
    const bgps: Algebra.Operation[] = [];
    const nonBgps: Algebra.Operation[] = [];
    for (const operation of operations) {
      if (operation.type === 'bgp') {
        bgps.push(operation);
      } else {
        nonBgps.push(operation);
      }
    }

    if (bgps.length === operations.length) {
      // Create a big BGP from all BGPs
      return this.joinOperationsAsBgp(bgps);
    } else if (bgps.length === operations.length - 1
      && nonBgps[0].type === 'leftjoin'
      && nonBgps[0].input[0].type === 'bgp') {
      // Check if we have one left-join (with a BGP on the left), and the rest are BGPs.
      // If so, merge the BGPS within the left-hand-side of the left-join.
      const originalLeftJoin: Algebra.LeftJoin = <Algebra.LeftJoin> nonBgps[0];
      bgps.push(originalLeftJoin.input[0]);
      return this.operationFactory.createLeftJoin(
        this.joinOperationsAsBgp(bgps),
        originalLeftJoin.input[1],
      );
    } else if (nonBgps.length === operations.length) {
      // Create nested joins
      return this.joinOperationsAsNestedJoin(nonBgps);
    } else {
      // Join as much BGPs together as possible, and join with the other operations
      return this.joinOperationsAsNestedJoin([
        this.joinOperationsAsBgp(bgps),
        this.joinOperationsAsNestedJoin(nonBgps),
      ]);
    }
  }

  public joinOperationsAsBgp(operations: Algebra.Operation[]): Algebra.Operation {
    return this.operationFactory.createBgp((<Algebra.Pattern[]> []).concat.apply([], operations
      .map((op) => (<Algebra.Bgp> op).patterns)));
  }

  public joinOperationsAsNestedJoin(operations: Algebra.Operation[]): Algebra.Operation {
    return this.operationFactory.createJoin(operations);
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
    return this.dataFactory.variable!((convertContext.path.length
      ? convertContext.path.join(this.settings.variableDelimiter) + this.settings.variableDelimiter : '') + fieldLabel);
  }

  /**
   * Convert a GraphQL term into a URI using the given context.
   * @param {string} value A GraphQL term.
   * @param {IContext} context A JSON-LD context.
   * @return {NamedNode} A named node.
   */
  public valueToNamedNode(value: string, context: JsonLdContextNormalized): RDF.NamedNode {
    const contextValue = context.expandTerm(value, true);
    if (this.settings.requireContext && !contextValue) {
      throw new Error('No context entry was found for ' + value);
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
  public getArgument(args: ReadonlyArray<ArgumentNode> | undefined, name: string): ArgumentNode | undefined {
    if (args) {
      for (const argument of args) {
        if (argument.name.value === name) {
          return argument;
        }
      }
    }
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
                           context: JsonLdContextNormalized): Algebra.Pattern {
    const predicate: RDF.NamedNode = this.valueToNamedNode(predicateName.value, context);
    if (context && context.getContextRaw()[predicateName.value]
      && (<any> context.getContextRaw()[predicateName.value])['@reverse']) {
      return this.operationFactory.createPattern(object, predicate, subject, graph);
    }
    return this.operationFactory.createPattern(subject, predicate, object, graph);
  }

  /**
   * Create a quad path when the predicate is a list node with field alternatives
   * that need to be translated using the context.
   * @param {Term} subject The subject.
   * @param {NameNode} predicateName The name node for the predicate.
   * @param {Term} object The object.
   * @param {Term} graph The graph.
   * @param {IContext} context A context.
   * @return {Path} A quad property path.
   */
  public createQuadPath(subject: RDF.Term, predicateName: NameNode, predicateAlternatives: ListValueNode,
                        object: RDF.Term, graph: RDF.Term,
                        context: JsonLdContextNormalized): Algebra.Path {
    const predicateInitial: RDF.NamedNode = this.valueToNamedNode(predicateName.value, context);
    let pathSymbol: Algebra.PropertyPathSymbol = this.operationFactory.createLink(predicateInitial);

    // Add all fields in the list as predicate alternatives
    for (const predicateAlternative of predicateAlternatives.values) {
      if (predicateAlternative.kind !== 'EnumValue') {
        throw new Error('Invalid value type for \'alt\' argument, must be EnumValue, but got '
          + predicateAlternative.kind);
      }
      pathSymbol = this.operationFactory.createAlt([
        pathSymbol,
        this.operationFactory.createLink(this.valueToNamedNode(predicateAlternative.value, context)),
      ]);
    }

    // Reverse the path based on the initial predicate
    if (context && context.getContextRaw()[predicateName.value]
      && (<any> context.getContextRaw()[predicateName.value])['@reverse']) {
      return this.operationFactory.createPath(object, pathSymbol, subject, graph);
    }
    return this.operationFactory.createPath(subject, pathSymbol, object, graph);
  }

}
