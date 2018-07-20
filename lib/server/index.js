const Koa = require('koa');
const Router = require('koa-router');
const logger = require('../logging/logger-factory').getLogger('server');
const searchModel = require('../api/graphql/search');
const bodyParser = require('koa-bodyparser');
const healthHandler = require('../api/handlers/health').getHealth;
const notFoundHandler = require('../api/handlers/404').notFound;

const ElasticSearch = require('../persistence/elasticsearch');

module.exports.createServer = function createServer(config) {
  const app = new Koa();
  const es = new ElasticSearch();

  app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    logger.info(`${ctx.method} ${ctx.url} - took ${ms}ms`);
  });

  app.use(async (ctx, next) => {
    ctx.services = { es, logger };
    await next();
  });

  app.use(notFoundHandler());

  const router = new Router();

  router.use(['/api'], bodyParser());

  // Middleware for posts for GraphQL
  router.post('/api/posts', searchModel.middleware(es));

  router.get('/health', healthHandler());

  app
    .use(router.routes())
    .use(router.allowedMethods());

  const oldListen = app.listen.bind(app);

  app.listen = function() {
    return oldListen(config.port);
  }

  return app;
};
