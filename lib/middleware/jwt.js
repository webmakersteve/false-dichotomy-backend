// const logger = require('../logging/logger-factory').getLogger('jwt');

module.exports.requireAuthentication = function makeRequireAuthenticationMiddleware() {
  const fourOhOneError = 'a JWT token is required to access this resource, and should be passed in using an authorization header.';

  return async (ctx, next) => {
    const { headers } = ctx.request;
    const authHeader = headers.authorization;

    function fail(err) {
      ctx.status = 401;
      switch (ctx.accepts('json', 'text')) {
        case 'text':
          ctx.type = 'text/plain';
          ctx.body = err || fourOhOneError;
          break;
        default:
          ctx.type = 'application/json';
          ctx.body = JSON.stringify({ status: 'nok', error: err || fourOhOneError });
          break;
      }
    }

    if (!authHeader) {
      fail();
      return;
    }

    const [authType, token] = authHeader.split(/ +/);

    if (!token) {
      fail();
      return;
    }

    if (authType.toLowerCase() !== 'bearer') {
      fail('only bearer authentication is accepted');
      return;
    }

    try {
      // Now we can actually try to decode the jwt.
      const decoded = ctx.services.bnet.decodeJwt(token);
      ctx.user = {
        bnet: ctx.services.bnet.createAuthenticatedClient(decoded, false),
        battletag: decoded.battletag,
        id: decoded.id,
      };

      // Now await next
      await next();
    } catch (e) {
      fail(e.message);
    }
  };
};
