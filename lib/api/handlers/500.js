const logger = require('../../logging/logger-factory').getLogger('500');

// Get health handler
module.exports.internalError = function makeInternalErrorHandler(options) {
  return async (ctx, next) => {
    try {
      await next();
    } catch (e) {
      ctx.status == ctx.status !== 404 ? ctx.status : 500;
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
  }
}
