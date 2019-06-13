'use strict'

/**
* Cloud Adapter to connect NATS to SNS.
* Listens on the configured NATS subject and sends all Non-AWS-Events to SNS.
* This file is complete configurable from config.js
*/

const AWS = require('aws-sdk');
const NatsStreaming = require('node-nats-streaming');
const cloudeventParser = require('./cloudevents-parser.js');
const config = require('./config.js')

AWS.config.region = config.sns.region;
var SNS = new AWS.SNS({apiVersion: '2010-03-31'});

var nats = NatsStreaming.connect(config.nats.clusterID, config.sns.clientID + "-to", config.nats.url);

// Connect to NATS ans listen to the configured subject
nats.on('connect', function () {
  var opts = nats.subscriptionOptions();
  opts.setDeliverAllAvailable();
  opts.setDurableName(config.sns.clientID);
  opts.setManualAckMode(true);

  var subscription = nats.subscribe(config.nats.subject, opts);
  subscription.on('message', function (message) {
    var cloudevent = parseMessage(message.getData());
    // Check if it is not a AWS Event
    if (!cloudevent.getType().startsWith(config.sns.prefix)) {
      sendToSNS(message, cloudevent);
    } else {
      message.ack();
    }
  });
  console.log('To-SNS Adapter ready.');
});

nats.on('close', function () {
  console.log('To-SNS:', 'Connection closed');
});

/**
* Parse Message as Cloudevent
*/
function parseMessage(message) {
  try {
    var json = JSON.parse(message);
    return cloudeventParser(json);
  } catch (e) {
    console.log('To-SNS:', e);
  }
}

/**
* Send it to SNS via AWS-SDK
*/
function sendToSNS(message, cloudevent) {
  var params = {
    Message: cloudevent.toString(),
    TopicArn: config.sns.topicARN,
    MessageAttributes: {
      'type': {
        DataType: 'String',
        StringValue: cloudevent.getType()
      },
      'source': {
        DataType: 'String',
        StringValue: cloudevent.getSource()
      }
    }
  };

  SNS.publish(params).promise()
  .then((data) => {
    console.log('To-SNS:', "Message sent to the topic", params.TopicArn);
    console.log('To-SNS:', "MessageID is " + data.MessageId);
    message.ack();
  })
  .catch((err) => {
    console.error('To-SNS:', err, err.stack);
  });
}

// Close Connection to NATS when application is killed
process.on('SIGTERM', (signal) => {
  nats.close();
});
