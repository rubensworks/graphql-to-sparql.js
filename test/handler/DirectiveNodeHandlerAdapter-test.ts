import * as DataFactory from "@rdfjs/data-model";
import {literal, namedNode} from "@rdfjs/data-model";
import {DirectiveNode} from "graphql";
import {Converter} from "../../lib/Converter";
import {DirectiveNodeHandlerAdapter} from "../../lib/handler/directivenode/DirectiveNodeHandlerAdapter";
import {IVariablesDictionary} from "../../lib/IConvertContext";
import {Util} from "../../lib/Util";
import {JsonLdContextNormalized} from "jsonld-context-parser";

// tslint:disable:object-literal-sort-keys

describe('DirectiveNodeHandlerAdapter', () => {

  let adapter: DirectiveNodeHandlerAdapter;

  beforeEach(() => {
    const settings = {
      variableDelimiter: '_',
      expressionVariableCounter: 0,
    };
    const util = new Util(settings);
    adapter = new (<any> DirectiveNodeHandlerAdapter)(null, util, settings);
    Converter.registerNodeValueHandlers(util, settings);
  });

  describe('#getDirectiveConditionalValue', () => {
    const ctx = {
      context: new JsonLdContextNormalized({}),
      graph: DataFactory.defaultGraph(),
      path: [ 'parent' ],
      subject: null,
      singularizeState: null,
      singularizeVariables: {},
      terminalVariables: [],
      fragmentDefinitions: {},
      variablesDict: <IVariablesDictionary> {
        varTrue: { kind: 'BooleanValue', value: true },
        varFalse: { kind: 'BooleanValue', value: false },
        varList: { kind: 'ListValue',
          values: [
            { kind: 'BooleanValue', value: true },
            { kind: 'BooleanValue', value: false },
          ] },
      },
      variablesMetaDict: {},
    };

    it('should throw if no \'if\' arg is present', () => {
      const directive: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'skip' },
        arguments: [
          {
            kind: 'Argument',
            name: { kind: 'Name', value: 'somethingelse' },
            value: { kind: 'Variable', name: { kind: 'Name', value: 'varTrue' } },
          },
        ] };
      return expect(() => adapter.getDirectiveConditionalValue(directive, ctx))
        .toThrow(new Error('The directive skip is missing an if-argument.'));
    });

    it('should get value if an \'if\' arg is present with list value', () => {
      const directive: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'skip' },
        arguments: [
          {
            kind: 'Argument',
            name: { kind: 'Name', value: 'if' },
            value: { kind: 'Variable', name: { kind: 'Name', value: 'varList' } },
          },
        ] };
      return expect(() => adapter.getDirectiveConditionalValue(directive, ctx))
        .toThrow(new Error('Can not apply the directive skip with a list.'));
    });

    it('should get value if an \'if\' arg is present', () => {
      const directive: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'skip' },
        arguments: [
          {
            kind: 'Argument',
            name: { kind: 'Name', value: 'if' },
            value: { kind: 'Variable', name: { kind: 'Name', value: 'varTrue' } },
          },
        ] };
      return expect(adapter.getDirectiveConditionalValue(directive, ctx))
        .toEqual(literal('true', namedNode('http://www.w3.org/2001/XMLSchema#boolean')));
    });
  });
});
