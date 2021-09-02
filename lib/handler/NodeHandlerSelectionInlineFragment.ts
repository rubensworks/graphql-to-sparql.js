import {FieldNode, InlineFragmentNode} from "graphql/language";
import {Algebra} from "sparqlalgebrajs";
import {IConvertContext} from "../IConvertContext";
import {IConvertSettings} from "../IConvertSettings";
import {Util} from "../Util";
import {NodeHandlerSelectionAdapter} from "./NodeHandlerSelectionAdapter";

/**
 * Converts GraphQL inline fragment to one or more quad patterns with a given type within an optional.
 */
export class NodeHandlerSelectionInlineFragment extends NodeHandlerSelectionAdapter<InlineFragmentNode> {

  constructor(util: Util, settings: IConvertSettings) {
    super('InlineFragment', util, settings);
  }

  public handle(inlineFragmentNode: InlineFragmentNode, convertContext: IConvertContext): Algebra.Operation {
    // Wrap in an OPTIONAL, as this pattern should only apply if the type applies
    const fieldNode: FieldNode = {
      alias: undefined,
      arguments: undefined,
      directives: inlineFragmentNode.directives,
      kind: 'Field',
      name: { kind: 'Name', value: convertContext.subject.value },
      selectionSet: inlineFragmentNode.selectionSet,
    };
    const auxiliaryPatterns = inlineFragmentNode.typeCondition
      ? [ this.util.newTypePattern(convertContext.subject, inlineFragmentNode.typeCondition, convertContext) ] : [];
    return this.util.operationFactory.createLeftJoin(
      this.util.operationFactory.createBgp([]),
      this.fieldToOperation(convertContext, fieldNode, false, auxiliaryPatterns),
    );
  }

}
