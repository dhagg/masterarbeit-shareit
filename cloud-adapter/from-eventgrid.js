'use strict'

/**
* Cloud Adapter to connect SNS to NATS.
* Opens a HTTP-Endpoint and listens for incoming events.
* This file is complete configurable from config.js
*/

const NatsStreaming = require('node-nats-streaming');
const url = require('url');
const http = require('http');
const https = require('https');
const cloudeventParser = require('./cloudevents-parser.js');
const config = require('./config.js')

var nats = NatsStreaming.connect(config.nats.clusterID, config.eventgrid.clientID + "-from", config.nats.url);

var server = http.createServer(function(req, res){
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    if (!req.url.endsWith("code=" + config.eventgrid.secret_key)) {
      console.log("Unauthorized connection!");
      return;
    }
    var json = JSON.parse(body);
    if (json) {
      if (json[0] && json[0].eventType && json[0].eventType  == "Microsoft.EventGrid.SubscriptionValidationEvent") {
        // Return the ValidationCode to subscribe to Event grid
        // See: https://docs.microsoft.com/de-de/azure/event-grid/receive-events#endpoint-validation
        const response = "{ \"ValidationResponse\": \"" + json[0].data.validationCode + "\" }";
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': response.length });
        res.write(response);
      } else if (json.cloudEventsVersion && json.cloudEventsVersion == "0.1") {
        var cloudevent = parseMessage(json);
        sendToNats(cloudevent);
        res.writeHead(200);
      }
      res.end();
      return;
    }
    res.writeHead(400);
    res.end();
    return;
  });
});

// Start Server
server.listen(config.eventgrid.port);
console.log("From-EventGrid Adapter ready.");

function parseMessage(message) {
  try {
    return cloudeventParser(message);
  } catch (e) {
    console.log('From-EventGrid:', e);
  }
}

function sendToNats(cloudevent) {
  nats.publish(config.nats.subject, cloudevent.toString(), function(err, guid){
    if(err) {
      console.log('From-EventGrid:', 'publish failed: ' + err);
    } else {
      console.log('From-EventGrid:', 'published message with guid: ' + guid);
    }
  });
}

// Close Connection to NATS and stop server when application is killed
process.on('SIGTERM', (signal) => {
  nats.close();
  server.close();
  console.log('From-EventGrid:', 'Stopped');
});
