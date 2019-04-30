import {IntValueNode} from "graphql/language";
import {IConvertContext} from "../../IConvertContext";
import {IConvertSettings} from "../../IConvertSettings";
import {Util} from "../../Util";
import {IValueNodeHandlerOutput, NodeValueHandlerAdapter} from "./NodeValueHandlerAdapter";
import * as RDF from "rdf-js";

/**
 * Converts GraphQL ints to RDF integer terms.
 */
export class NodeValueHandlerInt extends NodeValueHandlerAdapter<IntValueNode> {

  protected readonly datatype: RDF.NamedNode;

  constructor(util: Util, settings: IConvertSettings) {
    super('IntValue', util, settings);
    this.datatype = this.util.dataFactory.namedNode('http://www.w3.org/2001/XMLSchema#integer');
  }

  public handle(valueNode: IntValueNode, fieldName: string,
                convertContext: IConvertContext): IValueNodeHandlerOutput {
    return { terms: [ this.util.dataFactory.literal(valueNode.value, this.datatype) ] };
  }

}
