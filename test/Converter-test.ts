import * as DataFactory from "@rdfjs/data-model";
import {DocumentNode} from "graphql";
import {Factory} from "sparqlalgebrajs";
import {Converter} from "../lib/Converter";
import {IVariablesDictionary} from "../lib/IConvertContext";

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
            ]), [
              DataFactory.variable('hero'),
              DataFactory.variable('hero_friends'),
              DataFactory.variable('hero_friends_name'),
            ]), 10, 2),
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
`, context, { variablesDict })).toEqual(OperationFactory.createProject(OperationFactory.createBgp([
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
`, context, { variablesDict })).toEqual(OperationFactory.createProject(OperationFactory.createBgp([
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
`, context, { variablesDict })).toEqual(OperationFactory.createProject(
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

      it('it should convert a query with @optional', async () => {
        const context = {
          hero: 'http://example.org/hero',
          name: 'http://example.org/name',
          friend: 'http://example.org/friend',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
{
  hero {
    name @optional
    friend @optional
  }
}
`, context)).toEqual(
          OperationFactory.createProject(
            OperationFactory.createJoin(
              OperationFactory.createBgp([
                OperationFactory.createPattern(
                    DataFactory.blankNode('b23'),
                    DataFactory.namedNode('http://example.org/hero'),
                    DataFactory.variable('hero'),
                  ),
              ],
              ),
              OperationFactory.createJoin(
                OperationFactory.createLeftJoin(
                  OperationFactory.createBgp([]),
                  OperationFactory.createBgp([
                    OperationFactory.createPattern(
                        DataFactory.variable('hero'),
                        DataFactory.namedNode('http://example.org/name'),
                        DataFactory.variable('hero_name'),
                      ),
                  ],
                  ),
                ),
                OperationFactory.createLeftJoin(
                  OperationFactory.createBgp([]),
                  OperationFactory.createBgp([
                    OperationFactory.createPattern(
                        DataFactory.variable('hero'),
                        DataFactory.namedNode('http://example.org/friend'),
                        DataFactory.variable('hero_friend'),
                      ),
                  ],
                  ),
                ),
              ),
            ), [
              DataFactory.variable('hero_name'),
              DataFactory.variable('hero_friend'),
            ]));
      });

      it('it should convert a query with @reverse', async () => {
        const context = {
          G1: 'http://example.org/graph1',
          hero: 'http://example.org/hero',
          friend: { '@reverse': 'http://example.org/friend' },
          name: 'http://example.org/name',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
{
  hero {
    friend {
      name
    }
  }
}
`, context)).toEqual(
          OperationFactory.createProject(OperationFactory.createBgp([
            OperationFactory.createPattern(
                DataFactory.blankNode('b24'),
                DataFactory.namedNode('http://example.org/hero'),
                DataFactory.variable('hero'),
            ),
            OperationFactory.createPattern(
                DataFactory.variable('hero_friend'),
                DataFactory.namedNode('http://example.org/friend'),
                DataFactory.variable('hero'),
            ),
            OperationFactory.createPattern(
                DataFactory.variable('hero_friend'),
                DataFactory.namedNode('http://example.org/name'),
                DataFactory.variable('hero_friend_name'),
            ),
          ]),
            [
              DataFactory.variable('hero_friend_name'),
            ]));
      });

      it('it should convert a pre-parsed query', async () => {
        const context = {
          human: 'http://example.org/human',
          name: 'http://example.org/name',
        };
        return expect(await converter.graphqlToSparqlAlgebra({
          kind: 'Document',
          definitions: [
            {
              kind: 'OperationDefinition',
              operation: 'query',
              selectionSet: {
                kind: 'SelectionSet',
                selections: [
                  {
                    kind: 'Field',
                    name: { kind: 'Name', value: 'human' },
                    selectionSet: {
                      kind: 'SelectionSet',
                      selections: [
                        {
                          kind: 'Field',
                          name: { kind: 'Name', value: 'name' },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        }, context)).toEqual(OperationFactory.createProject(OperationFactory.createBgp([
          OperationFactory.createPattern(
            DataFactory.blankNode('b25'),
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

      it('it should convert a query with non-set variables', async () => {
        const context = {
          human: 'http://example.org/human',
          name: 'http://example.org/name',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
query($varA: String, $varB: String) {
  id(_: $varA)
  human {
    name(_: $varB)
  }
}
`, context)).toEqual(OperationFactory.createProject(OperationFactory.createBgp([
  OperationFactory.createPattern(
            DataFactory.variable('varA'),
            DataFactory.namedNode('http://example.org/human'),
            DataFactory.variable('human'),
          ),
  OperationFactory.createPattern(
            DataFactory.variable('human'),
            DataFactory.namedNode('http://example.org/name'),
            DataFactory.variable('varB'),
          ),
]), [
  DataFactory.variable('varA'),
  DataFactory.variable('varB'),
]));
      });

      it('it should error on an undefined inner variable', async () => {
        const context = {
          human: 'http://example.org/human',
          name: 'http://example.org/name',
        };
        return expect(converter.graphqlToSparqlAlgebra(`
query($varA: String, $varB: String) {
  id(_: $varA)
  human {
    name(_: $varB_)
  }
}
`, context)).rejects.toThrow(new Error('Undefined variable: varB_'));
      });

      it('it should error on an undefined id(_) variable', async () => {
        const context = {
          human: 'http://example.org/human',
          name: 'http://example.org/name',
        };
        return expect(converter.graphqlToSparqlAlgebra(`
query($varA: String, $varB: String) {
  id(_: $varA_)
  human {
    name(_: $varB)
  }
}
`, context)).rejects.toThrow(new Error('Undefined variable: varA_'));
      });

      it('it should convert a query with a field alternative', async () => {
        const context = {
          human: 'http://example.org/human',
          alien: 'http://example.org/alien',
          name: 'http://example.org/name',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
query {
  human(alt: alien) {
    name
  }
}
`, context)).toEqual(OperationFactory.createProject(
          OperationFactory.createJoin(
            OperationFactory.createBgp([
              OperationFactory.createPattern(
                DataFactory.variable('human'),
                DataFactory.namedNode('http://example.org/name'),
                DataFactory.variable('human_name'),
              ),
            ]),
            OperationFactory.createPath(
              DataFactory.blankNode('b26'),
              OperationFactory.createAlt(
                OperationFactory.createLink(DataFactory.namedNode('http://example.org/human')),
                OperationFactory.createLink(DataFactory.namedNode('http://example.org/alien')),
              ),
              DataFactory.variable('human'),
            ),
          ), [
            DataFactory.variable('human_name'),
          ]));
      });

      it('it should convert a query with field alternatives', async () => {
        const context = {
          human: 'http://example.org/human',
          alien: 'http://example.org/alien',
          belgian: 'http://example.org/belgian',
          name: 'http://example.org/name',
        };
        return expect(await converter.graphqlToSparqlAlgebra(`
query {
  human(alt: [alien, belgian]) {
    name
  }
}
`, context)).toEqual(OperationFactory.createProject(
          OperationFactory.createJoin(
            OperationFactory.createBgp([
              OperationFactory.createPattern(
                DataFactory.variable('human'),
                DataFactory.namedNode('http://example.org/name'),
                DataFactory.variable('human_name'),
              ),
            ]),
            OperationFactory.createPath(
              DataFactory.blankNode('b27'),
              OperationFactory.createAlt(
                OperationFactory.createAlt(
                  OperationFactory.createLink(DataFactory.namedNode('http://example.org/human')),
                  OperationFactory.createLink(DataFactory.namedNode('http://example.org/alien')),
                ),
                OperationFactory.createLink(DataFactory.namedNode('http://example.org/belgian')),
              ),
              DataFactory.variable('human'),
            ),
          ), [
            DataFactory.variable('human_name'),
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

    describe('for value singularization', () => {
      it('should handle a couple @single fields', async () => {
        const context = {
          hero: 'http://example.org/hero',
          friends: 'http://example.org/friends',
          name: 'http://example.org/name',
        };
        const options =  {
          singularizeVariables: {},
        };
        await converter.graphqlToSparqlAlgebra(`
{
  hero {
    name @single
    friends {
      name @single
    }
  }
}
`, context, options);
        return expect(options.singularizeVariables).toEqual({
          hero_name: true,
          hero_friends_name: true,
        });
      });

      it('should handle a scope-all single', async () => {
        const context = {
          hero: 'http://example.org/hero',
          friends: 'http://example.org/friends',
          name: 'http://example.org/name',
        };
        const options =  {
          singularizeVariables: {},
        };
        await converter.graphqlToSparqlAlgebra(`
query {
  hero @single(scope: all) {
    name
    friends {
      name
    }
  }
}
`, context, options);
        return expect(options.singularizeVariables).toEqual({
          hero: true,
          hero_name: true,
          hero_friends: true,
          hero_friends_name: true,
        });
      });

      it('should handle scope-all single and plural combined', async () => {
        const context = {
          hero: 'http://example.org/hero',
          friends: 'http://example.org/friends',
          name: 'http://example.org/name',
        };
        const options =  {
          singularizeVariables: {},
        };
        await converter.graphqlToSparqlAlgebra(`
query {
  hero @single(scope: all) {
    name
    friends @plural(scope: all) {
      name
    }
  }
}
`, context, options);
        return expect(options.singularizeVariables).toEqual({
          hero: true,
          hero_name: true,
        });
      });

      it('should handle a root @single and couple @plural fields', async () => {
        const context = {
          hero: 'http://example.org/hero',
          friends: 'http://example.org/friends',
          name: 'http://example.org/name',
        };
        const options =  {
          singularizeVariables: {},
        };
        await converter.graphqlToSparqlAlgebra(`
query @single(scope: all) {
  hero @plural {
    name
    friends @plural {
      name
    }
  }
}
`, context, options);
        return expect(options.singularizeVariables).toEqual({
          '': true,
          'hero_name': true,
          'hero_friends_name': true,
        });
      });
    });
  });
});
