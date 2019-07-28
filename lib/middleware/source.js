module.exports.requireInternal = function makeRequireInternalMiddleware() {
  return async (ctx, next) => {
    const { ip } = ctx.request;

    if (ip !== '127.0.0.1' && ip !== '::1' && ip.startsWith('192.168.')) {
      ctx.status = 404;
      ctx.body = '';
      return;
    }

    await next();
  };
};
