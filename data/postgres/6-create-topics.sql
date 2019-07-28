CREATE TABLE topics(
  id SERIAL NOT NULL PRIMARY KEY,
  name VARCHAR(250) NOT NULL,
  slug VARCHAR(70) NOT NULL,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by INTEGER NOT NULL REFERENCES users(bnet_account_id),
  board INTEGER NOT NULL REFERENCES boards(id),
  UNIQUE (board, slug)
);
