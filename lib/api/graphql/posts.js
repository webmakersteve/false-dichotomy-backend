const { buildSchema } = require('graphql');
const graphqlHandler = require('../handlers/graphql');

const schema = buildSchema(`
  input PostInput {
    content: String
    board: String
    topic: String
  }

  type Post {
    content: String
    author: String
  }

  type Query {
    searchPosts(q: String!): [Post]!
  }

  type Mutation {
    createPost(input: PostInput): Post
  }
`);

const root = {
  searchPosts: async ({ q }, ctx) => {
    const results = await ctx.services.elastic.searchPosts({ q });
    return results.map(v => ({
      body: v._source.post.body,
      poster: v._source.post.poster,
    }));
  },
  createTopic: async (obj, ctx) => {
    const t = new Post({
      ...obj.input,
      createdBy: ctx.user.id,
    });
    const r = await ctx.services.postgres.createTopic(t);
    return r;
  },
};

schema.graphqlMiddleware = () => graphqlHandler(root, schema);

module.exports = schema;
