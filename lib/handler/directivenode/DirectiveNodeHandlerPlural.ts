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
 * A handler for plural directives.
 */
export class DirectiveNodeHandlerPlural extends DirectiveNodeHandlerAdapter {
  constructor(util: Util, settings: IConvertSettings) {
    super('plural', util, settings);
  }

  public handle(directiveContext: IDirectiveContext, convertContext: IConvertContext): IDirectiveNodeHandlerOutput {
    if (this.isDirectiveScopeAll(directiveContext.directive)) {
      convertContext.singularizeState = SingularizeState.PLURAL;
    }
    // Delete the existing entry, as this may have already been set before if we were in a single scope.
    delete convertContext.singularizeVariables!
      [this.util.nameToVariable(directiveContext.fieldLabel, convertContext).value];
    return {};
  }
}
