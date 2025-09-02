import {ListTypeNode, NamedTypeNode, NonNullTypeNode, OperationDefinitionNode, TypeNode} from "graphql/language";
import type {Algebra} from "@traqula/algebra-transformations-1-2";
import {IConvertContext} from "../IConvertContext";
import {IConvertSettings} from "../IConvertSettings";
import {Util} from "../Util";
import {NodeHandlerDefinitionAdapter} from "./NodeHandlerDefinitionAdapter";

/**
 * Converts GraphQL definitions to joined operations for all its selections.
 */
export class NodeHandlerDefinitionOperation extends NodeHandlerDefinitionAdapter<OperationDefinitionNode> {

  constructor(util: Util, settings: IConvertSettings) {
    super('OperationDefinition', util, settings);
  }

  public handle(operationDefinition: OperationDefinitionNode, convertContext: IConvertContext): Algebra.Operation {
    if (operationDefinition.operation !== 'query') {
      throw new Error('Unsupported definition operation: ' + operationDefinition.operation);
    }
    // We ignore the query name, as SPARQL doesn't support naming queries.

    // Variables
    if (operationDefinition.variableDefinitions) {
      for (const variableDefinition of operationDefinition.variableDefinitions) {
        const name: string = variableDefinition.variable.name.value;
        // Put the default value in the context if it hasn't been defined yet.
        if (variableDefinition.defaultValue) {
          if (!convertContext.variablesDict[name]) {
            convertContext.variablesDict[name] = variableDefinition.defaultValue;
          }
        }

        // Handle type
        let typeNode: TypeNode = variableDefinition.type;
        const mandatory: boolean = typeNode.kind === 'NonNullType';
        if (mandatory) {
          typeNode = (<NonNullTypeNode> typeNode).type;
        }
        const list: boolean = typeNode.kind === 'ListType';
        if (list) {
          typeNode = (<ListTypeNode> typeNode).type;
        }
        const type: string = (<NamedTypeNode> typeNode).name.value;
        convertContext.variablesMetaDict[name] = { mandatory, list, type };
      }
    }

    // Directives
    const directiveOutputs = this.getDirectiveOutputs(operationDefinition.directives,
      operationDefinition.name ? operationDefinition.name.value : '', convertContext);
    if (!directiveOutputs) {
      return this.util.operationFactory.createBgp([]);
    }

    // Handle the operation
    const operation = this.util.joinOperations(operationDefinition.selectionSet.selections
      .map((selectionNode) => this.util.handleNode(selectionNode, convertContext)));

    // Override operation if needed
    return this.handleDirectiveOutputs(directiveOutputs, operation);
  }

}
