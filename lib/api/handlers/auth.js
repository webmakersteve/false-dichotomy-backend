module.exports.loginUser = function makeLoginUseHandler(options) {
  const redirect_uri = `${options.fqdn}${options.redirect_to}`;

  return async (ctx, next) => {
    const flow = ctx.services.bnet.getOauthClient();

    const authorizationUri = flow.authorizationCode.authorizeURL({
      redirect_uri,
      scope: ['wow.profile'],
    });

    ctx.redirect(authorizationUri);
  };

}

module.exports.loginCallback = function makeLoginCallback(options) {
  const { fqdn } = options;

  return async (ctx, next) => {
    const flow = ctx.services.bnet.getOauthClient();

    const { query } = ctx.request;
    const redirect_uri = `${fqdn}${ctx.request.path}`;

    if (!query || !query.code) {
      ctx.throws(400, 'code is required to authenticate');
      return;
    }

    // Get the access token object (the authorization code is given from the previous step).
    const tokenConfig = {
      code: query.code,
      redirect_uri,
      scope: ['wow.profile'], // also can be an array of multiple scopes, ex. ['<scope1>, '<scope2>', '...']
    };

    // Save the access token
    let accessToken;
    try {
      const result = await flow.authorizationCode.getToken(tokenConfig)
      accessToken = flow.accessToken.create(result);
    } catch (e) {
      ctx.status = 400;
      throw new Error(`Could not validate OAuth token: ${e.message}`);
    }

    ctx.status = 200;
    ctx.type = 'application/json';
    ctx.body = JSON.stringify({
      status: 'ok',
      jwt: ctx.services.bnet.getJwt(accessToken.token),
    });
  };

}

