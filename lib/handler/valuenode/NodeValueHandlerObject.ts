import type { Algebra } from '@traqula/algebra-transformations-1-2';
import type { ObjectValueNode } from 'graphql/language';
import type { IConvertContext } from '../../IConvertContext';
import type { IConvertSettings } from '../../IConvertSettings';
import type { Util } from '../../Util';
import type { IValueNodeHandlerOutput } from './NodeValueHandlerAdapter';
import { NodeValueHandlerAdapter } from './NodeValueHandlerAdapter';

/**
 * Converts GraphQL objects to triple patterns by converting keys to predicates and values to objects.
 */
export class NodeValueHandlerObject extends NodeValueHandlerAdapter<ObjectValueNode> {
  public constructor(util: Util, settings: IConvertSettings) {
    super('ObjectValue', util, settings);
  }

  public handle(
    valueNode: ObjectValueNode,
    fieldName: string,
    convertContext: IConvertContext,
  ): IValueNodeHandlerOutput {
    // Convert object keys to predicates and values to objects, and link them both with a new blank node.
    const subject = this.util.dataFactory.blankNode();
    let auxiliaryObjectPatterns: Algebra.Pattern[] = [];
    for (const field of valueNode.fields) {
      const subValue = this.util.handleNodeValue(field.value, fieldName, convertContext);
      for (const term of subValue.terms) {
        auxiliaryObjectPatterns.push(this.util.createQuadPattern(
          subject,
          field.name,
          term,
          convertContext.graph,
          convertContext.context,
        ));
      }
      if (subValue.auxiliaryPatterns) {
        auxiliaryObjectPatterns = [ ...auxiliaryObjectPatterns, ...subValue.auxiliaryPatterns ];
      }
    }
    return { terms: [ subject ], auxiliaryPatterns: auxiliaryObjectPatterns };
  }
}
