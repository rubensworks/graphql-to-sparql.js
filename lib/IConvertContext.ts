import {FragmentDefinitionNode, ValueNode} from "graphql/language";
import {JsonLdContextNormalized} from "jsonld-context-parser";
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
  context: JsonLdContextNormalized;
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
  /**
   * The fields that are to be singularized.
   */
  singularizeVariables?: ISingularizeVariables;
  /**
   * The current singularization state.
   */
  singularizeState: SingularizeState;
  /**
   * If unknown variables that are being used should NOT throw an error.
   */
  ignoreUnknownVariables?: boolean;
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

/**
 * A mapping from (nested) field names to a boolean indicating whether or not this field should be singularized.
 * If the field is not present, singularization for this field is false.
 */
export interface ISingularizeVariables {
  [id: string]: boolean;
}

/**
 * A singularization state for variable values.
 */
export enum SingularizeState {
  /**
   * If only a first matching value should be picked.
   */
  SINGLE,
  /**
   * If all matching values should be picked.
   */
  PLURAL,
}
