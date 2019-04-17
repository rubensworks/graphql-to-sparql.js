import * as DataFactory from "@rdfjs/data-model";
import {DirectiveNode, DocumentNode, NameNode} from "graphql";
import * as RDF from "rdf-js";
import {Factory} from "sparqlalgebrajs";
import {Converter, IConvertContext, IVariablesDictionary} from "../lib/Converter";

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
        return expect(await converter.graphqlToSparqlAlgebra(`
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
        return expect(await converter.graphqlToSparqlAlgebra(`
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

      it('it should convert a query with first and offset arguments', async () => {
        const context = {
          hero: 'http://example.org/hero',
          name: 'http://example.org/name',
          friends: 'http://example.org/friends',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
{
  hero {
    name
    friends(first:2 offset:10) {
      name
    }
  }
}
`, context)).toEqual(OperationFactory.createProject(
          OperationFactory.createJoin(
            OperationFactory.createBgp([
              OperationFactory.createPattern(
                DataFactory.blankNode('b3'),
                DataFactory.namedNode('http://example.org/hero'),
                DataFactory.variable('hero'),
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
              OperationFactory.createSlice(OperationFactory.createProject(OperationFactory.createBgp([
                OperationFactory.createPattern(
                  DataFactory.variable('hero'),
                  DataFactory.namedNode('http://example.org/friends'),
                  DataFactory.variable('hero_friends'),
                ),
                OperationFactory.createPattern(
                  DataFactory.variable('hero_friends'),
                  DataFactory.namedNode('http://example.org/name'),
                  DataFactory.variable('hero_friends_name'),
                ),
              ]), []), 10, 2),
            ),
          ), [
            DataFactory.variable('hero_name'),
            DataFactory.variable('hero_friends_name'),
          ]));
      });

      it('it should convert a query with nested elements', async () => {
        const context = {
          human: 'http://example.org/human',
          id: 'http://example.org/id',
          name: 'http://example.org/name',
          friends: 'http://example.org/friends',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
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
        return expect(await converter.graphqlToSparqlAlgebra(`
{
  human(id: "1000") {
    name
    height(unit: FOOT)
  }
}
`, context)).toEqual(OperationFactory.createProject(OperationFactory.createBgp([
  OperationFactory.createPattern(
    DataFactory.blankNode('b5'),
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
        return expect(await converter.graphqlToSparqlAlgebra(`
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
    DataFactory.blankNode('b6'),
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
    DataFactory.blankNode('b6'),
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
        return expect(await converter.graphqlToSparqlAlgebra(`
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
          DataFactory.blankNode('b7'),
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
          DataFactory.blankNode('b7'),
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
        return expect(await converter.graphqlToSparqlAlgebra(`
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

      it('it should convert a query with variables with default values', async () => {
        const context = {
          hero: 'http://example.org/hero',
          episode: 'http://example.org/episode',
          JEDI: 'http://example.org/types/jedi',
          name: 'http://example.org/name',
          friends: 'http://example.org/friends',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
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
        return expect(await converter.graphqlToSparqlAlgebra(`
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
    DataFactory.blankNode('b10'),
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
        return expect(await converter.graphqlToSparqlAlgebra(`
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
                DataFactory.blankNode('b11'),
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

      it('it should convert a query with a single totalCount select', async () => {
        const context = {
          hero: 'http://example.org/hero',
          episode: 'http://example.org/episode',
          JEDI: 'http://example.org/types/jedi',
          name: 'http://example.org/name',
          friends: 'http://example.org/friends',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
{
  hero {
    friends {
      totalCount
    }
  }
}
`, context)).toEqual(OperationFactory.createProject(
          OperationFactory.createJoin(
            OperationFactory.createBgp([
              OperationFactory.createPattern(
                DataFactory.blankNode('b12'),
                DataFactory.namedNode('http://example.org/hero'),
                DataFactory.variable('hero'),
              ),
            ]),
            OperationFactory.createProject(
              OperationFactory.createExtend(
                OperationFactory.createGroup(
                  OperationFactory.createBgp([
                    OperationFactory.createPattern(
                      DataFactory.variable('hero'),
                      DataFactory.namedNode('http://example.org/friends'),
                      DataFactory.variable('hero_friends'),
                    )],
                  ),
                  [],
                  [OperationFactory.createBoundAggregate(
                    DataFactory.variable('var0'),
                    'count',
                    OperationFactory.createTermExpression(DataFactory.variable('hero_friends')),
                    false,
                  )],
                ),
                DataFactory.variable('hero_friends_totalCount'),
                OperationFactory.createTermExpression(DataFactory.variable('var0')),
              ),
              [DataFactory.variable('hero_friends_totalCount')],
            ),
          ), [
            DataFactory.variable('hero_friends_totalCount'),
          ]));
      });

      it('it should convert a query with a totalCount and a regular select', async () => {
        const context = {
          hero: 'http://example.org/hero',
          episode: 'http://example.org/episode',
          JEDI: 'http://example.org/types/jedi',
          name: 'http://example.org/name',
          friends: 'http://example.org/friends',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
{
  hero {
    friends {
      name
      totalCount
    }
  }
}
`, context)).toEqual(OperationFactory.createProject(
          OperationFactory.createJoin(
            OperationFactory.createBgp([
              OperationFactory.createPattern(
                DataFactory.blankNode('b13'),
                DataFactory.namedNode('http://example.org/hero'),
                DataFactory.variable('hero'),
              ),
            ]),
            OperationFactory.createJoin(
              OperationFactory.createProject(
                OperationFactory.createBgp([
                  OperationFactory.createPattern(
                    DataFactory.variable('hero'),
                    DataFactory.namedNode('http://example.org/friends'),
                    DataFactory.variable('hero_friends'),
                  ),
                  OperationFactory.createPattern(
                    DataFactory.variable('hero_friends'),
                    DataFactory.namedNode('http://example.org/name'),
                    DataFactory.variable('hero_friends_name'),
                  ),
                ]),
                [],
              ),
              OperationFactory.createProject(
                OperationFactory.createExtend(
                  OperationFactory.createGroup(
                    OperationFactory.createBgp([
                      OperationFactory.createPattern(
                        DataFactory.variable('hero'),
                        DataFactory.namedNode('http://example.org/friends'),
                        DataFactory.variable('hero_friends'),
                      )],
                    ),
                    [],
                    [OperationFactory.createBoundAggregate(
                      DataFactory.variable('var0'),
                      'count',
                      OperationFactory.createTermExpression(DataFactory.variable('hero_friends')),
                      false,
                    )],
                  ),
                  DataFactory.variable('hero_friends_totalCount'),
                  OperationFactory.createTermExpression(DataFactory.variable('var0')),
                ),
                [DataFactory.variable('hero_friends_totalCount')],
              ),
            ),
          ), [
            DataFactory.variable('hero_friends_name'),
            DataFactory.variable('hero_friends_totalCount'),
          ]));
      });

      it('it should convert a simple query with a complex context', async () => {
        const context = {
          '@vocab': 'http://example.org/',
          'ex': '#',
          'human': { '@id': 'ex:human' },
          'name': 'ex:name',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
{
  human {
    name
  }
}
`, context)).toEqual(OperationFactory.createProject(OperationFactory.createBgp([
  OperationFactory.createPattern(
    DataFactory.blankNode('b14'),
    DataFactory.namedNode('http://example.org/#human'),
    DataFactory.variable('human'),
  ),
  OperationFactory.createPattern(
    DataFactory.variable('human'),
    DataFactory.namedNode('http://example.org/#name'),
    DataFactory.variable('human_name'),
  ),
]), [
  DataFactory.variable('human_name'),
]));
      });

      it('it should convert a query for getting id at root', async () => {
        const context = {
          name: 'http://example.org/name',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
{
  id
  name
}
`, context)).toEqual(
          OperationFactory.createProject(OperationFactory.createBgp([
            OperationFactory.createPattern(
              DataFactory.variable('id'),
              DataFactory.namedNode('http://example.org/name'),
              DataFactory.variable('name'),
            ),
          ]),
            [
              DataFactory.variable('id'),
              DataFactory.variable('name'),
            ]));
      });

      it('it should convert a query for getting id in inner node', async () => {
        const context = {
          hero: 'http://example.org/hero',
          name: 'http://example.org/name',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
{
  hero {
    id
    name
  }
}
`, context)).toEqual(
          OperationFactory.createProject(OperationFactory.createBgp([
            OperationFactory.createPattern(
                DataFactory.blankNode('b15'),
                DataFactory.namedNode('http://example.org/hero'),
                DataFactory.variable('hero_id'),
              ),
            OperationFactory.createPattern(
                DataFactory.variable('hero_id'),
                DataFactory.namedNode('http://example.org/name'),
                DataFactory.variable('hero_name'),
              ),
          ]),
            [
              DataFactory.variable('hero_id'),
              DataFactory.variable('hero_name'),
            ]));
      });

      it('it should convert a query for setting id without children', async () => {
        const context = {
          HAN_SOLO: 'http://example.org/HanSolo',
          hero: 'http://example.org/hero',
          name: 'http://example.org/name',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
{
  hero(_:HAN_SOLO)
}
`, context)).toEqual(
          OperationFactory.createProject(OperationFactory.createBgp([
            OperationFactory.createPattern(
                DataFactory.blankNode('b16'),
                DataFactory.namedNode('http://example.org/hero'),
                DataFactory.namedNode('http://example.org/HanSolo'),
              ),
          ]),
            []));
      });

      it('it should convert a query for setting id with children', async () => {
        const context = {
          HAN_SOLO: 'http://example.org/HanSolo',
          hero: 'http://example.org/hero',
          name: 'http://example.org/name',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
{
  hero(_:HAN_SOLO) {
    name
  }
}
`, context)).toEqual(
          OperationFactory.createProject(OperationFactory.createBgp([
            OperationFactory.createPattern(
                DataFactory.blankNode('b17'),
                DataFactory.namedNode('http://example.org/hero'),
                DataFactory.namedNode('http://example.org/HanSolo'),
            ),
            OperationFactory.createPattern(
                DataFactory.namedNode('http://example.org/HanSolo'),
                DataFactory.namedNode('http://example.org/name'),
                DataFactory.variable('hero_name'),
              ),
          ]),
            [
              DataFactory.variable('hero_name'),
            ]));
      });

      it('it should convert a query for getting graph at root', async () => {
        const context = {
          name: 'http://example.org/name',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
{
  graph
  name
}
`, context)).toEqual(
          OperationFactory.createProject(OperationFactory.createBgp([
            OperationFactory.createPattern(
                DataFactory.blankNode('b18'),
                DataFactory.namedNode('http://example.org/name'),
                DataFactory.variable('name'),
                DataFactory.variable('graph'),
              ),
          ]),
            [
              DataFactory.variable('graph'),
              DataFactory.variable('name'),
            ]));
      });

      it('it should convert a query for setting graph at root', async () => {
        const context = {
          G1: 'http://example.org/graph1',
          name: 'http://example.org/name',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
{
  graph(_:G1)
  name
}
`, context)).toEqual(
          OperationFactory.createProject(OperationFactory.createBgp([
            OperationFactory.createPattern(
                DataFactory.blankNode('b19'),
                DataFactory.namedNode('http://example.org/name'),
                DataFactory.variable('name'),
                DataFactory.namedNode('http://example.org/graph1'),
              ),
          ]),
            [
              DataFactory.variable('name'),
            ]));
      });

      it('it should convert a query for getting graph in inner node', async () => {
        const context = {
          hero: 'http://example.org/hero',
          name: 'http://example.org/name',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
{
  hero {
    graph
    name
  }
}
`, context)).toEqual(
          OperationFactory.createProject(OperationFactory.createBgp([
            OperationFactory.createPattern(
                DataFactory.blankNode('b20'),
                DataFactory.namedNode('http://example.org/hero'),
                DataFactory.variable('hero'),
            ),
            OperationFactory.createPattern(
                DataFactory.variable('hero'),
                DataFactory.namedNode('http://example.org/name'),
                DataFactory.variable('hero_name'),
                DataFactory.variable('hero_graph'),
              ),
          ]),
            [
              DataFactory.variable('hero_graph'),
              DataFactory.variable('hero_name'),
            ]));
      });

      it('it should convert a query for setting graph without children', async () => {
        const context = {
          G1: 'http://example.org/graph1',
          hero: 'http://example.org/hero',
          name: 'http://example.org/name',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
{
  hero(graph:G1)
}
`, context)).toEqual(
          OperationFactory.createProject(OperationFactory.createBgp([
            OperationFactory.createPattern(
                DataFactory.blankNode('b21'),
                DataFactory.namedNode('http://example.org/hero'),
                DataFactory.variable('hero'),
                DataFactory.namedNode('http://example.org/graph1'),
              ),
          ]),
            [
              DataFactory.variable('hero'),
            ]));
      });

      it('it should convert a query for setting graph with children', async () => {
        const context = {
          G1: 'http://example.org/graph1',
          hero: 'http://example.org/hero',
          name: 'http://example.org/name',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
{
  hero(graph:G1) {
    name
  }
}
`, context)).toEqual(
          OperationFactory.createProject(OperationFactory.createBgp([
            OperationFactory.createPattern(
                DataFactory.blankNode('b22'),
                DataFactory.namedNode('http://example.org/hero'),
                DataFactory.variable('hero'),
                DataFactory.namedNode('http://example.org/graph1'),
            ),
            OperationFactory.createPattern(
                DataFactory.variable('hero'),
                DataFactory.namedNode('http://example.org/name'),
                DataFactory.variable('hero_name'),
                DataFactory.namedNode('http://example.org/graph1'),
              ),
          ]),
            [
              DataFactory.variable('hero_name'),
            ]));
      });
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
        return expect(converter.getNodeQuadContextSelectionSet(null, ctx)).toEqual({});
      });

      it('should be empty for unknown fields', async () => {
        return expect(converter.getNodeQuadContextSelectionSet({
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
        expect(converter.getNodeQuadContextSelectionSet({
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
        expect(converter.getNodeQuadContextSelectionSet({
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
        return expect(converter.getNodeQuadContextSelectionSet({
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
        expect(converter.getNodeQuadContextSelectionSet({
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
        return expect(() => converter.getNodeQuadContextSelectionSet({
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
        expect(converter.getNodeQuadContextSelectionSet({
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
        expect(converter.getNodeQuadContextSelectionSet({
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
        return expect(converter.getNodeQuadContextSelectionSet({
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
        expect(converter.getNodeQuadContextSelectionSet({
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
        return expect(() => converter.getNodeQuadContextSelectionSet({
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
        return expect(converter.indexFragments(<DocumentNode> {
          kind: 'Document',
          definitions: [
            {
              kind: 'OperationDefinition',
              name: { kind: 'Name', value: 'op' },
              operation: 'query',
              selectionSet: {
                kind: 'SelectionSet',
                selections: [
                  { kind: 'Field', name: { kind: 'Name', value: 'theField' } },
                ],
              },
              variableDefinitions: [],
              directives: [],
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
          graph: DataFactory.defaultGraph(),
          path: [ 'a' ],
          subject: DataFactory.namedNode('subject'),
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
              DataFactory.namedNode('subject'),
              DataFactory.namedNode('http://example.org/theField'),
              DataFactory.variable('a_theField'),
            ),
          ]));
      });

      it('should convert an operation query definition node with a directive', async () => {
        const ctx = {
          context: { theField: 'http://example.org/theField' },
          graph: DataFactory.defaultGraph(),
          path: [ 'a' ],
          subject: DataFactory.namedNode('subject'),
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
              DataFactory.namedNode('subject'),
              DataFactory.namedNode('http://example.org/theField'),
              DataFactory.variable('a_theField'),
            ),
          ]));
      });
    });

    describe('#selectionToPatterns', () => {
      it('should convert a field selection node', async () => {
        const subject = DataFactory.namedNode('theSubject');
        const ctx = {
          context: { theField: 'http://example.org/theField' },
          graph: DataFactory.defaultGraph(),
          path: [ 'a' ],
          subject,
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
        return expect(converter.selectionToPatterns(ctx,
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
        const subject = DataFactory.namedNode('theSubject');
        const ctx = {
          context: {
            theField: 'http://example.org/theField',
            anotherField: 'http://example.org/anotherField',
            andAnotherField: 'http://example.org/andAnotherField',
          },
          graph: DataFactory.defaultGraph(),
          path: [ 'a' ],
          subject,
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
        return expect(converter.selectionToPatterns(ctx,
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
        const subject = DataFactory.namedNode('theSubject');
        const ctx = {
          context: {
            theField: 'http://example.org/theField',
            anotherField: 'http://example.org/anotherField',
            andAnotherField: 'http://example.org/andAnotherField',
          },
          graph: DataFactory.defaultGraph(),
          path: [ 'a' ],
          subject,
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
        return expect(converter.selectionToPatterns(ctx,
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
        const subject = DataFactory.namedNode('theSubject');
        const ctx = {
          context: { theField: 'http://example.org/theField' },
          graph: DataFactory.defaultGraph(),
          path: [ 'a' ],
          subject,
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
        converter.selectionToPatterns(ctx, { kind: 'Field', name: { kind: 'Name', value: 'theField' } });
        return expect(ctx.terminalVariables).toEqual([
          DataFactory.variable('a_theField'),
        ]);
      });

      it('should terminate a field selection node with an empty selection set', async () => {
        const subject = DataFactory.namedNode('theSubject');
        const ctx = {
          context: { theField: 'http://example.org/theField' },
          graph: DataFactory.defaultGraph(),
          path: [ 'a' ],
          subject,
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
        converter.selectionToPatterns(ctx,
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
        const subject = DataFactory.namedNode('theSubject');
        const ctx = {
          context: { theField: 'http://example.org/theField' },
          graph: DataFactory.defaultGraph(),
          path: [ 'a' ],
          subject,
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
        converter.selectionToPatterns(ctx,
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
        const subject = DataFactory.namedNode('theSubject');
        const ctx = {
          context: {
            theField: 'http://example.org/theField',
          },
          graph: DataFactory.defaultGraph(),
          path: [ 'a' ],
          subject,
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
        return expect(converter.selectionToPatterns(ctx,
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
        const subject = DataFactory.namedNode('theSubject');
        const ctx: IConvertContext = {
          context: {
            theField: 'http://example.org/theField',
            Character: 'http://example.org/types/Character',
          },
          graph: DataFactory.defaultGraph(),
          path: [ 'a' ],
          subject,
          terminalVariables: [],
          fragmentDefinitions: {
            fragment1: {
              kind: 'FragmentDefinition',
              name: { kind: 'Name', value: 'fragment1' },
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
        return expect(converter.selectionToPatterns(ctx,
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
        const subject = DataFactory.namedNode('theSubject');
        const ctx = {
          context: {
            theField: 'http://example.org/theField',
          },
          graph: DataFactory.defaultGraph(),
          path: [ 'a' ],
          subject,
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: <IVariablesDictionary> {
            varTrue: { kind: 'BooleanValue', value: true },
            varFalse: { kind: 'BooleanValue', value: false },
          },
          variablesMetaDict: {},
        };
        return expect(converter.selectionToPatterns(ctx,
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
        const subject = DataFactory.namedNode('theSubject');
        const ctx = {
          context: {
            theField: 'http://example.org/theField',
            Character: 'http://example.org/types/Character',
          },
          graph: DataFactory.defaultGraph(),
          path: [ 'a' ],
          subject,
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
        return expect(converter.selectionToPatterns(ctx,
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
        const subject = DataFactory.namedNode('theSubject');
        const ctx = {
          context: {
            theField: 'http://example.org/theField',
            Character: 'http://example.org/types/Character',
          },
          graph: DataFactory.defaultGraph(),
          path: [ 'a' ],
          subject,
          terminalVariables: [],
          fragmentDefinitions: {},
          variablesDict: {},
          variablesMetaDict: {},
        };
        return expect(converter.selectionToPatterns(ctx,
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
        return expect(converter.joinOperations([
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
        return expect(converter.nameToVariable({ kind: 'Field', name: { kind: 'Name', value: 'varName' } }, ctx))
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
        return expect(converter.nameToVariable({ kind: 'Field', name: { kind: 'Name', value: 'varName' } }, ctx))
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
        return expect(converter.nameToVariable(
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
        return expect(converter.nameToVariable({ kind: 'Field', name: { kind: 'Name', value: 'varName' } }, ctx))
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

      it('should expand a value that is in the context as an object', async () => {
        return expect(converter.valueToNamedNode('abc', { abc: { '@id': 'http://example.org/abc' } }))
          .toEqual(DataFactory.namedNode('http://example.org/abc'));
      });
    });

    describe('#valueToTerm', () => {
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
        return expect(converter.valueToTerm(
          { kind: 'Variable', name: { kind: 'Name', value: 'myVar1' } }, ctx, 'va'))
          .toEqual({ terms: [ DataFactory.literal('myValue1') ] });
      });

      it('should error when an unknown variable is not defined', async () => {
        return expect(() => converter.valueToTerm(
          { kind: 'Variable', name: { kind: 'Name', value: 'myVar3' } }, ctx, 'va')).toThrow();
      });

      it('should error when a mandatory variable is not defined', async () => {
        return expect(() => converter.valueToTerm(
          { kind: 'Variable', name: { kind: 'Name', value: 'myVar4' } }, ctx, 'va')).toThrow();
      });

      it('should error when a variable has no list type while it was expected', async () => {
        return expect(() => converter.valueToTerm(
          { kind: 'Variable', name: { kind: 'Name', value: 'myVar5' } }, ctx, 'va')).toThrow();
      });

      it('should error when a variable has an incorrect defined list type', async () => {
        return expect(() => converter.valueToTerm(
          { kind: 'Variable', name: { kind: 'Name', value: 'myVar6' } }, ctx, 'va')).toThrow();
      });

      it('should convert an int', async () => {
        return expect(converter.valueToTerm(
          { kind: 'IntValue', value: '123' }, ctx, 'va'))
          .toEqual({ terms: [ DataFactory.literal('123',
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#integer')) ] });
      });

      it('should convert a float', async () => {
        return expect(converter.valueToTerm(
          { kind: 'FloatValue', value: '123.1' }, ctx, 'va'))
          .toEqual({ terms: [ DataFactory.literal('123.1',
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#float')) ] });
      });

      it('should convert a string', async () => {
        return expect(converter.valueToTerm(
          { kind: 'StringValue', value: 'abc' }, ctx, 'va'))
          .toEqual({ terms: [ DataFactory.literal('abc') ] });
      });

      it('should convert a languaged string', async () => {
        return expect(converter.valueToTerm(
          { kind: 'StringValue', value: 'abc' }, ctx, 'va_en'))
          .toEqual({ terms: [ DataFactory.literal('abc', 'en') ] });
      });

      it('should convert a datatyped string', async () => {
        return expect(converter.valueToTerm(
          { kind: 'StringValue', value: 'abc' }, ctx, 'va_datetime'))
          .toEqual({ terms: [ DataFactory.literal('abc', DataFactory
            .namedNode('http://www.w3.org/2001/XMLSchema#dateTime')) ] });
      });

      it('should convert a true boolean', async () => {
        return expect(converter.valueToTerm(
          { kind: 'BooleanValue', value: true }, ctx, 'va'))
          .toEqual({ terms: [ DataFactory.literal('true',
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')) ] });
      });

      it('should convert a false boolean', async () => {
        return expect(converter.valueToTerm(
          { kind: 'BooleanValue', value: false }, ctx, 'va'))
          .toEqual({ terms: [ DataFactory.literal('false',
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')) ] });
      });

      it('should convert a null value', async () => {
        return expect(converter.valueToTerm(
          { kind: 'NullValue' }, ctx, 'va'))
          .toEqual({ terms: [ DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil') ] });
      });

      it('should convert an enum value', async () => {
        return expect(converter.valueToTerm(
          { kind: 'EnumValue', value: 'FOOT' }, ctx, 'va'))
          .toEqual({ terms: [ DataFactory.namedNode('http://example.org/types/foot') ] });
      });

      it('should convert a list value in non-RDF-list-mode', async () => {
        const out = converter.valueToTerm(
          { kind: 'ListValue', values: [
            { kind: 'BooleanValue', value: false },
            { kind: 'BooleanValue', value: true },
            { kind: 'BooleanValue', value: false },
          ] }, ctx, 'va');
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
          ] }, ctx, 'va');
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
          ] }, ctx, 'va');
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

    describe('#createTriplePattern', () => {
      it('should create a triple pattern for a normal context', async () => {
        const s = DataFactory.namedNode('s');
        const p: NameNode = { kind: 'Name', value: 'p' };
        const o = DataFactory.namedNode('o');
        const g = DataFactory.defaultGraph();
        return expect(converter.createQuadPattern(s, p, o, g, { p: 'myP' }))
          .toEqual(OperationFactory.createPattern(s, DataFactory.namedNode('myP'), o));
      });

      it('should create a triple pattern for a reversed context', async () => {
        const s = DataFactory.namedNode('s');
        const p: NameNode = { kind: 'Name', value: 'p' };
        const o = DataFactory.namedNode('o');
        const g = DataFactory.defaultGraph();
        return expect(converter.createQuadPattern(s, p, o, g, { p: { '@reverse': 'myP' } }))
          .toEqual(OperationFactory.createPattern(o, DataFactory.namedNode('myP'), s));
      });

      it('should create a quad pattern for a normal context', async () => {
        const s = DataFactory.namedNode('s');
        const p: NameNode = { kind: 'Name', value: 'p' };
        const o = DataFactory.namedNode('o');
        const g = DataFactory.namedNode('g');
        return expect(converter.createQuadPattern(s, p, o, g, { p: 'myP' }))
          .toEqual(OperationFactory.createPattern(s, DataFactory.namedNode('myP'), o, g));
      });

      it('should create a quad pattern for a reversed context', async () => {
        const s = DataFactory.namedNode('s');
        const p: NameNode = { kind: 'Name', value: 'p' };
        const o = DataFactory.namedNode('o');
        const g = DataFactory.namedNode('g');
        return expect(converter.createQuadPattern(s, p, o, g, { p: { '@reverse': 'myP' } }))
          .toEqual(OperationFactory.createPattern(o, DataFactory.namedNode('myP'), s, g));
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
        return expect(converter.handleDirective(unknownDirective, ctx)).toBeTruthy();
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
