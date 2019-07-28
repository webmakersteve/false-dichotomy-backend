CREATE TABLE api_refreshes(
  bnet_account_id INTEGER NOT NULL,
  refresh_time DATE NOT NULL,
  PRIMARY KEY (bnet_account_id, refresh_time)
);
