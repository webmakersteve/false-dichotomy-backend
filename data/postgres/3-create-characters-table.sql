CREATE TABLE characters(
  character_id VARCHAR(255) NOT NULL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  realm VARCHAR(100) NOT NULL,
  class INT NOT NULL,
  thumbnail VARCHAR(200) NOT NULL,
  guild VARCHAR(255),
  owner INTEGER NOT NULL REFERENCES users(bnet_account_id)
);
