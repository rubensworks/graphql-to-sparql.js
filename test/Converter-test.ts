import * as DataFactory from "rdf-data-model";
import {Factory} from "sparqlalgebrajs";
import {Converter} from "../lib/Converter";

// tslint:disable:object-literal-sort-keys

const OperationFactory = new Factory(DataFactory);

describe('Converter', () => {

  describe('without default data factory', () => {
    let converter: Converter;

    beforeEach(() => {
      converter = new Converter();
    });

    describe('#graphqlToSparqlAlgebra', () => {
      it('it should convert a simple query', async () => {
        const context = {
          human: 'http://example.org/human',
          name: 'http://example.org/name',
        };
        return expect(converter.graphqlToSparqlAlgebra(`
{
  human {
    name
  }
}
`, context)).toEqual(OperationFactory.createProject(OperationFactory.createBgp([
  OperationFactory.createPattern(
    DataFactory.blankNode('b1'),
    DataFactory.namedNode('http://example.org/human'),
    DataFactory.variable('human'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('human'),
    DataFactory.namedNode('http://example.org/name'),
    DataFactory.variable('human_name'),
  ),
]), [
  DataFactory.variable('human_name'),
]));
      });

      it('it should convert a query with arguments', async () => {
        const context = {
          human: 'http://example.org/human',
          id: 'http://example.org/id',
          name: 'http://example.org/name',
        };
        return expect(converter.graphqlToSparqlAlgebra(`
{
  human(id: "1000") {
    name
  }
}
`, context)).toEqual(OperationFactory.createProject(OperationFactory.createBgp([
  OperationFactory.createPattern(
    DataFactory.blankNode('b2'),
    DataFactory.namedNode('http://example.org/human'),
    DataFactory.variable('human'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('human'),
    DataFactory.namedNode('http://example.org/id'),
    DataFactory.literal('1000'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('human'),
    DataFactory.namedNode('http://example.org/name'),
    DataFactory.variable('human_name'),
  ),
]), [
  DataFactory.variable('human_name'),
]));
      });

      it('it should convert a query with nested elements', async () => {
        const context = {
          human: 'http://example.org/human',
          id: 'http://example.org/id',
          name: 'http://example.org/name',
          friends: 'http://example.org/friends',
        };
        return expect(converter.graphqlToSparqlAlgebra(`
{
  human(id: "1000") {
    name
    # Queries can have comments!
    friends {
      name
    }
  }
}
`, context)).toEqual(OperationFactory.createProject(OperationFactory.createBgp([
  OperationFactory.createPattern(
    DataFactory.blankNode('b3'),
    DataFactory.namedNode('http://example.org/human'),
    DataFactory.variable('human'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('human'),
    DataFactory.namedNode('http://example.org/id'),
    DataFactory.literal('1000'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('human'),
    DataFactory.namedNode('http://example.org/name'),
    DataFactory.variable('human_name'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('human'),
    DataFactory.namedNode('http://example.org/friends'),
    DataFactory.variable('human_friends'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('human_friends'),
    DataFactory.namedNode('http://example.org/name'),
    DataFactory.variable('human_friends_name'),
  ),
]), [
  DataFactory.variable('human_name'),
  DataFactory.variable('human_friends_name'),
]));
      });
    });

    describe('#definitionToPattern', () => {
      it('should convert an operation query definition node', async () => {
        const ctx = { context: { theField: 'http://example.org/theField' }, path: [ 'a' ], terminalVariables: [] };
        return expect(converter.definitionToPattern(ctx,
          {
            kind: 'OperationDefinition',
            operation: 'query',
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'theField' } },
              ],
            },
          })).toEqual(OperationFactory.createBgp([
            OperationFactory.createPattern(
              DataFactory.blankNode('b4'),
              DataFactory.namedNode('http://example.org/theField'),
              DataFactory.variable('a_theField'),
            ),
          ]));
      });
    });

    describe('#selectionToPatterns', () => {
      it('should convert a field selection node', async () => {
        const ctx = { context: { theField: 'http://example.org/theField' }, path: [ 'a' ], terminalVariables: [] };
        const subject = DataFactory.namedNode('theSubject');
        return expect(converter.selectionToPatterns(ctx, subject,
          { kind: 'Field', name: { kind: 'Name', value: 'theField' } })).toEqual([
            OperationFactory.createPattern(
              subject,
              DataFactory.namedNode('http://example.org/theField'),
              DataFactory.variable('a_theField'),
            ),
          ]);
      });

      it('should convert a field selection node with a selection set', async () => {
        const ctx = {
          context: {
            theField: 'http://example.org/theField',
            anotherField: 'http://example.org/anotherField',
            andAnotherField: 'http://example.org/andAnotherField',
          },
          path: [ 'a' ],
          terminalVariables: [],
        };
        const subject = DataFactory.namedNode('theSubject');
        return expect(converter.selectionToPatterns(ctx, subject,
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'theField' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'anotherField' } },
                { kind: 'Field', name: { kind: 'Name', value: 'andAnotherField' } },
              ],
            },
          })).toEqual([
            OperationFactory.createPattern(
              subject,
              DataFactory.namedNode('http://example.org/theField'),
              DataFactory.variable('a_theField'),
            ),
            OperationFactory.createPattern(
              DataFactory.variable('a_theField'),
              DataFactory.namedNode('http://example.org/anotherField'),
              DataFactory.variable('a_theField_anotherField'),
            ),
            OperationFactory.createPattern(
              DataFactory.variable('a_theField'),
              DataFactory.namedNode('http://example.org/andAnotherField'),
              DataFactory.variable('a_theField_andAnotherField'),
            ),
          ]);
      });

      it('should convert a field selection node with arguments', async () => {
        const ctx = {
          context: {
            theField: 'http://example.org/theField',
            anotherField: 'http://example.org/anotherField',
            andAnotherField: 'http://example.org/andAnotherField',
          },
          path: [ 'a' ],
          terminalVariables: [],
        };
        const subject = DataFactory.namedNode('theSubject');
        return expect(converter.selectionToPatterns(ctx, subject,
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'theField' },
            arguments: [
              { kind: 'Argument', name: { kind: 'Name', value: 'anotherField' },
                value: { kind: 'StringValue', value: 'abc' } },
              { kind: 'Argument', name: { kind: 'Name', value: 'andAnotherField' },
                value: { kind: 'StringValue', value: 'def' } },
            ],
          })).toEqual([
            OperationFactory.createPattern(
              subject,
              DataFactory.namedNode('http://example.org/theField'),
              DataFactory.variable('a_theField'),
            ),
            OperationFactory.createPattern(
              DataFactory.variable('a_theField'),
              DataFactory.namedNode('http://example.org/anotherField'),
              DataFactory.literal('abc'),
            ),
            OperationFactory.createPattern(
              DataFactory.variable('a_theField'),
              DataFactory.namedNode('http://example.org/andAnotherField'),
              DataFactory.literal('def'),
            ),
          ]);
      });

      it('should terminate a field selection node without selection set', async () => {
        const ctx = { context: { theField: 'http://example.org/theField' }, path: [ 'a' ], terminalVariables: [] };
        const subject = DataFactory.namedNode('theSubject');
        converter.selectionToPatterns(ctx, subject,
          { kind: 'Field', name: { kind: 'Name', value: 'theField' } });
        return expect(ctx.terminalVariables).toEqual([
          DataFactory.variable('a_theField'),
        ]);
      });

      it('should terminate a field selection node with an empty selection set', async () => {
        const ctx = { context: { theField: 'http://example.org/theField' }, path: [ 'a' ], terminalVariables: [] };
        const subject = DataFactory.namedNode('theSubject');
        converter.selectionToPatterns(ctx, subject,
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'theField' },
            selectionSet: { kind: 'SelectionSet', selections: [] },
          });
        return expect(ctx.terminalVariables).toEqual([
          DataFactory.variable('a_theField'),
        ]);
      });

      it('should not terminate a field selection node with selection set', async () => {
        const ctx = { context: { theField: 'http://example.org/theField' }, path: [ 'a' ], terminalVariables: [] };
        const subject = DataFactory.namedNode('theSubject');
        converter.selectionToPatterns(ctx, subject,
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'theField' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'anotherField' } },
              ],
            },
          });
        return expect(ctx.terminalVariables).toEqual([
          DataFactory.variable('a_theField_anotherField'),
        ]);
      });
    });

    describe('#nameToVariable', () => {
      it('should convert a variable with an empty path', async () => {
        const ctx = { context: {}, path: [], terminalVariables: [] };
        return expect(converter.nameToVariable({ kind: 'Name', value: 'varName' }, ctx))
          .toEqual(DataFactory.namedNode('varName'));
      });

      it('should convert a variable with a single path element', async () => {
        const ctx = { context: {}, path: [ 'abc' ], terminalVariables: [] };
        return expect(converter.nameToVariable({ kind: 'Name', value: 'varName' }, ctx))
          .toEqual(DataFactory.namedNode('abc_varName'));
      });

      it('should convert a variable with multiple path elements', async () => {
        const ctx = { context: {}, path: [ 'abc', 'def', 'ghi' ], terminalVariables: [] };
        return expect(converter.nameToVariable({ kind: 'Name', value: 'varName' }, ctx))
          .toEqual(DataFactory.namedNode('abc_def_ghi_varName'));
      });
    });

    describe('#valueToNamedNode', () => {
      it('should directly convert a value that is not in the context', async () => {
        return expect(converter.valueToNamedNode('abc', {})).toEqual(DataFactory.namedNode('abc'));
      });

      it('should expand a value that is in the context', async () => {
        return expect(converter.valueToNamedNode('abc', { abc: 'http://example.org/abc' }))
          .toEqual(DataFactory.namedNode('http://example.org/abc'));
      });
    });

    describe('#valueToTerm', () => {
      it('should convert a variable', async () => {
        return expect(converter.valueToTerm(
          { kind: 'Variable', name: { kind: 'Name', value: 'myVar' } }))
          .toEqual(DataFactory.variable('myVar'));
      });

      it('should convert an int', async () => {
        return expect(converter.valueToTerm(
          { kind: 'IntValue', value: '123' }))
          .toEqual(DataFactory.literal('123',
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#integer')));
      });

      it('should convert a float', async () => {
        return expect(converter.valueToTerm(
          { kind: 'FloatValue', value: '123.1' }))
          .toEqual(DataFactory.literal('123.1',
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#float')));
      });

      it('should convert a string', async () => {
        return expect(converter.valueToTerm(
          { kind: 'StringValue', value: 'abc' })).toEqual(DataFactory.literal('abc'));
      });

      it('should convert a true boolean', async () => {
        return expect(converter.valueToTerm(
          { kind: 'BooleanValue', value: true }))
          .toEqual(DataFactory.literal('true',
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')));
      });

      it('should convert a false boolean', async () => {
        return expect(converter.valueToTerm(
          { kind: 'BooleanValue', value: false }))
          .toEqual(DataFactory.literal('false',
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')));
      });

      it('should convert a null value', async () => {
        return expect(converter.valueToTerm(
          { kind: 'NullValue' }).termType).toEqual('BlankNode');
      });
    });
  });

  // TODO: make proper tests and do first commit.

  /*describe('#graphqlToSparqlAlgebra', () => {
    it('should work TODO', async () => {
      const context = {
        human: "http://example.org/human",
        id: "http://example.org/id",
        name: "http://example.org/name",
        friends: "http://example.org/friends",
      };
      const q1 = `
{
  human(id: "1000") {
    name
  }
}
`;
      const q2 = `
{
  human(id: "1000") {
    name
    # Queries can have comments!
    friends {
      name
    }
  }
}
`;
      const q3 = `
{
  empireHero: hero(episode: EMPIRE) {
    name
  }
  jediHero: hero(episode: JEDI) {
    name
  }
}
`;
      const q10 = `
{
  human(id: "1000") {
    name
    height(unit: FOOT)
  }
}
{
  empireHero: hero(episode: EMPIRE) {
    name
  }
  jediHero: hero(episode: JEDI) {
    name
  }
}`;
      const algebra = new Converter().graphqlToSparqlAlgebra(q3, context);
      console.log(JSON.stringify(algebra, null, '  ')); // TODO
      console.log(toSparql(algebra)); // TODO
      return expect(true).toEqual(true); // TODO
    });
  });*/
});
