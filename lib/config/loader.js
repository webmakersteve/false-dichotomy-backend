const fs = require('fs');
const pathUtil = require('path');
const yaml = require('js-yaml');
const merge = require('deepmerge');

const CONFIG_DIR = pathUtil.resolve(pathUtil.join(__dirname, '..', '..', 'config'));

const DEFAULTS = pathUtil.join(CONFIG_DIR, 'defaults.yml');
const LOCAL = pathUtil.join(CONFIG_DIR, 'local.yml');
const GLOBAL_CONFIG = '/etc/falsedichotomy/config.yaml';

function loadFileYaml(path, baseConfig) {
  const buf = fs.readFileSync(path, 'utf8');
  const parsed = yaml.safeLoad(buf);

  return baseConfig ? merge(baseConfig, parsed) : parsed;
}

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
module.exports.loadConfig = function(args, configFile) {
  let resultConfig = loadFileYaml(DEFAULTS, {});

  if (configFile) {
    // Load this one and do make a fuss if it does not exist. Need to normalize the path first
    if (!pathUtil.isAbsolute(configFile)) {
      configFile = pathUtil.resolve(__dirname, configFile);
    }

    try {
      resultConfig = loadFileYaml(configFile, resultConfig);
    } catch (e) {
      if (e.code === 'ENOENT') {
        throw new Error(`Could not find file at path: ${configFile}`);
      }
      throw e;
    }
  } else {
    // Try to load this one but don't make a big fuss if it does not exist
    try {
      resultConfig = loadFileYaml(GLOBAL_CONFIG, resultConfig);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }
  }

  // There may be a local properties to merge in too
  try {
    resultConfig = loadFileYaml(LOCAL, resultConfig);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }

  return merge(resultConfig, args);;
}
