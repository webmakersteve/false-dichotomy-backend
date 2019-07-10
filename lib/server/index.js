const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const http = require('http');

const logger = require('../logging/logger-factory').getLogger('server');
const graphqlHandler = require('../api/handlers/graphql');
const healthHandler = require('../api/handlers/health').getHealth;
const { getMetrics } = require('../api/handlers/metrics');
const errorHandlers = require('../api/handlers/errors');
const authHandlers = require('../api/handlers/auth');
const userHandlers = require('../api/handlers/users');
const configHandlers = require('../api/handlers/admin/config');
const jwtMiddleware = require('../middleware/jwt');

module.exports.createServer = function createServer(globalConfig, svcs) {
  const app = new Koa();
  const config = globalConfig.http;

  const services = {
    ...svcs,
    logger,
  };

  app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    logger.trace(`${ctx.method} ${ctx.url} - took ${ms}ms`);
  });

  app.use(async (ctx, next) => {
    ctx.services = services;
    await next();
  });

  app.use(errorHandlers.internalError());
  app.use(errorHandlers.notFound());

  const router = new Router();

  // Generic Routes. Not app specific
  router.get('/healthz', healthHandler());
  router.get('/metrics', getMetrics());

  // Global middleware
  router.use(['/api'], bodyParser());

  // Authentication routes.
  router.get('auth_callback', '/api/auth/callback', authHandlers.loginCallback({ fqdn: config.fqdn }));
  router.get('/api/auth', authHandlers.loginUser({
    fqdn: config.fqdn,
    redirect_to: router.url('auth_callback'),
  }));

  const authenticatedRouter = new Router({
    prefix: '/api',
  });
  authenticatedRouter.use(bodyParser());
  authenticatedRouter.use(jwtMiddleware.requireAuthentication());

  // All routes below this require authentication
  authenticatedRouter.post('/graphql', graphqlHandler());
  authenticatedRouter.get('/wow', async (ctx) => {
    const characters = await ctx.user.bnet.getWowCharacters();

    ctx.body = characters;
    ctx.type = 'application/json';
  });

  authenticatedRouter.get('/user', userHandlers.currentUser());

  const adminRouter = new Router({
    prefix: '/api/admin',
  });
  adminRouter.use(bodyParser());
  adminRouter.use(jwtMiddleware.requireAuthentication());
  adminRouter.use(jwtMiddleware.requireAdmin());

  adminRouter.get('/config', configHandlers.getConfig(globalConfig));

  app
    .use(router.routes())
    .use(router.allowedMethods())
    .use(authenticatedRouter.routes())
    .use(authenticatedRouter.allowedMethods())
    .use(adminRouter.routes())
    .use(adminRouter.allowedMethods());

  const server = http.createServer(app.callback());

  const oldListen = server.listen.bind(server);

  server.listen = function listen() {
    return oldListen(config.port);
  };

  return server;
};
