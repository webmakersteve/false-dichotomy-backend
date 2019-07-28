const Post = require('../../models/post');

module.exports = {
  searchPosts: async ({ input }, ctx) => {
    const results = await ctx.services.elastic.searchPosts(input);
    return results.map(v => ({
      body: v._source.post.body,
      poster: v._source.post.poster,
    }));
  },
  createPost: async (obj, ctx) => {
    const p = new Post({
      ...obj.input,
      createdBy: ctx.user.id,
    });
    const r = await ctx.services.postgres.createPost(p);
    return r;
  },
};
