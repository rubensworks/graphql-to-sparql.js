import type { DefinitionNode } from 'graphql/language';
import type { IConvertSettings } from '../IConvertSettings';
import type { Util } from '../Util';
import { NodeHandlerAdapter } from './NodeHandlerAdapter';

/**
 * A handler for converting GraphQL definition nodes to operations.
 */
export abstract class NodeHandlerDefinitionAdapter<T extends DefinitionNode> extends NodeHandlerAdapter<T> {
  public constructor(targetKind: T['kind'], util: Util, settings: IConvertSettings) {
    super(targetKind, util, settings);
  }
}
