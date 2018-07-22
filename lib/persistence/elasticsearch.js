const elasticsearch = require('elasticsearch');
// const logger = require('../../lib/logging/logger-factory').getLogger('elasticsearch');

class ElasticsearchDriver {
  constructor(config) {
    this.client = new elasticsearch.Client({
      host: config.hosts,
      log: [],
      apiVersion: '5.6',
    });
  }

  putTemplate(templateId, template) {
    return this.client.indices.putTemplate({
      name: templateId,
      body: template,
      create: false,
    });
  }

  ping() {
    return this.client.ping({
      requestTimeout: 1000,
    });
  }

  async searchPosts(search) {
    try {
      const results = await this.client.search({
        index: 'false-dichotomy-forums-*',
        type: 'post',
        q: search.q,
      });

      if (results.timed_out) {
        return Promise.reject(new Error(`Request to elasticsearch timed out. took ${results.took} ms`));
      }

      if (results._shards.failed > 0) {
        // some shards failed. Prolly ok.
      }

      if (results.hits.total < 1) {
        return Promise.resolve([]);
      }

      return Promise.resolve(results.hits.hits);
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

module.exports = ElasticsearchDriver;
