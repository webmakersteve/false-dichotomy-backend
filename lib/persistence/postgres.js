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
    const sql = 'SELECT b.*, '
    + 'posts.created_at as most_recent_post_date, '
    + 'users.battletag AS most_recent_post_author, '
    + 'topics.name AS most_recent_topic_name, '
    + 'topics.slug AS most_recent_topics_slug '
    + 'FROM boards b '
    + 'LEFT OUTER JOIN posts ON b.id = posts.board AND posts.id = ('
    + 'SELECT id FROM posts WHERE b.id = posts.board ORDER BY created_at DESC LIMIT 1'
    + ') '
    + 'LEFT OUTER JOIN topics ON (posts.topic = topics.id) '
    + 'LEFT OUTER JOIN users ON (posts.author = users.bnet_account_id) '
    + '';

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

  async getTopics({ slug }) {
    const sql = 'SELECT t.*, '
    + 'posts.created_at as most_recent_post_date, '
    + 'users.battletag AS most_recent_post_author '
    + 'FROM topics t '
    + 'LEFT OUTER JOIN posts ON t.id = posts.topic AND posts.id = ('
    + 'SELECT id FROM posts WHERE t.id = posts.topic ORDER BY created_at DESC LIMIT 1'
    + ') '
    + 'LEFT OUTER JOIN users ON (posts.author = users.bnet_account_id) '
    + 'WHERE t.board = ('
    + 'SELECT boards.id FROM boards WHERE boards.slug = $1'
    + ')'
    + '';

    const result = await this.query(sql, slug);
    return result && result.rows ? result.rows : [];
  }

  async createTopic({
    name,
    slug,
    createdBy,
    board,
  }) {
    const sql = 'INSERT INTO topics(name, slug, created_by, board) '
    + 'SELECT $1, $2, $3, b.id as board '
    + 'FROM boards b '
    + 'WHERE b.slug = $4 '
    + 'RETURNING *';

    const result = await this.query(sql, name, slug, createdBy, board.slug);
    return result && result.rows ? result.rows[0] : null;
  }
}

module.exports = PostgresDriver;
