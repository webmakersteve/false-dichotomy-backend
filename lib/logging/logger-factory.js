const bunyan = require('bunyan');

const loggers = {};

const LOGGER_DEFAULTS = {
  name: 'false-dichotomy',
  level: 'info',
};

let rootLogger = bunyan.createLogger(LOGGER_DEFAULTS);

module.exports.configureRootLogger = function getRootLogger(options) {
  rootLogger = bunyan.createLogger({
    ...LOGGER_DEFAULTS,
    ...options,
  });

  return rootLogger;
};

module.exports.getLogger = function getLogger(name) {
  if (!name) {
    return rootLogger;
  }

  if (Object.prototype.hasOwnProperty.call(loggers, name)) {
    return loggers[name];
  }

  const logger = rootLogger.child({
    component: name,
  });

  loggers[name] = logger;

  return logger;
};
