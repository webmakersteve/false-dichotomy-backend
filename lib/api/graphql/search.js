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

schema.middleware = function searchMiddleware(database) {
  const root = {
    searchPosts: async ({ q }) => {
      const results = await database.searchPosts({ q });
      return results.map(v => ({
        body: v._source.post.body,
        poster: v._source.post.poster,
      }));
    },
  };

  return async (ctx) => {
    if (ctx.is('json') !== 'json') {
      ctx.throw(406, 'only json is accepted');
      return;
    }

    const jsonBody = ctx.request.body;
    const response = await graphql(schema, jsonBody.query, root);

    if (response.errors && response.errors.length > 0) {
      ctx.status = 400;
      response.status = 'nok';
    } else {
      response.status = 'ok';
    }

    ctx.body = response;
  };
};

module.exports = schema;