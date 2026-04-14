import type * as RDF from '@rdfjs/types';
import type { StringValueNode } from 'graphql/language';
import type { IConvertContext } from '../../IConvertContext';
import type { IConvertSettings } from '../../IConvertSettings';
import type { Util } from '../../Util';
import type { IValueNodeHandlerOutput } from './NodeValueHandlerAdapter';
import { NodeValueHandlerAdapter } from './NodeValueHandlerAdapter';

/**
 * Converts GraphQL strings to RDF string terms, which can have a custom language or datatype.
 */
export class NodeValueHandlerString extends NodeValueHandlerAdapter<StringValueNode> {
  public constructor(util: Util, settings: IConvertSettings) {
    super('StringValue', util, settings);
  }

  public handle(
    valueNode: StringValueNode,
    fieldName: string,
    convertContext: IConvertContext,
  ): IValueNodeHandlerOutput {
    // eslint-disable-next-line ts/no-unsafe-assignment, ts/no-explicit-any
    const contextEntry: any = convertContext.context.getContextRaw()[fieldName];
    let language: string | undefined;
    let datatype: RDF.NamedNode | undefined;
    if (contextEntry && typeof contextEntry !== 'string') {
      // eslint-disable-next-line ts/no-unsafe-member-access
      if (contextEntry['@language']) {
        // eslint-disable-next-line ts/no-unsafe-assignment, ts/no-unsafe-member-access
        language = contextEntry['@language'];
      // eslint-disable-next-line ts/no-unsafe-member-access
      } else if (contextEntry['@type']) {
        // eslint-disable-next-line ts/no-unsafe-argument, ts/no-unsafe-member-access
        datatype = this.util.dataFactory.namedNode(contextEntry['@type']);
      }
    }
    return { terms: [ this.util.dataFactory.literal((valueNode).value, language ?? datatype) ]};
  }
}
