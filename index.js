#!/usr/bin/env node
const program = require('commander');

const pjs = require('./package.json');
const { loadConfig } = require('./lib/config/loader');
const loggerFactory = require('./lib/logging/logger-factory');

const VERBOSITY_TABLE = [
  'info',
  'debug',
  'trace',
];

function convertVerbosity(verbosity) {
  const v = verbosity || 0;
  if (v >= VERBOSITY_TABLE.length) {
    return VERBOSITY_TABLE[VERBOSITY_TABLE.length - 1];
  }

  if (!v) {
    return VERBOSITY_TABLE[0];
  }

  return VERBOSITY_TABLE[v];
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
    level: convertVerbosity(program.verbose),
  },
}, program.args[0]);

// Configure the root logger
const logger = loggerFactory.configureRootLogger(config.logging);

// At this point we can require files that bring a logger in...
// Can avoid this if we rely on instantiation to set the logger up
// the first time inside those classes
// Not sure what the correct trade-off is.
const Elasticsearch = require('./lib/persistence/elasticsearch');
const BnetClient = require('./lib/services/bnet');
const prom = require('./lib/services/metrics');
const PostgresClient = require('./lib/persistence/postgres');
const { createServer } = require('./lib/server');
const { handleWebsockets, bindHandlers } = require('./lib/websocket');

// Initialize backends now
const elasticsearch = new Elasticsearch(config.elasticsearch);
const postgres = new PostgresClient(config.postgres);
const bnet = new BnetClient(config.bnet);

const services = {
  elasticsearch,
  bnet,
  postgres,
  prom,
};


const server = createServer(config, services);
handleWebsockets(config, server, services, (sock) => {
  logger.info({ connectedUser: sock.name }, `User is connected: ${sock.name}`);

  bindHandlers(config, sock);
});

logger.info(config.http, `Server is listening on port ${config.http.port}`);

// Listen on the server
server.listen();
