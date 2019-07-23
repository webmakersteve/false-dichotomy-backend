const AWS = require('aws-sdk');
const uuid = require('uuid/v1');
const logger = require('../../lib/logging/logger-factory').getLogger('aws');

AWS.config.update({
  region: 'us-west-2',
  logger,
});

const tables = {
  users: 'homenot_to_scale_users',
  tokens: 'homenot_to_scale_tokens',
};

function getId(source, id) {
  return Buffer.from(`${source}::${id}`).toString('base64');
}

class DynamoClient {
  constructor(options) {
    this.client = new AWS.DynamoDB.DocumentClient();
    this.logger = logger;
  }

  async getUserFromToken(token) {
    const result = await this.queryObjectInternal({
      KeyConditionExpression: '#token = :k',
      ExpressionAttributeValues: {
        ':k': token,
      },
      ExpressionAttributeNames: {
        '#token': 'Token',
      },
      IndexName: 'TokenIndex',
      TableName: tables.tokens,
    });

    if (!result || result.Items.length < 1) {
      throw new Error('Token does not exist');
    }

    const userId = result.Items[0].UserId;

    const fetchedObject = await this.getObjectInternal({
      TableName: tables.users,
      Key: {
        UserId: userId,
      },
    });

    if (!fetchedObject || !fetchedObject.Item) {
      throw new Error('User has been deleted');
    }

    return fetchedObject.Item;
  }

  async putUser(source, user, { token }) {
    const { access_token, expires_in, refresh_token } = token;
    const id = getId(source, user.id);
    await this.putObjectInternal(tables.users, {
      UserId: id,
      DisplayName: user.displayName || user.username,
      Email: user.email,
      Source: source,
    });

    const uuidToken = uuid();

    await this.putObjectInternal(tables.tokens, {
      UserId: id,
      CreatedTime: Date.now(),
      Token: uuidToken,
      Source: source,
      Expires: expires_in,
      RefreshToken: refresh_token,
      AccessToken: access_token,
    });

    return { id, token: uuidToken };
  }

  queryObjectInternal(params) {
    return new Promise((resolve, reject) => {
      this.client.query(params, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(data);
      });
    });
  }

  getObjectInternal(params) {
    return new Promise((resolve, reject) => {
      this.client.get(params, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(data);
      });
    });
  }

  putObjectInternal(table, item) {
    return new Promise((resolve, reject) => {
      this.client.put({
        TableName: table,
        Item: {
          ...item,
        },
      }, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(data);
      });
    });
  }
}

module.exports = DynamoClient;
