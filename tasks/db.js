const fs = require('fs');
const glob = require('glob'); // eslint-disable-line import/no-extraneous-dependencies
const pathUtil = require('path');
const util = require('util');

const Postgres = require('../lib/persistence/postgres');

const ROOT_DIR = pathUtil.resolve(__dirname, '..');
const MIGRATION_DIR = pathUtil.resolve(ROOT_DIR, 'data', 'postgres');

const globPromise = util.promisify(glob);

module.exports.putDatabaseSchema = async function putDatabaseSchema(config, cb) {
  const pg = new Postgres(config.postgres);

  async function getCurrentMigration() {
    const results = await pg.query('SELECT MAX(migration_id) as max_migration FROM migrations');

    if (results.rows && results.rows[0].max_migration) {
      return results.rows[0].max_migration;
    }
    return 0;
  }

  try {
    const globbedFiles = await globPromise(pathUtil.join(MIGRATION_DIR, '*.sql'));
    const files = globbedFiles.map((filename) => {
      const basename = pathUtil.basename(filename);
      const migrationNumber = parseInt(basename.substring(0, basename.indexOf('-')), 10);

      return {
        basename,
        migrationNumber,
        filename,
      };
    }).sort((a, b) => a.migrationNumber - b.migrationNumber);

    let migrationsTableExists = await pg.tableExists('migrations');
    let currentMigration = -1;

    // Figure out what migrations we need to run
    if (migrationsTableExists) {
      currentMigration = await getCurrentMigration();
    }

    for (let file of files) {
      const { filename, basename, migrationNumber } = file;

      // If the migration number that should be run is greater than the current migration,
      // just skip it.
      if (migrationNumber <= currentMigration) {
        continue;
      }

      const contents = fs.readFileSync(filename).toString();

      await pg.query(contents);

      // Check again if migrations table exists if we need to.
      if (!migrationsTableExists) {
        migrationsTableExists = await pg.tableExists('migrations');
      }

      // Now update the migrations table
      if (migrationsTableExists) {
        await pg.query('INSERT INTO migrations(migration_name, migration_id, completed) VALUES ($1, $2, $3)',
          basename,
          migrationNumber,
          new Date());
      }
    };

    return cb();
  } catch (e) {
    return cb(e);
  }
};

module.exports.deleteDatabaseSchema = async function deleteDatabaseSchema(config, cb) {
  const pg = new Postgres(config.postgres);

  try {
    await pg.tableExists('migrations');
    return cb();
  } catch (e) {
    return cb(e);
  }
};
