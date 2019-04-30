import * as DataFactory from "@rdfjs/data-model";
import {NameNode} from "graphql";
import * as RDF from "rdf-js";
import {Factory} from "sparqlalgebrajs";
import {Converter} from "../lib/Converter";
import {IConvertContext, IVariablesDictionary} from "../lib/IConvertContext";
import {Util} from "../lib/Util";

// tslint:disable:object-literal-sort-keys

const OperationFactory = new Factory(DataFactory);

describe('Util', () => {

  let util: Util;

  beforeEach(() => {
    const settings = {
      variableDelimiter: '_',
      expressionVariableCounter: 0,
    };
    util = new Util(settings);
    Converter.registerNodeValueHandlers(util, settings);
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
        OperationFactory.createUnion(null, null),
        OperationFactory.createBgp([
          OperationFactory.createPattern(<RDF.Term> <any> 'a2', <RDF.Term> <any> 'b2',
            <RDF.Term> <any> 'c2'),
          OperationFactory.createPattern(<RDF.Term> <any> 'd2', <RDF.Term> <any> 'e2',
            <RDF.Term> <any> 'f2'),
        ]),
        OperationFactory.createLeftJoin(null, null),
      ])).toEqual(
        OperationFactory.createJoin(
          OperationFactory.createUnion(null, null),
          OperationFactory.createJoin(
            OperationFactory.createBgp([
              OperationFactory.createPattern(<RDF.Term> <any> 'a2', <RDF.Term> <any> 'b2',
                <RDF.Term> <any> 'c2'),
              OperationFactory.createPattern(<RDF.Term> <any> 'd2', <RDF.Term> <any> 'e2',
                <RDF.Term> <any> 'f2'),
            ]),
            OperationFactory.createLeftJoin(null, null),
          ),
        ),
      );
    });
  });

  describe('#nameToVariable', () => {
    it('should convert a variable with an empty path', async () => {
      const ctx: IConvertContext = {
        context: {},
        graph: DataFactory.defaultGraph(),
        path: [],
        subject: null,
        terminalVariables: [],
        fragmentDefinitions: {},
        variablesDict: {},
        variablesMetaDict: {},
      };
      return expect(util.nameToVariable({ kind: 'Field', name: { kind: 'Name', value: 'varName' } }, ctx))
        .toEqual(DataFactory.namedNode('varName'));
    });

    it('should convert a variable with a single path element', async () => {
      const ctx: IConvertContext = {
        context: {},
        graph: DataFactory.defaultGraph(),
        path: [ 'abc' ],
        subject: null,
        terminalVariables: [],
        fragmentDefinitions: {},
        variablesDict: {},
        variablesMetaDict: {},
      };
      return expect(util.nameToVariable({ kind: 'Field', name: { kind: 'Name', value: 'varName' } }, ctx))
        .toEqual(DataFactory.namedNode('abc_varName'));
    });

    it('should convert an aliased variable with a single path element', async () => {
      const ctx: IConvertContext = {
        context: {},
        graph: DataFactory.defaultGraph(),
        path: [ 'abc' ],
        subject: null,
        terminalVariables: [],
        fragmentDefinitions: {},
        variablesDict: {},
        variablesMetaDict: {},
      };
      return expect(util.nameToVariable(
        { kind: 'Field', name: { kind: 'Name', value: 'varName' }, alias: { kind: 'Name', value: 'varName2' } }, ctx))
        .toEqual(DataFactory.namedNode('abc_varName2'));
    });

    it('should convert a variable with multiple path elements', async () => {
      const ctx = {
        context: {},
        graph: DataFactory.defaultGraph(),
        path: [ 'abc', 'def', 'ghi' ],
        subject: null,
        terminalVariables: [],
        fragmentDefinitions: {},
        variablesDict: {},
        variablesMetaDict: {},
      };
      return expect(util.nameToVariable({ kind: 'Field', name: { kind: 'Name', value: 'varName' } }, ctx))
        .toEqual(DataFactory.namedNode('abc_def_ghi_varName'));
    });
  });

  describe('#valueToNamedNode', () => {
    it('should directly convert a value that is not in the context', async () => {
      return expect(util.valueToNamedNode('abc', {})).toEqual(DataFactory.namedNode('abc'));
    });

    it('should expand a value that is in the context', async () => {
      return expect(util.valueToNamedNode('abc', { abc: 'http://example.org/abc' }))
        .toEqual(DataFactory.namedNode('http://example.org/abc'));
    });

    it('should expand a value that is in the context as an object', async () => {
      return expect(util.valueToNamedNode('abc', { abc: { '@id': 'http://example.org/abc' } }))
        .toEqual(DataFactory.namedNode('http://example.org/abc'));
    });
  });

  describe('#handleNodeValue', () => {
    const ctx: IConvertContext = {
      context: {
        FOOT: 'http://example.org/types/foot',
        va: 'http://example.org/va',
        vb: 'http://example.org/vb',
        vc: 'http://example.org/vc',
        va_en: { '@id': 'http://example.org/va', "@language": "en" },
        va_datetime: { '@id': 'http://example.org/va', "@type": "http://www.w3.org/2001/XMLSchema#dateTime" },
      },
      graph: DataFactory.defaultGraph(),
      path: [],
      subject: null,
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
        .toEqual({ terms: [ DataFactory.literal('myValue1') ] });
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
        .toEqual({ terms: [ DataFactory.literal('123',
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#integer')) ] });
    });

    it('should convert a float', async () => {
      return expect(util.handleNodeValue(
        { kind: 'FloatValue', value: '123.1' }, 'va', ctx))
        .toEqual({ terms: [ DataFactory.literal('123.1',
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#float')) ] });
    });

    it('should convert a string', async () => {
      return expect(util.handleNodeValue(
        { kind: 'StringValue', value: 'abc' }, 'va', ctx))
        .toEqual({ terms: [ DataFactory.literal('abc') ] });
    });

    it('should convert a languaged string', async () => {
      return expect(util.handleNodeValue(
        { kind: 'StringValue', value: 'abc' }, 'va_en', ctx))
        .toEqual({ terms: [ DataFactory.literal('abc', 'en') ] });
    });

    it('should convert a datatyped string', async () => {
      return expect(util.handleNodeValue(
        { kind: 'StringValue', value: 'abc' }, 'va_datetime', ctx))
        .toEqual({ terms: [ DataFactory.literal('abc', DataFactory
            .namedNode('http://www.w3.org/2001/XMLSchema#dateTime')) ] });
    });

    it('should convert a true boolean', async () => {
      return expect(util.handleNodeValue(
        { kind: 'BooleanValue', value: true }, 'va', ctx))
        .toEqual({ terms: [ DataFactory.literal('true',
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')) ] });
    });

    it('should convert a false boolean', async () => {
      return expect(util.handleNodeValue(
        { kind: 'BooleanValue', value: false }, 'va', ctx))
        .toEqual({ terms: [ DataFactory.literal('false',
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')) ] });
    });

    it('should convert a null value', async () => {
      return expect(util.handleNodeValue(
        { kind: 'NullValue' }, 'va', ctx))
        .toEqual({ terms: [ DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil') ] });
    });

    it('should convert an enum value', async () => {
      return expect(util.handleNodeValue(
        { kind: 'EnumValue', value: 'FOOT' }, 'va', ctx))
        .toEqual({ terms: [ DataFactory.namedNode('http://example.org/types/foot') ] });
    });

    it('should convert a list value in non-RDF-list-mode', async () => {
      const out = util.handleNodeValue(
        { kind: 'ListValue', values: [
            { kind: 'BooleanValue', value: false },
            { kind: 'BooleanValue', value: true },
            { kind: 'BooleanValue', value: false },
        ] }, 'va', ctx);
      expect(out.terms).toEqual([
        DataFactory.literal('false',
          DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')),
        DataFactory.literal('true',
          DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')),
        DataFactory.literal('false',
          DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')),
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
      expect(out.auxiliaryPatterns.length).toEqual(6);

      expect(out.auxiliaryPatterns[0].subject).toEqual(out.auxiliaryPatterns[1].subject);
      expect(out.auxiliaryPatterns[0].subject.termType).toEqual('BlankNode');
      expect(out.auxiliaryPatterns[0].predicate)
        .toEqual(DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'));
      expect(out.auxiliaryPatterns[0].object)
        .toEqual(DataFactory.literal('false',
          DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')));
      expect(out.auxiliaryPatterns[1].subject.termType).toEqual('BlankNode');
      expect(out.auxiliaryPatterns[1].predicate)
        .toEqual(DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'));
      expect(out.auxiliaryPatterns[1].object.termType).toEqual('BlankNode');

      expect(out.auxiliaryPatterns[1].object).toEqual(out.auxiliaryPatterns[2].subject);
      expect(out.auxiliaryPatterns[2].subject).toEqual(out.auxiliaryPatterns[3].subject);
      expect(out.auxiliaryPatterns[2].subject.termType).toEqual('BlankNode');
      expect(out.auxiliaryPatterns[2].predicate)
        .toEqual(DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'));
      expect(out.auxiliaryPatterns[2].object)
        .toEqual(DataFactory.literal('true',
          DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')));
      expect(out.auxiliaryPatterns[3].subject.termType).toEqual('BlankNode');
      expect(out.auxiliaryPatterns[3].predicate)
        .toEqual(DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'));
      expect(out.auxiliaryPatterns[3].object.termType).toEqual('BlankNode');

      expect(out.auxiliaryPatterns[3].object).toEqual(out.auxiliaryPatterns[4].subject);
      expect(out.auxiliaryPatterns[4].subject).toEqual(out.auxiliaryPatterns[5].subject);
      expect(out.auxiliaryPatterns[4].subject.termType).toEqual('BlankNode');
      expect(out.auxiliaryPatterns[4].predicate)
        .toEqual(DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'));
      expect(out.auxiliaryPatterns[4].object)
        .toEqual(DataFactory.literal('false',
          DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')));
      expect(out.auxiliaryPatterns[5].subject.termType).toEqual('BlankNode');
      expect(out.auxiliaryPatterns[5].predicate)
        .toEqual(DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'));
      expect(out.auxiliaryPatterns[5].object)
        .toEqual(DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'));
    });

    it('should convert an object value', async () => {
      const out = util.handleNodeValue(
        { kind: 'ObjectValue', fields: [
            { kind: 'ObjectField', name: { kind: 'Name', value: 'va' }, value: { kind: 'BooleanValue', value: false } },
            { kind: 'ObjectField', name: { kind: 'Name', value: 'vb' }, value: { kind: 'BooleanValue', value: true } },
            { kind: 'ObjectField', name: { kind: 'Name', value: 'vc' }, value: { kind: 'BooleanValue', value: false } },
        ] }, 'va', ctx);
      expect(out.terms[0].termType).toEqual('BlankNode');
      expect(out.auxiliaryPatterns.length).toEqual(3);

      expect(out.auxiliaryPatterns[0].subject).toEqual(out.terms[0]);
      expect(out.auxiliaryPatterns[0].predicate)
        .toEqual(DataFactory.namedNode('http://example.org/va'));
      expect(out.auxiliaryPatterns[0].object)
        .toEqual(DataFactory.literal('false',
          DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')));

      expect(out.auxiliaryPatterns[1].subject).toEqual(out.terms[0]);
      expect(out.auxiliaryPatterns[1].predicate)
        .toEqual(DataFactory.namedNode('http://example.org/vb'));
      expect(out.auxiliaryPatterns[1].object)
        .toEqual(DataFactory.literal('true',
          DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')));

      expect(out.auxiliaryPatterns[2].subject).toEqual(out.terms[0]);
      expect(out.auxiliaryPatterns[2].predicate)
        .toEqual(DataFactory.namedNode('http://example.org/vc'));
      expect(out.auxiliaryPatterns[2].object)
        .toEqual(DataFactory.literal('false',
          DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')));
    });
  });

  describe('#createQuadPattern', () => {
    it('should create a triple pattern for a normal context', async () => {
      const s = DataFactory.namedNode('s');
      const p: NameNode = { kind: 'Name', value: 'p' };
      const o = DataFactory.namedNode('o');
      const g = DataFactory.defaultGraph();
      return expect(util.createQuadPattern(s, p, o, g, { p: 'myP' }))
        .toEqual(OperationFactory.createPattern(s, DataFactory.namedNode('myP'), o));
    });

    it('should create a triple pattern for a reversed context', async () => {
      const s = DataFactory.namedNode('s');
      const p: NameNode = { kind: 'Name', value: 'p' };
      const o = DataFactory.namedNode('o');
      const g = DataFactory.defaultGraph();
      return expect(util.createQuadPattern(s, p, o, g, { p: { '@reverse': 'myP' } }))
        .toEqual(OperationFactory.createPattern(o, DataFactory.namedNode('myP'), s));
    });

    it('should create a quad pattern for a normal context', async () => {
      const s = DataFactory.namedNode('s');
      const p: NameNode = { kind: 'Name', value: 'p' };
      const o = DataFactory.namedNode('o');
      const g = DataFactory.namedNode('g');
      return expect(util.createQuadPattern(s, p, o, g, { p: 'myP' }))
        .toEqual(OperationFactory.createPattern(s, DataFactory.namedNode('myP'), o, g));
    });

    it('should create a quad pattern for a reversed context', async () => {
      const s = DataFactory.namedNode('s');
      const p: NameNode = { kind: 'Name', value: 'p' };
      const o = DataFactory.namedNode('o');
      const g = DataFactory.namedNode('g');
      return expect(util.createQuadPattern(s, p, o, g, { p: { '@reverse': 'myP' } }))
        .toEqual(OperationFactory.createPattern(o, DataFactory.namedNode('myP'), s, g));
    });
  });

  describe('#getArgument', () => {
    it('should return null on null arguments', async () => {
      return expect(util.getArgument(null, 'abc')).toBe(null);
    });

    it('should return null on an argument that is not present', async () => {
      return expect(util.getArgument([
        { kind: 'Argument', name: { kind: 'Name', value: 'def' }, value: { kind: 'StringValue', value: 'val' } },
      ], 'abc')).toBe(null);
    });

    it('should return the named argument', async () => {
      return expect(util.getArgument([
        { kind: 'Argument', name: { kind: 'Name', value: 'abc' }, value: { kind: 'StringValue', value: 'val' } },
      ], 'abc')).toEqual(
        { kind: 'Argument', name: { kind: 'Name', value: 'abc' }, value: { kind: 'StringValue', value: 'val' } });
    });
  });

});
