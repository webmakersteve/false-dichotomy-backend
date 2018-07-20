const Koa = require('koa');
const Router = require('koa-router');
const logger = require('../logging/logger-factory').getLogger('server');
const searchModel = require('../api/graphql/search');
const bodyParser = require('koa-bodyparser');
const healthHandler = require('../api/handlers/health').getHealth;
const notFoundHandler = require('../api/handlers/404').notFound;
const internalErrorHandler = require('../api/handlers/500').internalError;
const authHandlers = require('../api/handlers/auth');

const ElasticSearch = require('../persistence/elasticsearch');

module.exports.createServer = function createServer(config, services) {
  const app = new Koa();

  services = {
    ...services,
    logger,
  };

  app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    logger.info(`${ctx.method} ${ctx.url} - took ${ms}ms`);
  });

  app.use(async (ctx, next) => {
    ctx.services = services;
    await next();
  });

  app.use(internalErrorHandler());
  app.use(notFoundHandler());

  const router = new Router();

  router.use(['/api'], bodyParser());

  // Middleware for posts for GraphQL
  router.post('/api/posts', searchModel.middleware(services.elastic));

  router.get('/health', healthHandler());

  router.get('auth_callback', '/api/auth/callback', authHandlers.loginCallback({
    fqdn: config.fqdn,
  }));
  router.get('/api/auth', authHandlers.loginUser({
    fqdn: config.fqdn,
    redirect_to: router.url('auth_callback'),
  }));

  app
    .use(router.routes())
    .use(router.allowedMethods());

  const oldListen = app.listen.bind(app);

  app.listen = function() {
    return oldListen(config.port);
  }

  return app;
};
