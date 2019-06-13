'use strict'

/**
* Cloud Adapter to connect NATS to Event grid.
* Listens on the configured NATS subject and sends all Non-Azure-Events to Event Grid.
* This file is complete configurable from config.js
*/

const NatsStreaming = require('node-nats-streaming');
const request = require('request');
const cloudeventParser = require('./cloudevents-parser.js');
const config = require('./config.js')

var nats = NatsStreaming.connect(config.nats.clusterID, config.eventgrid.clientID + "-to", config.nats.url);

// Connect to NATS ans listen to the configured subject
nats.on('connect', function () {
  var opts = nats.subscriptionOptions();
  opts.setDeliverAllAvailable();
  opts.setDurableName(config.eventgrid.clientID);
  opts.setManualAckMode(true);

  var subscription = nats.subscribe(config.nats.subject, opts);
  subscription.on('message', function (message) {
    var cloudevent = parseMessage(message.getData());
    // Check if it is not a Azure Event
    if (!cloudevent.getType().startsWith(config.eventgrid.prefix)) {
      sendToEventGrid(message, cloudevent);
    } else {
      message.ack();
    }
  });
  console.log('To-EventGrid Adapter ready.');
});

nats.on('close', function () {
  console.log('To-EventGrid:', 'Connection closed');
});

/**
* Parse Message as Cloudevent
*/function parseMessage(message) {
  try {
    var json = JSON.parse(message);
    return cloudeventParser(json);
  } catch (e) {
    console.log('To-EventGrid:', e);
  }
}

/**
* Send it to EventGrid via HTTPS-Endpoint
*/
function sendToEventGrid(message, cloudevent) {
  cloudevent.source('#' + cloudevent.getSource());
  var params = {
    headers: {
      'aeg-sas-key': config.eventgrid.key,
      'content-type': 'application/json',
    },
    body: cloudevent.toString(),
  }
  request.post(config.eventgrid.url, params, (err, res, body) => {
    if (err) { return console.log('To-EventGrid:', err); }
    message.ack();
    console.log('To-EventGrid:', 'Event ' + cloudevent.getType() + ' successfully emitted.');
  });
}

// Close Connection to NATS when application is killed
process.on('SIGTERM', (signal) => {
  nats.close();
});
