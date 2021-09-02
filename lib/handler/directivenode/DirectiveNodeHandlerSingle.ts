import {IConvertContext, SingularizeState} from "../../IConvertContext";
import {IConvertSettings} from "../../IConvertSettings";
import {Util} from "../../Util";
import {
  DirectiveNodeHandlerAdapter,
  IDirectiveContext,
  IDirectiveNodeHandlerOutput
} from "./DirectiveNodeHandlerAdapter";

/**
 * A handler for single directives.
 */
export class DirectiveNodeHandlerSingle extends DirectiveNodeHandlerAdapter {

  constructor(util: Util, settings: IConvertSettings) {
    super('single', util, settings);
  }

  public handle(directiveContext: IDirectiveContext, convertContext: IConvertContext): IDirectiveNodeHandlerOutput {
    if (this.isDirectiveScopeAll(directiveContext.directive)) {
      convertContext.singularizeState = SingularizeState.SINGLE;
    }
    convertContext.singularizeVariables!
      [this.util.nameToVariable(directiveContext.fieldLabel, convertContext).value] = true;
    return {};
  }
}
