const { buildSchema } = require('graphql');
const Topic = require('../../models/topic');
const graphqlHandler = require('../handlers/graphql');

const schema = buildSchema(`
  input BoardInput {
    slug: String!
  }

  input TopicInput {
    board: BoardInput!
    name: String!
    slug: String
  }

  type Author {
    battletag: String
  }

  type RecentPost {
    author: Author!
    createdAt: Int
  }

  type Topic {
    id: Int
    name: String
    slug: String
    mostRecentPost: RecentPost
  }

  type Query {
    getTopics(input: BoardInput!): [Topic]!
  }

  type Mutation {
    createTopic(input: TopicInput!): Topic
  }
`);

const root = {
  getTopics: async ({ input }, ctx) => {
    const results = await ctx.services.postgres.getTopics(input);
    return results.map(Topic.fromDatabase);
  },
  createTopic: async (obj, ctx) => {
    const t = new Topic({
      ...obj.input,
      createdBy: ctx.user.id,
    });
    const r = await ctx.services.postgres.createTopic(t);
    return r;
  },
};

schema.graphqlMiddleware = () => graphqlHandler(root, schema);

module.exports = schema;
