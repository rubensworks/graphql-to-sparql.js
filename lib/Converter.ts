import {
  ArgumentNode,
  BooleanValueNode,
  DefinitionNode, DirectiveNode, DocumentNode, EnumValueNode, FieldNode, FloatValueNode, FragmentDefinitionNode,
  FragmentSpreadNode, InlineFragmentNode,
  IntValueNode, ListTypeNode, ListValueNode, NamedTypeNode,
  NameNode, NonNullTypeNode, ObjectValueNode,
  OperationDefinitionNode, parse,
  SelectionNode,
  StringValueNode, TypeNode,
  ValueNode, VariableNode,
} from "graphql";
import * as DefaultDataFactory from "rdf-data-model";
import * as RDF from "rdf-js";
import {Algebra, Factory} from "sparqlalgebrajs";

/**
 * Translate GraphQL queries into SPARQL algebra.
 */
export class Converter {

  private readonly dataFactory: RDF.DataFactory;
  private readonly operationFactory: Factory;
  private readonly arraysToRdfLists: boolean;

  constructor(settings?: IConverterSettings) {
    settings = settings || {};
    this.dataFactory = settings.dataFactory || DefaultDataFactory;
    this.operationFactory = new Factory(this.dataFactory);
    this.arraysToRdfLists = settings.arraysToRdfLists;
  }

