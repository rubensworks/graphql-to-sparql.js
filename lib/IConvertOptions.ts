import {ISingularizeVariables, IVariablesDictionary} from "./IConvertContext";

/**
 * Options for initiating a conversion.
 */
export interface IConvertOptions {
  /**
   * A variables dictionary.
   */
  variablesDict?: IVariablesDictionary;
  /**
   * A structure into which all singularize variables are collected.
   */
  singularizeVariables?: ISingularizeVariables;
}
