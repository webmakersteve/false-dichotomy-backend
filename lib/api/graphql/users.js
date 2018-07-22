const { buildSchema } = require('graphql');
const User = require('../../models/user');
const graphqlHandler = require('../handlers/graphql');

const FAKE_USER = {
  battletag: 'tag',
  firstName: 'hithere',
  lastName: 'hithere',
  role: 0,
};

const schema = buildSchema(`
  type User {
    battletag: String
    firstName: String
    lastName: String
    mainCharacter: Int
    role: Int
  }

  type Mutation {
    updateUser(battletag: String!, firstName: String, lastName: String, role: Int): User
  }

  type Query {
    getUsers: [User]!
  }
`);

const root = {
  updateUser: async () => FAKE_USER,
  getUsers: async (obj, ctx) => {
    const users = await ctx.services.postgres.getUsers();
    return users.map(user => User.fromDatabase(user));
  },
};

schema.graphqlMiddleware = () => graphqlHandler(root, schema);

module.exports = schema;
