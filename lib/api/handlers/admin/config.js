module.exports.getConfig = function makeGetConfigHandler(config) {
  return async (ctx) => {
    switch (ctx.accepts('json', 'text')) {
      case 'text':
        ctx.type = 'text/plain';
        // Need to create a nice text formatter.
        ctx.body = 'Use JSON for now';
        break;
      default:
        ctx.type = 'application/json';
        ctx.body = JSON.stringify({ status: 'ok', config });
        break;
    }
    ctx.body = '';
    ctx.status = 200;
  };
};
