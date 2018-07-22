const pg = require('pg');
// const PostgresClient = pg.Client;
const PostgresPool = pg.Pool;

const logger = require('../logging/logger-factory').getLogger('postgres');

class PostgresDriver {
  constructor(config) {
    this.pool = new PostgresPool(config);

    this.pool.on('error', (err) => {
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
          .then((result) => {
            done();
            resolve(result);
          })
          .catch((queryErr) => {
            done();
            reject(new Error(`Error executing database query: ${queryErr.message}`));
          });
      });
    });
  }

  /**
   * Get all users from the postgres database.
   *
   * @return {array} Array of users
   */
  async getUsers() {
    const sql = 'SELECT * FROM users';
    const result = await this.query(sql);

    return result && result.rows ? result.rows : [];
  }

  async updateUser({
    battletag,
    firstName,
    lastName,
    mainCharacter,
  }) {
    const sql = 'UPDATE users SET '
    + 'first_name = $2, '
    + 'last_name = $3, '
    + 'main_character = $4 '
    + 'WHERE battletag = $1 '
    + 'RETURNING *';

    const result = await this.query(sql, battletag, firstName, lastName, mainCharacter);

    // We need to return the user object here probably.
    return result && result.rows ? result.rows[0] : null;
  }

  async createUser({
    id,
    battletag,
    accessToken,
    accessTokenExpires,
  }) {
    const sql = 'INSERT INTO '
      + 'users(bnet_account_id, battletag, access_token, access_token_expires) '
      + 'VALUES ($1, $2, $3, $4) '
      + 'ON CONFLICT(bnet_account_id) DO UPDATE '
      + 'SET battletag = $2, access_token = $3, access_token_expires = $4 '
      + 'RETURNING *';

    const result = await this.query(sql, id, battletag, accessToken, accessTokenExpires);

    // We need to return the user object here probably.
    return result && result.rows ? result.rows[0] : null;
  }

  /**
   * Check whether a table exists.
   *
   * @param  {string} The table to check existance on
   * @return {boolean} True if it exists, false otherwise
   */
  async tableExists(table) {
    const sql = 'SELECT EXISTS ('
    + 'SELECT table_name '
    + 'FROM   information_schema.tables '
    + 'WHERE  table_name = $1'
    + ');';
    const result = await this.query(sql, table);
    return result.rows && result.rows[0].exists;
  }
}

module.exports = PostgresDriver;
