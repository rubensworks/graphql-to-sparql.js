import {StringValueNode} from "graphql/language";
import * as RDF from "@rdfjs/types";
import {IConvertContext} from "../../IConvertContext";
import {IConvertSettings} from "../../IConvertSettings";
import {Util} from "../../Util";
import {IValueNodeHandlerOutput, NodeValueHandlerAdapter} from "./NodeValueHandlerAdapter";

/**
 * Converts GraphQL strings to RDF string terms, which can have a custom language or datatype.
 */
export class NodeValueHandlerString extends NodeValueHandlerAdapter<StringValueNode> {

  constructor(util: Util, settings: IConvertSettings) {
    super('StringValue', util, settings);
  }

  public handle(valueNode: StringValueNode, fieldName: string,
                convertContext: IConvertContext): IValueNodeHandlerOutput {
    const contextEntry: any = convertContext.context.getContextRaw()[fieldName];
    let language: string = null;
    let datatype: RDF.NamedNode = null;
    if (contextEntry && typeof contextEntry !== 'string') {
      if (contextEntry['@language']) {
        language = contextEntry['@language'];
      } else if (contextEntry['@type']) {
        datatype = this.util.dataFactory.namedNode(contextEntry['@type']);
      }
    }
    return { terms: [ this.util.dataFactory.literal((<StringValueNode> valueNode).value, language || datatype) ] };
  }

}
