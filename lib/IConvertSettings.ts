import * as RDF from "@rdfjs/types";

/**
 * Constructor settings object interface for {@link Converter}.
 *
 * This is defined once per converter instance.
 */
export interface IConvertSettings {
  /**
   * A custom datafactory.
   */
  dataFactory?: RDF.DataFactory;
  /**
   * If arrays should be converted to RDF lists.
   * Otherwise (default), arrays will be converted to multiple predicate-object links.
   */
  arraysToRdfLists?: boolean;
  /**
   * The string to join variable names by.
   * Defaults to '_'.
   */
  variableDelimiter?: string;
  /**
   * If the use of a context is required.
   * If true, and GraphQL nodes are not present in the context, an error will be thrown.
   */
  requireContext?: boolean;
  /**
   * A counter to create unique variable names.
   */
  expressionVariableCounter?: number;
}
