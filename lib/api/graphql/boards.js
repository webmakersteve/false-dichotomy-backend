const { buildSchema } = require('graphql');
const Board = require('../../models/board');
const graphqlHandler = require('../handlers/graphql');

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

schema.graphqlMiddleware = () => graphqlHandler(root, schema);

module.exports = schema;
