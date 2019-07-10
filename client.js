#!/usr/bin/env node
const program = require('commander');
const fs = require('fs');
const { isAbsolute, resolve } = require('path');

const pjs = require('./package.json');
const { loadConfig } = require('./lib/config/loader');
const loggerFactory = require('./lib/logging/logger-factory');
const BackendClient = require('./client/index');

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

function loadToken(v) {
  // Need to manufacture the path
  let filePath;
  if (isAbsolute(v)) {
    filePath = v;
  } else {
    filePath = resolve(__dirname, v);
  }
  const buf = fs.readFileSync(filePath);
  return buf.toString().trim();
}

program
  .version(pjs.version)
  .usage('[options] <config>')
  .option('-v, --verbose', 'Increase the logging verbosity', increaseVerbosity, 0)
  .option('-t, --jwt <file>', 'Location on the filesystem of the JSON web token', loadToken, null)
  .parse(process.argv);

const config = loadConfig({
  version: program.version(),
  environment: process.env.NODE_ENV || 'development',
  logging: {
    level: convertVerbosity(program.verbose),
  },
  client: {
    jwt: program.jwt,
  },
}, program.args[0]);

// Configure the root logger
const logger = loggerFactory.configureRootLogger(config.logging);

const client = new BackendClient({
  ...config.client,
  logger,
  http: config.http,
});

(async () => {
  await BackendClient.preloadQueries();
  const body = await client.getBoards();
})();
