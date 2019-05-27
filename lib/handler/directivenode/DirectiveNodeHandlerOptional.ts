import {IConvertContext} from "../../IConvertContext";
import {IConvertSettings} from "../../IConvertSettings";
import {Util} from "../../Util";
import {
  DirectiveNodeHandlerAdapter,
  IDirectiveContext,
  IDirectiveNodeHandlerOutput
} from "./DirectiveNodeHandlerAdapter";

/**
 * A handler for optional directives.
 */
export class DirectiveNodeHandlerOptional extends DirectiveNodeHandlerAdapter {

  constructor(util: Util, settings: IConvertSettings) {
    super('optional', util, settings);
  }

  public handle(directiveContext: IDirectiveContext, convertContext: IConvertContext): IDirectiveNodeHandlerOutput {
    return {
      operationOverrider: (operation) => this.util.operationFactory.createLeftJoin(
        this.util.operationFactory.createBgp([]),
        operation,
      ),
    };
  }
}
