const bunyan = require('bunyan');

const loggers = {};

const LOGGER_DEFAULTS = {
  name: 'false-dichotomy',
  level: 'info',
}

let rootLogger = bunyan.createLogger(LOGGER_DEFAULTS);

module.exports.configureRootLogger = function(options) {
  rootLogger = bunyan.createLogger({
    ...LOGGER_DEFAULTS,
    ...options,
  });
}

module.exports.getLogger = function getLogger(name) {
  if (!name) {
    return rootLogger;
  }

  if (loggers.hasOwnProperty(name)) {
    return loggers[name];
  }

  const logger = rootLogger.child({
    component: name,
  });

  loggers[name] = logger;

  return logger;
};
