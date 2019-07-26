const AWS = require('aws-sdk');
const logger = require('../logging/logger-factory').getLogger('aws');

AWS.config.update({
  region: 'us-west-2',
  logger,
});

class SqsClient {
  constructor(options) {
    this.client = new AWS.SQS();
    this.logger = logger;
    this.options = options;
  }

  send({ body, queue, headers }) {
    const MessageAttributes = {};

    if (headers) {
      Object.keys(headers).forEach((headerName) => {
        MessageAttributes[headerName] = {
          DataType: 'STRING_VALUE',
          StringValue: headers[headerName],
        };
      });
    }

    return new Promise((resolve, reject) => {
      this.client.sendMessage({
        MessageBody: body,
        // MessageDeduplicationId: ,
        QueueUrl: this.options.queues[queue || 'default'],
        MessageAttributes,
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

module.exports = SqsClient;
