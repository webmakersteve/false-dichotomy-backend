const { graphql, buildSchema } = require('graphql');
const User = require('../../models/user');

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

schema.graphqlMiddleware = function usersGraphqlMiddleware() {
  return async (ctx) => {
    if (ctx.is('json') !== 'json') {
      ctx.throw(406, 'only json is accepted');
      return;
    }

    const jsonBody = ctx.request.body;
    const response = await graphql(schema, jsonBody.query, root, {
      user: ctx.user,
      services: ctx.services,
    }, jsonBody.variables);

    if (response.errors && response.errors.length > 0) {
      ctx.status = 400;
      response.status = 'nok';
    } else {
      ctx.status = 200;
      response.status = 'ok';
    }

    ctx.body = response;
  };
};

module.exports = schema;
