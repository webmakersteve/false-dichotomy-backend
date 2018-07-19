const { graphql, buildSchema } = require('graphql');

const schema = buildSchema(`
  type Post {
    body: String
    poster: String
  }

  type Query {
    searchPosts(q: String!): [Post]!
  }
`);

schema.middleware = function(database) {
  const root = {
    searchPosts: async function({ q }) {
      const results = await database.searchPosts({ q });
      return results.map(v => {
        return {
          body: v._source.post.body,
          poster: v._source.post.poster,
        };
      });
    }
  }
  return async function(ctx, next) {
    const jsonBody = ctx.request.body;
    const response = await graphql(schema, jsonBody.query, root);

    ctx.body = response;
  }
}

module.exports = schema;
