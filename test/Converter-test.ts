import {DirectiveNode} from "graphql";
import * as DataFactory from "rdf-data-model";
import * as RDF from "rdf-js";
import {Factory} from "sparqlalgebrajs";
import {Converter, IVariablesDictionary} from "../lib/Converter";

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

      it('it should convert a query with enum arguments', async () => {
        const context = {
          human: 'http://example.org/human',
          id: 'http://example.org/id',
          name: 'http://example.org/name',
          height: 'http://example.org/height',
          unit: 'http://example.org/unit',
          FOOT: 'http://example.org/types/foot',
        };
        return expect(converter.graphqlToSparqlAlgebra(`
{
  human(id: "1000") {
    name
    height(unit: FOOT)
  }
}
`, context)).toEqual(OperationFactory.createProject(OperationFactory.createBgp([
  OperationFactory.createPattern(
    DataFactory.blankNode('b4'),
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
    DataFactory.namedNode('http://example.org/height'),
    DataFactory.variable('human_height'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('human_height'),
    DataFactory.namedNode('http://example.org/unit'),
    DataFactory.namedNode('http://example.org/types/foot'),
  ),
]), [
  DataFactory.variable('human_name'),
  DataFactory.variable('human_height'),
]));
      });

      it('it should convert a query with aliases', async () => {
        const context = {
          hero: 'http://example.org/hero',
          episode: 'http://example.org/episode',
          EMPIRE: 'http://example.org/types/empire',
          JEDI: 'http://example.org/types/jedi',
          name: 'http://example.org/name',
        };
        return expect(converter.graphqlToSparqlAlgebra(`
{
  empireHero: hero(episode: EMPIRE) {
    name
  }
  jediHero: hero(episode: JEDI) {
    name
  }
}
`, context)).toEqual(OperationFactory.createProject(OperationFactory.createBgp([
  OperationFactory.createPattern(
    DataFactory.blankNode('b5'),
    DataFactory.namedNode('http://example.org/hero'),
    DataFactory.variable('empireHero'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('empireHero'),
    DataFactory.namedNode('http://example.org/episode'),
    DataFactory.namedNode('http://example.org/types/empire'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('empireHero'),
    DataFactory.namedNode('http://example.org/name'),
    DataFactory.variable('empireHero_name'),
  ),
  OperationFactory.createPattern(
    DataFactory.blankNode('b5'),
    DataFactory.namedNode('http://example.org/hero'),
    DataFactory.variable('jediHero'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('jediHero'),
    DataFactory.namedNode('http://example.org/episode'),
    DataFactory.namedNode('http://example.org/types/jedi'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('jediHero'),
    DataFactory.namedNode('http://example.org/name'),
    DataFactory.variable('jediHero_name'),
  ),
]), [
  DataFactory.variable('empireHero_name'),
  DataFactory.variable('jediHero_name'),
]));
      });

      it('it should convert a query with fragments', async () => {
        const context = {
          hero: 'http://example.org/hero',
          episode: 'http://example.org/episode',
          EMPIRE: 'http://example.org/types/empire',
          JEDI: 'http://example.org/types/jedi',
          name: 'http://example.org/name',
          appearsIn: 'http://example.org/appearsIn',
          friends: 'http://example.org/friends',
          Character: 'http://example.org/types/Character',
        };
        return expect(converter.graphqlToSparqlAlgebra(`
{
  leftComparison: hero(episode: EMPIRE) {
    ...comparisonFields
  }
  rightComparison: hero(episode: JEDI) {
    ...comparisonFields
  }
}

fragment comparisonFields on Character {
  name
  appearsIn
  friends {
    name
  }
}
`, context)).toEqual(OperationFactory.createProject(
  OperationFactory.createJoin(
    OperationFactory.createJoin(
      OperationFactory.createBgp([
        OperationFactory.createPattern(
          DataFactory.blankNode('b6'),
          DataFactory.namedNode('http://example.org/hero'),
          DataFactory.variable('leftComparison'),
        ),
        OperationFactory.createPattern(
          DataFactory.variable('leftComparison'),
          DataFactory.namedNode('http://example.org/episode'),
          DataFactory.namedNode('http://example.org/types/empire'),
        ),
      ]),
      OperationFactory.createLeftJoin(
        OperationFactory.createBgp([]),
        OperationFactory.createBgp([
          OperationFactory.createPattern(
            DataFactory.variable('leftComparison'),
            DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DataFactory.namedNode('http://example.org/types/Character'),
          ),
          OperationFactory.createPattern(
            DataFactory.variable('leftComparison'),
            DataFactory.namedNode('http://example.org/name'),
            DataFactory.variable('leftComparison_name'),
          ),
          OperationFactory.createPattern(
            DataFactory.variable('leftComparison'),
            DataFactory.namedNode('http://example.org/appearsIn'),
            DataFactory.variable('leftComparison_appearsIn'),
          ),
          OperationFactory.createPattern(
            DataFactory.variable('leftComparison'),
            DataFactory.namedNode('http://example.org/friends'),
            DataFactory.variable('leftComparison_friends'),
          ),
          OperationFactory.createPattern(
            DataFactory.variable('leftComparison_friends'),
            DataFactory.namedNode('http://example.org/name'),
            DataFactory.variable('leftComparison_friends_name'),
          ),
        ]),
      ),
    ),
    OperationFactory.createJoin(
      OperationFactory.createBgp([
        OperationFactory.createPattern(
          DataFactory.blankNode('b6'),
          DataFactory.namedNode('http://example.org/hero'),
          DataFactory.variable('rightComparison'),
        ),
        OperationFactory.createPattern(
          DataFactory.variable('rightComparison'),
          DataFactory.namedNode('http://example.org/episode'),
          DataFactory.namedNode('http://example.org/types/jedi'),
        ),
      ]),
      OperationFactory.createLeftJoin(
        OperationFactory.createBgp([]),
        OperationFactory.createBgp([
          OperationFactory.createPattern(
            DataFactory.variable('rightComparison'),
            DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DataFactory.namedNode('http://example.org/types/Character'),
          ),
          OperationFactory.createPattern(
            DataFactory.variable('rightComparison'),
            DataFactory.namedNode('http://example.org/name'),
            DataFactory.variable('rightComparison_name'),
          ),
          OperationFactory.createPattern(
            DataFactory.variable('rightComparison'),
            DataFactory.namedNode('http://example.org/appearsIn'),
            DataFactory.variable('rightComparison_appearsIn'),
          ),
          OperationFactory.createPattern(
            DataFactory.variable('rightComparison'),
            DataFactory.namedNode('http://example.org/friends'),
            DataFactory.variable('rightComparison_friends'),
          ),
          OperationFactory.createPattern(
            DataFactory.variable('rightComparison_friends'),
            DataFactory.namedNode('http://example.org/name'),
            DataFactory.variable('rightComparison_friends_name'),
          ),
        ]),
      ),
    ),
  ), [
    DataFactory.variable('leftComparison_name'),
    DataFactory.variable('leftComparison_appearsIn'),
    DataFactory.variable('leftComparison_friends_name'),
    DataFactory.variable('rightComparison_name'),
    DataFactory.variable('rightComparison_appearsIn'),
    DataFactory.variable('rightComparison_friends_name'),
  ]));
      });

      it('it should convert a query with variables', async () => {
        const context = {
          hero: 'http://example.org/hero',
          episode: 'http://example.org/episode',
          JEDI: 'http://example.org/types/jedi',
          name: 'http://example.org/name',
          friends: 'http://example.org/friends',
        };
        const variablesDict: IVariablesDictionary = {
          episode: { kind: 'EnumValue', value: 'JEDI' },
        };
        return expect(converter.graphqlToSparqlAlgebra(`
query HeroNameAndFriends($episode: Episode) {
  hero(episode: $episode) {
    name
    friends {
      name
    }
  }
}
`, context, variablesDict)).toEqual(OperationFactory.createProject(OperationFactory.createBgp([
  OperationFactory.createPattern(
    DataFactory.blankNode('b7'),
    DataFactory.namedNode('http://example.org/hero'),
    DataFactory.variable('hero'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('hero'),
    DataFactory.namedNode('http://example.org/episode'),
    DataFactory.namedNode('http://example.org/types/jedi'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('hero'),
    DataFactory.namedNode('http://example.org/name'),
    DataFactory.variable('hero_name'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('hero'),
    DataFactory.namedNode('http://example.org/friends'),
    DataFactory.variable('hero_friends'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('hero_friends'),
    DataFactory.namedNode('http://example.org/name'),
    DataFactory.variable('hero_friends_name'),
)]), [
  DataFactory.variable('hero_name'),
  DataFactory.variable('hero_friends_name'),
]));
      });

      it('it should convert a query with variables with default values', async () => {
        const context = {
          hero: 'http://example.org/hero',
          episode: 'http://example.org/episode',
          JEDI: 'http://example.org/types/jedi',
          name: 'http://example.org/name',
          friends: 'http://example.org/friends',
        };
        return expect(converter.graphqlToSparqlAlgebra(`
query HeroNameAndFriends($episode: Episode = JEDI) {
  hero(episode: $episode) {
    name
    friends {
      name
    }
  }
}
`, context)).toEqual(OperationFactory.createProject(OperationFactory.createBgp([
  OperationFactory.createPattern(
    DataFactory.blankNode('b8'),
    DataFactory.namedNode('http://example.org/hero'),
    DataFactory.variable('hero'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('hero'),
    DataFactory.namedNode('http://example.org/episode'),
    DataFactory.namedNode('http://example.org/types/jedi'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('hero'),
    DataFactory.namedNode('http://example.org/name'),
    DataFactory.variable('hero_name'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('hero'),
    DataFactory.namedNode('http://example.org/friends'),
    DataFactory.variable('hero_friends'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('hero_friends'),
    DataFactory.namedNode('http://example.org/name'),
    DataFactory.variable('hero_friends_name'),
)]), [
  DataFactory.variable('hero_name'),
  DataFactory.variable('hero_friends_name'),
]));
      });

      it('it should convert a query with variables with directives', async () => {
        const context = {
          hero: 'http://example.org/hero',
          episode: 'http://example.org/episode',
          JEDI: 'http://example.org/types/jedi',
          name: 'http://example.org/name',
          friends: 'http://example.org/friends',
        };
        const variablesDict: IVariablesDictionary = {
          episode: { kind: 'EnumValue', value: 'JEDI' },
          withFriends: { kind: 'BooleanValue', value: false },
        };
        return expect(converter.graphqlToSparqlAlgebra(`
query Hero($episode: Episode, $withFriends: Boolean!) {
  hero(episode: $episode) {
    name
    friends @include(if: $withFriends) {
      name
    }
  }
}
`, context, variablesDict)).toEqual(OperationFactory.createProject(OperationFactory.createBgp([
  OperationFactory.createPattern(
    DataFactory.blankNode('b9'),
    DataFactory.namedNode('http://example.org/hero'),
    DataFactory.variable('hero'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('hero'),
    DataFactory.namedNode('http://example.org/episode'),
    DataFactory.namedNode('http://example.org/types/jedi'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('hero'),
    DataFactory.namedNode('http://example.org/name'),
    DataFactory.variable('hero_name'),
  )]), [
    DataFactory.variable('hero_name'),
  ]));
      });

      it('it should convert a query with inline fragments', async () => {
        const context = {
          hero: 'http://example.org/hero',
          episode: 'http://example.org/episode',
          JEDI: 'http://example.org/types/jedi',
          Droid: 'http://example.org/types/droid',
          Human: 'http://example.org/types/human',
          name: 'http://example.org/name',
          primaryFunction: 'http://example.org/primaryFunction',
          height: 'http://example.org/height',
        };
        const variablesDict: IVariablesDictionary = {
          ep: {kind: 'EnumValue', value: 'JEDI'},
        };
        return expect(converter.graphqlToSparqlAlgebra(`
query HeroForEpisode($ep: Episode!) {
  hero(episode: $ep) {
    name
    ... on Droid {
      primaryFunction
    }
    ... on Human {
      height
    }
  }
}
`, context, variablesDict)).toEqual(OperationFactory.createProject(
          OperationFactory.createJoin(
            OperationFactory.createBgp([
              OperationFactory.createPattern(
                DataFactory.blankNode('b10'),
                DataFactory.namedNode('http://example.org/hero'),
                DataFactory.variable('hero'),
              ),
              OperationFactory.createPattern(
                DataFactory.variable('hero'),
                DataFactory.namedNode('http://example.org/episode'),
                DataFactory.namedNode('http://example.org/types/jedi'),
              ),
            ]),
            OperationFactory.createJoin(
              OperationFactory.createBgp([
                OperationFactory.createPattern(
                  DataFactory.variable('hero'),
                  DataFactory.namedNode('http://example.org/name'),
                  DataFactory.variable('hero_name'),
                ),
              ]),
              OperationFactory.createJoin(
                OperationFactory.createLeftJoin(
                  OperationFactory.createBgp([]),
                  OperationFactory.createBgp([
                    OperationFactory.createPattern(
                      DataFactory.variable('hero'),
                      DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                      DataFactory.namedNode('http://example.org/types/droid'),
                    ),
                    OperationFactory.createPattern(
                      DataFactory.variable('hero'),
                      DataFactory.namedNode('http://example.org/primaryFunction'),
                      DataFactory.variable('hero_primaryFunction'),
                    ),
                  ]),
                ),
                OperationFactory.createLeftJoin(
                  OperationFactory.createBgp([]),
                  OperationFactory.createBgp([
                    OperationFactory.createPattern(
                      DataFactory.variable('hero'),
                      DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                      DataFactory.namedNode('http://example.org/types/human'),
                    ),
                    OperationFactory.createPattern(
                      DataFactory.variable('hero'),
                      DataFactory.namedNode('http://example.org/height'),
                      DataFactory.variable('hero_height'),
                    ),
                  ]),
                ),
              ),
            ),
          ), [
            DataFactory.variable('hero_name'),
            DataFactory.variable('hero_primaryFunction'),
            DataFactory.variable('hero_height'),
          ]));
      });
    });

    describe('#indexFragments', () => {
      it('should create an empty index when there are no fragments', async () => {
        return expect(converter.indexFragments({
          kind: 'Document',
          definitions: [
            {
              kind: 'OperationDefinition',
              operation: 'query',
              selectionSet: {
                kind: 'SelectionSet',
                selections: [
                  { kind: 'Field', name: { kind: 'Name', value: 'theField' } },
                ],
              },
            },
          ],
        })).toEqual({});
      });

      it('should create an empty index when there are fragments', async () => {
        return expect(converter.indexFragments({
          kind: 'Document',
          definitions: [
            {
              kind: 'OperationDefinition',
              operation: 'query',
              selectionSet: {
                kind: 'SelectionSet',
                selections: [
                  { kind: 'Field', name: { kind: 'Name', value: 'theField' } },
                ],
              },
            },
            {
              kind: 'FragmentDefinition',
              name: { value: 'fragment1' },
              typeCondition: {
                kind: 'NamedType',
                name: { kind: 'Name', value: 'Character' },
              },
              selectionSet: {
                kind: 'SelectionSet',
                selections: [
                  { kind: 'Field', name: { kind: 'Name', value: 'theField' } },
                ],
              },
            },
          ],
        })).toEqual({
          fragment1: {
            kind: 'FragmentDefinition',
            name: { value: 'fragment1' },
            typeCondition: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'Character' },
            },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'theField' } },
              ],
            },
          },
        });
      });
    });

    describe('#definitionToPattern', () => {
      it('should convert an operation query definition node', async () => {
        const ctx = {
          context: { theField: 'http://example.org/theField' },
          path: [ 'a' ],
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
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
              DataFactory.blankNode('b11'),
              DataFactory.namedNode('http://example.org/theField'),
              DataFactory.variable('a_theField'),
            ),
          ]));
      });

      it('should convert an operation query definition node with a directive', async () => {
        const ctx = {
          context: { theField: 'http://example.org/theField' },
          path: [ 'a' ],
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: <IVariablesDictionary> {
            varTrue: { kind: 'BooleanValue', value: true },
          },
          variablesMetaDict: {},
        };
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
            directives: [
              { kind: 'Directive', name: { kind: 'Name', value: 'include' }, arguments: [
                {
                  kind: 'Argument',
                  name: { kind: 'Name', value: 'if' },
                  value: { kind: 'Variable', name: { kind: 'Name', value: 'varTrue' } },
                },
              ] },
            ],
          })).toEqual(OperationFactory.createBgp([
            OperationFactory.createPattern(
              DataFactory.blankNode('b12'),
              DataFactory.namedNode('http://example.org/theField'),
              DataFactory.variable('a_theField'),
            ),
          ]));
      });
    });

    describe('#selectionToPatterns', () => {
      it('should convert a field selection node', async () => {
        const ctx = {
          context: { theField: 'http://example.org/theField' },
          path: [ 'a' ],
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
        const subject = DataFactory.namedNode('theSubject');
        return expect(converter.selectionToPatterns(ctx, subject,
          { kind: 'Field', name: { kind: 'Name', value: 'theField' } }))
          .toEqual(OperationFactory.createBgp([
            OperationFactory.createPattern(
              subject,
              DataFactory.namedNode('http://example.org/theField'),
              DataFactory.variable('a_theField'),
            ),
          ]));
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
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
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
          })).toEqual(OperationFactory.createBgp([
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
          ]));
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
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
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
          })).toEqual(OperationFactory.createBgp([
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
          ]));
      });

      it('should terminate a field selection node without selection set', async () => {
        const ctx = {
          context: { theField: 'http://example.org/theField' },
          path: [ 'a' ],
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
        const subject = DataFactory.namedNode('theSubject');
        converter.selectionToPatterns(ctx, subject,
          { kind: 'Field', name: { kind: 'Name', value: 'theField' } });
        return expect(ctx.terminalVariables).toEqual([
          DataFactory.variable('a_theField'),
        ]);
      });

      it('should terminate a field selection node with an empty selection set', async () => {
        const ctx = {
          context: { theField: 'http://example.org/theField' },
          path: [ 'a' ],
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
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
        const ctx = {
          context: { theField: 'http://example.org/theField' },
          path: [ 'a' ],
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
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

      it('should convert a field selection node with an alias', async () => {
        const ctx = {
          context: {
            theField: 'http://example.org/theField',
          },
          path: [ 'a' ],
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
        const subject = DataFactory.namedNode('theSubject');
        return expect(converter.selectionToPatterns(ctx, subject,
          {
            alias: { kind: 'Name', value: 'theAliasField' },
            kind: 'Field',
            name: { kind: 'Name', value: 'theField' },
          })).toEqual(OperationFactory.createBgp([
            OperationFactory.createPattern(
              subject,
              DataFactory.namedNode('http://example.org/theField'),
              DataFactory.variable('a_theAliasField'),
            ),
          ]));
      });

      it('should convert a fragment spread selection node', async () => {
        const ctx = {
          context: {
            theField: 'http://example.org/theField',
            Character: 'http://example.org/types/Character',
          },
          path: [ 'a' ],
          terminalVariables: [],
          fragmentDefinitions: {
            fragment1: {
              kind: 'FragmentDefinition',
              name: { value: 'fragment1' },
              typeCondition: {
                kind: 'NamedType',
                name: { kind: 'Name', value: 'Character' },
              },
              selectionSet: {
                kind: 'SelectionSet',
                selections: [
                  { kind: 'Field', name: { kind: 'Name', value: 'theField' } },
                ],
              },
            },
          },
          variablesDict: {},
          variablesMetaDict: {},
        };
        const subject = DataFactory.namedNode('theSubject');
        return expect(converter.selectionToPatterns(ctx, subject,
          {
            kind: 'FragmentSpread',
            name: { kind: 'Name', value: 'fragment1' },
          })).toEqual(OperationFactory.createLeftJoin(
          OperationFactory.createBgp([]),
          OperationFactory.createBgp([
            OperationFactory.createPattern(
              subject,
              DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DataFactory.namedNode('http://example.org/types/Character'),
            ),
            OperationFactory.createPattern(
              subject,
              DataFactory.namedNode('http://example.org/theField'),
              DataFactory.variable('a_theField'),
            ),
          ]),
        ));
      });

      it('should convert a field selection node with a directive', async () => {
        const ctx = {
          context: {
            theField: 'http://example.org/theField',
          },
          path: [ 'a' ],
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: <IVariablesDictionary> {
            varTrue: { kind: 'BooleanValue', value: true },
            varFalse: { kind: 'BooleanValue', value: false },
          },
          variablesMetaDict: {},
        };
        const subject = DataFactory.namedNode('theSubject');
        return expect(converter.selectionToPatterns(ctx, subject,
          {
            alias: { kind: 'Name', value: 'theAliasField' },
            kind: 'Field',
            name: { kind: 'Name', value: 'theField' },
            directives: [
              { kind: 'Directive', name: { kind: 'Name', value: 'include' }, arguments: [
                {
                  kind: 'Argument',
                  name: { kind: 'Name', value: 'if' },
                  value: { kind: 'Variable', name: { kind: 'Name', value: 'varTrue' } },
                },
              ] },
            ],
          })).toEqual(OperationFactory.createBgp([
            OperationFactory.createPattern(
              subject,
              DataFactory.namedNode('http://example.org/theField'),
              DataFactory.variable('a_theAliasField'),
            ),
          ]));
      });

      it('should convert an inline fragment spread selection node', async () => {
        const ctx = {
          context: {
            theField: 'http://example.org/theField',
            Character: 'http://example.org/types/Character',
          },
          path: [ 'a' ],
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
        const subject = DataFactory.namedNode('theSubject');
        return expect(converter.selectionToPatterns(ctx, subject,
          {
            kind: 'InlineFragment',
            typeCondition: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'Character' },
            },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'theField' } },
              ],
            },
          })).toEqual(OperationFactory.createLeftJoin(
          OperationFactory.createBgp([]),
          OperationFactory.createBgp([
            OperationFactory.createPattern(
              subject,
              DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DataFactory.namedNode('http://example.org/types/Character'),
            ),
            OperationFactory.createPattern(
              subject,
              DataFactory.namedNode('http://example.org/theField'),
              DataFactory.variable('a_theField'),
            ),
          ]),
        ));
      });

      it('should convert the __typename meta field', async () => {
        const ctx = {
          context: {
            theField: 'http://example.org/theField',
            Character: 'http://example.org/types/Character',
          },
          path: [ 'a' ],
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
        const subject = DataFactory.namedNode('theSubject');
        return expect(converter.selectionToPatterns(ctx, subject,
          {
            kind: 'Field',
            name: { kind: 'Name', value: '__typename' },
          })).toEqual(
          OperationFactory.createBgp([
            OperationFactory.createPattern(
              subject,
              DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DataFactory.variable('a___typename'),
            ),
          ]));
      });
    });

    describe('#joinOperations', () => {
      it('should error on no patterns', async () => {
        return expect(() => converter.joinOperations([]).toThrow());
      });

      it('should return the single passed operation', async () => {
        return expect(converter.joinOperations([
          OperationFactory.createBgp([]),
        ])).toEqual(
          OperationFactory.createBgp([]),
        );
      });

      it('should return a BGP from 3 BGPs', async () => {
        return expect(converter.joinOperations([
          OperationFactory.createBgp([
            OperationFactory.createPattern(<RDF.Term> <any> 'a1', <RDF.Term> <any> 'b1', <RDF.Term> <any> 'c1'),
            OperationFactory.createPattern(<RDF.Term> <any> 'd1', <RDF.Term> <any> 'e1', <RDF.Term> <any> 'f1'),
          ]),
          OperationFactory.createBgp([
            OperationFactory.createPattern(<RDF.Term> <any> 'a2', <RDF.Term> <any> 'b2', <RDF.Term> <any> 'c2'),
            OperationFactory.createPattern(<RDF.Term> <any> 'd2', <RDF.Term> <any> 'e2', <RDF.Term> <any> 'f2'),
          ]),
          OperationFactory.createBgp([
            OperationFactory.createPattern(<RDF.Term> <any> 'a3', <RDF.Term> <any> 'b3', <RDF.Term> <any> 'c3'),
            OperationFactory.createPattern(<RDF.Term> <any> 'd3', <RDF.Term> <any> 'e3', <RDF.Term> <any> 'f3'),
          ]),
        ])).toEqual(
          OperationFactory.createBgp([
            OperationFactory.createPattern(<RDF.Term> <any> 'a1', <RDF.Term> <any> 'b1', <RDF.Term> <any> 'c1'),
            OperationFactory.createPattern(<RDF.Term> <any> 'd1', <RDF.Term> <any> 'e1', <RDF.Term> <any> 'f1'),
            OperationFactory.createPattern(<RDF.Term> <any> 'a2', <RDF.Term> <any> 'b2', <RDF.Term> <any> 'c2'),
            OperationFactory.createPattern(<RDF.Term> <any> 'd2', <RDF.Term> <any> 'e2', <RDF.Term> <any> 'f2'),
            OperationFactory.createPattern(<RDF.Term> <any> 'a3', <RDF.Term> <any> 'b3', <RDF.Term> <any> 'c3'),
            OperationFactory.createPattern(<RDF.Term> <any> 'd3', <RDF.Term> <any> 'e3', <RDF.Term> <any> 'f3'),
          ]),
        );
      });

      it('should return a nested join when not all operations are BGPs', async () => {
        return expect(converter.joinOperations([
          OperationFactory.createUnion(null, null),
          OperationFactory.createBgp([
            OperationFactory.createPattern(<RDF.Term> <any> 'a2', <RDF.Term> <any> 'b2', <RDF.Term> <any> 'c2'),
            OperationFactory.createPattern(<RDF.Term> <any> 'd2', <RDF.Term> <any> 'e2', <RDF.Term> <any> 'f2'),
          ]),
          OperationFactory.createLeftJoin(null, null),
        ])).toEqual(
          OperationFactory.createJoin(
            OperationFactory.createUnion(null, null),
            OperationFactory.createJoin(
              OperationFactory.createBgp([
                OperationFactory.createPattern(<RDF.Term> <any> 'a2', <RDF.Term> <any> 'b2', <RDF.Term> <any> 'c2'),
                OperationFactory.createPattern(<RDF.Term> <any> 'd2', <RDF.Term> <any> 'e2', <RDF.Term> <any> 'f2'),
              ]),
              OperationFactory.createLeftJoin(null, null),
            ),
          ),
        );
      });
    });

    describe('#nameToVariable', () => {
      it('should convert a variable with an empty path', async () => {
        const ctx = { context: {}, path: [], terminalVariables: [], fragmentDefinitions: {}, variablesDict: {} };
        return expect(converter.nameToVariable({ kind: 'Name', value: 'varName' }, ctx))
          .toEqual(DataFactory.namedNode('varName'));
      });

      it('should convert a variable with a single path element', async () => {
        const ctx = { context: {}, path: [ 'abc' ], terminalVariables: [], fragmentDefinitions: {}, variablesDict: {} };
        return expect(converter.nameToVariable({ kind: 'Name', value: 'varName' }, ctx))
          .toEqual(DataFactory.namedNode('abc_varName'));
      });

      it('should convert a variable with multiple path elements', async () => {
        const ctx = {
          context: {},
          path: [ 'abc', 'def', 'ghi' ],
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
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
      const ctx = {
        context: {
          FOOT: 'http://example.org/types/foot',
          va: 'http://example.org/va',
          vb: 'http://example.org/vb',
          vc: 'http://example.org/vc',
        },
        path: [],
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
        return expect(converter.valueToTerm(
          { kind: 'Variable', name: { kind: 'Name', value: 'myVar1' } }, ctx))
          .toEqual({ terms: [ DataFactory.literal('myValue1') ] });
      });

      it('should error when an unknown variable is not defined', async () => {
        return expect(() => converter.valueToTerm(
          { kind: 'Variable', name: { kind: 'Name', value: 'myVar3' } }, ctx)).toThrow();
      });

      it('should error when a mandatory variable is not defined', async () => {
        return expect(() => converter.valueToTerm(
          { kind: 'Variable', name: { kind: 'Name', value: 'myVar4' } }, ctx)).toThrow();
      });

      it('should error when a variable has no list type while it was expected', async () => {
        return expect(() => converter.valueToTerm(
          { kind: 'Variable', name: { kind: 'Name', value: 'myVar5' } }, ctx)).toThrow();
      });

      it('should error when a variable has an incorrect defined list type', async () => {
        return expect(() => converter.valueToTerm(
          { kind: 'Variable', name: { kind: 'Name', value: 'myVar6' } }, ctx)).toThrow();
      });

      it('should convert an int', async () => {
        return expect(converter.valueToTerm(
          { kind: 'IntValue', value: '123' }, ctx))
          .toEqual({ terms: [ DataFactory.literal('123',
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#integer')) ] });
      });

      it('should convert a float', async () => {
        return expect(converter.valueToTerm(
          { kind: 'FloatValue', value: '123.1' }, ctx))
          .toEqual({ terms: [ DataFactory.literal('123.1',
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#float')) ] });
      });

      it('should convert a string', async () => {
        return expect(converter.valueToTerm(
          { kind: 'StringValue', value: 'abc' }, ctx))
          .toEqual({ terms: [ DataFactory.literal('abc') ] });
      });

      it('should convert a true boolean', async () => {
        return expect(converter.valueToTerm(
          { kind: 'BooleanValue', value: true }, ctx))
          .toEqual({ terms: [ DataFactory.literal('true',
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')) ] });
      });

      it('should convert a false boolean', async () => {
        return expect(converter.valueToTerm(
          { kind: 'BooleanValue', value: false }, ctx))
          .toEqual({ terms: [ DataFactory.literal('false',
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')) ] });
      });

      it('should convert a null value', async () => {
        return expect(converter.valueToTerm(
          { kind: 'NullValue' }, ctx))
          .toEqual({ terms: [ DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil') ] });
      });

      it('should convert an enum value', async () => {
        return expect(converter.valueToTerm(
          { kind: 'EnumValue', value: 'FOOT' }, ctx))
          .toEqual({ terms: [ DataFactory.namedNode('http://example.org/types/foot') ] });
      });

      it('should convert a list value in non-RDF-list-mode', async () => {
        const out = converter.valueToTerm(
          { kind: 'ListValue', values: [
            { kind: 'BooleanValue', value: false },
            { kind: 'BooleanValue', value: true },
            { kind: 'BooleanValue', value: false },
          ] }, ctx);
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
        const out = new Converter({ arraysToRdfLists: true }).valueToTerm(
          { kind: 'ListValue', values: [
            { kind: 'BooleanValue', value: false },
            { kind: 'BooleanValue', value: true },
            { kind: 'BooleanValue', value: false },
          ] }, ctx);
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
        const out = converter.valueToTerm(
          { kind: 'ObjectValue', fields: [
            { kind: 'ObjectField', name: { kind: 'Name', value: 'va' }, value: { kind: 'BooleanValue', value: false } },
            { kind: 'ObjectField', name: { kind: 'Name', value: 'vb' }, value: { kind: 'BooleanValue', value: true } },
            { kind: 'ObjectField', name: { kind: 'Name', value: 'vc' }, value: { kind: 'BooleanValue', value: false } },
          ] }, ctx);
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

    describe('#getArgument', () => {
      it('should error on null arguments', async () => {
        return expect(() => converter.getArgument(null, 'abc')).toThrow();
      });

      it('should error on an argument that is not present', async () => {
        return expect(() => converter.getArgument([
          { kind: 'Argument', name: { kind: 'Name', value: 'def' }, value: { kind: 'StringValue', value: 'val' } },
        ], 'abc')).toThrow();
      });

      it('should return the named argument', async () => {
        return expect(converter.getArgument([
          { kind: 'Argument', name: { kind: 'Name', value: 'abc' }, value: { kind: 'StringValue', value: 'val' } },
        ], 'abc')).toEqual(
          { kind: 'Argument', name: { kind: 'Name', value: 'abc' }, value: { kind: 'StringValue', value: 'val' } });
      });
    });

    describe('#handleDirective', () => {
      const ctx = {
        context: {},
        path: [],
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

      it('should error on an unsupported directive', async () => {
        return expect(() => converter.handleDirective(unknownDirective, ctx)).toThrow();
      });

      it('should return true on a true inclusion', async () => {
        return expect(converter.handleDirective(includeTrue, ctx)).toBeTruthy();
      });

      it('should return false on a false inclusion', async () => {
        return expect(converter.handleDirective(includeFalse, ctx)).toBeFalsy();
      });

      it('should return false on a true skip', async () => {
        return expect(converter.handleDirective(skipTrue, ctx)).toBeFalsy();
      });

      it('should return true on a false skip', async () => {
        return expect(converter.handleDirective(skipFalse, ctx)).toBeTruthy();
      });
    });
  });
});
