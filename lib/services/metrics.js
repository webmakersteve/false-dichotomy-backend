const client = require('prom-client');

const registry = new client.Registry();

// Probe every 5th second.
client.collectDefaultMetrics({
  timeout: 5000,
  prefix: 'nottoscale_backend_',
  register: registry,
});

module.exports = registry;
