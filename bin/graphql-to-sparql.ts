#!/usr/bin/env node

import * as fs from 'fs';
import minimist = require('minimist');
import {toSparql} from "sparqlalgebrajs";
import {Converter} from "../lib/Converter";

const args = minimist(process.argv.slice(2));
if (args._.length !== 2 || args.h || args.help) {
  process.stderr.write(
    'usage: graphql-to-sparql [--help] context query\n' +
    '  query should be a JSON object, e.g.\n' +
    '      { hero { name } }\n' +
    '    or the path to such a query\n' +
    '  context should be a GraphQL query, e.g.\n' +
    '      { "sources": [{ "type": "hypermedia", "value" : "http://fragments.dbpedia.org/2015/en" }]}\n' +
    '    or the path to such a JSON file\n',
  );
  process.exit(1);
}

// allow both files as direct JSON objects for context
const context = JSON.parse(fs.existsSync(args._[0]) ? fs.readFileSync(args._[0], 'utf8') : args._[0]);
const query = fs.existsSync(args._[1]) ? fs.readFileSync(args._[1], 'utf8') : args._[1];

process.stdout.write(toSparql(new Converter().graphqlToSparqlAlgebra(query, context)) + '\n');
