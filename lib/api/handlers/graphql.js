const { graphql } = require('graphql');

module.exports = function getGraphqlHandler(root, schema) {
  return async (ctx) => {
    if (ctx.is('json') !== 'json') {
      ctx.throw(406, 'only json is accepted');
      return;
    }

    const jsonBody = ctx.request.body;
    const response = await graphql(schema, jsonBody.query, root, {
      user: ctx.user,
      services: ctx.services,
    }, jsonBody.variables);

    if (response.errors && response.errors.length > 0) {
      ctx.status = 400;
      response.status = 'nok';
      ctx.body = {
        ...response,
        errors: response.errors.map(e => e.message),
      };
    } else {
      ctx.status = 200;
      response.status = 'ok';
      ctx.body = response;
    }
  };
};
