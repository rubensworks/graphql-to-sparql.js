import {DataFactory} from "rdf-data-factory";
import {Factory} from "@traqula/algebra-sparql-1-1";
import {Converter} from "../../lib/Converter";
import {NodeHandlerDefinitionOperation} from "../../lib/handler/NodeHandlerDefinitionOperation";
import { IConvertContext, IVariablesDictionary, SingularizeState } from "../../lib/IConvertContext";
import {Util} from "../../lib/Util";
import {JsonLdContextNormalized} from "jsonld-context-parser";

// tslint:disable:object-literal-sort-keys

const DF = new DataFactory();
const OperationFactory = new Factory(DF);

describe('NodeHandlerDefinitionOperation', () => {

  let handler: NodeHandlerDefinitionOperation;

  beforeEach(() => {
    const settings = {
      variableDelimiter: '_',
      expressionVariableCounter: 0,
    };
    const util = new Util(settings);
    handler = new NodeHandlerDefinitionOperation(util, settings);
    Converter.registerNodeHandlers(util, settings);
    Converter.registerNodeValueHandlers(util, settings);
  });

  describe('#handle', () => {
    it('should convert an operation query definition node', async () => {
      const ctx: IConvertContext = {
        context: new JsonLdContextNormalized({ theField: 'http://example.org/theField' }),
        graph: DF.defaultGraph(),
        path: [ 'a' ],
        singularizeState: SingularizeState.PLURAL,
        singularizeVariables: {},
        subject: DF.namedNode('subject'),
        terminalVariables: [],
        fragmentDefinitions: {},
        variablesDict: {},
        variablesMetaDict: {},
      };
      return expect(handler.handle({
        kind: 'OperationDefinition',
        operation: 'query',
        selectionSet: {
          kind: 'SelectionSet',
          selections: [
            { kind: 'Field', name: { kind: 'Name', value: 'theField' } },
          ],
        },
      }, ctx)).toEqual(OperationFactory.createBgp([
        OperationFactory.createPattern(
          DF.namedNode('subject'),
          DF.namedNode('http://example.org/theField'),
          DF.variable('a_theField'),
        ),
      ]));
    });

    it('should convert an operation query definition node with a directive', async () => {
      const ctx: IConvertContext = {
        context: new JsonLdContextNormalized({ theField: 'http://example.org/theField' }),
        graph: DF.defaultGraph(),
        path: [ 'a' ],
        singularizeState: SingularizeState.PLURAL,
        singularizeVariables: {},
        subject: DF.namedNode('subject'),
        terminalVariables: [],
        fragmentDefinitions: {},
        variablesDict: <IVariablesDictionary> {
          varTrue: { kind: 'BooleanValue', value: true },
        },
        variablesMetaDict: {},
      };
      return expect(handler.handle({
        kind: 'OperationDefinition',
        operation: 'query',
        selectionSet: {
          kind: 'SelectionSet',
          selections: [
            { kind: 'Field', name: { kind: 'Name', value: 'theField' } },
          ],
        },
        directives: [
          { kind: 'Directive', name: { kind: 'Name', value: 'include' }, arguments: [
            {
              kind: 'Argument',
              name: { kind: 'Name', value: 'if' },
              value: { kind: 'Variable', name: { kind: 'Name', value: 'varTrue' } },
            },
          ] },
        ],
      }, ctx)).toEqual(OperationFactory.createBgp([
        OperationFactory.createPattern(
          DF.namedNode('subject'),
          DF.namedNode('http://example.org/theField'),
          DF.variable('a_theField'),
        ),
      ]));
    });
  });

});
