import type * as RDF from '@rdfjs/types';
import type { BooleanValueNode } from 'graphql/language';
import type { IConvertContext } from '../../IConvertContext';
import type { IConvertSettings } from '../../IConvertSettings';
import type { Util } from '../../Util';
import type { IValueNodeHandlerOutput } from './NodeValueHandlerAdapter';
import { NodeValueHandlerAdapter } from './NodeValueHandlerAdapter';

/**
 * Converts GraphQL booleans to RDF boolean terms.
 */
export class NodeValueHandlerBoolean extends NodeValueHandlerAdapter<BooleanValueNode> {
  protected readonly datatype: RDF.NamedNode;

  constructor(util: Util, settings: IConvertSettings) {
    super('BooleanValue', util, settings);
    this.datatype = this.util.dataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean');
  }

  public handle(valueNode: BooleanValueNode, fieldName: string, convertContext: IConvertContext): IValueNodeHandlerOutput {
    return { terms: [ this.util.dataFactory.literal(valueNode.value ? 'true' : 'false', this.datatype) ]};
  }
}
