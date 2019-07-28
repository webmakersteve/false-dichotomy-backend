const request = require('request');
const queryLoader = require('query-loader');

let QUERIES;

class BackendClient {
  constructor({
    logger,
    jwt,
    http,
  }) {
    this.logger = logger;
    this.jwt = jwt;

    // There are circumstances where we want to use a local client instead of the FQDN client.
    // Need to make it configurable in the future, or perhaps you should just appropriately
    // configure FQDN!

    this.client = request.defaults({
      baseUrl: `http://${http.host}:${http.port}/api`,
      headers: {
        authorization: `Bearer ${jwt}`,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      json: true,
    });
  }

  getBoards() {
    return new Promise((resolve, reject) => {
      this.client.post({
        url: '/graphql',
        body: {
          query: ,
        },
      }, (err, response, body) => {
        if (err) {
          reject(err);
          return;
        }

        if (body.status === 'nok') {
          reject(new Error(body.errors.join('; ')));
          return;
        }

        resolve(body.data.getBoards);
      });
    });
  }
}

BackendClient.preloadQueries = async function preloadQueries() {
  if (!QUERIES) {
    QUERIES = await queryLoader('./queries');
  }
}

module.exports = BackendClient;
