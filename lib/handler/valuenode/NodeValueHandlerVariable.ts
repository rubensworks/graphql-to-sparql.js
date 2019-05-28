import {ListValueNode, ValueNode} from "graphql/language";
import {VariableNode} from "graphql/language/ast";
import {IConvertContext} from "../../IConvertContext";
import {IConvertSettings} from "../../IConvertSettings";
import {Util} from "../../Util";
import {IValueNodeHandlerOutput, NodeValueHandlerAdapter} from "./NodeValueHandlerAdapter";

/**
 * Converts GraphQL variables to terms based on the contents of the variablesDict.
 */
export class NodeValueHandlerVariable extends NodeValueHandlerAdapter<VariableNode> {

  constructor(util: Util, settings: IConvertSettings) {
    super('Variable', util, settings);
  }

  public handle(valueNode: VariableNode, fieldName: string,
                convertContext: IConvertContext): IValueNodeHandlerOutput {
    const id: string = valueNode.name.value;
    const value: ValueNode = convertContext.variablesDict[id];
    const meta = convertContext.variablesMetaDict[id];

    // Handle missing values
    if (!value) {
      if (!meta || meta.mandatory) {
        throw new Error(`Undefined variable: ${id}`);
      } else {
        return { terms: [this.util.dataFactory.variable(id)] };
      }
    }

    // Don't allow variables that refer to other variables
    if (value.kind === 'Variable') {
      throw new Error(`Variable refers to another variable: ${id}`);
    }

    if (meta) {
      // Check the type
      if (meta.list) {
        // If we expect a list, check if we got a list.
        if (value.kind !== 'ListValue') {
          throw new Error(`Expected a list, but got ${value.kind} for ${id}`);
        }
        // Check the type in the list
        if (meta.type) {
          const listValue: ListValueNode = <ListValueNode> value;
          for (const v of listValue.values) {
            if (v.kind !== meta.type) {
              throw new Error(`Expected ${meta.type}, but got ${v.kind} for ${id}`);
            }
          }
        }
      } else if (meta.type) {
        // This is allowed to be different (?)
        /*if (value.kind !== meta.type) {
          throw new Error(`Expected ${meta.type}, but got ${value.kind} for ${id}`);
        }*/
      }
    }

    return this.util.handleNodeValue(value, fieldName, convertContext);
  }

}
