const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const logger = require('../logging/logger-factory').getLogger('server');
const postsModel = require('../api/graphql/posts');
const usersModel = require('../api/graphql/users');
const userModel = require('../api/graphql/user');
const healthHandler = require('../api/handlers/health').getHealth;
const errorHandlers = require('../api/handlers/errors');
const authHandlers = require('../api/handlers/auth');
const userHandlers = require('../api/handlers/users');
const jwtMiddleware = require('../middleware/jwt');

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
  router.get('/health', healthHandler());

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
  authenticatedRouter.post('/posts', postsModel.graphqlMiddleware());
  authenticatedRouter.get('/wow', async (ctx) => {
    const client = ctx.services.bnet.createAuthenticatedClient();
    const characters = await client.getWowCharacters();

    ctx.body = characters;
    ctx.type = 'application/json';
  });

  authenticatedRouter.get('/user', userHandlers.currentUser());
  authenticatedRouter.post('/user', userModel.graphqlMiddleware());
  authenticatedRouter.post('/users', usersModel.graphqlMiddleware());

  app
    .use(router.routes())
    .use(router.allowedMethods())
    .use(authenticatedRouter.routes())
    .use(authenticatedRouter.allowedMethods());

  const oldListen = app.listen.bind(app);

  app.listen = function listen() {
    return oldListen(config.port);
  };

  return app;
};
