
// Get health handler
module.exports.notFound = function makeNotFoundHandler() {
  return async (ctx, next) => {
    await next();
    if (ctx.status === 404) {
      switch (ctx.accepts('json', 'text')) {
        case 'text':
          ctx.type = 'text/plain';
          ctx.body = `Route not found: ${ctx.request.path}`;
          break;
        default:
          ctx.type = 'application/json';
          ctx.body = JSON.stringify({ status: 'nok', error: `route not found: ${ctx.request.path}` });
          break;
      }
    }
  };
};
