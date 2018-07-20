const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const logger = require('../logging/logger-factory').getLogger('server');
const searchModel = require('../api/graphql/search');
const healthHandler = require('../api/handlers/health').getHealth;
const notFoundHandler = require('../api/handlers/404').notFound;
const internalErrorHandler = require('../api/handlers/500').internalError;
const authHandlers = require('../api/handlers/auth');

module.exports.createServer = function createServer(config, svcs) {
  const app = new Koa();

  const services = {
    ...svcs,
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

  router.get('/api/wow', async (ctx) => {
    const client = ctx.services.bnet.createAuthenticatedClient();
    const characters = await client.getWowCharacters();

    ctx.body = characters;
    ctx.type = 'application/json';
  });

  app
    .use(router.routes())
    .use(router.allowedMethods());

  const oldListen = app.listen.bind(app);

  app.listen = function listen() {
    return oldListen(config.port);
  };

  return app;
};
