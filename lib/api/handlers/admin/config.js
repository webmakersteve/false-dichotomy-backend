const traverse = require('traverse');

const protectedSegments = [
  'password',
  'secret',
];

function scrubKeys() {
  if (this.circular) {
    return;
  }

  if (!this.key) {
    return;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const segment of protectedSegments) {
    if (this.key.toLowerCase().indexOf(segment) > -1) {
      this.remove();
      return;
    }
  }
}

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
    ctx.body = traverse(traverse.clone(config)).map(scrubKeys);
    ctx.status = 200;
  };
};
