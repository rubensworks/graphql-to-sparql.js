import {ObjectValueNode} from "graphql/language";
import type {Algebra} from "@traqula/algebra-transformations-1-2";
import {IConvertContext} from "../../IConvertContext";
import {IConvertSettings} from "../../IConvertSettings";
import {Util} from "../../Util";
import {IValueNodeHandlerOutput, NodeValueHandlerAdapter} from "./NodeValueHandlerAdapter";

/**
 * Converts GraphQL objects to triple patterns by converting keys to predicates and values to objects.
 */
export class NodeValueHandlerObject extends NodeValueHandlerAdapter<ObjectValueNode> {

  constructor(util: Util, settings: IConvertSettings) {
    super('ObjectValue', util, settings);
  }

  public handle(valueNode: ObjectValueNode, fieldName: string,
                convertContext: IConvertContext): IValueNodeHandlerOutput {
    // Convert object keys to predicates and values to objects, and link them both with a new blank node.
    const subject = this.util.dataFactory.blankNode();
    let auxiliaryObjectPatterns: Algebra.Pattern[] = [];
    for (const field of valueNode.fields) {
      const subValue = this.util.handleNodeValue(field.value, fieldName, convertContext);
      for (const term of subValue.terms) {
        auxiliaryObjectPatterns.push(this.util.createQuadPattern(
          subject, field.name, term, convertContext.graph, convertContext.context));
      }
      if (subValue.auxiliaryPatterns) {
        auxiliaryObjectPatterns = auxiliaryObjectPatterns.concat(subValue.auxiliaryPatterns);
      }
    }
    return { terms: [ subject ], auxiliaryPatterns: auxiliaryObjectPatterns };
  }

}
