import {DataFactory} from "rdf-data-factory";
import {Converter} from "../../lib/Converter";
import {NodeHandlerAdapter} from "../../lib/handler/NodeHandlerAdapter";
import { IConvertContext, IVariablesDictionary } from "../../lib/IConvertContext";
import {Util} from "../../lib/Util";
import {JsonLdContextNormalized} from "jsonld-context-parser";

const DF = new DataFactory();

// tslint:disable:object-literal-sort-keys

describe('NodeHandlerAdapter', () => {

  let adapter: NodeHandlerAdapter<any>;

  beforeEach(() => {
    const settings = {
      variableDelimiter: '_',
      expressionVariableCounter: 0,
    };
    const util = new Util(settings);
    adapter = new (<any> NodeHandlerAdapter)(null, util, settings);
    Converter.registerNodeValueHandlers(util, settings);
    Converter.registerDirectiveNodeHandlers(util, settings);
  });

  describe('#getNodeQuadContextSelectionSet', () => {
    let ctx: IConvertContext;

    beforeEach(() => {
      ctx = <IConvertContext> <any> {
        context: new JsonLdContextNormalized({ theField: 'http://example.org/theField' }),
        path: [ 'a' ],
        subject: DF.namedNode('subject'),
        terminalVariables: [],
        fragmentDefinitions: {},
        variablesDict: <IVariablesDictionary> {
          varTrue: { kind: 'BooleanValue', value: true },
        },
        variablesMetaDict: {},
      };
    });

    it('should be empty for no selection set', async () => {
      return expect(adapter.getNodeQuadContextSelectionSet(undefined, 'field', ctx)).toEqual({});
    });

    it('should be empty for unknown fields', async () => {
      return expect(adapter.getNodeQuadContextSelectionSet({
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field1' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field2' },
          },
          {
            kind: 'FragmentSpread',
            name: { kind: 'Name', value: 'spread1' },
          },
        ],
      }, 'field', ctx)).toEqual({});
    });

    it('should return a variable id for an id field', async () => {
      expect(adapter.getNodeQuadContextSelectionSet({
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field1' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'id' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field3' },
          },
        ],
      }, 'field', ctx)).toEqual({ subject: DF.variable('a_id') });
      expect(ctx.terminalVariables).toEqual([ DF.variable('a_id') ]);
    });

    it('should return a variable id for an id field with alias', async () => {
      expect(adapter.getNodeQuadContextSelectionSet({
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field1' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'id' },
            alias: { kind: 'Name', value: 'myId' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field3' },
          },
        ],
      }, 'field', ctx)).toEqual({ subject: DF.variable('a_myId') });
      expect(ctx.terminalVariables).toEqual([ DF.variable('a_myId') ]);
    });

    it('should return a variable id for an id field with non-_ args', async () => {
      return expect(adapter.getNodeQuadContextSelectionSet({
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field1' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'id' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'bla1' },
                value: { kind: 'EnumValue', value: 'http://ex.org/val' },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'bla2' },
                value: { kind: 'EnumValue', value: 'http://ex.org/val' },
              },
            ],
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field3' },
          },
        ],
      }, 'field', ctx)).toEqual({ subject: DF.variable('a_id') });
    });

    it('should return a concrete id for an id field with _ arg', async () => {
      expect(adapter.getNodeQuadContextSelectionSet({
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field1' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'id' },
            alias: { kind: 'Name', value: 'myId' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: '_' },
                value: { kind: 'EnumValue', value: 'http://ex.org/val' },
              },
            ],
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field3' },
          },
        ],
      }, 'field', ctx)).toEqual({ subject: DF.namedNode('http://ex.org/val') });
      expect(ctx.terminalVariables).toEqual([]);
    });

    it('should error on a concrete id for an id field with _ arg with list value', async () => {
      return expect(() => adapter.getNodeQuadContextSelectionSet({
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field1' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'id' },
            alias: { kind: 'Name', value: 'myId' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: '_' },
                value: { kind: 'ListValue', values: [
                    { kind: 'EnumValue', value: 'http://ex.org/val1' },
                    { kind: 'EnumValue', value: 'http://ex.org/val2' },
                ] },
              },
            ],
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field3' },
          },
        ],
      }, 'field', ctx)).toThrow(new Error('Only single values can be set as id, but got 2 at id'));
    });

    it('should return a variable graph for an graph field', async () => {
      expect(adapter.getNodeQuadContextSelectionSet({
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field1' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'graph' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field3' },
          },
        ],
      }, 'field', ctx)).toEqual({ graph: DF.variable('a_graph') });
      expect(ctx.terminalVariables).toEqual([ DF.variable('a_graph') ]);
    });

    it('should return a variable id for an graph field with alias', async () => {
      expect(adapter.getNodeQuadContextSelectionSet({
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field1' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'graph' },
            alias: { kind: 'Name', value: 'myGraph' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field3' },
          },
        ],
      }, 'field', ctx)).toEqual({ graph: DF.variable('a_myGraph') });
      expect(ctx.terminalVariables).toEqual([ DF.variable('a_myGraph') ]);
    });

    it('should return a variable graph for a graph field with non-_ args', async () => {
      return expect(adapter.getNodeQuadContextSelectionSet({
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field1' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'graph' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'bla1' },
                value: { kind: 'EnumValue', value: 'http://ex.org/val' },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'bla2' },
                value: { kind: 'EnumValue', value: 'http://ex.org/val' },
              },
            ],
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field3' },
          },
        ],
      }, 'field', ctx)).toEqual({ graph: DF.variable('a_graph') });
    });

    it('should return a concrete graph for a graph field with _ arg', async () => {
      expect(adapter.getNodeQuadContextSelectionSet({
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field1' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'graph' },
            alias: { kind: 'Name', value: 'myGraph' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: '_' },
                value: { kind: 'EnumValue', value: 'http://ex.org/val' },
              },
            ],
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field3' },
          },
        ],
      }, 'field', ctx)).toEqual({ graph: DF.namedNode('http://ex.org/val') });
      expect(ctx.terminalVariables).toEqual([]);
    });

    it('should error on a concrete id for an graph field with _ arg with list value', async () => {
      return expect(() => adapter.getNodeQuadContextSelectionSet({
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field1' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'graph' },
            alias: { kind: 'Name', value: 'myGraph' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: '_' },
                value: { kind: 'ListValue', values: [
                    { kind: 'EnumValue', value: 'http://ex.org/val1' },
                    { kind: 'EnumValue', value: 'http://ex.org/val2' },
                ] },
              },
            ],
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'field3' },
          },
        ],
      }, 'field', ctx)).toThrow(new Error('Only single values can be set as graph, but got 2 at graph'));
    });
  });
});
