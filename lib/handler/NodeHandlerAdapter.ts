import {ArgumentNode, DirectiveNode, FieldNode, SelectionSetNode} from "graphql/language";
import * as RDF from "rdf-js";
import {Algebra} from "sparqlalgebrajs";
import {IConvertContext} from "../IConvertContext";
import {IConvertSettings} from "../IConvertSettings";
import {Util} from "../Util";

/**
 * A handler for converting GraphQL nodes to operations.
 */
export abstract class NodeHandlerAdapter<T extends { kind: string }> {

  public readonly targetKind: string;
  protected readonly util: Util;
  protected readonly settings: IConvertSettings;

  constructor(targetKind: T['kind'], util: Util, settings: IConvertSettings) {
    this.targetKind = targetKind;
    this.util = util;
    this.settings = settings;
  }

  /**
   * Get the operation for the given GraphQL node.
   * @param {T} node A GraphQL node.
   * @param {IConvertContext} convertContext A conversion context.
   * @return {Operation} A SPARQL algebra operation.
   */
  public abstract handle(node: T, convertContext: IConvertContext): Algebra.Operation;

  /* ----- Node quad context ----- */

  /**
   * Get the quad context of a selection set node that should be used for the whole definition node.
   *
   * This is a pre-processing step of selection sets.
   * Its only purpose is to determine the subject within a selection set,
   * because this subject is needed to link with its parent.
   * In a later phase, the selection set will be processed using the discovered subject,
   * and the field identifying the subject will be ignored.
   *
   * @param {SelectionSetNode} selectionSet A selection set node.
   * @param {IConvertContext} convertContext A convert context.
   * @return {INodeQuadContext} The subject, graph and auxiliary patterns.
   */
  public getNodeQuadContextSelectionSet(selectionSet: SelectionSetNode | null, convertContext: IConvertContext)
    : INodeQuadContext {
    const nodeQuadContext: INodeQuadContext = {};
    if (selectionSet) {
      for (const selectionNode of selectionSet.selections) {
        if (selectionNode.kind === 'Field') {
          const fieldNode = selectionNode;
          this.handleNodeQuadContextField(fieldNode, convertContext, nodeQuadContext, 'id', 'subject');
          this.handleNodeQuadContextField(fieldNode, convertContext, nodeQuadContext, 'graph', 'graph');
        }
      }
    }
    return nodeQuadContext;
  }

  /**
   * Handles a single field for determining the node quad context.
   * @param {FieldNode} fieldNode A field node.
   * @param {IConvertContext} convertContext A convert context.
   * @param {INodeQuadContext} nodeQuadContext The node quad context to populate.
   * @param {string} fieldName The field name to check for.
   * @param {keyof INodeQuadContext} nodeQuadContextKey The key to fill into the node quad context.
   */
  public handleNodeQuadContextField(fieldNode: FieldNode, convertContext: IConvertContext,
                                    nodeQuadContext: INodeQuadContext, fieldName: string,
                                    nodeQuadContextKey: keyof INodeQuadContext) {
    if (!nodeQuadContext[nodeQuadContextKey] && fieldNode.name.value === fieldName) {
      // Get (or set) the nodeQuadContextKey for fieldName fields
      if (!nodeQuadContext[nodeQuadContextKey]) {
        const argument = this.util.getArgument(fieldNode.arguments, '_');
        if (argument) {
          const valueOutput = this.util.handleNodeValue(argument.value, fieldNode.name.value, convertContext);
          if (valueOutput.terms.length !== 1) {
            throw new Error(`Only single values can be set as ${fieldName}, but got ${valueOutput.terms
              .length} at ${fieldNode.name.value}`);
          }
          nodeQuadContext[nodeQuadContextKey] = valueOutput.terms[0];
          if (valueOutput.auxiliaryPatterns) {
            if (!nodeQuadContext.auxiliaryPatterns) {
              nodeQuadContext.auxiliaryPatterns = [];
            }
            nodeQuadContext.auxiliaryPatterns.concat(valueOutput.auxiliaryPatterns);
          }
        }
      }
      if (!nodeQuadContext[nodeQuadContextKey]) {
        const term = this.util.nameToVariable(fieldNode, convertContext);
        convertContext.terminalVariables.push(term);
        nodeQuadContext[nodeQuadContextKey] = term;
      }
    }
  }

  /* ----- Directives ----- */

  /**
   * Get an operation override defined by one of the directives.
   * @param {ReadonlyArray<DirectiveNode>} directives An option directives array.
   * @param {IConvertContext} convertContext A convert context.
   * @return {Algebra.Operation} An overridden operation or null.
   */
  public getDirectivesOverride(directives: ReadonlyArray<DirectiveNode> | null,
                               convertContext: IConvertContext): Algebra.Operation {
    if (directives) {
      for (const directive of directives) {
        if (!this.testDirectives(directive, convertContext)) {
          return this.util.operationFactory.createBgp([]);
        }
      }
    }
    return null;
  }

  /**
   * Check if none of the directives block further handling of the active node.
   * @param {DirectiveNode} directive A directive.
   * @param {IConvertContext} convertContext A convert context.
   * @return {boolean} If processing of the active node should continue.
   */
  public testDirectives(directive: DirectiveNode, convertContext: IConvertContext): boolean {
    let val: RDF.Term;
    switch (directive.name.value) {
    case 'include':
      val = this.getDirectiveConditionalValue(directive, convertContext);
      if (val.termType === 'Literal' && val.value === 'false') {
        return false;
      }
      break;
    case 'skip':
      val = this.getDirectiveConditionalValue(directive, convertContext);
      if (val.termType === 'Literal' && val.value === 'true') {
        return false;
      }
      break;
    default:
      // Ignore all other directives
    }
    return true;
  }

  /**
   * Get the value of the 'if' argument in a directive.
   * @param {DirectiveNode} directive A directive.
   * @param {IConvertContext} convertContext A convert context.
   * @return {Term} The term.
   */
  public getDirectiveConditionalValue(directive: DirectiveNode, convertContext: IConvertContext): RDF.Term {
    const arg: ArgumentNode = this.util.getArgument(directive.arguments, 'if');
    const subValue = this.util.handleNodeValue(arg.value, arg.name.value, convertContext);
    if (subValue.terms.length !== 1) {
      throw new Error(`Can not apply a directive with a list: ${subValue.terms}`);
    }
    return subValue.terms[0];
  }

}

/**
 * The output of getting a node's quad context.
 */
export interface INodeQuadContext {
  subject?: RDF.Term;
  graph?: RDF.Term;
  auxiliaryPatterns?: Algebra.Pattern[];
}
