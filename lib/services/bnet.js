const oauth2 = require('simple-oauth2');
const jwt = require('jsonwebtoken');

function getApiHost(region) {
  if (region === 'cn') {
    return 'api.battlenet.com.cn'
  } else {
    return region + '.api.battle.net'
  }
}

function getAuthHost(region) {
  return region + '.battle.net';
}

class BnetClient {
  constructor(options) {
    this.id = options.id;
    this.secret = options.secret;
    this.region = options.region || 'us';
    this.host = getApiHost(options.region || 'us');
  }

  getOauthClient(region) {
    return oauth2.create({
      client: {
        id: this.id,
        secret: this.secret,
      },
      auth: {
        tokenHost: `https://${getAuthHost(this.region)}`,
        authorizePath: '/oauth/authorize',
        tokenPath: '/oauth/token',
      }
    })
  }

  getJwt(token) {
    return jwt.sign(token, this.secret);
  }
}

module.exports = BnetClient;
