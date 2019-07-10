const logger = require('../../logging/logger-factory').getLogger('metrics');

// Get metrics handler
module.exports.getMetrics = function makeGetMetricsHandler() {
  return async (ctx) => {
    const { ip } = ctx.request;
    if (ip !== '127.0.0.1' && ip !== '::1') {
      ctx.status = 404;
      ctx.body = '';
      return;
    }

    try {
      ctx.status = 200;
      ctx.type = 'text/plain';
      ctx.body = ctx.services.prom.metrics();
    } catch (e) {
      logger.error(`Metrics query failed: ${e.message}`, e);
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
  };
};
