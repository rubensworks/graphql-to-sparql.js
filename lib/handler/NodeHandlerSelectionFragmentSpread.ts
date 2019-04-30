import {FieldNode, FragmentDefinitionNode, FragmentSpreadNode} from "graphql/language";
import {Algebra} from "sparqlalgebrajs";
import {IConvertContext} from "../IConvertContext";
import {IConvertSettings} from "../IConvertSettings";
import {Util} from "../Util";
import {NodeHandlerSelectionAdapter} from "./NodeHandlerSelectionAdapter";

/**
 * Converts GraphQL fragment spread to one or more quad patterns with a given type within an optional.
 */
export class NodeHandlerSelectionFragmentSpread extends NodeHandlerSelectionAdapter<FragmentSpreadNode> {

  constructor(util: Util, settings: IConvertSettings) {
    super('FragmentSpread', util, settings);
  }

  public handle(fragmentSpreadNode: FragmentSpreadNode, convertContext: IConvertContext): Algebra.Operation {
    const fragmentDefinitionNode: FragmentDefinitionNode = convertContext
      .fragmentDefinitions[fragmentSpreadNode.name.value];
    if (!fragmentDefinitionNode) {
      throw new Error('Undefined fragment definition: ' + fragmentSpreadNode.name.value);
    }

    // Wrap in an OPTIONAL, as this pattern should only apply if the type applies
    const fieldNode: FieldNode = {
      alias: null,
      arguments: null,
      directives: fragmentDefinitionNode.directives,
      kind: 'Field',
      name: fragmentSpreadNode.name,
      selectionSet: fragmentDefinitionNode.selectionSet,
    };
    const auxiliaryPatterns = [
      this.util.newTypePattern(convertContext.subject, fragmentDefinitionNode.typeCondition, convertContext),
    ];
    return this.util.operationFactory.createLeftJoin(
      this.util.operationFactory.createBgp([]),
      this.fieldToOperation(convertContext, fieldNode, false, auxiliaryPatterns),
    );
  }

}
