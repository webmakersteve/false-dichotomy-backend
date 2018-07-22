const fs = require('fs');
const glob = require('glob'); // eslint-disable-line import/no-extraneous-dependencies
const pathUtil = require('path');
const util = require('util');

const Elasticsearch = require('../lib/persistence/elasticsearch');

const ROOT_DIR = pathUtil.resolve(__dirname, '..');
const MIGRATION_DIR = pathUtil.resolve(ROOT_DIR, 'data', 'elasticsearch');

const globPromise = util.promisify(glob);

module.exports.putElasticTemplates = async function putTemplates(config, cb) {
  const esClient = new Elasticsearch(config.elasticsearch);

  try {
    const files = await globPromise(pathUtil.join(MIGRATION_DIR, '*.json'));

    files.forEach(async (file) => {
      const templateName = pathUtil.basename(file, '.json');

      await esClient.putTemplate(templateName, fs.readFileSync(file).toString());
    });

    return cb();
  } catch (e) {
    return cb(e);
  }
};
