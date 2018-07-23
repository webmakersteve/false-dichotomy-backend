const graphqlHandler = require('../handlers/graphql');
const schema = require('./schema');

const boards = require('./boards');
const posts = require('./posts');
const topics = require('./topics');
const users = require('./users');

// We need to create root from all the subroot methods
const root = {
  ...boards,
  ...posts,
  ...topics,
  ...users,
};

module.exports = () => graphqlHandler(root, schema);
