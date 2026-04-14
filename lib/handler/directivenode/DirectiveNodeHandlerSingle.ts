import type { IConvertContext } from '../../IConvertContext';
import { SingularizeState } from '../../IConvertContext';
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
 * A handler for single directives.
 */
export class DirectiveNodeHandlerSingle extends DirectiveNodeHandlerAdapter {
  public constructor(util: Util, settings: IConvertSettings) {
    super('single', util, settings);
  }

  public handle(directiveContext: IDirectiveContext, convertContext: IConvertContext): IDirectiveNodeHandlerOutput {
    if (this.isDirectiveScopeAll(directiveContext.directive)) {
      convertContext.singularizeState = SingularizeState.SINGLE;
    }
    const varName = this.util.nameToVariable(directiveContext.fieldLabel, convertContext).value;
    convertContext.singularizeVariables![varName] = true;
    return {};
  }
}
