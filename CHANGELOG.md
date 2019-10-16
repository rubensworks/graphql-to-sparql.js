# Changelog
All notable changes to this project will be documented in this file.

<a name="v2.0.2"></a>
## [v2.0.2](https://github.com/rubensworks/graphql-to-sparql.js/compare/v2.0.1...v2.0.2) - 2019-10-16

### Changed
* [Update sparqlalgebrajs to version 2.0.0](https://github.com/rubensworks/graphql-to-sparql.js/commit/e0241a7d430dfd83586c5db1fc86dc3bb5cc1b1b)

<a name="v2.0.1"></a>
## [v2.0.1](https://github.com/rubensworks/graphql-to-sparql.js/compare/v2.0.0...v2.0.1) - 2019-09-10

### Fixed
* [Fix `@optional` not working, Closes rubensworks/GraphQL-LD.js#6](https://github.com/rubensworks/graphql-to-sparql.js/commit/3f5ec07d272644143b6cddf739c69ef3dc09c8fd)
* [Fix empty results when using first and limit args](https://github.com/rubensworks/graphql-to-sparql.js/commit/c8696def4389d879965b49b01fcf90ba0373e49e)

<a name="v2.0.0"></a>
## [v2.0.0](https://github.com/rubensworks/graphql-to-sparql.js/compare/v1.5.0...v2.0.0) - 2019-06-13

### Fixed
* [Fix and document @reverse fields, Closes #22](https://github.com/rubensworks/graphql-to-sparql.js/commit/8cdb439f844172753c739a119ea7873df2cd98d3)

### Added
* [Allow conversion of pre-parsed GraphQL queries, Closes #29](https://github.com/rubensworks/graphql-to-sparql.js/commit/15d8628cafb7ec8b3fbe729346d5fb800862702c)
* [Allow complex JSON-LD contexts to be used](https://github.com/rubensworks/graphql-to-sparql.js/commit/c41462a490940594096b507f9604b1bba955e209)
* [Allow alternative fields to be defined](https://github.com/rubensworks/graphql-to-sparql.js/commit/5f0e939cfa0e6946d9d83f1278596c53d2958cfd)
* [Add @optional directive that produces left joins, Closes #21](https://github.com/rubensworks/graphql-to-sparql.js/commit/10019a0010c3715fe4a3adc065485150c64083d2)
* [Construct singularizeVariables via @single and @plural](https://github.com/rubensworks/graphql-to-sparql.js/commit/03693ee88a5d529cab8d3d151c3ae164f9a6bd9f)
* [Allow getting and setting of graph](https://github.com/rubensworks/graphql-to-sparql.js/commit/57c094eb8185024ecbb115acb01390d2a5d7fc7d)
* [Allow getting and setting of subject, Closes #15](https://github.com/rubensworks/graphql-to-sparql.js/commit/c05c80a20c744dea03b2df0b6db95f23914aca85)

### Changed
* [Make undefined variables emit a SPARQL variable](https://github.com/rubensworks/graphql-to-sparql.js/commit/ed1f6b6b613c91374bda9a367646598895d8e71c)
* [Split up logic over separate handlers](https://github.com/rubensworks/graphql-to-sparql.js/commit/714484d8d638f3df439a379782a51d30b71d34f9)
* [Pass subject in context and ignore unknown directives](https://github.com/rubensworks/graphql-to-sparql.js/commit/9ae2d641ded939788150dc43ddce0b289fff9df6)
* [Make GraphQL import more specific, Closes #27](https://github.com/rubensworks/graphql-to-sparql.js/commit/997cca7212c868874690e63cf86a5fb7aa5ebf6f)

<a name="v1.5.0"></a>
## [v1.5.0](https://github.com/rubensworks/graphql-to-sparql.js/compare/v1.4.1...v1.5.0) - 2019-01-24

### Changed
* [Convert blank nodes to variables, #19](https://github.com/rubensworks/graphql-to-sparql.js/commit/d5fbe9bb63eb8566cf105f32949101f6d64fbdfc)

<a name="v1.4.1"></a>
## [v1.4.1](https://github.com/rubensworks/graphql-to-sparql.js/compare/v1.4.0...v1.4.1) - 2018-11-09

### Changed
* [Update to SPARQL Algebra 1.3.1](https://github.com/rubensworks/graphql-to-sparql.js/commit/da9f82d7abbf81f84106234d36c38657676f1894)

<a name="v1.4.0"></a>
## [v1.4.0](https://github.com/rubensworks/graphql-to-sparql.js/compare/v1.3.1...v1.4.0) - 2018-11-08

### Changed
* [Update to generic RDFJS typings](https://github.com/rubensworks/graphql-to-sparql.js/commit/95213c794afdcb20a97d9a5a1bc20b4f7570d9e3)

<a name="v1.3.2"></a>
## [v1.3.2](https://github.com/rubensworks/graphql-to-sparql.js/compare/v1.3.1...v1.3.2) - 2018-11-08

### Fixed
* [Remove tslib dependency](https://github.com/rubensworks/graphql-to-sparql.js/commit/7133254886a3c04c6c33afbc2848deca3652c8c1)
