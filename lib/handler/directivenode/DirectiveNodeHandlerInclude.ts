import type { IConvertContext } from '../../IConvertContext';
import type { IConvertSettings } from '../../IConvertSettings';
import type { Util } from '../../Util';
import type {
  IDirectiveContext,
  IDirectiveNodeHandlerOutput,
} from './DirectiveNodeHandlerAdapter';
import {
  DirectiveNodeHandlerAdapter,
} from './DirectiveNodeHandlerAdapter';

/**
 * A handler for include directives.
 */
export class DirectiveNodeHandlerInclude extends DirectiveNodeHandlerAdapter {
  public constructor(util: Util, settings: IConvertSettings) {
    super('include', util, settings);
  }

  public handle(directiveContext: IDirectiveContext, convertContext: IConvertContext): IDirectiveNodeHandlerOutput {
    const val = this.getDirectiveConditionalValue(directiveContext.directive, convertContext);
    if (val.termType === 'Literal' && val.value === 'false') {
      return { ignore: true };
    }
    return {};
  }
}
