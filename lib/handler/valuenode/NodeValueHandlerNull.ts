import type * as RDF from '@rdfjs/types';
import type { NullValueNode } from 'graphql/language';
import type { IConvertContext } from '../../IConvertContext';
import type { IConvertSettings } from '../../IConvertSettings';
import type { Util } from '../../Util';
import type { IValueNodeHandlerOutput } from './NodeValueHandlerAdapter';
import { NodeValueHandlerAdapter } from './NodeValueHandlerAdapter';

/**
 * Converts GraphQL nulls to RDF nil terms.
 */
export class NodeValueHandlerNull extends NodeValueHandlerAdapter<NullValueNode> {
  protected readonly nil: RDF.NamedNode;

  public constructor(util: Util, settings: IConvertSettings) {
    super('NullValue', util, settings);
    this.nil = this.util.dataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil');
  }

  public handle(
    _valueNode: NullValueNode,
    _fieldName: string,
    _convertContext: IConvertContext,
  ): IValueNodeHandlerOutput {
    return { terms: [ this.nil ]};
  }
}
