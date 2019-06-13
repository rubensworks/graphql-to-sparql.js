# GraphQL to SPARQL

[![Build Status](https://travis-ci.org/rubensworks/graphql-to-sparql.js.svg?branch=master)](https://travis-ci.org/rubensworks/graphql-to-sparql.js)
[![Coverage Status](https://coveralls.io/repos/github/rubensworks/graphql-to-sparql.js/badge.svg?branch=master)](https://coveralls.io/github/rubensworks/graphql-to-sparql.js?branch=master)
[![npm version](https://badge.fury.io/js/graphql-to-sparql.svg)](https://www.npmjs.com/package/graphql-to-sparql) [![Greenkeeper badge](https://badges.greenkeeper.io/rubensworks/graphql-to-sparql.js.svg)](https://greenkeeper.io/)

A utility package that allows you to convert GraphQL queries to SPARQL or SPARQL algebra,
using a [JSON-LD context](https://www.w3.org/TR/json-ld/#the-context).
Such queries are also known as GraphQL-LD queries.

Supported JSON-LD context features:
* Key-value mapping between shorthands and URIs.
* `@type`: Sets the RDF datatype.
* `@language`: Sets the RDF language.
* `@id`: Identifies the IRI of a term.
* `@reverse` Reverses the direction of a property.

_Looking for [GraphQL-LD](https://github.com/rubensworks/GraphQL-LD.js)?_

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

const algebra = await new Converter().graphqlToSparqlAlgebra('{ hero { name } }', {
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

### Defining or looking up the id of entities

Using `id` fields, the id (or _subject_) of entities can be queried or defined.

Context:
```json
{
    "hero": "http://example.org/hero",
    "HAN_SOLO": "http://example.org/HanSolo",
    "name": "http://example.org/name",
    "friend": "http://example.org/friend"
}
```

#### Getting an id

GraphQL:
```graphql
{
  hero {
    id
    name
  }
}
```

SPARQL:
```sparql
SELECT ?hero_name ?hero_id WHERE {
  _:b1 <http://example.org/hero> ?hero_id.
  ?hero_id <http://example.org/name> ?hero_name.
}
```

#### Setting a block-scoped id

GraphQL:
```graphql
{
  hero(_:HAN_SOLO) {
    name
  }
}
```

SPARQL:
```sparql
SELECT ?hero_name WHERE {
  _:b1 <http://example.org/hero> <http://example.org/HanSolo>.
  <http://example.org/HanSolo> <http://example.org/name> ?hero_name.
}
```

#### Setting an inline id

GraphQL:
```graphql
{
  friend(_:HAN_SOLO)
  name
}
```

SPARQL:
```sparql
SELECT ?name WHERE {
  ?b1 <http://example.org/friend> <http://example.org/HanSolo>;
    <http://example.org/name> ?name.
}
```

### Defining or looking up the graph

Using `graph` fields, the _named graph_ can be queried or defined.

When `graph` is used as a field,
this will have as side-effect that fields inside the node can be selected from _any_ graph,
instead of only the _default graph_.

Context:
```json
{
    "hero": "http://example.org/hero",
    "EMPIRE": "http://example.org/EMPIRE",
    "name": "http://example.org/name",
    "friend": "http://example.org/friend"
}
```

#### Getting a graph

GraphQL:
```graphql
{
  hero {
    graph
    name
  }
}
```

SPARQL:
```sparql
SELECT ?hero_name ?hero_id WHERE {
  _:b1 <http://example.org/hero> ?hero.
  GRAPH ?graph {
    ?hero <http://example.org/name> ?hero_name.
  }
}
```

#### Setting a block-scoped graph (1)

GraphQL:
```graphql
{
  hero {
    graph(_:EMPIRE)
    name
    friend
  }
}
```

SPARQL:
```sparql
SELECT ?hero_name WHERE {
  _:b1 <http://example.org/hero> ?hero.
  GRAPH <http://example.org/EMPIRE> {
    ?hero <http://example.org/name> ?hero_name;
          <http://example.org/friend> ?hero_friend.
  }
}
```

#### Setting a block-scoped graph (2)

GraphQL:
```graphql
{
  hero(graph:EMPIRE) {
    name
    friend
  }
}
```

SPARQL:
```sparql
SELECT ?hero_name WHERE {
  GRAPH <http://example.org/EMPIRE> {
    _:b1 <http://example.org/hero> ?hero.
    ?hero <http://example.org/name> ?hero_name.
          <http://example.org/friend> ?hero_friend.
  }
}
```

#### Setting an inline graph

GraphQL:
```graphql
{
  friend(graph:EMPIRE)
  name
}
```

SPARQL:
```sparql
SELECT ?name WHERE {
  GRAPH <http://example.org/EMPIRE> {
    ?b1 <http://example.org/friend> ?friend;
  }
  ?b1 <http://example.org/name> ?name.
}
```

### Optional fields

By default, all fields that are defined in the query are _required_ to have results.
If any of the fields do not produce results, the full query results set will be empty.

However, in some cases you may not be certain that a field will have results.
In those cases, you may want to mark a field as _optional_, using the `@optional` directive.

Context:
```json
{
    "hero": "http://example.org/hero",
    "name": "http://example.org/name",
    "friend": "http://example.org/friend"
}

```

GraphQL:
```graphql
query {
  hero {
    name @optional
    friend @optional
  }
}

```

SPARQL:
```sparql
SELECT ?hero_name ?hero_friend WHERE {
  ?b1 <http://example.org/hero> ?hero.
  OPTIONAL { ?hero <http://example.org/name> ?hero_name. }
  OPTIONAL { ?hero <http://example.org/friend> ?hero_friend. }
}
```

### Reversed fields

If you want to reverse the relationship between
a parent a child node,
you can use the `@reverse` context option for a field.

Context:
```json
{
    "hero": "http://example.org/hero",
    "name": "http://example.org/name",
    "friend": { "@reverse": "http://example.org/friend" }
}
```

GraphQL:
```graphql
query {
  hero {
    friend {
      name
    }
  }
}
```

SPARQL:
```sparql
SELECT ?hero_friend_name WHERE {
  ?b1 <http://example.org/hero> ?hero.
  ?hero_friend <http://example.org/friend> ?hero;
    <http://example.org/name> ?hero_friend_name.
}
```

### Alternative fields

If multiple fields are applicable for retrieving a value,
then you can define all of them via the `alt` argument.

Context:
```json
{
    "hero": "http://example.org/hero",
    "name": "http://example.org/name",
    "firstName": "http://example.org/firstName"
}
```

GraphQL:
```graphql
{
  hero {
    name(alt: firstName)
  }
}
```

_If you want to define more than one alternative, you can define them in a list like this: `name(alt: [firstName, nickName])`_

SPARQL:
```sparql
SELECT ?hero_name WHERE {
  ?b1 <http://example.org/hero> ?hero.
  ?hero (<http://example.org/name>|<http://example.org/firstName>) ?hero_name.
}
```

## Converting to tree-based results

Using a tool such as [SPARQL-Results+JSON to tree](https://github.com/rubensworks/sparqljson-to-tree.js),
results from converted queries can be compacted.
By default, all values will be considered _plural_, and values will always be emitted in an array.
With the `singularizeVariables` option, you can specify which values should be _singularized_ and not wrapped in an array anymore.

To simplify this process, graphql-to-sparql allows `@single` or `@plural` directives to be added inside the queries to indicate which fields should be singularized and which ones should remain plural.
If no directive is present, everything will remain plural.
For this, graphql-to-sparql allows an `singularizeVariables` object to be passed via options,
which can then be used by other tools for compaction.

For example:
```
import {Converter as TreeConverter} from "sparqljson-to-tree";

const singularizeVariables = {};
const algebra = await new Converter().graphqlToSparqlAlgebra('{ hero { name } }', {
  "hero": "http://example.org/hero",
  "name": "http://example.org/name",
  "friends": "http://example.org/friends"
}, { singularizeVariables });

const response =  { ... }; // Passed to some query engine like Comunica

const jsonResult = new TreeConverter().sparqlJsonResultsToTree(response, { singularizeVariables });
```

Available directives:

| Directive | Meaning |
| --------- | ------- |
| `@single` | This field will be singular. |
| `@plural` | This field will be plural. |
| `@single(scope: all)` | This field and all child fields will be singular. |
| `@plural(scope: all)` | This field and all child fields will be plural. |

By default, all fields all plural. So there is an implicit `@plural(scope: all)` directive on the query root.

### Singularization examples

#### Singularizing a field

Query:
```graphql
{
  hero {
    name @single
  }
}
```
Example output:
```json
[
  {
    "hero": [
      {
        "name": "Alice"
      },
      {
        "name": "Bob"
      }
    ]
  }
]
```

#### Singularizing everything

Query:
```graphql
query @single(scope: all) {
  hero {
    name
  }
}
```
Example output:
```json
{
  "hero": {
    "name": "Alice"
  }
}
```

#### Singularizing everything except for a single field

Query:
```graphql
query @single(scope: all) {
  hero @plural {
    name
  }
}
```
Example output:
```json
{
  "hero": [
    {
      "name": "Alice"
    }
  ]
}
```


## License
This software is written by [Ruben Taelman](http://rubensworks.net/).

This code is released under the [MIT license](http://opensource.org/licenses/MIT).
