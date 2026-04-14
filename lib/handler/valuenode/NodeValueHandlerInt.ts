import type * as RDF from '@rdfjs/types';
import type { IntValueNode } from 'graphql/language';
import type { IConvertContext } from '../../IConvertContext';
import type { IConvertSettings } from '../../IConvertSettings';
import type { Util } from '../../Util';
import type { IValueNodeHandlerOutput } from './NodeValueHandlerAdapter';
import { NodeValueHandlerAdapter } from './NodeValueHandlerAdapter';

/**
 * Converts GraphQL ints to RDF integer terms.
 */
export class NodeValueHandlerInt extends NodeValueHandlerAdapter<IntValueNode> {
  protected readonly datatype: RDF.NamedNode;

  constructor(util: Util, settings: IConvertSettings) {
    super('IntValue', util, settings);
    this.datatype = this.util.dataFactory.namedNode('http://www.w3.org/2001/XMLSchema#integer');
  }

  public handle(valueNode: IntValueNode, fieldName: string, convertContext: IConvertContext): IValueNodeHandlerOutput {
    return { terms: [ this.util.dataFactory.literal(valueNode.value, this.datatype) ]};
  }
}
