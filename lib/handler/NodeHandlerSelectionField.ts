import type { Algebra } from '@traqula/algebra-transformations-1-2';
import type { FieldNode } from 'graphql/language';
import type { IConvertContext } from '../IConvertContext';
import type { IConvertSettings } from '../IConvertSettings';
import type { Util } from '../Util';
import { NodeHandlerSelectionAdapter } from './NodeHandlerSelectionAdapter';

/**
 * Converts GraphQL fields to one or more quad patterns.
 */
export class NodeHandlerSelectionField extends NodeHandlerSelectionAdapter<FieldNode> {
  public constructor(util: Util, settings: IConvertSettings) {
    super('Field', util, settings);
  }

  public handle(fieldNode: FieldNode, convertContext: IConvertContext): Algebra.Operation {
    return this.fieldToOperation(convertContext, fieldNode, true);
  }
}
