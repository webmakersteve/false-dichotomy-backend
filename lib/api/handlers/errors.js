const logger = require('../../logging/logger-factory').getLogger('errors');

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

// Get health handler
module.exports.internalError = function makeInternalErrorHandler() {
  return async (ctx, next) => {
    try {
      await next();
    } catch (e) {
      ctx.status = ctx.status !== 404 ? ctx.status : 500;
      logger.error(e, `Exception thrown in accessing route '${ctx.request.path}': ${e.message}`);
      switch (ctx.accepts('json', 'text')) {
        case 'text':
          ctx.type = 'text/plain';
          ctx.body = `Internal error at path: ${ctx.request.path}; ${e.message}`;
          break;
        default:
          ctx.type = 'application/json';
          ctx.body = JSON.stringify({ status: 'nok', error: e.message });
          break;
      }
    }
  };
};
