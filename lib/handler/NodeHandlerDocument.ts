import {DocumentNode} from "graphql";
import {DefinitionNode} from "graphql/language";
import * as RDF from "@rdfjs/types";
import {Algebra} from "@traqula/algebra-transformations-1-2";
import {AlgebraFactory, algebraUtils} from "@traqula/algebra-transformations-1-2";
import {IConvertContext} from "../IConvertContext";
import {IConvertSettings} from "../IConvertSettings";
import {Util} from "../Util";
import {INodeQuadContext, NodeHandlerAdapter} from "./NodeHandlerAdapter";

/**
 * Converts GraphQL documents to joined operations for all its definitions.
 */
export class NodeHandlerDocument extends NodeHandlerAdapter<DocumentNode> {
  constructor(util: Util, settings: IConvertSettings) {
    super('Document', util, settings);
  }

  public handle(document: DocumentNode, convertContext: IConvertContext): Algebra.Operation {
    const definitionOperations = document.definitions
      .map((definition) => {
        const subjectOutput = this.getNodeQuadContextDefinitionNode(definition,
          {...convertContext, ignoreUnknownVariables: true});
        const queryParseContext: IConvertContext = {
          ...convertContext,
          graph: subjectOutput.graph || convertContext.graph,
          subject: subjectOutput.subject || this.util.dataFactory.blankNode(),
        };
        let definitionOperation = this.util.handleNode(definition, queryParseContext);
        if (subjectOutput && subjectOutput.auxiliaryPatterns) {
          definitionOperation = this.util.joinOperations([
            definitionOperation,
            this.util.operationFactory.createBgp(subjectOutput.auxiliaryPatterns),
          ]);
        }
        return definitionOperation;
      });
    const operation = this.util.operationFactory.createProject(
      definitionOperations.length === 1 ? definitionOperations[0] : this.util.operationFactory.createUnion(definitionOperations),
      convertContext.terminalVariables);

    // Convert blank nodes to variables
    return this.translateBlankNodesToVariables(operation);
  }

  /**
   * Get the quad context of a definition node that should be used for the whole definition node.
   * @param {DefinitionNode} definition A definition node.
   * @param {IConvertContext} convertContext A convert context.
   * @return {INodeQuadContext} The subject and optional auxiliary patterns.
   */
  public getNodeQuadContextDefinitionNode(definition: DefinitionNode, convertContext: IConvertContext)
    : INodeQuadContext {
    if (definition.kind === 'OperationDefinition') {
      return this.getNodeQuadContextSelectionSet(definition.selectionSet,
        definition.name ? definition.name.value : '', convertContext);
    }
    throw new Error(`Unsupported definition: ${definition.kind}`);
  }

  /**
   * Translates blank nodes inside the query to variables.
   * @param {Project} operation The operation to translate.
   * @return {Operation} The transformed operation.
   */
  public translateBlankNodesToVariables(operation: Algebra.Project): Algebra.Operation {
    const blankToVariableMapping: {[bLabel: string]: RDF.Variable} = {};
    const variablesRaw = new Set(operation.variables.map(x => x.value));

    const uniqueVar = (label: string, variables: Set<string>): RDF.Variable => {
      let counter = 0;
      let labelLoop = label;
      while (variablesRaw.has(labelLoop)) {
        labelLoop = `${label}${counter++}`;
      }
      return this.util.dataFactory.variable!(labelLoop);
    }

    const blankToVariable = (term: RDF.Term): RDF.Term => {
      if (term.termType === 'BlankNode') {
        let variable = blankToVariableMapping[term.value];
        if (!variable) {
          variable = uniqueVar(term.value, variablesRaw);
          variablesRaw.add(variable.value)
          blankToVariableMapping[term.value] = variable;
        }
        return variable;
      }
      return term;
    }

    return algebraUtils.mapOperation<'unsafe', typeof operation>(operation, {
      [Algebra.Types.PATH]: {
        preVisitor: () => ({continue: false}),
        transform: (op: Algebra.Path) => this.util.operationFactory.createPath(
          blankToVariable(op.subject),
          op.predicate,
          blankToVariable(op.object),
          blankToVariable(op.graph),
        )
      },
      [Algebra.Types.PATTERN]: {
        preVisitor: () => ({continue: false}),
        transform: (op: Algebra.Pattern) => this.util.operationFactory.createPattern(
            blankToVariable(op.subject),
            blankToVariable(op.predicate),
            blankToVariable(op.object),
            blankToVariable(op.graph),
          ),
      },
    });
  }
}
