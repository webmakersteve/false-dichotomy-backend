const { graphql, buildSchema } = require('graphql');


const schema = buildSchema(`
  input PostInput {
    content: String
    author: String
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
    } else {
      ctx.status = 200;
      response.status = 'ok';
    }

    ctx.body = response;
  };
};

module.exports = schema;
