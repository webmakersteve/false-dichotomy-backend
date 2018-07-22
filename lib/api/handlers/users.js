module.exports.currentUser = function makeGetCurrentUserHandler() {
  return async (ctx) => {
    // This ensures it exists and updates it if it does not
    const user = await ctx.services.postgres.createUser({
      id: ctx.user.id,
      battletag: ctx.user.battletag,
      accessToken: ctx.user.bnet.token,
      accessTokenExpires: ctx.user.bnet.expires,
    });

    ctx.status = 200;
    ctx.body = user;
    ctx.type = 'application/json';
  };
};
