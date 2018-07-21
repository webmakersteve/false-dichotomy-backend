const pg = require('pg');
// const PostgresClient = pg.Client;
const PostgresPool = pg.Pool;

const logger = require('../logging/logger-factory').getLogger('postgres');

class PostgresDriver {
  constructor(config) {
    this.pool = new PostgresPool(config);

    this.pool.on('error', (err, client) => {
      logger.error(err, `Unexpected error on idle client: ${err.message}`);
    });
  }

  query(query, ...args) {
    return new Promise((resolve, reject) => {
      this.pool.connect((err, client, done) => {
        if (err) {
          reject(err);
          return;
        }

        client.query(query, args)
          .then(result => {
            done();
            resolve(result);
          })
          .catch(err => {
            done();
            reject(err);
          });
      });
    });
  }
}

module.exports = PostgresDriver;
