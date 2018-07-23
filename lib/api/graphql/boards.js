const Board = require('../../models/board');

module.exports = {
  getBoards: async (obj, ctx) => {
    const results = await ctx.services.postgres.getBoards();
    return results.map(Board.fromDatabase);
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
