const { graphql, buildSchema } = require('graphql');
const Board = require('../../models/board');

const schema = buildSchema(`
  input BoardInput {
    name: String!
    slug: String
  }

  type Board {
    id: Int
    name: String
    slug: String
  }

  type Query {
    getBoards: [Board]!
  }

  type Mutation {
    createBoard(input: BoardInput): Board
  }
`);

const root = {
  getBoards: async (obj, ctx) => {
    const results = await ctx.services.postgres.getBoards();
    return results;
  },
  createBoard: async (obj, ctx) => {
    const b = new Board({
      ...obj.input,
      createdBy: ctx.user.id,
    });
    await ctx.services.postgres.createBoard(b);
    return b;
  },
};

schema.graphqlMiddleware = function postsGraphqlMiddleware() {
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
      ctx.body = {
        ...response,
        errors: response.errors.map(e => e.message),
      };
    } else {
      ctx.status = 200;
      response.status = 'ok';
      ctx.body = response;
    }
  };
};

module.exports = schema;
