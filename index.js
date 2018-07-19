#!/usr/bin/env node
const pjs = require('./package.json');
const { createServer } = require('./lib/server');

/**
 * Module dependencies.
 */

const program = require('commander');

function increaseVerbosity(v, total) {
  return total + 1;
}

program
  .version(pjs.version)
  .usage('[options] <config>')
  .option('--port <n>', 'Port on which the server should listen', parseInt, 8080)
  .option('-v, --verbose', 'Increase the logging verbosity', increaseVerbosity, 10)
  .parse(process.argv);

const config = {
  version: program.version(),
  http: {
    port: program.port,
  },
  logging: {
    verbosity: program.verbose,
  },
}

const server = createServer(config.http);

// Listen on the server
server.listen();
