const Topic = require('../../models/topic');

module.exports = {
  getTopics: async ({ input }, ctx) => {
    if (!input.slug) {
      throw new Error('"slug" is a required field to getTopics');
    }

    const results = await ctx.services.postgres.getTopics(input);
    return results.map(Topic.fromDatabase);
  },
  createTopic: async ({ input }, ctx) => {
    if (!input.slug) {
      throw new Error('"slug" is a required field to getTopics');
    }

    const t = new Topic({
      ...input,
      createdBy: ctx.user.id,
    });
    const r = await ctx.services.postgres.createTopic(t);
    return r;
  },
};
