import {DataFactory} from "rdf-data-factory";
import {DocumentNode} from "graphql";
import {AlgebraFactory} from "@traqula/algebra-transformations-1-2";
import {Converter} from "../lib/Converter";
import {IVariablesDictionary} from "../lib/IConvertContext";

// tslint:disable:object-literal-sort-keys

const DF = new DataFactory({ blankNodePrefix: 'df_' });
const OperationFactory = new AlgebraFactory(DF);

describe('Converter', () => {

  beforeEach(() => {
    DF.resetBlankNodeCounter();
  });

  describe('without default data factory', () => {
    let converter: Converter;

    beforeEach(() => {
      converter = new Converter({ dataFactory: new DataFactory({ blankNodePrefix: 'df_' }) });
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
    DF.variable('df_0'),
    DF.namedNode('http://example.org/human'),
    DF.variable('human'),
  ),
  OperationFactory.createPattern(
    DF.variable('human'),
    DF.namedNode('http://example.org/name'),
    DF.variable('human_name'),
  ),
]), [
  DF.variable('human_name'),
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
    DF.variable('df_0'),
    DF.namedNode('http://example.org/human'),
    DF.variable('human'),
  ),
  OperationFactory.createPattern(
    DF.variable('human'),
    DF.namedNode('http://example.org/id'),
    DF.literal('1000'),
  ),
  OperationFactory.createPattern(
    DF.variable('human'),
    DF.namedNode('http://example.org/name'),
    DF.variable('human_name'),
  ),
]), [
  DF.variable('human_name'),
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
          OperationFactory.createJoin([
            OperationFactory.createBgp([
              OperationFactory.createPattern(
                DF.variable('df_0'),
                DF.namedNode('http://example.org/hero'),
                DF.variable('hero'),
              ),
              OperationFactory.createPattern(
                DF.variable('hero'),
                DF.namedNode('http://example.org/name'),
                DF.variable('hero_name'),
              ),
            ]),
            OperationFactory.createSlice(OperationFactory.createProject(OperationFactory.createBgp([
              OperationFactory.createPattern(
                DF.variable('hero'),
                DF.namedNode('http://example.org/friends'),
                DF.variable('hero_friends'),
              ),
              OperationFactory.createPattern(
                DF.variable('hero_friends'),
                DF.namedNode('http://example.org/name'),
                DF.variable('hero_friends_name'),
              ),
            ]), [
              DF.variable('hero'),
              DF.variable('hero_friends'),
              DF.variable('hero_friends_name'),
            ]), 10, 2),
          ]), [
            DF.variable('hero_name'),
            DF.variable('hero_friends_name'),
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
    DF.variable('df_0'),
    DF.namedNode('http://example.org/human'),
    DF.variable('human'),
  ),
  OperationFactory.createPattern(
    DF.variable('human'),
    DF.namedNode('http://example.org/id'),
    DF.literal('1000'),
  ),
  OperationFactory.createPattern(
    DF.variable('human'),
    DF.namedNode('http://example.org/name'),
    DF.variable('human_name'),
  ),
  OperationFactory.createPattern(
    DF.variable('human'),
    DF.namedNode('http://example.org/friends'),
    DF.variable('human_friends'),
  ),
  OperationFactory.createPattern(
    DF.variable('human_friends'),
    DF.namedNode('http://example.org/name'),
    DF.variable('human_friends_name'),
  ),
]), [
  DF.variable('human_name'),
  DF.variable('human_friends_name'),
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
    DF.variable('df_0'),
    DF.namedNode('http://example.org/human'),
    DF.variable('human'),
  ),
  OperationFactory.createPattern(
    DF.variable('human'),
    DF.namedNode('http://example.org/id'),
    DF.literal('1000'),
  ),
  OperationFactory.createPattern(
    DF.variable('human'),
    DF.namedNode('http://example.org/name'),
    DF.variable('human_name'),
  ),
  OperationFactory.createPattern(
    DF.variable('human'),
    DF.namedNode('http://example.org/height'),
    DF.variable('human_height'),
  ),
  OperationFactory.createPattern(
    DF.variable('human_height'),
    DF.namedNode('http://example.org/unit'),
    DF.namedNode('http://example.org/types/foot'),
  ),
]), [
  DF.variable('human_name'),
  DF.variable('human_height'),
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
    DF.variable('df_0'),
    DF.namedNode('http://example.org/hero'),
    DF.variable('empireHero'),
  ),
  OperationFactory.createPattern(
    DF.variable('empireHero'),
    DF.namedNode('http://example.org/episode'),
    DF.namedNode('http://example.org/types/empire'),
  ),
  OperationFactory.createPattern(
    DF.variable('empireHero'),
    DF.namedNode('http://example.org/name'),
    DF.variable('empireHero_name'),
  ),
  OperationFactory.createPattern(
    DF.variable('df_0'),
    DF.namedNode('http://example.org/hero'),
    DF.variable('jediHero'),
  ),
  OperationFactory.createPattern(
    DF.variable('jediHero'),
    DF.namedNode('http://example.org/episode'),
    DF.namedNode('http://example.org/types/jedi'),
  ),
  OperationFactory.createPattern(
    DF.variable('jediHero'),
    DF.namedNode('http://example.org/name'),
    DF.variable('jediHero_name'),
  ),
]), [
  DF.variable('empireHero_name'),
  DF.variable('jediHero_name'),
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
  OperationFactory.createJoin([
    OperationFactory.createLeftJoin(
        OperationFactory.createBgp([
          OperationFactory.createPattern(
            DF.variable('df_0'),
            DF.namedNode('http://example.org/hero'),
            DF.variable('leftComparison'),
          ),
          OperationFactory.createPattern(
            DF.variable('leftComparison'),
            DF.namedNode('http://example.org/episode'),
            DF.namedNode('http://example.org/types/empire'),
          ),
        ]),
        OperationFactory.createBgp([
          OperationFactory.createPattern(
            DF.variable('leftComparison'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('http://example.org/types/Character'),
          ),
          OperationFactory.createPattern(
            DF.variable('leftComparison'),
            DF.namedNode('http://example.org/name'),
            DF.variable('leftComparison_name'),
          ),
          OperationFactory.createPattern(
            DF.variable('leftComparison'),
            DF.namedNode('http://example.org/appearsIn'),
            DF.variable('leftComparison_appearsIn'),
          ),
          OperationFactory.createPattern(
            DF.variable('leftComparison'),
            DF.namedNode('http://example.org/friends'),
            DF.variable('leftComparison_friends'),
          ),
          OperationFactory.createPattern(
            DF.variable('leftComparison_friends'),
            DF.namedNode('http://example.org/name'),
            DF.variable('leftComparison_friends_name'),
          ),
        ]),
      ),
    OperationFactory.createLeftJoin(
        OperationFactory.createBgp([
          OperationFactory.createPattern(
            DF.variable('df_0'),
            DF.namedNode('http://example.org/hero'),
            DF.variable('rightComparison'),
          ),
          OperationFactory.createPattern(
            DF.variable('rightComparison'),
            DF.namedNode('http://example.org/episode'),
            DF.namedNode('http://example.org/types/jedi'),
          ),
        ]),
        OperationFactory.createBgp([
          OperationFactory.createPattern(
            DF.variable('rightComparison'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('http://example.org/types/Character'),
          ),
          OperationFactory.createPattern(
            DF.variable('rightComparison'),
            DF.namedNode('http://example.org/name'),
            DF.variable('rightComparison_name'),
          ),
          OperationFactory.createPattern(
            DF.variable('rightComparison'),
            DF.namedNode('http://example.org/appearsIn'),
            DF.variable('rightComparison_appearsIn'),
          ),
          OperationFactory.createPattern(
            DF.variable('rightComparison'),
            DF.namedNode('http://example.org/friends'),
            DF.variable('rightComparison_friends'),
          ),
          OperationFactory.createPattern(
            DF.variable('rightComparison_friends'),
            DF.namedNode('http://example.org/name'),
            DF.variable('rightComparison_friends_name'),
          ),
        ]),
      ),
  ]), [
    DF.variable('leftComparison_name'),
    DF.variable('leftComparison_appearsIn'),
    DF.variable('leftComparison_friends_name'),
    DF.variable('rightComparison_name'),
    DF.variable('rightComparison_appearsIn'),
    DF.variable('rightComparison_friends_name'),
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
    DF.variable('df_0'),
    DF.namedNode('http://example.org/hero'),
    DF.variable('hero'),
  ),
  OperationFactory.createPattern(
    DF.variable('hero'),
    DF.namedNode('http://example.org/episode'),
    DF.namedNode('http://example.org/types/jedi'),
  ),
  OperationFactory.createPattern(
    DF.variable('hero'),
    DF.namedNode('http://example.org/name'),
    DF.variable('hero_name'),
  ),
  OperationFactory.createPattern(
    DF.variable('hero'),
    DF.namedNode('http://example.org/friends'),
    DF.variable('hero_friends'),
  ),
  OperationFactory.createPattern(
    DF.variable('hero_friends'),
    DF.namedNode('http://example.org/name'),
    DF.variable('hero_friends_name'),
)]), [
  DF.variable('hero_name'),
  DF.variable('hero_friends_name'),
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
    DF.variable('df_0'),
    DF.namedNode('http://example.org/hero'),
    DF.variable('hero'),
  ),
  OperationFactory.createPattern(
    DF.variable('hero'),
    DF.namedNode('http://example.org/episode'),
    DF.namedNode('http://example.org/types/jedi'),
  ),
  OperationFactory.createPattern(
    DF.variable('hero'),
    DF.namedNode('http://example.org/name'),
    DF.variable('hero_name'),
  ),
  OperationFactory.createPattern(
    DF.variable('hero'),
    DF.namedNode('http://example.org/friends'),
    DF.variable('hero_friends'),
  ),
  OperationFactory.createPattern(
    DF.variable('hero_friends'),
    DF.namedNode('http://example.org/name'),
    DF.variable('hero_friends_name'),
)]), [
  DF.variable('hero_name'),
  DF.variable('hero_friends_name'),
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
    DF.variable('df_0'),
    DF.namedNode('http://example.org/hero'),
    DF.variable('hero'),
  ),
  OperationFactory.createPattern(
    DF.variable('hero'),
    DF.namedNode('http://example.org/episode'),
    DF.namedNode('http://example.org/types/jedi'),
  ),
  OperationFactory.createPattern(
    DF.variable('hero'),
    DF.namedNode('http://example.org/name'),
    DF.variable('hero_name'),
  )]), [
    DF.variable('hero_name'),
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
          OperationFactory.createJoin([
            OperationFactory.createBgp([
              OperationFactory.createPattern(
                DF.variable('df_0'),
                DF.namedNode('http://example.org/hero'),
                DF.variable('hero'),
              ),
              OperationFactory.createPattern(
                DF.variable('hero'),
                DF.namedNode('http://example.org/episode'),
                DF.namedNode('http://example.org/types/jedi'),
              ),
              OperationFactory.createPattern(
                DF.variable('hero'),
                DF.namedNode('http://example.org/name'),
                DF.variable('hero_name'),
              ),
            ]),
            OperationFactory.createJoin([
              OperationFactory.createLeftJoin(
                OperationFactory.createBgp([]),
                OperationFactory.createBgp([
                  OperationFactory.createPattern(
                    DF.variable('hero'),
                    DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                    DF.namedNode('http://example.org/types/droid'),
                  ),
                  OperationFactory.createPattern(
                    DF.variable('hero'),
                    DF.namedNode('http://example.org/primaryFunction'),
                    DF.variable('hero_primaryFunction'),
                  ),
                ]),
              ),
              OperationFactory.createLeftJoin(
                OperationFactory.createBgp([]),
                OperationFactory.createBgp([
                  OperationFactory.createPattern(
                    DF.variable('hero'),
                    DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                    DF.namedNode('http://example.org/types/human'),
                  ),
                  OperationFactory.createPattern(
                    DF.variable('hero'),
                    DF.namedNode('http://example.org/height'),
                    DF.variable('hero_height'),
                  ),
                ]),
              ),
            ]),
          ]), [
            DF.variable('hero_name'),
            DF.variable('hero_primaryFunction'),
            DF.variable('hero_height'),
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
          OperationFactory.createJoin([
            OperationFactory.createBgp([
              OperationFactory.createPattern(
                DF.variable('df_0'),
                DF.namedNode('http://example.org/hero'),
                DF.variable('hero'),
              ),
            ]),
            OperationFactory.createProject(
              OperationFactory.createExtend(
                OperationFactory.createGroup(
                  OperationFactory.createBgp([
                    OperationFactory.createPattern(
                      DF.variable('hero'),
                      DF.namedNode('http://example.org/friends'),
                      DF.variable('hero_friends'),
                    )],
                  ),
                  [],
                  [OperationFactory.createBoundAggregate(
                    DF.variable('var0'),
                    'count',
                    OperationFactory.createTermExpression(DF.variable('hero_friends')),
                    false,
                  )],
                ),
                DF.variable('hero_friends_totalCount'),
                OperationFactory.createTermExpression(DF.variable('var0')),
              ),
              [DF.variable('hero_friends_totalCount')],
            ),
          ]), [
            DF.variable('hero_friends_totalCount'),
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
          OperationFactory.createJoin([
            OperationFactory.createBgp([
              OperationFactory.createPattern(
                DF.variable('df_0'),
                DF.namedNode('http://example.org/hero'),
                DF.variable('hero'),
              ),
            ]),
            OperationFactory.createJoin([
              OperationFactory.createProject(
                OperationFactory.createBgp([
                  OperationFactory.createPattern(
                    DF.variable('hero'),
                    DF.namedNode('http://example.org/friends'),
                    DF.variable('hero_friends'),
                  ),
                  OperationFactory.createPattern(
                    DF.variable('hero_friends'),
                    DF.namedNode('http://example.org/name'),
                    DF.variable('hero_friends_name'),
                  ),
                ]),
                [],
              ),
              OperationFactory.createProject(
                OperationFactory.createExtend(
                  OperationFactory.createGroup(
                    OperationFactory.createBgp([
                      OperationFactory.createPattern(
                        DF.variable('hero'),
                        DF.namedNode('http://example.org/friends'),
                        DF.variable('hero_friends'),
                      )],
                    ),
                    [],
                    [OperationFactory.createBoundAggregate(
                      DF.variable('var0'),
                      'count',
                      OperationFactory.createTermExpression(DF.variable('hero_friends')),
                      false,
                    )],
                  ),
                  DF.variable('hero_friends_totalCount'),
                  OperationFactory.createTermExpression(DF.variable('var0')),
                ),
                [DF.variable('hero_friends_totalCount')],
              ),
            ]),
          ]), [
            DF.variable('hero_friends_name'),
            DF.variable('hero_friends_totalCount'),
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
    DF.variable('df_0'),
    DF.namedNode('http://example.org/#human'),
    DF.variable('human'),
  ),
  OperationFactory.createPattern(
    DF.variable('human'),
    DF.namedNode('http://example.org/#name'),
    DF.variable('human_name'),
  ),
]), [
  DF.variable('human_name'),
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
              DF.variable('id'),
              DF.namedNode('http://example.org/name'),
              DF.variable('name'),
            ),
          ]),
            [
              DF.variable('id'),
              DF.variable('name'),
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
                DF.variable('df_0'),
                DF.namedNode('http://example.org/hero'),
                DF.variable('hero_id'),
              ),
            OperationFactory.createPattern(
                DF.variable('hero_id'),
                DF.namedNode('http://example.org/name'),
                DF.variable('hero_name'),
              ),
          ]),
            [
              DF.variable('hero_id'),
              DF.variable('hero_name'),
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
                DF.variable('df_0'),
                DF.namedNode('http://example.org/hero'),
                DF.namedNode('http://example.org/HanSolo'),
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
                DF.variable('df_0'),
                DF.namedNode('http://example.org/hero'),
                DF.namedNode('http://example.org/HanSolo'),
            ),
            OperationFactory.createPattern(
                DF.namedNode('http://example.org/HanSolo'),
                DF.namedNode('http://example.org/name'),
                DF.variable('hero_name'),
              ),
          ]),
            [
              DF.variable('hero_name'),
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
                DF.variable('df_0'),
                DF.namedNode('http://example.org/name'),
                DF.variable('name'),
                DF.variable('graph'),
              ),
          ]),
            [
              DF.variable('graph'),
              DF.variable('name'),
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
                DF.variable('df_0'),
                DF.namedNode('http://example.org/name'),
                DF.variable('name'),
                DF.namedNode('http://example.org/graph1'),
              ),
          ]),
            [
              DF.variable('name'),
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
                DF.variable('df_0'),
                DF.namedNode('http://example.org/hero'),
                DF.variable('hero'),
            ),
            OperationFactory.createPattern(
                DF.variable('hero'),
                DF.namedNode('http://example.org/name'),
                DF.variable('hero_name'),
                DF.variable('hero_graph'),
              ),
          ]),
            [
              DF.variable('hero_graph'),
              DF.variable('hero_name'),
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
                DF.variable('df_0'),
                DF.namedNode('http://example.org/hero'),
                DF.variable('hero'),
                DF.namedNode('http://example.org/graph1'),
              ),
          ]),
            [
              DF.variable('hero'),
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
                DF.variable('df_0'),
                DF.namedNode('http://example.org/hero'),
                DF.variable('hero'),
                DF.namedNode('http://example.org/graph1'),
            ),
            OperationFactory.createPattern(
                DF.variable('hero'),
                DF.namedNode('http://example.org/name'),
                DF.variable('hero_name'),
                DF.namedNode('http://example.org/graph1'),
              ),
          ]),
            [
              DF.variable('hero_name'),
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
            OperationFactory.createJoin([
              OperationFactory.createBgp([
                OperationFactory.createPattern(
                    DF.variable('df_0'),
                    DF.namedNode('http://example.org/hero'),
                    DF.variable('hero'),
                  ),
              ],
              ),
              OperationFactory.createJoin([
                OperationFactory.createLeftJoin(
                  OperationFactory.createBgp([]),
                  OperationFactory.createBgp([
                    OperationFactory.createPattern(
                        DF.variable('hero'),
                        DF.namedNode('http://example.org/name'),
                        DF.variable('hero_name'),
                      ),
                  ],
                  ),
                ),
                OperationFactory.createLeftJoin(
                  OperationFactory.createBgp([]),
                  OperationFactory.createBgp([
                    OperationFactory.createPattern(
                        DF.variable('hero'),
                        DF.namedNode('http://example.org/friend'),
                        DF.variable('hero_friend'),
                      ),
                  ],
                  ),
                ),
              ]),
            ]), [
              DF.variable('hero_name'),
              DF.variable('hero_friend'),
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
                DF.variable('df_0'),
                DF.namedNode('http://example.org/hero'),
                DF.variable('hero'),
            ),
            OperationFactory.createPattern(
                DF.variable('hero_friend'),
                DF.namedNode('http://example.org/friend'),
                DF.variable('hero'),
            ),
            OperationFactory.createPattern(
                DF.variable('hero_friend'),
                DF.namedNode('http://example.org/name'),
                DF.variable('hero_friend_name'),
            ),
          ]),
            [
              DF.variable('hero_friend_name'),
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
            DF.variable('df_0'),
            DF.namedNode('http://example.org/human'),
            DF.variable('human'),
          ),
          OperationFactory.createPattern(
            DF.variable('human'),
            DF.namedNode('http://example.org/name'),
            DF.variable('human_name'),
          ),
        ]), [
          DF.variable('human_name'),
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
            DF.variable('varA'),
            DF.namedNode('http://example.org/human'),
            DF.variable('human'),
          ),
  OperationFactory.createPattern(
            DF.variable('human'),
            DF.namedNode('http://example.org/name'),
            DF.variable('varB'),
          ),
]), [
  DF.variable('varA'),
  DF.variable('varB'),
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
          OperationFactory.createJoin([
            OperationFactory.createBgp([
              OperationFactory.createPattern(
                DF.variable('human'),
                DF.namedNode('http://example.org/name'),
                DF.variable('human_name'),
              ),
            ]),
            OperationFactory.createPath(
              DF.variable('df_0'),
              OperationFactory.createAlt([
                OperationFactory.createLink(DF.namedNode('http://example.org/human')),
                OperationFactory.createLink(DF.namedNode('http://example.org/alien')),
              ]),
              DF.variable('human'),
            ),
          ]), [
            DF.variable('human_name'),
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
          OperationFactory.createJoin([
            OperationFactory.createBgp([
              OperationFactory.createPattern(
                DF.variable('human'),
                DF.namedNode('http://example.org/name'),
                DF.variable('human_name'),
              ),
            ]),
            OperationFactory.createPath(
              DF.variable('df_0'),
              OperationFactory.createAlt([
                OperationFactory.createAlt([
                  OperationFactory.createLink(DF.namedNode('http://example.org/human')),
                  OperationFactory.createLink(DF.namedNode('http://example.org/alien')),
                ]),
                OperationFactory.createLink(DF.namedNode('http://example.org/belgian')),
              ]),
              DF.variable('human'),
            ),
          ]), [
            DF.variable('human_name'),
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
