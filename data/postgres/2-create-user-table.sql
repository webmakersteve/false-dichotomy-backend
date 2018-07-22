CREATE TABLE users(
  bnet_account_id INTEGER NOT NULL PRIMARY KEY,
  battletag VARCHAR(120) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(200),
  access_token VARCHAR(120) NOT NULL,
  access_token_expires DATE NOT NULL,
  role INT DEFAULT 0
);