  /**
   * Translates a GraphQL query into SPARQL algebra.
   * @param {string} graphqlQuery A GraphQL query string.
   * @param {IContext} context A JSON-LD context.
   * @param {IVariablesDictionary} variablesDict A variables dictionary.
   * @return {Operation}
   */
  public graphqlToSparqlAlgebra(graphqlQuery: string, context: IContext,
                                variablesDict?: IVariablesDictionary): Algebra.Operation {
    const document: DocumentNode = parse(graphqlQuery);

    const queryParseContext: IConvertContext = {
      context,
      fragmentDefinitions: this.indexFragments(document),
      path: [],
      terminalVariables: [],
      variablesDict: variablesDict || {},
      variablesMetaDict: {},
    };
    return this.operationFactory.createProject(
      <Algebra.Operation> document.definitions.map(this.definitionToPattern.bind(this, queryParseContext)).reduce(
      (prev: Algebra.Operation, current: Algebra.Operation) => {
        if (!current) {
          return prev;
        }
        if (!prev) {
          return current;
        }
        return this.operationFactory.createUnion(prev, current);
      }, null), queryParseContext.terminalVariables);
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

  /**
   * Convert a GraphQL definition node into an algebra operation.
   * @param {IConvertContext} convertContext A convert context.
   * @param {DefinitionNode} definition A GraphQL definition node.
   * @return {Operation} A SPARQL algebra operation.
   */
  public definitionToPattern(convertContext: IConvertContext, definition: DefinitionNode): Algebra.Operation | null {
    switch (definition.kind) {
    case 'OperationDefinition':
      const operationDefinition: OperationDefinitionNode = <OperationDefinitionNode> definition;
      if (operationDefinition.operation !== 'query') {
        throw new Error('Unsupported definition operation: ' + operationDefinition.operation);
      }
      // We ignore the query name, as SPARQL doesn't support naming queries.

      const subject: RDF.Term = this.dataFactory.blankNode();

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
      if (operationDefinition.directives) {
        for (const directive of operationDefinition.directives) {
          if (!this.handleDirective(directive, convertContext)) {
            return null;
          }
        }
      }

      return this.joinOperations(operationDefinition.selectionSet.selections
        .map(this.selectionToPatterns.bind(this, convertContext, subject)));
    case 'FragmentDefinition':
      throw new Error('Illegal state: fragment definitions must be indexed and removed before processing');
    default:
      throw new Error('Unsupported definition node: ' + definition.kind);
    }
  }

  /**
   * Convert a GraphQL selection node into an algebra operation.
   * @param {IConvertContext} convertContext A convert context.
   * @param {Term} subject The RDF term that should be used as subject.
   * @param {SelectionNode} selectionNode A GraphQL selection node.
   * @return {Pattern[]} An array of quad patterns.
   */
  public selectionToPatterns(convertContext: IConvertContext, subject: RDF.Term,
                             selectionNode: SelectionNode): Algebra.Operation {
    switch (selectionNode.kind) {
    case 'FragmentSpread':
      const fragmentSpreadNode: FragmentSpreadNode = <FragmentSpreadNode> selectionNode;
      const fragmentDefinitionNode: FragmentDefinitionNode = convertContext
        .fragmentDefinitions[fragmentSpreadNode.name.value];
      if (!fragmentDefinitionNode) {
        throw new Error('Undefined fragment definition: ' + fragmentSpreadNode.name.value);
      }

      // Wrap in an OPTIONAL, as this pattern should only apply if the type applies
      return this.operationFactory.createLeftJoin(
        this.operationFactory.createBgp([]),
        this.fieldToOperation(convertContext, subject, {
          alias: null,
          arguments: null,
          directives: fragmentDefinitionNode.directives,
          kind: 'Field',
          name: fragmentSpreadNode.name,
          selectionSet: fragmentDefinitionNode.selectionSet,
        }, false,
          [ this.newTypePattern(subject, fragmentDefinitionNode.typeCondition, convertContext) ]));
    case 'InlineFragment':
      const inlineFragmentNode: InlineFragmentNode = <InlineFragmentNode> selectionNode;

      // Wrap in an OPTIONAL, as this pattern should only apply if the type applies
      return this.operationFactory.createLeftJoin(
        this.operationFactory.createBgp([]),
        this.fieldToOperation(convertContext, subject, {
          alias: null,
          arguments: null,
          directives: inlineFragmentNode.directives,
          kind: 'Field',
          name: { kind: 'Name', value: subject.value },
          selectionSet: inlineFragmentNode.selectionSet,
        }, false,
          inlineFragmentNode.typeCondition
            ? [ this.newTypePattern(subject, inlineFragmentNode.typeCondition, convertContext) ] : []));
    case 'Field':
      return this.fieldToOperation(convertContext, subject, <FieldNode> selectionNode, true);
    }
  }

  /**
   * Create a pattern with an rdf:type predicate.
   * @param {Term} subject The subject.
   * @param {NamedTypeNode} typeCondition The object name.
   * @param {IConvertContext} convertContext A convert context.
   * @return {Pattern} A pattern.
   */
  public newTypePattern(subject: RDF.Term, typeCondition: NamedTypeNode, convertContext: IConvertContext) {
    return this.operationFactory.createPattern(
      subject,
      this.dataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      this.valueToNamedNode(typeCondition.name.value, convertContext.context));
  }

  /**
   * Convert a field node to an operation.
   * @param {IConvertContext} convertContext A convert context.
   * @param {Term} subject The subject.
   * @param {FieldNode} fieldNode The field node to convert.
   * @param {boolean} pushTerminalVariables If terminal variables should be created.
   * @param {Pattern[]} auxiliaryPatterns Optional patterns that should be part of the BGP.
   * @return {Operation} The reslting operation.
   */
  public fieldToOperation(convertContext: IConvertContext, subject: RDF.Term, fieldNode: FieldNode,
                          pushTerminalVariables: boolean, auxiliaryPatterns?: Algebra.Pattern[]): Algebra.Operation {
    // Offset and limit can be changed using the magic arguments 'first' and 'offset'.
    let offset = 0;
    let limit;

    if (pushTerminalVariables) {
      const operationOverride = this.handleMetaField(convertContext, subject, fieldNode, auxiliaryPatterns);
      if (operationOverride) {
        return operationOverride;
      }
    }

    let patterns: Algebra.Pattern[] = auxiliaryPatterns ? auxiliaryPatterns.concat([]) : [];
    const predicate: RDF.NamedNode = this.valueToNamedNode(fieldNode.name.value, convertContext.context);
    // Aliases change the variable name (and path name)
    const object: RDF.Variable = this.nameToVariable(fieldNode.alias ? fieldNode.alias : fieldNode.name,
      convertContext);
    // Create at least a pattern for the parent node and the current path.
    if (pushTerminalVariables) {
      patterns.push(this.operationFactory.createPattern(subject, predicate, object));
    }

    // Create patterns for the node's arguments
    if (fieldNode.arguments && fieldNode.arguments.length) {
      for (const argument of fieldNode.arguments) {
        if (argument.name.value === 'first') {
          if (argument.value.kind !== 'IntValue') {
            throw new Error('Invalid value type for \'first\' argument: ' + argument.value.kind);
          }
          limit = parseInt((<IntValueNode> argument.value).value, 10);
        } else if (argument.name.value === 'offset') {
          if (argument.value.kind !== 'IntValue') {
            throw new Error('Invalid value type for \'offset\' argument: ' + argument.value.kind);
          }
          offset = parseInt((<IntValueNode> argument.value).value, 10);
        } else {
          const valueOutput = this.valueToTerm(argument.value, convertContext);
          for (const term of valueOutput.terms) {
            patterns.push(this.operationFactory.createPattern(object,
              this.valueToNamedNode(argument.name.value, convertContext.context), term));
          }
          if (valueOutput.auxiliaryPatterns) {
            patterns = patterns.concat(valueOutput.auxiliaryPatterns);
          }
        }
      }
    }

    // Directives
    if (fieldNode.directives) {
      for (const directive of fieldNode.directives) {
        if (!this.handleDirective(directive, convertContext)) {
          return this.operationFactory.createBgp([]);
        }
      }
    }

    // Recursive call for nested selection sets
    let operation: Algebra.Operation = this.operationFactory.createBgp(patterns);
    if (fieldNode.selectionSet && fieldNode.selectionSet.selections.length) {
      // Change path value when there was an alias on this node.
      const pathSubValue: string = fieldNode.alias ? fieldNode.alias.value : fieldNode.name.value;
      const subConvertContext: IConvertContext = pushTerminalVariables
        ? Object.assign(Object.assign({}, convertContext),
        { path: convertContext.path.concat([pathSubValue]) })
        : convertContext;
      operation = this.joinOperations([operation].concat(fieldNode.selectionSet.selections
        .map(this.selectionToPatterns.bind(this, subConvertContext, pushTerminalVariables ? object : subject))));
    } else if (pushTerminalVariables) {
      // If no nested selection sets exist,
      // consider the object variable as a terminal variable that should be selected.
      convertContext.terminalVariables.push(object);
    }

    // Wrap the operation in a slice if a 'first' or 'offset' argument was provided.
    if (offset || limit) {
      operation = this.operationFactory
        .createSlice(this.operationFactory.createProject(operation, []), offset, limit);
    }

    return operation;
  }

  /**
   * Check if the given node is a meta field, for things like introspection.
   * If so, return a new operation for this, otherwise, null is returned.
   * @param {IConvertContext} convertContext A convert context.
   * @param {Term} subject The subject.
   * @param {FieldNode} fieldNode The field node to convert.
   * @param {Pattern[]} auxiliaryPatterns Optional patterns that should be part of the BGP.
   * @return {Operation} An operation or null.
   */
  public handleMetaField(convertContext: IConvertContext, subject: RDF.Term, fieldNode: FieldNode,
                         auxiliaryPatterns?: Algebra.Pattern[]): Algebra.Operation {
    // TODO: in the future, we should add support for GraphQL wide range of introspection features:
    // http://graphql.org/learn/introspection/
    if (fieldNode.name.value === '__typename') {
      // Aliases change the variable name (and path name)
      const object: RDF.Variable = this.nameToVariable(fieldNode.alias ? fieldNode.alias : fieldNode.name,
        convertContext);
      convertContext.terminalVariables.push(object);
      return this.operationFactory.createBgp([
        this.operationFactory.createPattern(
          subject, this.dataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), object,
        ),
      ].concat(auxiliaryPatterns || []));
    }
    return null;
  }

