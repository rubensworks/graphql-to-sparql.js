import {ValueNode} from "graphql";
import * as RDF from "@rdfjs/types";
import type {Algebra} from "@traqula/algebra-sparql-1-1";
import {IConvertContext} from "../../IConvertContext";
import {IConvertSettings} from "../../IConvertSettings";
import {Util} from "../../Util";

/**
 * A handler for converting GraphQL value nodes to terms and patterns.
 */
export abstract class NodeValueHandlerAdapter<T extends ValueNode> {

  public readonly targetKind: string;

  protected readonly util: Util;
  protected readonly settings: IConvertSettings;

  constructor(targetKind: T['kind'], util: Util, settings: IConvertSettings) {
    this.targetKind = targetKind;
    this.util = util;
    this.settings = settings;
  }

  /**
   * Get the terms and patterns for the given value node.
   * @param {T} valueNode A GraphQL node.
   * @param {string} fieldName The name of the field or argument in which the value was encapsulated.
   * @param {IConvertContext} convertContext A conversion context.
   * @return {IValueNodeHandlerOutput} The RDF terms and patterns.
   */
  public abstract handle(valueNode: T, fieldName: string, convertContext: IConvertContext): IValueNodeHandlerOutput;
}

/**
 * The output of converting a value node to an RDF term.
 */
export interface IValueNodeHandlerOutput {
  /**
   * The resulting RDF terms.
   */
  terms: RDF.Term[];
  /**
   * An optional array of patterns that are dependencies of the resulting term(s).
   */
  auxiliaryPatterns?: Algebra.Pattern[];
}
