import {FieldNode} from "graphql/language";
import {Algebra} from "sparqlalgebrajs";
import {IConvertContext} from "../IConvertContext";
import {IConvertSettings} from "../IConvertSettings";
import {Util} from "../Util";
import {NodeHandlerSelectionAdapter} from "./NodeHandlerSelectionAdapter";

/**
 * Converts GraphQL fields to one or more quad patterns.
 */
export class NodeHandlerSelectionField extends NodeHandlerSelectionAdapter<FieldNode> {

  constructor(util: Util, settings: IConvertSettings) {
    super('Field', util, settings);
  }

  public handle(fieldNode: FieldNode, convertContext: IConvertContext): Algebra.Operation {
    return this.fieldToOperation(convertContext, fieldNode, true);
  }

}
