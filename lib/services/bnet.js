const oauth2 = require('simple-oauth2');
const jwt = require('jsonwebtoken');
const request = require('request');

function getApiHost(region) {
  if (region === 'cn') {
    return 'api.battlenet.com.cn';
  }

  return `${region}.api.battle.net`;
}

function getAuthHost(region) {
  return `${region}.battle.net`;
}

class AccessTokenClient {
  constructor(accessToken, expires, client) {
    this.token = accessToken;
    this.expires = expires;
    this.host = `https://${getApiHost(client.region)}`;
    this.client = request.defaults({
      baseUrl: this.host,
      qs: {
        access_token: this.token,
      },
      json: true,
    });
  }

  isExpired() {
    return Date.now() >= this.expires;
  }

  async getWowCharacters() {
    return new Promise((resolve, reject) => {
      this.client.get({
        url: '/wow/user/characters',
        method: 'GET',
      }, (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(body);
      });
    });
  }
}

class BnetClient {
  constructor(options) {
    this.id = options.id;
    this.secret = options.secret;
    this.region = options.region || 'us';
    this.host = getApiHost(options.region || 'us');
    this.accessToken = options.access_token || undefined;
  }

  getOauthClient(region) {
    return oauth2.create({
      client: {
        id: this.id,
        secret: this.secret,
      },
      auth: {
        tokenHost: `https://${getAuthHost(region || this.region)}`,
        authorizePath: '/oauth/authorize',
        tokenPath: '/oauth/token',
      },
    });
  }

  getJwt(token) {
    return jwt.sign(token, this.secret);
  }

  createAuthenticatedClient(token, isJwt) {
    if (this.accessToken && !token) {
      return new AccessTokenClient(this.accessToken, Number.MAX_VALUE, this);
    }

    if (!token) {
      throw new Error('\'jwt\' has expired or is invalid');
    }

    let accessToken = token;
    let expiresAt = Number.MAX_VALUE;
    if (isJwt) {
      const decoded = jwt.verify(token, this.secret);
      accessToken = decoded.access_token;
      expiresAt = decoded.expires_at;
    }

    return new AccessTokenClient(accessToken, new Date(expiresAt).getTime(), this);
  }
}

module.exports = BnetClient;
