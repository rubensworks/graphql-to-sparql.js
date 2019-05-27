import {DefinitionNode, DocumentNode, FragmentDefinitionNode, parse} from "graphql/language";
import {IJsonLdContextNormalized, JsonLdContext} from "jsonld-context-parser";
import {Algebra} from "sparqlalgebrajs";
import {
  NodeHandlerDefinitionFragment,
  NodeHandlerDefinitionOperation,
  NodeHandlerDocument,
  NodeHandlerSelectionField,
  NodeHandlerSelectionFragmentSpread,
  NodeHandlerSelectionInlineFragment,
  NodeValueHandlerBoolean,
  NodeValueHandlerEnum,
  NodeValueHandlerFloat,
  NodeValueHandlerInt,
  NodeValueHandlerList,
  NodeValueHandlerNull,
  NodeValueHandlerObject,
  NodeValueHandlerString,
  NodeValueHandlerVariable,
} from "./handler";
import {
  DirectiveNodeHandlerInclude,
  DirectiveNodeHandlerOptional,
  DirectiveNodeHandlerPlural,
  DirectiveNodeHandlerSingle,
  DirectiveNodeHandlerSkip,
} from "./handler/directivenode";
import {IConvertContext, SingularizeState} from "./IConvertContext";
import {IConvertOptions} from "./IConvertOptions";
import {IConvertSettings} from "./IConvertSettings";
import {Util} from "./Util";

/**
 * Translate GraphQL queries into SPARQL algebra.
 */
export class Converter {

  private readonly util: Util;

  constructor(settings?: IConvertSettings) {
    settings = settings || {};
    settings.variableDelimiter = settings.variableDelimiter || '_';
    settings.expressionVariableCounter = settings.expressionVariableCounter || 0;

    this.util = new Util(settings);

    this.initializeNodeHandlers(settings);
  }

  public static registerNodeHandlers(util: Util, settings: IConvertSettings) {
    util.registerNodeHandler(new NodeHandlerDocument(util, settings));
    util.registerNodeHandler(new NodeHandlerDefinitionOperation(util, settings));
    util.registerNodeHandler(new NodeHandlerDefinitionFragment(util, settings));
    util.registerNodeHandler(new NodeHandlerSelectionFragmentSpread(util, settings));
    util.registerNodeHandler(new NodeHandlerSelectionInlineFragment(util, settings));
    util.registerNodeHandler(new NodeHandlerSelectionField(util, settings));
  }

  public static registerNodeValueHandlers(util: Util, settings: IConvertSettings) {
    util.registerNodeValueHandler(new NodeValueHandlerVariable(util, settings));
    util.registerNodeValueHandler(new NodeValueHandlerInt(util, settings));
    util.registerNodeValueHandler(new NodeValueHandlerFloat(util, settings));
    util.registerNodeValueHandler(new NodeValueHandlerString(util, settings));
    util.registerNodeValueHandler(new NodeValueHandlerBoolean(util, settings));
    util.registerNodeValueHandler(new NodeValueHandlerNull(util, settings));
    util.registerNodeValueHandler(new NodeValueHandlerEnum(util, settings));
    util.registerNodeValueHandler(new NodeValueHandlerList(util, settings));
    util.registerNodeValueHandler(new NodeValueHandlerObject(util, settings));
  }

  public static registerDirectiveNodeHandlers(util: Util, settings: IConvertSettings) {
    util.registerDirectiveNodeHandler(new DirectiveNodeHandlerInclude(util, settings));
    util.registerDirectiveNodeHandler(new DirectiveNodeHandlerOptional(util, settings));
    util.registerDirectiveNodeHandler(new DirectiveNodeHandlerPlural(util, settings));
    util.registerDirectiveNodeHandler(new DirectiveNodeHandlerSingle(util, settings));
    util.registerDirectiveNodeHandler(new DirectiveNodeHandlerSkip(util, settings));
  }

  /**
   * Translates a GraphQL query into SPARQL algebra.
   * @param {string} graphqlQuery A GraphQL query string.
   * @param {IContext} context A JSON-LD context.
   * @param {IConvertOptions} options An options object.
   * @return {Promise<Operation>} A promise resolving to an operation.
   */
  public async graphqlToSparqlAlgebra(graphqlQuery: string, context: JsonLdContext,
                                      options?: IConvertOptions): Promise<Algebra.Operation> {
    return this.graphqlToSparqlAlgebraRawContext(graphqlQuery,
      await this.util.contextParser.parse(context), options);
  }

  /**
   * Translates a GraphQL query into SPARQL algebra.
   * @param {string} graphqlQuery A GraphQL query string.
   * @param {IContext} context A JSON-LD context.
   * @param {IConvertOptions} options An options object.
   * @return {Operation} An operation.
   */
  public graphqlToSparqlAlgebraRawContext(graphqlQuery: string, context: IJsonLdContextNormalized,
                                          options?: IConvertOptions): Algebra.Operation {
    options = options || {};
    const document: DocumentNode = parse(graphqlQuery);
    const fragmentDefinitions = this.indexFragments(document);
    const convertContext: IConvertContext = {
      context,
      fragmentDefinitions,
      graph: this.util.dataFactory.defaultGraph(),
      path: [],
      singularizeState: SingularizeState.PLURAL, // We don't make this configurable to enforce query consistency
      singularizeVariables: options.singularizeVariables || {},
      subject: null,
      terminalVariables: [],
      variablesDict: options.variablesDict || {},
      variablesMetaDict: {},
    };

    return this.util.handleNode(document, convertContext);
  }

  /**
   * Create an index of all fragment definitions in the given document.
   *
   * This will assign a new array of definition nodes without fragment definition.
   *
   * @param {DocumentNode} document A document node.
   * @return {{[p: string]: FragmentDefinitionNode}} An index of fragment definition nodes.
   */
  public indexFragments(document: DocumentNode): {[name: string]: FragmentDefinitionNode} {
    const fragmentDefinitions: {[name: string]: FragmentDefinitionNode} = {};
    const newDefinitions: DefinitionNode[] = [];
    for (const definition of document.definitions) {
      if (definition.kind === 'FragmentDefinition') {
        fragmentDefinitions[definition.name.value] = definition;
      } else {
        newDefinitions.push(definition);
      }
    }
    (<any> document).definitions = newDefinitions;
    return fragmentDefinitions;
  }

  private initializeNodeHandlers(settings: IConvertSettings) {
    Converter.registerNodeHandlers(this.util, settings);
    Converter.registerNodeValueHandlers(this.util, settings);
    Converter.registerDirectiveNodeHandlers(this.util, settings);
  }

}
