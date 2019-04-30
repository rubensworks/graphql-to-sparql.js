import {DefinitionNode} from "graphql/language";
import {IConvertSettings} from "../IConvertSettings";
import {Util} from "../Util";
import {NodeHandlerAdapter} from "./NodeHandlerAdapter";

/**
 * A handler for converting GraphQL definition nodes to operations.
 */
export abstract class NodeHandlerDefinitionAdapter<T extends DefinitionNode> extends NodeHandlerAdapter<T> {

  constructor(targetKind: T['kind'], util: Util, settings: IConvertSettings) {
    super(targetKind, util, settings);
  }

}
