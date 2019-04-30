import {BooleanValueNode} from "graphql/language";
import * as RDF from "rdf-js";
import {IConvertContext} from "../../IConvertContext";
import {IConvertSettings} from "../../IConvertSettings";
import {Util} from "../../Util";
import {IValueNodeHandlerOutput, NodeValueHandlerAdapter} from "./NodeValueHandlerAdapter";

/**
 * Converts GraphQL booleans to RDF boolean terms.
 */
export class NodeValueHandlerBoolean extends NodeValueHandlerAdapter<BooleanValueNode> {

  protected readonly datatype: RDF.NamedNode;

  constructor(util: Util, settings: IConvertSettings) {
    super('BooleanValue', util, settings);
    this.datatype = this.util.dataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean');
  }

  public handle(valueNode: BooleanValueNode, fieldName: string,
                convertContext: IConvertContext): IValueNodeHandlerOutput {
    return { terms: [ this.util.dataFactory.literal(valueNode.value ? 'true' : 'false', this.datatype) ] };
  }

}
