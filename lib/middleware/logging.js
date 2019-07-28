module.exports.requestsLogger = function makeLoggingMiddlewaare() {
  return async (ctx, next) => {
    const start = Date.now();
    const state = { url: ctx.url, method: ctx.method };
    const shouldLog = !ctx.url.endsWith('metrics') && !ctx.url.endsWith('healthz');
    if (shouldLog) {
      ctx.services.logger.info({ url: ctx.url, method: ctx.method }, 'Handling incoming request');
    }
    await next();
    if (shouldLog) {
      const ms = Date.now() - start;
      ctx.services.logger.info({
        ...state,
        status: ctx.status,
      }, `Request complete after ${ms} ms`);
    }
  };
};
