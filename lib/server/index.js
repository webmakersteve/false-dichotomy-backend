const Koa = require('koa');
const Router = require('koa-router');
const logger = require('../logging/logger-factory').getLogger('server');

module.exports.createServer = function createServer(config) {
  const app = new Koa();
  // x-response-time

  app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
  });

  // logger
  app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    logger.info(`${ctx.method} ${ctx.url} - ${ms}`);
  });

  const router = new Router();

  router.get('/', (ctx, next) => {
    ctx.body = 'Planet earth, turns, slowly';
  });

  app
    .use(router.routes())
    .use(router.allowedMethods());

  const oldListen = app.listen.bind(app);

  app.listen = function() {
    return oldListen(config.port);
  }

  return app;
};
