const querystring = require('querystring');
const urlUtil = require('url');

module.exports.loginUser = function makeLoginUseHandler(options) {
  const redirectUri = `${options.fqdn}${options.redirect_to}`;

  return async (ctx) => {
    const flow = ctx.services.bnet.getOauthClient();

    const { query } = ctx.request;

    let newRedirectUri = redirectUri;
    if (query && query.redirect) {
      const unescapedQueryString = querystring.unescape(query.redirect);
      // Before we send it off we want to make sure the redirect is going to our local domain
      // We can do this by either ensuring it starts with the FQDN or a slash
      if (!unescapedQueryString.startsWith(options.fqdn) && !unescapedQueryString.startsWith('/')) {
//        ctx.throw(400, 'redirect URI must be relative or go to this domain');
//        return;
      }

      const qs = querystring.stringify({ redirect: unescapedQueryString });
      newRedirectUri += `?${qs}`;
    }

    const authorizationUri = flow.authorizationCode.authorizeURL({
      redirect_uri: newRedirectUri,
      scope: ['wow.profile'],
    });

    ctx.redirect(authorizationUri);
  };
};

module.exports.loginCallback = function makeLoginCallback(options) {
  const { fqdn } = options;

  // http://localhost:8080/api/auth
  return async (ctx) => {
    const flow = ctx.services.bnet.getOauthClient();

    const { query } = ctx.request;
    const redirectUri = `${fqdn}${ctx.request.path}`;

    if (!query || !query.code) {
      ctx.throw(400, 'code is required to authenticate');
      return;
    }

    // If we had a custom redirect URI we need to appropriately modify the path and all of that
    let newRedirectUri = redirectUri;
    if (query && query.redirect) {
      const qs = querystring.stringify({ redirect: querystring.unescape(query.redirect) });
      newRedirectUri += `?${qs}`;
    }

    if (query.redirect) {
      const uriRedirect = querystring.unescape(query.redirect);
      if (!uriRedirect.startsWith(fqdn)) {
        ctx.status = 400;
        throw new Error(`Could not validate OAuth token: Invalid redirect provided. redirect_uri = ${uriRedirect}`);
      }
      ctx.redirect(`${uriRedirect}?code=${querystring.escape(query.code)}&original_redirect=${querystring.escape(newRedirectUri)}`);
      return;
    }

    // Get the access token object (the authorization code is given from the previous step).
    const tokenConfig = {
      code: query.code,
      redirect_uri: newRedirectUri,
      scope: ['wow.profile'],
    };

    // Save the access token
    let accessToken;
    try {
      const result = await flow.authorizationCode.getToken(tokenConfig);
      accessToken = flow.accessToken.create(result);
    } catch (e) {
      ctx.status = 400;
      throw new Error(`Could not validate OAuth token: ${e.message}. redirect_uri = ${newRedirectUri}`);
    }

    // Now that we have the access token
    const userClient = ctx.services.bnet.createAuthenticatedClient(accessToken.token);
    const user = await userClient.getUser();

    let jwt;
    try {
      jwt = ctx.services.bnet.getJwt({
        ...accessToken.token,
        battletag: user.battletag,
        id: user.id,
      });
    } catch (e) {
      ctx.status = 400;
      ctx.type = 'application/json';
      ctx.body = JSON.stringify({
        status: 'ok',
        error: e.message,
        metadata: {
          jwt: 'Could not fetch',
        },
      });
      return;
    }

    if (query.redirect) {
      // If we are being told to redirect here we do not need to do the rest of what we were
      // going to do
      // Instead we are gonna pass the JWT in the query string to the redirect URI
      const parsed = urlUtil.parse(querystring.unescape(query.redirect));
      const redirectQuerystring = querystring.parse(parsed.query);
      redirectQuerystring.jwt = jwt;

      const qs = querystring.stringify(redirectQuerystring);

      const newUrl = urlUtil.format({
        protocol: parsed.protocol,
        host: parsed.host,
        pathname: parsed.pathname || '/',
        search: `?${qs}`,
      });

      ctx.redirect(newUrl);
      return;
    }

    ctx.status = 200;
    ctx.type = 'application/json';
    ctx.body = JSON.stringify({
      status: 'ok',
      user,
      jwt,
    });
  };
};
