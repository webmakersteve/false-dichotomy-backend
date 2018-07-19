const elasticsearch = require('elasticsearch');
const util = require('util');

class ElasticsearchDriver {
  constructor(config) {

    this.client = elasticsearch.Client({
      host: 'localhost:9200',
      log: 'info'
    });

  }

  async ping() {
    return this.client.ping({
      requestTimeout: 1000
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