  /**
   * Join the given array of operations.
   * If all operations are BGPs, then a single big BGP with all patterns from the given BGPs will be created.
   * @param {Operation[]} operations An array of operations.
   * @return {Operation} A single joined operation.
   */
  public joinOperations(operations: Algebra.Operation[]): Algebra.Operation {
    if (!operations.length) {
      throw new Error('Can not make a join of no operations');
    }
    if (operations.length === 1) {
      return operations[0];
    }

    // Check if all operations are BGPs
    let bgps: boolean = true;
    for (const operation of operations) {
      if (operation.type !== 'bgp') {
        bgps = false;
        break;
      }
    }

    if (bgps) {
      // Create a big BGP from all BGPs
      return this.operationFactory.createBgp([].concat.apply([], operations
        .map((op) => (<Algebra.Bgp> op).patterns)));
    } else {
      // Create nested joins
      return operations.reverse().reduce((prev, cur) => prev ? this.operationFactory.createJoin(cur, prev) : cur, null);
    }
  }

  /**
   * Convert a name node to a variable built from the node name and the current path inside the context.
   * @param {NameNode} name A name node.
   * @param {IConvertContext} convertContext A convert context.
   * @return {Variable} A variable.
   */
  public nameToVariable(name: NameNode, convertContext: IConvertContext): RDF.Variable {
    return this.dataFactory.variable((convertContext.path.length ? convertContext.path.join('_') + '_' : '')
      + name.value);
  }

