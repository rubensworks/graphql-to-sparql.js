import {NullValueNode} from "graphql/language";
import {IConvertContext} from "../../IConvertContext";
import {IConvertSettings} from "../../IConvertSettings";
import {Util} from "../../Util";
import {IValueNodeHandlerOutput, NodeValueHandlerAdapter} from "./NodeValueHandlerAdapter";
import * as RDF from "rdf-js";

/**
 * Converts GraphQL nulls to RDF nil terms.
 */
export class NodeValueHandlerNull extends NodeValueHandlerAdapter<NullValueNode> {

  protected readonly nil: RDF.NamedNode;

  constructor(util: Util, settings: IConvertSettings) {
    super('NullValue', util, settings);
    this.nil = this.util.dataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil');
  }

  public handle(valueNode: NullValueNode, fieldName: string,
                convertContext: IConvertContext): IValueNodeHandlerOutput {
    return { terms: [ this.nil ] };
  }

}
