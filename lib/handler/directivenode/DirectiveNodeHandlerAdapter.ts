import {DirectiveNode} from "graphql";
import * as RDF from "rdf-js";
import {Algebra} from "sparqlalgebrajs";
import {IConvertContext} from "../../IConvertContext";
import {IConvertSettings} from "../../IConvertSettings";
import {Util} from "../../Util";
import {ArgumentNode} from "graphql/language";

/**
 * An abstract handler for GraphQL directives.
 */
export abstract class DirectiveNodeHandlerAdapter {

  public readonly targetKind: string;

  protected readonly util: Util;
  protected readonly settings: IConvertSettings;

  constructor(targetKind: string, util: Util, settings: IConvertSettings) {
    this.targetKind = targetKind;
    this.util = util;
    this.settings = settings;
  }

  /**
   * Get the handler output for the given directive.
   * @param {IDirectiveContext} directiveContext The current directive context.
   * @param {IConvertContext} convertContext A conversion context.
   * @return {IValueNodeHandlerOutput} The RDF terms and patterns.
   */
  public abstract handle(directiveContext: IDirectiveContext, convertContext: IConvertContext)
    : IDirectiveNodeHandlerOutput;

  /**
   * Get the value of the 'if' argument in a directive.
   * @param {DirectiveNode} directive A directive.
   * @param {IConvertContext} convertContext A convert context.
   * @return {Term} The term.
   */
  public getDirectiveConditionalValue(directive: DirectiveNode, convertContext: IConvertContext): RDF.Term {
    const arg: ArgumentNode = this.util.getArgument(directive.arguments, 'if');
    if (!arg) {
      throw new Error(`The directive ${directive.name.value} is missing an if-argument.`);
    }
    const subValue = this.util.handleNodeValue(arg.value, arg.name.value, convertContext);
    if (subValue.terms.length !== 1) {
      throw new Error(`Can not apply the directive ${directive.name.value} with a list.`);
    }
    return subValue.terms[0];
  }

  /**
   * If a `scope: all` directive param is present.
   * @param {DirectiveNode} directive A directive.
   * @return {boolean} If `scope: all` is present.
   */
  public isDirectiveScopeAll(directive: DirectiveNode) {
    const scopeArg: ArgumentNode = this.util.getArgument(directive.arguments, 'scope');
    return scopeArg && scopeArg.value.kind === 'EnumValue' && scopeArg.value.value === 'all';
  }
}

/**
 * The output of converting a directive node to an operation.
 */
export interface IDirectiveNodeHandlerOutput {
  /**
   * If the field should be ignored.
   */
  ignore?: boolean;
  /**
   * The optional operation overrider.
   */
  operationOverrider?: (operation: Algebra.Operation) => Algebra.Operation;
}

export interface IDirectiveContext {
  /**
   * The current directive.
   */
  directive: DirectiveNode;
  /**
   * The current field label.
   */
  fieldLabel: string;
}
