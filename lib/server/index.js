const Koa = require('koa');
const Router = require('koa-router');
const logger = require('../logging/logger-factory').getLogger('server');
const searchModel = require('../api/models/search');
const bodyParser = require('koa-bodyparser');

const ElasticSearch = require('../persistence/elasticsearch');

module.exports.createServer = function createServer(config) {
  const app = new Koa();
  const es = new ElasticSearch();
  // x-response-time

  // Activate body parser
  app.use(bodyParser());

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

  // Middleware for posts gql
  router.post('/posts/gql', searchModel.middleware(es));

  router.get('/posts', async (ctx, next) => {
    try {
      const posts = await es.searchPosts();
      ctx.body = JSON.stringify(posts);
    } catch (e) {
      logger.error(e);
      ctx.body = 'Failed like a dead hyena';
    }
  });

  router.get('/health', async (ctx, next) => {
    try {
      await es.ping();
      ctx.body = 'All good in the hood';
    } catch (e) {
      logger.error(e);
      ctx.body = 'Failed like a dead hyena';
    }
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
