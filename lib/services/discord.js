const oauth2 = require('simple-oauth2');
const jwt = require('jsonwebtoken');
const request = require('request');

function getApiHost() {
  return 'discordapp.com';
}

function getAuthHost() {
  return getApiHost();
}

class AccessTokenClient {
  constructor(accessToken, expires, client) {
    this.token = accessToken;
    this.expires = expires;
    this.host = `https://${getApiHost(client.region)}/api`;
    this.client = request.defaults({
      baseUrl: this.host,
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      json: true,
    });
  }

  isExpired() {
    return Date.now() >= this.expires.getTime();
  }

  async revoke() {
    return new Promise(resolve => resolve());
  }

  async getUser() {
    return new Promise((resolve, reject) => {
      this.client.get({
        url: '/users/@me',
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

class DiscordClient {
  constructor(options) {
    this.id = options.id;
    this.secret = options.secret;
    this.host = getApiHost();
    this.accessToken = options.accessToken || undefined;
  }

  getOauthClient() {
    return oauth2.create({
      client: {
        id: this.id,
        secret: this.secret,
      },
      auth: {
        tokenHost: `https://${getAuthHost()}`,
        authorizePath: '/api/oauth2/authorize',
        tokenPath: '/api/oauth2/token',
      },
    });
  }

  getJwt(token) {
    return jwt.sign(token, this.secret);
  }

  decodeJwt(token) {
    return jwt.verify(token, this.secret);
  }

  createAuthenticatedClient(token, isJwt) {
    if (this.accessToken && !token) {
      return new AccessTokenClient(this.accessToken, Number.MAX_VALUE, this);
    }

    if (!token) {
      throw new Error('\'jwt\' has expired or is invalid');
    }

    let accessToken;
    let expiresAt;
    if (isJwt) {
      const decoded = jwt.verify(token, this.secret);
      accessToken = decoded.access_token;
      expiresAt = decoded.expires_at;
    } else {
      accessToken = token.access_token;
      expiresAt = new Date(token.expires_at) || Number.MAX_VALUE;
    }

    return new AccessTokenClient(accessToken, new Date(expiresAt), this);
  }
}

module.exports = DiscordClient;
