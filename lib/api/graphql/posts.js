const Post = require('../../models/post');

module.exports = {
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
