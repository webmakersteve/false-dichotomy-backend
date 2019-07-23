const pathUtil = require('path');
const nconf = require('nconf');
const nconfYaml = require('nconf-yaml');

const CONFIG_DIR = pathUtil.resolve(pathUtil.join(__dirname, '..', '..', 'config'));
const DEFAULTS = pathUtil.join(process.cwd(), 'config', 'defaults.yml');
const LOCAL = pathUtil.join(CONFIG_DIR, 'local.yml');
const GLOBAL_CONFIG = '/etc/falsedichotomy/config.yaml';

nconf.formats.yaml = nconfYaml;

/**
 * Load the config from arguments and a config file.
 *
 * Arguments are the last level of override so they override everything.
 *
 * The config file, if provided, must exist or this method will throw. Additionally,
 * if the config file is not provided, this function will try to load the config at
 * the global path.
 *
 * @param  {object} The arguments, provided as a map (object).
 * @param  {string} The filename to load as the primary config file.
 * @return {object} Config object that is created from various configuration sources.
 */
module.exports.loadConfig = function loadConfig(args, providedConfig) {
  nconf
    .file('defaults', { file: DEFAULTS, format: nconf.formats.yaml });

  if (providedConfig) {
    // Load this one and do make a fuss if it does not exist. Need to normalize the path first
    let configFile;
    if (!pathUtil.isAbsolute(configFile)) {
      configFile = pathUtil.resolve(__dirname, providedConfig);
    } else {
      configFile = providedConfig;
    }

    try {
      nconf.file('explicit', { file: configFile, format: nconf.formats.yaml });
    } catch (e) {
      if (e.code === 'ENOENT') {
        throw new Error(`Could not find file at path: ${configFile}`);
      }
      throw e;
    }
  } else {
    // Try to load this one but don't make a big fuss if it does not exist
    try {
      nconf.file('explicit', { file: GLOBAL_CONFIG, format: nconf.formats.yaml });
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }
  }

  // There may be a local properties to merge in too
  try {
    nconf.file('hidden', { file: LOCAL, format: nconf.formats.yaml });
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }

  nconf.env({
    separator: '__',
    match: /^n2s_/i,
    lowerCase: true,
    parseValues: true,
  }).argv();

  nconf.overrides(args);

  return nconf.get();
};
