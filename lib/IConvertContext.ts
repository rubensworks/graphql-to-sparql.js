import {FragmentDefinitionNode, ValueNode} from "graphql/language";
import {IJsonLdContextNormalized} from "jsonld-context-parser";
import * as RDF from "rdf-js";

/**
 * A context object that is passed through conversion steps.
 *
 * This is defined for each query conversion within a converter instance.
 */
export interface IConvertContext {
  /**
   * A JSON-LD context.
   */
  context: IJsonLdContextNormalized;
  /**
   * The current JSON path within the GraphQL query.
   */
  path: string[];
  /**
   * The subject term.
   */
  subject: RDF.Term;
  /**
   * The graph term.
   */
  graph: RDF.Term;
  /**
   * All variables that have no deeper child and should be selected withing the GraphQL query.
   */
  terminalVariables: RDF.Variable[];
  /**
   * All available fragment definitions.
   */
  fragmentDefinitions: {[name: string]: FragmentDefinitionNode};
  /**
   * A variable dictionary in case there are dynamic arguments in the query.
   */
  variablesDict: IVariablesDictionary;
  /**
   * A dictionary of variable metadata.
   */
  variablesMetaDict: IVariablesMetaDictionary;
}

/**
 * A variable dictionary in case there are dynamic arguments in the query.
 */
export interface IVariablesDictionary {
  [id: string]: ValueNode;
}

/**
 * A dictionary of variable metadata.
 */
export interface IVariablesMetaDictionary {
  [id: string]: { mandatory: boolean, list: boolean, type: string };
}
