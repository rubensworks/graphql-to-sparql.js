# GraphQL to SPARQL

[![Build Status](https://travis-ci.org/rubensworks/graphql-to-sparql.js.svg?branch=master)](https://travis-ci.org/rubensworks/graphql-to-sparql.js)
[![Coverage Status](https://coveralls.io/repos/github/rubensworks/graphql-to-sparql.js/badge.svg?branch=master)](https://coveralls.io/github/rubensworks/graphql-to-sparql.js?branch=master)
[![npm version](https://badge.fury.io/js/graphql-to-sparql.svg)](https://www.npmjs.com/package/graphql-to-sparql) [![Greenkeeper badge](https://badges.greenkeeper.io/rubensworks/graphql-to-sparql.js.svg)](https://greenkeeper.io/)

A utility package that allows you to convert GraphQL queries to SPARQL or SPARQL algebra,
using a (simplied) [JSON-LD context](https://www.w3.org/TR/json-ld/#the-context).
Such queries are also known as GraphQL-LD queries.

Supported JSON-LD context features:
* Key-value mapping between shorthands and URIs.
* `@type`
* `@language`
* `@id`
* `@reverse`

## Install

```bash
$ npm install [-g] graphql-to-sparql
```

## Usage

The `graphql-to-sparql` converts GraphQL queries to SPARQL.

```bash
$ graphql-to-sparql '{ "hero": "http://example.org/hero", "name": "http://example.org/name" }' '{ hero { name } }'
$ graphql-to-sparql my-context.jsonld my-query.graphql
```

The programmatic API can be invoked as follows:
```javascript
const Converter = require('graphql-to-sparql').Converter;

const algebra = new Converter().graphqlToSparqlAlgebra('{ hero { name } }', {
  "hero": "http://example.org/hero",
  "name": "http://example.org/name",
  "friends": "http://example.org/friends"
});
```

The resulting object is [SPARQL algebra](https://github.com/joachimvh/SPARQLAlgebra.js).

## Examples

Below you can find a couple of examples of how this library converts GraphQL queries to SPARQL.
These examples are based on the [GraphQL documentation](http://graphql.org/learn/queries/).

### Simple nesting

GraphQL trees are converted to SPARQL graphs by chaining triple patterns.

Context:
```json
{
    "me": "http://example.org/me",
    "name": "http://example.org/name"
}
```

GraphQL:
```graphql
{
  me {
    name
  }
}
```

SPARQL:
```sparql
SELECT ?me_name WHERE {
  _:b1 <http://example.org/me> ?me.
  ?me <http://example.org/name> ?me_name.
}
```

### Fields

Nodes can be nested to any depth, and just produce more triple patterns.

Context:
```json
{
    "hero": "http://example.org/hero",
    "name": "http://example.org/name",
    "friends": "http://example.org/friends"
}
```

GraphQL:
```graphql
{
  hero {
    name
    # Queries can have comments!
    friends {
      name
    }
  }
}
```

SPARQL:
```sparql
SELECT ?hero_name ?hero_friends_name WHERE {
  _:b1 <http://example.org/hero> ?hero.
  ?hero <http://example.org/name> ?hero_name.
  ?hero <http://example.org/friends> ?hero_friends.
  ?hero_friends <http://example.org/name> ?hero_friends_name.
}
```

### Arguments

GraphQL allows arguments to be passed to nodes,
which are converted to triple objects in SPARQL.

Context:
```json
{
    "human": "http://example.org/human",
    "id": "http://example.org/id",
    "name": "http://example.org/name",
    "height": "http://example.org/height"
}
```

GraphQL:
```graphql
{
  human(id: "1000") {
    name
    height
  }
}
```

SPARQL:
```sparql
SELECT ?human_name ?human_height WHERE {
  _:b1 <http://example.org/human> ?human.
  ?human <http://example.org/id> "1000".
  ?human <http://example.org/name> ?human_name.
  ?human <http://example.org/height> ?human_height.
}
```

### Aliases

In some cases, you may have clashing variable names in your GraphQL query.
For these situations, _aliases_ can be used to make your rename variables.

Context:
```json
{
    "hero": "http://example.org/hero",
    "name": "http://example.org/name",
    "episode": "http://example.org/episode",
    "EMPIRE": "http://example.org/types/Empire",
    "JEDI": "http://example.org/types/Jedi"
}
```

GraphQL:
```graphql
{
  empireHero: hero(episode: EMPIRE) {
    name
  }
  jediHero: hero(episode: JEDI) {
    name
  }
}
```

SPARQL:
```sparql
SELECT ?empireHero_name ?jediHero_name WHERE {
  _:b1 <http://example.org/hero> ?empireHero.
  ?empireHero <http://example.org/episode> <http://example.org/types/Empire>.
  ?empireHero <http://example.org/name> ?empireHero_name.
  _:b1 <http://example.org/hero> ?jediHero.
  ?jediHero <http://example.org/episode> <http://example.org/types/Jedi>.
  ?jediHero <http://example.org/name> ?jediHero_name.
}
```


### Fragments

GraphQL fragments can be used to abstract certain parts of your query tree to reuse them in different places.
GraphQL always applies fragments on certain _types_, which are translated to RDF `http://www.w3.org/1999/02/22-rdf-syntax-ns#type` predicates.

Context:
```json
{
    "hero": "http://example.org/hero",
    "name": "http://example.org/name",
    "appearsIn": "http://example.org/appearsIn",
    "friends": "http://example.org/friends",
    "episode": "http://example.org/episode",
    "EMPIRE": "http://example.org/types/Empire",
    "JEDI": "http://example.org/types/Jedi"
}
```

GraphQL:
```graphql
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
```

SPARQL:
```sparql
SELECT ?leftComparison_name ?leftComparison_appearsIn ?leftComparison_friends_name ?rightComparison_name ?rightComparison_appearsIn ?rightComparison_friends_name WHERE {
  _:b1 <http://example.org/hero> ?leftComparison.
  ?leftComparison <http://example.org/episode> <http://example.org/types/Empire>.
  OPTIONAL {
    ?leftComparison <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> undefined:Character.
    ?leftComparison <http://example.org/name> ?leftComparison_name.
    ?leftComparison <http://example.org/appearsIn> ?leftComparison_appearsIn.
    ?leftComparison <http://example.org/friends> ?leftComparison_friends.
    ?leftComparison_friends <http://example.org/name> ?leftComparison_friends_name.
  }
  _:b1 <http://example.org/hero> ?rightComparison.
  ?rightComparison <http://example.org/episode> <http://example.org/types/Jedi>.
  OPTIONAL {
    ?rightComparison <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> undefined:Character.
    ?rightComparison <http://example.org/name> ?rightComparison_name.
    ?rightComparison <http://example.org/appearsIn> ?rightComparison_appearsIn.
    ?rightComparison <http://example.org/friends> ?rightComparison_friends.
    ?rightComparison_friends <http://example.org/name> ?rightComparison_friends_name.
  }
}
```

### Variables

_Defining variables is only supported via the programmatic API (`IVariablesDictionary`) at the time of writing._

Variables can be defined to make queries parameterizable,
so that the source query does not have to be changed for every single case.

Context:
```json
{
    "hero": "http://example.org/hero",
    "name": "http://example.org/name",
    "friends": "http://example.org/friends",
    "episode": "http://example.org/episode",
    "JEDI": "http://example.org/types/Jedi"
}
```

GraphQL:
```graphql
query HeroNameAndFriends($episode: Episode = "JEDI") {
  hero(episode: $episode) {
    name
    friends {
      name
    }
  }
}
```

SPARQL:
```sparql
SELECT ?hero_name ?hero_friends_name WHERE {
  _:b1 <http://example.org/hero> ?hero.
  ?hero <http://example.org/episode> <http://example.org/types/Jedi>.
  ?hero <http://example.org/name> ?hero_name.
  ?hero <http://example.org/friends> ?hero_friends.
  ?hero_friends <http://example.org/name> ?hero_friends_name.
}
```

### Directives

_Defining variables is only supported via the programmatic API (`IVariablesDictionary`) at the time of writing._

Based on the definition of variables, query behaviour can change using GraphQL _directives_,
such as `@include(if: Boolean)` and `@skip(if: Boolean)`.

Context:
```json
{
    "hero": "http://example.org/hero",
    "name": "http://example.org/name",
    "friends": "http://example.org/friends",
    "episode": "http://example.org/episode",
    "JEDI": "http://example.org/types/Jedi"
}
```

GraphQL:
```graphql
query Hero($episode: Episode, $withFriends: Boolean! = true) {
  hero(episode: $episode) {
    name
    friends @include(if: $withFriends) {
      name
    }
  }
}
```

SPARQL:
```sparql
SELECT ?hero_name ?hero_friends_name WHERE {
  _:b1 <http://example.org/hero> ?hero.
  ?hero <http://example.org/episode> <http://www.w3.org/1999/02/22-rdf-syntax-ns#nil>.
  ?hero <http://example.org/name> ?hero_name.
  ?hero <http://example.org/friends> ?hero_friends.
  ?hero_friends <http://example.org/name> ?hero_friends_name.
}
```

### Inline Fragments

Similar to regular fragments, inline fragments can be used to scope a block to a certain type.

Context:
```json
{
    "hero": "http://example.org/hero",
    "name": "http://example.org/name",
    "primaryFunction": "http://example.org/primaryFunction",
    "height": "http://example.org/height",
    "Droid": "http://example.org/types/Droid",
    "Human": "http://example.org/types/Human"
}
```

GraphQL:
```graphql
query HeroForEpisode {
  hero {
    name
    ... on Droid {
      primaryFunction
    }
    ... on Human {
      height
    }
  }
}
```

SPARQL:
```sparql
SELECT ?hero_name ?hero_primaryFunction ?hero_height WHERE {
  _:b1 <http://example.org/hero> ?hero.
  ?hero <http://example.org/name> ?hero_name.
  OPTIONAL {
    ?hero <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.org/types/Droid>.
    ?hero <http://example.org/primaryFunction> ?hero_primaryFunction.
  }
  OPTIONAL {
    ?hero <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.org/types/Human>.
    ?hero <http://example.org/height> ?hero_height.
  }
}
```

### Meta fields

Some meta fields, such as `__typename` can be used to bind to the type of a node.

Context:
```json
{
    "search": "http://example.org/search",
    "text": "http://example.org/text",
    "name": "http://example.org/name",
    "Droid": "http://example.org/types/Droid",
    "Human": "http://example.org/types/Human"
}
```

GraphQL:
```graphql
{
  search(text: "an") {
    __typename
    ... on Human {
      name
    }
    ... on Droid {
      name
    }
    ... on Starship {
      name
    }
  }
}
```

SPARQL:
```sparql
SELECT ?search___typename ?search_name ?search_name ?search_name WHERE {
  _:b1 <http://example.org/search> ?search.
  ?search <http://example.org/text> "an".
  ?search <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?search___typename.
  OPTIONAL {
    ?search <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.org/types/Human>.
    ?search <http://example.org/name> ?search_name.
  }
  OPTIONAL {
    ?search <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.org/types/Droid>.
    ?search <http://example.org/name> ?search_name.
  }
  OPTIONAL {
    ?search <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> undefined:Starship.
    ?search <http://example.org/name> ?search_name.
  }
}
```

### Pagination

The magical arguments `first` and `offset` can be used to respectively set the _limit_ and _offset_ of query results.
Furthermore, the magical `totalCount` field will bind to the total number of matches, irrespective of the `first` and `offset` fields.

Context:
```json
{
    "hero": "http://example.org/hero",
    "name": "http://example.org/name",
    "friends": "http://example.org/friends"
}
```

GraphQL:
```graphql
{
  hero {
    name
    friends(first:2 offset:10) {
      totalCount
      name
    }
  }
}
```

SPARQL:
```sparql
SELECT ?hero_name ?hero_friends_name ?hero_friends_totalCount WHERE {
  _:b1 <http://example.org/hero> ?hero.
  ?hero <http://example.org/name> ?hero_name.
  {
    SELECT * WHERE {
      {
        SELECT * WHERE {
          ?hero <http://example.org/friends> ?hero_friends.
          ?hero_friends <http://example.org/name> ?hero_friends_name.
        }
      }
      { SELECT (COUNT(?hero_friends) AS ?hero_friends_totalCount) WHERE { ?hero <http://example.org/friends> ?hero_friends. } }
    }
    OFFSET 10
    LIMIT 2
  }
}
```

### Selecting by value

While this is not a default feature of GraphQL,
this library allows you to select by certain values of properties.
This is done using the `_` argument, which takes a value.

GraphQL:
```graphql
{
  name(_:'Han Solo')
  description
}
```

## License
This software is written by [Ruben Taelman](http://rubensworks.net/).

This code is released under the [MIT license](http://opensource.org/licenses/MIT).
