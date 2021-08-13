import {ListValueNode} from "graphql/language";
import * as RDF from "@rdfjs/types";
import {Algebra} from "sparqlalgebrajs";
import {IConvertContext} from "../../IConvertContext";
import {IConvertSettings} from "../../IConvertSettings";
import {Util} from "../../Util";
import {IValueNodeHandlerOutput, NodeValueHandlerAdapter} from "./NodeValueHandlerAdapter";

/**
 * Converts GraphQL lists to RDF lists if settings.arraysToRdfLists is true, otherwise it converts to multiple values.
 */
export class NodeValueHandlerList extends NodeValueHandlerAdapter<ListValueNode> {

  protected readonly nodeFirst: RDF.NamedNode;
  protected readonly nodeRest: RDF.NamedNode;
  protected readonly nodeNil: RDF.NamedNode;

  constructor(util: Util, settings: IConvertSettings) {
    super('ListValue', util, settings);
    this.nodeFirst = this.util.dataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first');
    this.nodeRest = this.util.dataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest');
    this.nodeNil = this.util.dataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil');
  }

  public handle(valueNode: ListValueNode, fieldName: string,
                convertContext: IConvertContext): IValueNodeHandlerOutput {
    const listTerms: RDF.Term[] = [];
    let auxiliaryPatterns: Algebra.Pattern[] = [];
    // Create terms for list values
    for (const v of valueNode.values) {
      const subValue = this.util.handleNodeValue(v, fieldName, convertContext);
      for (const term of subValue.terms) {
        listTerms.push(term);
      }
      if (subValue.auxiliaryPatterns) {
        auxiliaryPatterns = auxiliaryPatterns.concat(subValue.auxiliaryPatterns);
      }
    }

    if (this.settings.arraysToRdfLists) {
      // Convert array to RDF list

      // Create chained list structure
      const firstListNode: RDF.Term = this.util.dataFactory.blankNode();
      let listNode: RDF.Term = firstListNode;
      let remaining: number = listTerms.length;
      for (const term of listTerms) {
        auxiliaryPatterns.push(this.util.operationFactory.createPattern(
          listNode, this.nodeFirst, term, convertContext.graph));
        const nextListNode: RDF.Term = --remaining === 0 ? this.nodeNil : this.util.dataFactory.blankNode();
        auxiliaryPatterns.push(this.util.operationFactory.createPattern(
          listNode, this.nodeRest, nextListNode, convertContext.graph));
        listNode = nextListNode;
      }
      return { terms: [ firstListNode ], auxiliaryPatterns };
    } else {
      // Convert array to multiple terms that will be linked via the same predicate.
      return { terms: listTerms, auxiliaryPatterns };
    }
  }

}
