CREATE TABLE migrations(
  migration_name VARCHAR(255) NOT NULL PRIMARY KEY,
  migration_id INTEGER NOT NULL,
  completed DATE NOT NULL
);
