import {IConvertContext} from "../../IConvertContext";
import {IConvertSettings} from "../../IConvertSettings";
import {Util} from "../../Util";
import {
  DirectiveNodeHandlerAdapter,
  IDirectiveContext,
  IDirectiveNodeHandlerOutput
} from "./DirectiveNodeHandlerAdapter";

/**
 * A handler for skip directives.
 */
export class DirectiveNodeHandlerSkip extends DirectiveNodeHandlerAdapter {

  constructor(util: Util, settings: IConvertSettings) {
    super('skip', util, settings);
  }

  public handle(directiveContext: IDirectiveContext, convertContext: IConvertContext): IDirectiveNodeHandlerOutput {
    const val = this.getDirectiveConditionalValue(directiveContext.directive, convertContext);
    if (val.termType === 'Literal' && val.value === 'true') {
      return { pass: false };
    }
    return { pass: true };
  }
}
