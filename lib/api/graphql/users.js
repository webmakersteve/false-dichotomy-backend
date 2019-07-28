const User = require('../../models/user');

module.exports = {
  getUsers: async (obj, ctx) => {
    const users = await ctx.services.postgres.getUsers();
    return users.map(user => User.fromDatabase(user));
  },
  getUser: async (obj, ctx) => {
    const user = await ctx.services.postgres.createUser({
      id: ctx.user.id,
      battletag: ctx.user.battletag,
      accessToken: ctx.user.bnet.token,
      accessTokenExpires: ctx.user.bnet.expires,
    });

    return User.fromDatabase(user);
  },
  updateCurrentUser: async ({ input }, ctx) => {
    const { firstName, lastName, mainCharacter } = input;
    // Role needs to get filtered out if the user is not an admin, unless we can ascertain it
    // through guild rank.
    const { battletag } = ctx.user;
    const user = await ctx.services.postgres.updateUser({
      battletag,
      firstName,
      lastName,
      mainCharacter,
    });

    return User.fromDatabase(user);
  },
  getCurrentUser: async (obj, ctx) => {
    const user = await ctx.services.postgres.createUser({
      id: ctx.user.id,
      battletag: ctx.user.battletag,
      accessToken: ctx.user.bnet.token,
      accessTokenExpires: ctx.user.bnet.expires,
    });

    return User.fromDatabase(user);
  },
};
