import * as DataFactory from "@rdfjs/data-model";
import {DirectiveNode} from "graphql";
import {Converter} from "../../lib/Converter";
import {NodeHandlerAdapter} from "../../lib/handler/NodeHandlerAdapter";
import {IVariablesDictionary} from "../../lib/IConvertContext";
import {Util} from "../../lib/Util";

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
  });

  describe('#getNodeQuadContextSelectionSet', () => {
    let ctx;

    beforeEach(() => {
      ctx = {
        context: { theField: 'http://example.org/theField' },
        path: [ 'a' ],
        subject: DataFactory.namedNode('subject'),
        terminalVariables: [],
        fragmentDefinitions: {},
        variablesDict: <IVariablesDictionary> {
          varTrue: { kind: 'BooleanValue', value: true },
        },
        variablesMetaDict: {},
      };
    });

    it('should be empty for no selection set', async () => {
      return expect(adapter.getNodeQuadContextSelectionSet(null, ctx)).toEqual({});
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
      }, ctx)).toEqual({});
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
      }, ctx)).toEqual({ subject: DataFactory.variable('a_id') });
      expect(ctx.terminalVariables).toEqual([ DataFactory.variable('a_id') ]);
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
      }, ctx)).toEqual({ subject: DataFactory.variable('a_myId') });
      expect(ctx.terminalVariables).toEqual([ DataFactory.variable('a_myId') ]);
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
      }, ctx)).toEqual({ subject: DataFactory.variable('a_id') });
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
      }, ctx)).toEqual({ subject: DataFactory.namedNode('http://ex.org/val') });
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
      }, ctx)).toThrow(new Error('Only single values can be set as id, but got 2 at id'));
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
      }, ctx)).toEqual({ graph: DataFactory.variable('a_graph') });
      expect(ctx.terminalVariables).toEqual([ DataFactory.variable('a_graph') ]);
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
      }, ctx)).toEqual({ graph: DataFactory.variable('a_myGraph') });
      expect(ctx.terminalVariables).toEqual([ DataFactory.variable('a_myGraph') ]);
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
      }, ctx)).toEqual({ graph: DataFactory.variable('a_graph') });
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
      }, ctx)).toEqual({ graph: DataFactory.namedNode('http://ex.org/val') });
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
      }, ctx)).toThrow(new Error('Only single values can be set as graph, but got 2 at graph'));
    });
  });

  describe('#testDirectives', () => {
    const ctx = {
      context: {},
      graph: DataFactory.defaultGraph(),
      path: [],
      subject: null,
      terminalVariables: [],
      fragmentDefinitions: {},
      variablesDict: <IVariablesDictionary> {
        varTrue: { kind: 'BooleanValue', value: true },
        varFalse: { kind: 'BooleanValue', value: false },
      },
      variablesMetaDict: {},
    };
    const includeTrue: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'include' }, arguments: [
      {
        kind: 'Argument',
        name: { kind: 'Name', value: 'if' },
        value: { kind: 'Variable', name: { kind: 'Name', value: 'varTrue' } },
      },
    ] };
    const includeFalse: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'include' }, arguments: [
      {
        kind: 'Argument',
        name: { kind: 'Name', value: 'if' },
        value: { kind: 'Variable', name: { kind: 'Name', value: 'varFalse' } },
      },
    ] };
    const skipTrue: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'skip' }, arguments: [
      {
        kind: 'Argument',
        name: { kind: 'Name', value: 'if' },
        value: { kind: 'Variable', name: { kind: 'Name', value: 'varTrue' } },
      },
    ] };
    const skipFalse: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'skip' }, arguments: [
      {
        kind: 'Argument',
        name: { kind: 'Name', value: 'if' },
        value: { kind: 'Variable', name: { kind: 'Name', value: 'varFalse' } },
      },
    ] };
    const unknownDirective: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'unknow' }, arguments: [
      {
        kind: 'Argument',
        name: { kind: 'Name', value: 'if' },
        value: { kind: 'Variable', name: { kind: 'Name', value: 'varFalse' } },
      },
    ] };
    const idDirective: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'id' }, arguments: [] };

    it('should ignore an unsupported directive', async () => {
      return expect(adapter.testDirectives(unknownDirective, ctx)).toBeTruthy();
    });

    it('should return true on a true inclusion', async () => {
      return expect(adapter.testDirectives(includeTrue, ctx)).toBeTruthy();
    });

    it('should return false on a false inclusion', async () => {
      return expect(adapter.testDirectives(includeFalse, ctx)).toBeFalsy();
    });

    it('should return false on a true skip', async () => {
      return expect(adapter.testDirectives(skipTrue, ctx)).toBeFalsy();
    });

    it('should return true on a false skip', async () => {
      return expect(adapter.testDirectives(skipFalse, ctx)).toBeTruthy();
    });
  });
});
