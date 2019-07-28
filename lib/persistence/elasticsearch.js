const elasticsearch = require('elasticsearch');
// const logger = require('../../lib/logging/logger-factory').getLogger('elasticsearch');

class ElasticsearchDriver {
  constructor(config) {
    this.client = new elasticsearch.Client({
      host: config.hosts,
      log: [],
      apiVersion: '6.8',
    });
    this.index = config.index || 'false-dichotomy-forums-*';
    this.pageSize = config.page || 100;
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
    const {
      q,
      from,
      to,
      by,
      topic,
      page,
    } = search;

    const body = {
      query: {
        bool: {
          must: [{
            match: {
              content: q,
            },
          }],
        },
      },
    };

    if (from || to) {
      body.query.bool.must.push({
        range: {
          created: {
            gte: from,
            lte: to,
          },
        },
      });
    }

    if (by) {
      body.query.bool.must.push({
        match: {
          author: by,
        },
      });
    }

    if (topic) {
      body.query.bool.must.push({
        term: {
          topic,
        },
      });
    }

    const fromPage = page ? page * this.pageSize : 0;

    try {
      const results = await this.client.search({
        index: this.index,
        type: 'post',
        body,
        sort: [
          '_score',
        ],
        from: fromPage,
        size: this.pageSize,
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
