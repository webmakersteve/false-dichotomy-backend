const { buildSchema } = require('graphql');
const User = require('../../models/user');
const graphqlHandler = require('../handlers/graphql');

const schema = buildSchema(`
  type User {
    battletag: String
    firstName: String
    lastName: String
    mainCharacter: Int
  }

  type Mutation {
    updateUser(firstName: String, lastName: String): User
  }

  type Query {
    getUser: User!
  }
`);

const root = {
  updateUser: async ({ firstName, lastName, mainCharacter }, ctx) => {
    // Role needs to get filtered out if the user is not an admin, unless we can ascertain it
    // through guild rank.
    const { battletag } = ctx.user;
    const user = await ctx.services.postgres.updateUser({
      battletag,
      firstName,
      lastName,
      mainCharacter,
    });

    return User.fromDatabase(user);
  },
  getUser: async (obj, ctx) => {
    const user = await ctx.services.postgres.createUser({
      id: ctx.user.id,
      battletag: ctx.user.battletag,
      accessToken: ctx.user.bnet.token,
      accessTokenExpires: ctx.user.bnet.expires,
    });

    return User.fromDatabase(user);
  },
};

schema.graphqlMiddleware = () => graphqlHandler(root, schema);

module.exports = schema;
