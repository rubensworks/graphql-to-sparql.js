import {FloatValueNode} from "graphql/language";
import {IConvertContext} from "../../IConvertContext";
import {IConvertSettings} from "../../IConvertSettings";
import {Util} from "../../Util";
import {IValueNodeHandlerOutput, NodeValueHandlerAdapter} from "./NodeValueHandlerAdapter";
import * as RDF from "rdf-js";

/**
 * Converts GraphQL floats to RDF float terms.
 */
export class NodeValueHandlerFloat extends NodeValueHandlerAdapter<FloatValueNode> {

  protected readonly datatype: RDF.NamedNode;

  constructor(util: Util, settings: IConvertSettings) {
    super('FloatValue', util, settings);
    this.datatype = this.util.dataFactory.namedNode('http://www.w3.org/2001/XMLSchema#float');
  }

  public handle(valueNode: FloatValueNode, fieldName: string,
                convertContext: IConvertContext): IValueNodeHandlerOutput {
    return { terms: [ this.util.dataFactory.literal(valueNode.value, this.datatype) ] };
  }

}
