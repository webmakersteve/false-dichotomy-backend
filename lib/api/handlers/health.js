const logger = require('../../logging/logger-factory').getLogger('health');

// Get health handler
module.exports.getHealth = function makeGetHealthHandler(options) {
  return async (ctx, next) => {
    try {
      await ctx.services.elasticsearch.ping();
      ctx.status = 200;
      switch (ctx.accepts('json', 'text')) {
        case 'text':
          ctx.type = 'text/plain';
          ctx.body = 'ok';
          break;
        default:
          ctx.type = 'application/json';
          ctx.body = JSON.stringify({ status: 'ok' });
          break;
      }
    } catch (e) {
      logger.error('Health check failed: ' + e.message, e);
      ctx.status = 500;
      switch (ctx.accepts('json', 'text')) {
        case 'text':
          ctx.type = 'text/plain';
          ctx.body = e.message;
          break;
        default:
          ctx.type = 'application/json';
          ctx.body = JSON.stringify({ status: 'nok', error: e.message });
          break;
      }
    }
  }
}
