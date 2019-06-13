'use strict'

/**
* Cloud Adapter to connect NATS to AWS.
* Listens on the configured NATS subject and calls a Lambda Functions when an connected event occured.
* This file is complete configurable from config.js
*/

const AWS = require('aws-sdk');
const NatsStreaming = require('node-nats-streaming');
const cloudeventParser = require('./cloudevents-parser.js');
const config = require('./config.js')

AWS.config.region = config.aws.region;
var lambda = new AWS.Lambda();

var nats = NatsStreaming.connect(config.nats.clusterID, config.aws.clientID, config.nats.url);

// Connect to NATS ans listen to the configured subject
nats.on('connect', function () {
  var opts = nats.subscriptionOptions();
  opts.setDeliverAllAvailable();
  opts.setDurableName(config.aws.clientID);
  opts.setManualAckMode(true);
  
  var subscription = nats.subscribe(config.nats.subject, opts);
  subscription.on('message', function (message) {
    var cloudevent = parseMessage(message.getData());
    runActions(message, cloudevent);
  });
  console.log("AWS Connector ready.");
});

nats.on('close', function () {
  console.log("Connection closed");
});

/**
* Parse Message as Cloudevent
*/
function parseMessage(message) {
  try {
    var json = JSON.parse(message);
    return cloudeventParser(json);
  } catch (e) {
    console.log('AWS:', e);
  }
}

/**
* Run Actions when a matching Event occured
*/
function runActions(message, cloudevent) {
  var someActionStarted = false;
  
  config.aws.actions.forEach((action) => {
    if (action.eventType == cloudevent.getType()) {
      var filterValid = false;
      if (action.filter) {
        action.filter.forEach((filter) => {
          if (filter.regex && cloudevent.getSource().match(filter.regex)) {
            filterValid = true;
          }
        });
      } else {
        filterValid = true;
      }
      if (filterValid) {
        console.log('AWS:', 'Received', action.eventType);
        someActionStarted = true;
        var params = {
          FunctionName: action.functionName,
          InvocationType: 'Event',
          LogType: 'None',
          Payload: cloudevent.toString()
        };
        lambda.invoke(params, function(err, data) {
          if (err) {
            console.log('AWS:', err);
          } else {
            message.ack();
            console.log('AWS:', 'Invocation of ' + action.functionName + ' was successful');
          }
        })
      }
    }
  });
  
  if(!someActionStarted) {
    message.ack();
  }
}

// Close Connection to NATS when application is killed
process.on('SIGTERM', (signal) => {
  nats.close();
});
