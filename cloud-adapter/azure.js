'use strict'

/**
* Cloud Adapter to connect NATS to Azure.
* Listens on the configured NATS subject and calls a Azure Function when an connected event occured.
* This file is complete configurable from config.js
*/

const NatsStreaming = require('node-nats-streaming');
const request = require('request');
const cloudeventParser = require('./cloudevents-parser.js');
const config = require('./config.js')

var nats = NatsStreaming.connect(config.nats.clusterID, config.azure.clientID, config.nats.url);

// Connect to NATS ans listen to the configured subject
nats.on('connect', function () {
  var opts = nats.subscriptionOptions();
  opts.setDeliverAllAvailable();
  opts.setDurableName(config.azure.clientID);
  opts.setManualAckMode(true);
  
  var subscription = nats.subscribe(config.nats.subject, opts);
  subscription.on('message', function (message) {
    var cloudevent = parseMessage(message.getData());
    runActions(message, cloudevent);
  });
  console.log("Azure Connector ready.");
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
    console.log('Azure:', e);
  }
}

/**
* Run Actions when a matching Event occured
*/
function runActions(message, cloudevent) {
  var someActionStarted = false;
  
  config.azure.actions.forEach((action) => {
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
        console.log('Azure:', 'Received', action.eventType);
        someActionStarted = true;
        var params = {
          headers: {
            'content-type': 'application/json',
          },
          body: cloudevent.toString(),
        }
        request.post(action.functionUrl, params, (err, res, body) => {
          if (err) { return console.log(err); }
          message.ack();
          console.log('Azure:', 'Event ' + cloudevent.getType() + ' successfully emitted.');
        });
      } else {
        message.ack();
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
