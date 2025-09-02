import {DataFactory} from "rdf-data-factory";
import {DirectiveNode, NameNode} from "graphql";
import * as RDF from "@rdfjs/types";
import { Factory, Algebra } from "@traqula/algebra-transformations-1-2";
import {Converter} from "../lib/Converter";
import {IConvertContext, IVariablesDictionary, SingularizeState} from "../lib/IConvertContext";
import {Util} from "../lib/Util";
import {JsonLdContextNormalized} from "jsonld-context-parser";
import { IDirectiveNodeHandlerOutput } from '../lib/handler/directivenode';

// tslint:disable:object-literal-sort-keys

const DF = new DataFactory();
const OperationFactory = new Factory(DF);

describe('Util', () => {

  let util: Util;

  beforeEach(() => {
    const settings = {
      variableDelimiter: '_',
      expressionVariableCounter: 0,
    };
    util = new Util(settings);
    Converter.registerNodeValueHandlers(util, settings);
    Converter.registerDirectiveNodeHandlers(util, settings);
  });

  describe('#joinOperations', () => {
    it('should error on no patterns', async () => {
      return expect(() => util.joinOperations([]).toThrow());
    });

    it('should return the single passed operation', async () => {
      return expect(util.joinOperations([
        OperationFactory.createBgp([]),
      ])).toEqual(
        OperationFactory.createBgp([]),
      );
    });

    it('should return a BGP from 3 BGPs', async () => {
      return expect(util.joinOperations([
        OperationFactory.createBgp([
          OperationFactory.createPattern(<RDF.Term> <any> 'a1', <RDF.Term> <any> 'b1',
            <RDF.Term> <any> 'c1'),
          OperationFactory.createPattern(<RDF.Term> <any> 'd1', <RDF.Term> <any> 'e1',
            <RDF.Term> <any> 'f1'),
        ]),
        OperationFactory.createBgp([
          OperationFactory.createPattern(<RDF.Term> <any> 'a2', <RDF.Term> <any> 'b2',
            <RDF.Term> <any> 'c2'),
          OperationFactory.createPattern(<RDF.Term> <any> 'd2', <RDF.Term> <any> 'e2',
            <RDF.Term> <any> 'f2'),
        ]),
        OperationFactory.createBgp([
          OperationFactory.createPattern(<RDF.Term> <any> 'a3', <RDF.Term> <any> 'b3',
            <RDF.Term> <any> 'c3'),
          OperationFactory.createPattern(<RDF.Term> <any> 'd3', <RDF.Term> <any> 'e3',
            <RDF.Term> <any> 'f3'),
        ]),
      ])).toEqual(
        OperationFactory.createBgp([
          OperationFactory.createPattern(<RDF.Term> <any> 'a1', <RDF.Term> <any> 'b1',
            <RDF.Term> <any> 'c1'),
          OperationFactory.createPattern(<RDF.Term> <any> 'd1', <RDF.Term> <any> 'e1',
            <RDF.Term> <any> 'f1'),
          OperationFactory.createPattern(<RDF.Term> <any> 'a2', <RDF.Term> <any> 'b2',
            <RDF.Term> <any> 'c2'),
          OperationFactory.createPattern(<RDF.Term> <any> 'd2', <RDF.Term> <any> 'e2',
            <RDF.Term> <any> 'f2'),
          OperationFactory.createPattern(<RDF.Term> <any> 'a3', <RDF.Term> <any> 'b3',
            <RDF.Term> <any> 'c3'),
          OperationFactory.createPattern(<RDF.Term> <any> 'd3', <RDF.Term> <any> 'e3',
            <RDF.Term> <any> 'f3'),
        ]),
      );
    });

    it('should return a nested join when not all operations are BGPs', async () => {
      return expect(util.joinOperations([
        OperationFactory.createUnion([ { type: Algebra.Types.NOP }, { type: Algebra.Types.NOP } ]),
        OperationFactory.createBgp([
          OperationFactory.createPattern(<RDF.Term> <any> 'a2', <RDF.Term> <any> 'b2',
            <RDF.Term> <any> 'c2'),
          OperationFactory.createPattern(<RDF.Term> <any> 'd2', <RDF.Term> <any> 'e2',
            <RDF.Term> <any> 'f2'),
        ]),
        OperationFactory.createLeftJoin({ type: Algebra.Types.NOP }, { type: Algebra.Types.NOP }),
      ])).toEqual(
        OperationFactory.createJoin([
          OperationFactory.createBgp([
            OperationFactory.createPattern(<RDF.Term> <any> 'a2', <RDF.Term> <any> 'b2',
              <RDF.Term> <any> 'c2'),
            OperationFactory.createPattern(<RDF.Term> <any> 'd2', <RDF.Term> <any> 'e2',
              <RDF.Term> <any> 'f2'),
          ]),
          OperationFactory.createJoin([
            OperationFactory.createUnion([ { type: Algebra.Types.NOP }, { type: Algebra.Types.NOP } ]),
            OperationFactory.createLeftJoin({ type: Algebra.Types.NOP }, { type: Algebra.Types.NOP }),
          ]),
        ]),
      );
    });

    it('should return a left join from multiple BGPs and one left join', async () => {
      return expect(util.joinOperations([
        OperationFactory.createLeftJoin(
          OperationFactory.createBgp([
            OperationFactory.createPattern(<RDF.Term> <any> 'x2', <RDF.Term> <any> 'y2',
              <RDF.Term> <any> 'z2'),
          ]),
          OperationFactory.createBgp([
            OperationFactory.createPattern(<RDF.Term> <any> 'x2O', <RDF.Term> <any> 'y2O',
              <RDF.Term> <any> 'z2O'),
          ]),
        ),
        OperationFactory.createBgp([
          OperationFactory.createPattern(<RDF.Term> <any> 'a2', <RDF.Term> <any> 'b2',
            <RDF.Term> <any> 'c2'),
          OperationFactory.createPattern(<RDF.Term> <any> 'd2', <RDF.Term> <any> 'e2',
            <RDF.Term> <any> 'f2'),
        ]),
      ])).toEqual(
        OperationFactory.createLeftJoin(
          OperationFactory.createBgp([
            OperationFactory.createPattern(<RDF.Term> <any> 'a2', <RDF.Term> <any> 'b2',
              <RDF.Term> <any> 'c2'),
            OperationFactory.createPattern(<RDF.Term> <any> 'd2', <RDF.Term> <any> 'e2',
              <RDF.Term> <any> 'f2'),
            OperationFactory.createPattern(<RDF.Term> <any> 'x2', <RDF.Term> <any> 'y2',
              <RDF.Term> <any> 'z2'),
          ]),
          OperationFactory.createBgp([
            OperationFactory.createPattern(<RDF.Term> <any> 'x2O', <RDF.Term> <any> 'y2O',
              <RDF.Term> <any> 'z2O'),
          ]),
        ),
      );
    });
  });

  describe('#nameToVariable', () => {
    it('should convert a variable with an empty path', async () => {
      const ctx: IConvertContext = {
        context: new JsonLdContextNormalized({}),
        graph: DF.defaultGraph(),
        path: [],
        subject: null!,
        singularizeState: SingularizeState.PLURAL,
        singularizeVariables: {},
        terminalVariables: [],
        fragmentDefinitions: {},
        variablesDict: {},
        variablesMetaDict: {},
      };
      return expect(util.nameToVariable('varName', ctx))
        .toEqual(DF.variable('varName'));
    });

    it('should convert a variable with a single path element', async () => {
      const ctx: IConvertContext = {
        context: new JsonLdContextNormalized({}),
        graph: DF.defaultGraph(),
        path: [ 'abc' ],
        subject: null!,
        singularizeState: SingularizeState.PLURAL,
        singularizeVariables: {},
        terminalVariables: [],
        fragmentDefinitions: {},
        variablesDict: {},
        variablesMetaDict: {},
      };
      return expect(util.nameToVariable('varName', ctx))
        .toEqual(DF.variable('abc_varName'));
    });

    it('should convert a variable with multiple path elements', async () => {
      const ctx: IConvertContext = {
        context: new JsonLdContextNormalized({}),
        graph: DF.defaultGraph(),
        path: [ 'abc', 'def', 'ghi' ],
        subject: null!,
        singularizeState: SingularizeState.PLURAL,
        singularizeVariables: {},
        terminalVariables: [],
        fragmentDefinitions: {},
        variablesDict: {},
        variablesMetaDict: {},
      };
      return expect(util.nameToVariable('varName', ctx))
        .toEqual(DF.variable('abc_def_ghi_varName'));
    });
  });

  describe('#valueToNamedNode', () => {
    it('should directly convert a value that is not in the context', async () => {
      return expect(util.valueToNamedNode('abc', new JsonLdContextNormalized({})))
        .toEqual(DF.namedNode('abc'));
    });

    it('should expand a value that is in the context', async () => {
      return expect(util.valueToNamedNode('abc', new JsonLdContextNormalized({ abc: 'http://example.org/abc' })))
        .toEqual(DF.namedNode('http://example.org/abc'));
    });

    it('should expand a value that is in the context as an object', async () => {
      return expect(util.valueToNamedNode('abc', new JsonLdContextNormalized({ abc: { '@id': 'http://example.org/abc' } })))
        .toEqual(DF.namedNode('http://example.org/abc'));
    });
  });

  describe('#handleNodeValue', () => {
    const ctx: IConvertContext = {
      context: new JsonLdContextNormalized({
        FOOT: 'http://example.org/types/foot',
        va: 'http://example.org/va',
        vb: 'http://example.org/vb',
        vc: 'http://example.org/vc',
        va_en: { '@id': 'http://example.org/va', "@language": "en" },
        va_datetime: { '@id': 'http://example.org/va', "@type": "http://www.w3.org/2001/XMLSchema#dateTime" },
      }),
      graph: DF.defaultGraph(),
      path: [],
      subject: null!,
      singularizeState: SingularizeState.PLURAL,
      singularizeVariables: {},
      terminalVariables: [],
      fragmentDefinitions: {},
      variablesDict: <IVariablesDictionary> {
        myVar1: { kind: 'StringValue', value: 'myValue1' },
        myVar2: { kind: 'StringValue', value: 'myValue2' },
        myVar5: { kind: 'StringValue', value: 'myValue2' },
        myVar6: { kind: 'BooleanValue', value: true },
      },
      variablesMetaDict: {
        myVar1: { mandatory: true, list: false, type: 'StringValue' },
        myVar2: { mandatory: true, list: false, type: 'IntValue' },
        myVar4: { mandatory: true, list: false, type: 'StringValue' },
        myVar5: { mandatory: true, list: true, type: 'StringValue' },
        myVar6: { mandatory: true, list: true, type: 'StringValue' },
      },
    };
    it('should convert a variable that is defined', async () => {
      return expect(util.handleNodeValue(
        { kind: 'Variable', name: { kind: 'Name', value: 'myVar1' } }, 'va', ctx))
        .toEqual({ terms: [ DF.literal('myValue1') ] });
    });

    it('should error when an unknown variable is not defined', async () => {
      return expect(() => util.handleNodeValue(
        { kind: 'Variable', name: { kind: 'Name', value: 'myVar3' } }, 'va', ctx)).toThrow();
    });

    it('should error when a mandatory variable is not defined', async () => {
      return expect(() => util.handleNodeValue(
        { kind: 'Variable', name: { kind: 'Name', value: 'myVar4' } }, 'va', ctx)).toThrow();
    });

    it('should error when a variable has no list type while it was expected', async () => {
      return expect(() => util.handleNodeValue(
        { kind: 'Variable', name: { kind: 'Name', value: 'myVar5' } }, 'va', ctx)).toThrow();
    });

    it('should error when a variable has an incorrect defined list type', async () => {
      return expect(() => util.handleNodeValue(
        { kind: 'Variable', name: { kind: 'Name', value: 'myVar6' } }, 'va', ctx)).toThrow();
    });

    it('should convert an int', async () => {
      return expect(util.handleNodeValue(
        { kind: 'IntValue', value: '123' }, 'va', ctx))
        .toEqual({ terms: [ DF.literal('123',
            DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')) ] });
    });

    it('should convert a float', async () => {
      return expect(util.handleNodeValue(
        { kind: 'FloatValue', value: '123.1' }, 'va', ctx))
        .toEqual({ terms: [ DF.literal('123.1',
            DF.namedNode('http://www.w3.org/2001/XMLSchema#float')) ] });
    });

    it('should convert a string', async () => {
      return expect(util.handleNodeValue(
        { kind: 'StringValue', value: 'abc' }, 'va', ctx))
        .toEqual({ terms: [ DF.literal('abc') ] });
    });

    it('should convert a languaged string', async () => {
      return expect(util.handleNodeValue(
        { kind: 'StringValue', value: 'abc' }, 'va_en', ctx))
        .toEqual({ terms: [ DF.literal('abc', 'en') ] });
    });

    it('should convert a datatyped string', async () => {
      return expect(util.handleNodeValue(
        { kind: 'StringValue', value: 'abc' }, 'va_datetime', ctx))
        .toEqual({ terms: [ DF.literal('abc', DF
            .namedNode('http://www.w3.org/2001/XMLSchema#dateTime')) ] });
    });

    it('should convert a true boolean', async () => {
      return expect(util.handleNodeValue(
        { kind: 'BooleanValue', value: true }, 'va', ctx))
        .toEqual({ terms: [ DF.literal('true',
            DF.namedNode('http://www.w3.org/2001/XMLSchema#boolean')) ] });
    });

    it('should convert a false boolean', async () => {
      return expect(util.handleNodeValue(
        { kind: 'BooleanValue', value: false }, 'va', ctx))
        .toEqual({ terms: [ DF.literal('false',
            DF.namedNode('http://www.w3.org/2001/XMLSchema#boolean')) ] });
    });

    it('should convert a null value', async () => {
      return expect(util.handleNodeValue(
        { kind: 'NullValue' }, 'va', ctx))
        .toEqual({ terms: [ DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil') ] });
    });

    it('should convert an enum value', async () => {
      return expect(util.handleNodeValue(
        { kind: 'EnumValue', value: 'FOOT' }, 'va', ctx))
        .toEqual({ terms: [ DF.namedNode('http://example.org/types/foot') ] });
    });

    it('should convert a list value in non-RDF-list-mode', async () => {
      const out = util.handleNodeValue(
        { kind: 'ListValue', values: [
            { kind: 'BooleanValue', value: false },
            { kind: 'BooleanValue', value: true },
            { kind: 'BooleanValue', value: false },
        ] }, 'va', ctx);
      expect(out.terms).toEqual([
        DF.literal('false',
          DF.namedNode('http://www.w3.org/2001/XMLSchema#boolean')),
        DF.literal('true',
          DF.namedNode('http://www.w3.org/2001/XMLSchema#boolean')),
        DF.literal('false',
          DF.namedNode('http://www.w3.org/2001/XMLSchema#boolean')),
      ]);
    });

    it('should convert a list value in RDF-list-mode', async () => {
      const settings = { arraysToRdfLists: true };
      const utilThis = new Util(settings);
      Converter.registerNodeValueHandlers(utilThis, settings);
      const out = utilThis.handleNodeValue(
        { kind: 'ListValue', values: [
            { kind: 'BooleanValue', value: false },
            { kind: 'BooleanValue', value: true },
            { kind: 'BooleanValue', value: false },
        ] }, 'va', ctx);
      expect(out.terms[0].termType).toEqual('BlankNode');
      expect(out.auxiliaryPatterns!.length).toEqual(6);

      expect(out.auxiliaryPatterns![0].subject).toEqual(out.auxiliaryPatterns![1].subject);
      expect(out.auxiliaryPatterns![0].subject.termType).toEqual('BlankNode');
      expect(out.auxiliaryPatterns![0].predicate)
        .toEqual(DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'));
      expect(out.auxiliaryPatterns![0].object)
        .toEqual(DF.literal('false',
          DF.namedNode('http://www.w3.org/2001/XMLSchema#boolean')));
      expect(out.auxiliaryPatterns![1].subject.termType).toEqual('BlankNode');
      expect(out.auxiliaryPatterns![1].predicate)
        .toEqual(DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'));
      expect(out.auxiliaryPatterns![1].object.termType).toEqual('BlankNode');

      expect(out.auxiliaryPatterns![1].object).toEqual(out.auxiliaryPatterns![2].subject);
      expect(out.auxiliaryPatterns![2].subject).toEqual(out.auxiliaryPatterns![3].subject);
      expect(out.auxiliaryPatterns![2].subject.termType).toEqual('BlankNode');
      expect(out.auxiliaryPatterns![2].predicate)
        .toEqual(DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'));
      expect(out.auxiliaryPatterns![2].object)
        .toEqual(DF.literal('true',
          DF.namedNode('http://www.w3.org/2001/XMLSchema#boolean')));
      expect(out.auxiliaryPatterns![3].subject.termType).toEqual('BlankNode');
      expect(out.auxiliaryPatterns![3].predicate)
        .toEqual(DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'));
      expect(out.auxiliaryPatterns![3].object.termType).toEqual('BlankNode');

      expect(out.auxiliaryPatterns![3].object).toEqual(out.auxiliaryPatterns![4].subject);
      expect(out.auxiliaryPatterns![4].subject).toEqual(out.auxiliaryPatterns![5].subject);
      expect(out.auxiliaryPatterns![4].subject.termType).toEqual('BlankNode');
      expect(out.auxiliaryPatterns![4].predicate)
        .toEqual(DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'));
      expect(out.auxiliaryPatterns![4].object)
        .toEqual(DF.literal('false',
          DF.namedNode('http://www.w3.org/2001/XMLSchema#boolean')));
      expect(out.auxiliaryPatterns![5].subject.termType).toEqual('BlankNode');
      expect(out.auxiliaryPatterns![5].predicate)
        .toEqual(DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'));
      expect(out.auxiliaryPatterns![5].object)
        .toEqual(DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'));
    });

    it('should convert an object value', async () => {
      const out = util.handleNodeValue(
        { kind: 'ObjectValue', fields: [
            { kind: 'ObjectField', name: { kind: 'Name', value: 'va' }, value: { kind: 'BooleanValue', value: false } },
            { kind: 'ObjectField', name: { kind: 'Name', value: 'vb' }, value: { kind: 'BooleanValue', value: true } },
            { kind: 'ObjectField', name: { kind: 'Name', value: 'vc' }, value: { kind: 'BooleanValue', value: false } },
        ] }, 'va', ctx);
      expect(out.terms[0].termType).toEqual('BlankNode');
      expect(out.auxiliaryPatterns!.length).toEqual(3);

      expect(out.auxiliaryPatterns![0].subject).toEqual(out.terms[0]);
      expect(out.auxiliaryPatterns![0].predicate)
        .toEqual(DF.namedNode('http://example.org/va'));
      expect(out.auxiliaryPatterns![0].object)
        .toEqual(DF.literal('false',
          DF.namedNode('http://www.w3.org/2001/XMLSchema#boolean')));

      expect(out.auxiliaryPatterns![1].subject).toEqual(out.terms[0]);
      expect(out.auxiliaryPatterns![1].predicate)
        .toEqual(DF.namedNode('http://example.org/vb'));
      expect(out.auxiliaryPatterns![1].object)
        .toEqual(DF.literal('true',
          DF.namedNode('http://www.w3.org/2001/XMLSchema#boolean')));

      expect(out.auxiliaryPatterns![2].subject).toEqual(out.terms[0]);
      expect(out.auxiliaryPatterns![2].predicate)
        .toEqual(DF.namedNode('http://example.org/vc'));
      expect(out.auxiliaryPatterns![2].object)
        .toEqual(DF.literal('false',
          DF.namedNode('http://www.w3.org/2001/XMLSchema#boolean')));
    });
  });

  describe('#handleDirectiveNode', () => {
    const ctx: IConvertContext = {
      context: new JsonLdContextNormalized({}),
      graph: DF.defaultGraph(),
      path: [ 'parent' ],
      subject: null!,
      singularizeState: null!,
      singularizeVariables: {},
      terminalVariables: [],
      fragmentDefinitions: {},
      variablesDict: <IVariablesDictionary> {
        varTrue: { kind: 'BooleanValue', value: true },
        varFalse: { kind: 'BooleanValue', value: false },
      },
      variablesMetaDict: {},
    };
    const includeTrue: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'include' },
      arguments: [
        {
          kind: 'Argument',
          name: { kind: 'Name', value: 'if' },
          value: { kind: 'Variable', name: { kind: 'Name', value: 'varTrue' } },
        },
      ] };
    const includeFalse: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'include' },
      arguments: [
        {
          kind: 'Argument',
          name: { kind: 'Name', value: 'if' },
          value: { kind: 'Variable', name: { kind: 'Name', value: 'varFalse' } },
        },
      ] };
    const skipTrue: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'skip' },
      arguments: [
        {
          kind: 'Argument',
          name: { kind: 'Name', value: 'if' },
          value: { kind: 'Variable', name: { kind: 'Name', value: 'varTrue' } },
        },
      ] };
    const skipFalse: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'skip' },
      arguments: [
        {
          kind: 'Argument',
          name: { kind: 'Name', value: 'if' },
          value: { kind: 'Variable', name: { kind: 'Name', value: 'varFalse' } },
        },
      ] };
    const unknownDirective: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'unknow' },
      arguments: [
        {
          kind: 'Argument',
          name: { kind: 'Name', value: 'if' },
          value: { kind: 'Variable', name: { kind: 'Name', value: 'varFalse' } },
        },
      ] };
    const idDirective: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'id' }, arguments: [] };
    const single: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'single' }, arguments: [] };
    const singleAll: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'single' },
      arguments: [
        {
          kind: 'Argument',
          name: { kind: 'Name', value: 'scope' },
          value: { kind: 'EnumValue', value: 'all' },
        },
      ] };
    const plural: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'plural' }, arguments: [] };
    const pluralAll: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'plural' },
      arguments: [
        {
          kind: 'Argument',
          name: { kind: 'Name', value: 'scope' },
          value: { kind: 'EnumValue', value: 'all' },
        },
      ] };
    const optional: DirectiveNode = { kind: 'Directive', name: { kind: 'Name', value: 'optional' }, arguments: [] };

    it('should return null for an unsupported directive', async () => {
      return expect(util.handleDirectiveNode({ directive: unknownDirective, fieldLabel: 'field' }, ctx))
        .toEqual(null);
    });

    it('should return true on a true inclusion', async () => {
      return expect(util.handleDirectiveNode({ directive: includeTrue, fieldLabel: 'field' }, ctx))
        .toEqual({});
    });

    it('should return false on a false inclusion', async () => {
      return expect(util.handleDirectiveNode({ directive: includeFalse, fieldLabel: 'field' }, ctx))
        .toEqual({ ignore: true });
    });

    it('should return false on a true skip', async () => {
      return expect(util.handleDirectiveNode({ directive: skipTrue, fieldLabel: 'field' }, ctx))
        .toEqual({ ignore: true });
    });

    it('should return true on a false skip', async () => {
      return expect(util.handleDirectiveNode({ directive: skipFalse, fieldLabel: 'field' }, ctx))
        .toEqual({});
    });

    it('should modify singularize variables and not set the single state on single', async () => {
      ctx.singularizeState = null!;
      ctx.singularizeVariables = {};
      util.handleDirectiveNode({ directive: single, fieldLabel: 'field' }, ctx);
      expect(ctx.singularizeVariables).toEqual({
        parent_field: true,
      });
      expect(ctx.singularizeState).toEqual(null);
    });

    it('should modify singularize variables and set the single state on single all', async () => {
      ctx.singularizeState = null!;
      ctx.singularizeVariables = {};
      util.handleDirectiveNode({ directive: singleAll, fieldLabel: 'field' }, ctx);
      expect(ctx.singularizeVariables).toEqual({
        parent_field: true,
      });
      expect(ctx.singularizeState).toEqual(SingularizeState.SINGLE);
    });

    it('should modify singularize variables and not set the single state on plural', async () => {
      ctx.singularizeState = null!;
      ctx.singularizeVariables = {
        parent_field: true,
      };
      util.handleDirectiveNode({ directive: plural, fieldLabel: 'field' }, ctx);
      expect(ctx.singularizeVariables).toEqual({});
      expect(ctx.singularizeState).toEqual(null);
    });

    it('should modify singularize variables and set the single state on plural all', async () => {
      ctx.singularizeState = null!;
      ctx.singularizeVariables = {
        parent_field: true,
      };
      util.handleDirectiveNode({ directive: pluralAll, fieldLabel: 'field' }, ctx);
      expect(ctx.singularizeVariables).toEqual({});
      expect(ctx.singularizeState).toEqual(SingularizeState.PLURAL);
    });

    it('should wrap the operation into a left join for optional', async () => {
      const { ignore, operationOverrider } = <IDirectiveNodeHandlerOutput> util
        .handleDirectiveNode({ directive: optional, fieldLabel: 'field' }, ctx);
      expect(ignore).toBeFalsy();
      expect(operationOverrider!(OperationFactory.createBgp([
        OperationFactory.createPattern(
          DF.namedNode('s'),
          DF.namedNode('p'),
          DF.namedNode('o'),
        ),
      ]))).toEqual(OperationFactory.createLeftJoin(
        OperationFactory.createBgp([]),
        OperationFactory.createBgp([
          OperationFactory.createPattern(
            DF.namedNode('s'),
            DF.namedNode('p'),
            DF.namedNode('o'),
          ),
        ]),
      ));
    });
  });

  describe('#createQuadPattern', () => {
    it('should create a triple pattern for a normal context', async () => {
      const s = DF.namedNode('s');
      const p: NameNode = { kind: 'Name', value: 'p' };
      const o = DF.namedNode('o');
      const g = DF.defaultGraph();
      return expect(util.createQuadPattern(s, p, o, g,
        new JsonLdContextNormalized({ p: 'ex:myP' })))
        .toEqual(OperationFactory.createPattern(s, DF.namedNode('ex:myP'), o));
    });

    it('should create a triple pattern for a normal context using @vocab', async () => {
      const s = DF.namedNode('s');
      const p: NameNode = { kind: 'Name', value: 'p' };
      const o = DF.namedNode('o');
      const g = DF.defaultGraph();
      const context = await util.contextParser.parse({ '@vocab': 'ex:', 'p': '/myP' });
      return expect(util.createQuadPattern(s, p, o, g, context))
        .toEqual(OperationFactory.createPattern(s, DF.namedNode('ex:/myP'), o));
    });

    it('should create a triple pattern for a reversed context', async () => {
      const s = DF.namedNode('s');
      const p: NameNode = { kind: 'Name', value: 'p' };
      const o = DF.namedNode('o');
      const g = DF.defaultGraph();
      return expect(util.createQuadPattern(s, p, o, g,
        new JsonLdContextNormalized({ p: { '@reverse': true, '@id': 'ex:myP' } })))
        .toEqual(OperationFactory.createPattern(o, DF.namedNode('ex:myP'), s));
    });

    it('should create a quad pattern for a normal context', async () => {
      const s = DF.namedNode('s');
      const p: NameNode = { kind: 'Name', value: 'p' };
      const o = DF.namedNode('o');
      const g = DF.namedNode('g');
      return expect(util.createQuadPattern(s, p, o, g,
        new JsonLdContextNormalized({ p: 'ex:myP' })))
        .toEqual(OperationFactory.createPattern(s, DF.namedNode('ex:myP'), o, g));
    });

    it('should create a quad pattern for a reversed context', async () => {
      const s = DF.namedNode('s');
      const p: NameNode = { kind: 'Name', value: 'p' };
      const o = DF.namedNode('o');
      const g = DF.namedNode('g');
      return expect(util.createQuadPattern(s, p, o, g,
        new JsonLdContextNormalized({ p: { '@reverse': true, '@id': 'ex:myP' } })))
        .toEqual(OperationFactory.createPattern(o, DF.namedNode('ex:myP'), s, g));
    });
  });

  describe('#getArgument', () => {
    it('should return null on null arguments', async () => {
      return expect(util.getArgument(undefined, 'abc')).toBe(undefined);
    });

    it('should return null on an argument that is not present', async () => {
      return expect(util.getArgument([
        { kind: 'Argument', name: { kind: 'Name', value: 'def' }, value: { kind: 'StringValue', value: 'val' } },
      ], 'abc')).toBe(undefined);
    });

    it('should return the named argument', async () => {
      return expect(util.getArgument([
        { kind: 'Argument', name: { kind: 'Name', value: 'abc' }, value: { kind: 'StringValue', value: 'val' } },
      ], 'abc')).toEqual(
        { kind: 'Argument', name: { kind: 'Name', value: 'abc' }, value: { kind: 'StringValue', value: 'val' } });
    });
  });

});
