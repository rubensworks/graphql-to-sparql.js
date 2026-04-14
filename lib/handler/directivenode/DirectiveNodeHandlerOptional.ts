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
 * A handler for optional directives.
 */
export class DirectiveNodeHandlerOptional extends DirectiveNodeHandlerAdapter {
  constructor(util: Util, settings: IConvertSettings) {
    super('optional', util, settings);
  }

  public handle(directiveContext: IDirectiveContext, convertContext: IConvertContext): IDirectiveNodeHandlerOutput {
    return {
      operationOverrider: operation => this.util.operationFactory.createLeftJoin(
        this.util.operationFactory.createBgp([]),
        operation,
      ),
    };
  }
}
