import type * as RDF from '@rdfjs/types';
import type { FloatValueNode } from 'graphql/language';
import type { IConvertContext } from '../../IConvertContext';
import type { IConvertSettings } from '../../IConvertSettings';
import type { Util } from '../../Util';
import type { IValueNodeHandlerOutput } from './NodeValueHandlerAdapter';
import { NodeValueHandlerAdapter } from './NodeValueHandlerAdapter';

/**
 * Converts GraphQL floats to RDF float terms.
 */
export class NodeValueHandlerFloat extends NodeValueHandlerAdapter<FloatValueNode> {
  protected readonly datatype: RDF.NamedNode;

  constructor(util: Util, settings: IConvertSettings) {
    super('FloatValue', util, settings);
    this.datatype = this.util.dataFactory.namedNode('http://www.w3.org/2001/XMLSchema#float');
  }

  public handle(valueNode: FloatValueNode, fieldName: string, convertContext: IConvertContext): IValueNodeHandlerOutput {
    return { terms: [ this.util.dataFactory.literal(valueNode.value, this.datatype) ]};
  }
}