  /**
   * Convert a GraphQL term into a URI using the given context.
   * @param {string} value A GraphQL term.
   * @param {IContext} context A JSON-LD context.
   * @return {NamedNode} A named node.
   */
  public valueToNamedNode(value: string, context: IContext): RDF.NamedNode {
    return this.dataFactory.namedNode(context[value] || value);
  }

  /**
   * Convert a GraphQL value into an RDF term.
   * @param {ValueNode} valueNode A GraphQL value node.
   * @param {IConvertContext} convertContext A convert context.
   * @return {Term} An RDF term.
   */
  public valueToTerm(valueNode: ValueNode, convertContext: IConvertContext): IValueToTermOutput {
    switch (valueNode.kind) {
    case 'Variable':
      const variableNode: VariableNode = <VariableNode> valueNode;
      const id: string = variableNode.name.value;
      const value: ValueNode = convertContext.variablesDict[id];
      const meta = convertContext.variablesMetaDict[id];

      // Handle missing values
      if (!value) {
        if (!meta || meta.mandatory) {
          throw new Error(`Undefined variable: ${id}`);
        } else {
          return this.valueToTerm({ kind: 'NullValue' }, convertContext);
        }
      }

      // Don't allow variables that refer to other variables
      if (value.kind === 'Variable') {
        throw new Error(`Variable refers to another variable: ${id}`);
      }

      if (meta) {
        // Check the type
        if (meta.list) {
          // If we expect a list, check if we got a list.
          if (value.kind !== 'ListValue') {
            throw new Error(`Expected a list, but got ${value.kind} for ${id}`);
          }
          // Check the type in the list
          if (meta.type) {
            const listValue: ListValueNode = <ListValueNode> value;
            for (const v of listValue.values) {
              if (v.kind !== meta.type) {
                throw new Error(`Expected ${meta.type}, but got ${v.kind} for ${id}`);
              }
            }
          }
        } else if (meta.type) {
          // This is allowed to be different (?)
          /*if (value.kind !== meta.type) {
            throw new Error(`Expected ${meta.type}, but got ${value.kind} for ${id}`);
          }*/
        }
      }

      return this.valueToTerm(value, convertContext);
    case 'IntValue':
      return { terms: [ this.dataFactory.literal((<IntValueNode> valueNode).value,
        this.dataFactory.namedNode('http://www.w3.org/2001/XMLSchema#integer')) ] };
    case 'FloatValue':
      return { terms: [ this.dataFactory.literal((<FloatValueNode> valueNode).value,
        this.dataFactory.namedNode('http://www.w3.org/2001/XMLSchema#float')) ] };
    case 'StringValue':
      return { terms: [ this.dataFactory.literal((<StringValueNode> valueNode).value) ] };
    case 'BooleanValue':
      return { terms: [ this.dataFactory.literal((<BooleanValueNode> valueNode).value ? 'true' : 'false',
        this.dataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')) ] };
    case 'NullValue':
      return { terms: [ this.dataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil') ] };
    case 'EnumValue':
      return { terms: [ this.valueToNamedNode((<EnumValueNode> valueNode).value, convertContext.context) ] };
    case 'ListValue':
      const listTerms: RDF.Term[] = [];
      let auxiliaryPatterns: Algebra.Pattern[] = [];
      // Create terms for list values
      for (const v of (<ListValueNode> valueNode).values) {
        const subValue = this.valueToTerm(v, convertContext);
        for (const term of subValue.terms) {
          listTerms.push(term);
        }
        if (subValue.auxiliaryPatterns) {
          auxiliaryPatterns = auxiliaryPatterns.concat(subValue.auxiliaryPatterns);
        }
      }

      if (this.arraysToRdfLists) {
        // Convert array to RDF list

        // Create chained list structure
        const firstListNode: RDF.Term = this.dataFactory.blankNode();
        let listNode: RDF.Term = firstListNode;
        let remaining: number = listTerms.length;
        for (const term of listTerms) {
          auxiliaryPatterns.push(this.operationFactory.createPattern(
            listNode,
            this.dataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'),
            term,
          ));
          const nextListNode: RDF.Term = --remaining === 0
            ? this.dataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil')
            : this.dataFactory.blankNode();
          auxiliaryPatterns.push(this.operationFactory.createPattern(
            listNode,
            this.dataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'),
            nextListNode,
          ));
          listNode = nextListNode;
        }
        return { terms: [ firstListNode ], auxiliaryPatterns };
      } else {
        // Convert array to multiple terms that will be linked via the same predicate.
        return { terms: listTerms, auxiliaryPatterns };
      }
    case 'ObjectValue':
      // Convert object keys to predicates and values to objects, and link them both with a new blank node.
      const subject = this.dataFactory.blankNode();
      let auxiliaryObjectPatterns: Algebra.Pattern[] = [];
      for (const field of (<ObjectValueNode> valueNode).fields) {
        const predicate = this.valueToNamedNode(field.name.value, convertContext.context);
        const subValue = this.valueToTerm(field.value, convertContext);
        for (const term of subValue.terms) {
          auxiliaryObjectPatterns.push(this.operationFactory.createPattern(subject, predicate, term));
        }
        if (subValue.auxiliaryPatterns) {
          auxiliaryObjectPatterns = auxiliaryObjectPatterns.concat(subValue.auxiliaryPatterns);
        }
      }
      return { terms: [ subject ], auxiliaryPatterns: auxiliaryObjectPatterns };
    }
  }

  /**
   * Get an argument by name.
   * This will throw an error if the argument could not be found.
   * @param {ReadonlyArray<ArgumentNode>} args Arguments or null.
   * @param {string} name The name of an argument.
   * @return {ArgumentNode} The named argument.
   */
  public getArgument(args: ReadonlyArray<ArgumentNode> | null, name: string): ArgumentNode {
    if (!args) {
      throw new Error('No arguments were defined for the directive.');
    }
    for (const argument of args) {
      if (argument.name.value === name) {
        return argument;
      }
    }
    throw new Error('Undefined argument: ' + name);
  }

  /**
   * Handle a directive.
   * @param {DirectiveNode} directive A directive.
   * @param {IConvertContext} convertContext A convert context.
   * @return {boolean} If processing of the active should continue.
   */
  public handleDirective(directive: DirectiveNode, convertContext: IConvertContext): boolean {
    const arg: ArgumentNode = this.getArgument(directive.arguments, 'if');
    const subValue = this.valueToTerm(arg.value, convertContext);
    if (subValue.terms.length !== 1) {
      throw new Error(`Can not apply a directive with a list: ${subValue.terms}`);
    }
    const val: RDF.Term = subValue.terms[0];
    switch (directive.name.value) {
    case 'include':
      if (val.termType === 'Literal' && val.value === 'false') {
        return false;
      }
      break;
    case 'skip':
      if (val.termType === 'Literal' && val.value === 'true') {
        return false;
      }
      break;
    default:
      throw new Error('Unsupported directive: ' + directive.name.value);
    }
    return true;
  }

}

/**
 * Constructor settings object interface for {@link Converter}.
 */
export interface IConverterSettings {
  /**
   * A custom datafactory.
   */
  dataFactory?: RDF.DataFactory;
  /**
   * If arrays should be converted to RDF lists.
   * Otherwise (default), arrays will be converted to multiple predicate-object links.
   */
  arraysToRdfLists?: boolean;
}

/**
 * A context object that is passed through conversion steps.
 */
export interface IConvertContext {
  /**
   * A JSON-LD context.
   */
  context: IContext;
  /**
   * The current JSON path within the GraphQL query.
   */
  path: string[];
  /**
   * All variables that have no deeper child and should be selected withing the GraphQL query.
   */
  terminalVariables: RDF.Variable[];
  /**
   * All available fragment definitions.
   */
  fragmentDefinitions: {[name: string]: FragmentDefinitionNode};
  /**
   * A variable dictionary in case there are dynamic arguments in the query.
   */
  variablesDict: IVariablesDictionary;
  /**
   * A dictionary of variable metadata.
   */
  variablesMetaDict: IVariablesMetaDictionary;
}

/**
 * A JSON-LD context.
 */
export interface IContext {
  [id: string]: string;
}

/**
 * A variable dictionary in case there are dynamic arguments in the query.
 */
export interface IVariablesDictionary {
  [id: string]: ValueNode;
}

/**
 * A dictionary of variable metadata.
 */
export interface IVariablesMetaDictionary {
  [id: string]: { mandatory: boolean, list: boolean, type: string };
}

/**
 * The output of converting a value node to an RDF term.
 */
export interface IValueToTermOutput {
  terms: RDF.Term[];
  auxiliaryPatterns?: Algebra.Pattern[];
}
