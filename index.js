#!/usr/bin/env node
const pjs = require('./package.json');
const { createServer } = require('./lib/server');
const { loadConfig } = require('./lib/config/loader');
const Elasticsearch = require('./lib/persistence/elasticsearch');

/**
 * Module dependencies.
 */

const program = require('commander');

const VERBOSITY_TABLE = [
  'info',
  'debug',
  'trace'
]

function convertVerbosity(verbosity) {
  verbosity = verbosity || 0;
  if (verbosity >= VERBOSITY_TABLE.length) {
    return VERBOSITY_TABLE[VERBOSITY_TABLE.length - 1];
  } else if (!verbosity) {
    return VERBOSITY_TABLE[0];
  } else {
    return VERBOSITY_TABLE[verbosity];
  }
}

function increaseVerbosity(v, total) {
  return total + 1;
}

program
  .version(pjs.version)
  .usage('[options] <config>')
  .option('--port <n>', 'Port on which the server should listen', parseInt, 8080)
  .option('-v, --verbose', 'Increase the logging verbosity', increaseVerbosity, 0)
  .parse(process.argv);

const config = loadConfig({
  version: program.version(),
  environment: process.env.NODE_ENV || 'development',
  http: {
    port: program.port,
  },
  logging: {
    verbosity: convertVerbosity(program.verbose),
  },
}, program.args[0]);

// Initialize backends now
const elasticsearch = new Elasticsearch(config.elasticsearch);

const server = createServer(config.http, {
  elasticsearch,
});

// Listen on the server
server.listen();
