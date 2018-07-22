const { graphql, buildSchema } = require('graphql');

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

    return {
      battletag: user.battletag,
      firstName: user.first_name,
      lastName: user.last_name,
      mainCharacter: user.main_character,
    };
  },
  getUser: async (obj, ctx) => {
    const user = await ctx.services.postgres.createUser({
      id: ctx.user.id,
      battletag: ctx.user.battletag,
      accessToken: ctx.user.bnet.token,
      accessTokenExpires: ctx.user.bnet.expires,
    });

    return {
      battletag: user.battletag,
      firstName: user.first_name,
      lastName: user.last_name,
      mainCharacter: user.main_character,
      accessTokenExpires: ctx.user.bnet.expires,
    };
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
      response.status = 'ok';
    }

    ctx.status = 200;
    ctx.body = response;
  };
};

module.exports = schema;
