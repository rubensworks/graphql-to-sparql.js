import type { EnumValueNode } from 'graphql/language';
import type { IConvertContext } from '../../IConvertContext';
import type { IConvertSettings } from '../../IConvertSettings';
import type { Util } from '../../Util';
import type { IValueNodeHandlerOutput } from './NodeValueHandlerAdapter';
import { NodeValueHandlerAdapter } from './NodeValueHandlerAdapter';

/**
 * Converts GraphQL enums to RDF named nodes.
 */
export class NodeValueHandlerEnum extends NodeValueHandlerAdapter<EnumValueNode> {
  public constructor(util: Util, settings: IConvertSettings) {
    super('EnumValue', util, settings);
  }

  public handle(valueNode: EnumValueNode, fieldName: string, convertContext: IConvertContext): IValueNodeHandlerOutput {
    return { terms: [ this.util.valueToNamedNode(valueNode.value, convertContext.context) ]};
  }
}
