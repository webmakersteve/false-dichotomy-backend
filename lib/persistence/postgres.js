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

  /**
   * Generic query. Probably used inside other methods, but exposed as well.
   * Utilizes pooling for connections
   *
   * @param  {string}    query The SQL query
   * @param  {...[any]}  args  The args to be passed into the query for
   *                           replacement
   * @return {Promise}         Promise that resolves with the result.
   */
  async query(query, ...args) {
    const client = await this.getClientFromPool();
    try {
      return await client.query(query, args);
    } catch (err) {
      throw new Error(`Error executing database query: ${err.message}`);
    } finally {
      client.release();
    }
  }

  getClientFromPool() {
    return this.pool.connect();
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

  /**
   * Get all the boards.
   *
   * @return {array} Array of boards
   */
  async getBoards() {
    const sql = 'SELECT boards.*, '
    + 'topics.name as most_recent_topic_name, '
    + 'topics.slug AS most_recent_topic_slug, '
    + 'topics.created_at AS most_recent_topic_date, '
    + 'topics.id AS most_recent_topic_id '
    + 'FROM boards '
    + 'LEFT OUTER JOIN topics ON (boards.id = topics.board) '
    + 'AND topics.id = ('
    + 'SELECT id FROM topics WHERE boards.id = topics.board ORDER BY created_at DESC'
    + ')';

    const result = await this.query(sql);

    return result && result.rows ? result.rows : [];
  }

  async createBoard({
    name,
    slug,
    createdBy,
  }) {
    const sql = 'INSERT INTO boards(name, slug, created_by) '
    + 'VALUES ($1, $2, $3) '
    + 'RETURNING *';

    const result = await this.query(sql, name, slug, createdBy);

    return result && result.rows ? result.rows[0] : null;
  }
}

module.exports = PostgresDriver;
