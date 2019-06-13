'use strict'

/**
* Cloud Adapter to connect Event grid to NATS.
* Opens a HTTP-Endpoint and listens for incoming events.
* This file is complete configurable from config.js
*/

const AWS = require('aws-sdk');
const NatsStreaming = require('node-nats-streaming');
const http = require('http');
const https = require('https');
const cloudeventParser = require('./cloudevents-parser.js');
const config = require('./config.js')

AWS.config.region = config.sns.region;
var SNS = new AWS.SNS({apiVersion: '2010-03-31'});

var nats = NatsStreaming.connect(config.nats.clusterID, config.sns.clientID + "-from", config.nats.url);

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
      if (json.Type && json.Type == "SubscriptionConfirmation") {
        callSubscriptionUrl(json.SubscribeURL);
      } else if (json.Type && json.Type == "Notification") {
        parseMessage(json.Message);
      }
      res.writeHead(200);
      res.end();
      return;
    }
    res.writeHead(400);
    res.end();
    return;
  });
});

/**
* Calls the URL to Subscribe to the SNS topic.
*/
function callSubscriptionUrl(subscribeURL) {
	if (subscribeURL.startsWith("https://sns." + config.sns.region + ".amazonaws.com")) {
		https.get(subscribeURL);
	} else {
		console.log("Invalid SubscribeURL", subscribeURL);
	}
}

// Start Server
server.listen(config.sns.port);
console.log("From-SNS Adapter ready.");

function parseMessage(message) {
  try {
    var json = JSON.parse(message);
    var cloudevent = cloudeventParser(json);
    sendToNats(message, cloudevent);
  } catch (e) {
    console.log('From-SNS:', e);
  }
}

function sendToNats(cloudevent) {
  nats.publish(config.nats.subject, cloudevent.toString(), function(err, guid){
    if(err) {
      console.log('From-SNS:', 'publish failed: ' + err);
    } else {
      console.log('From-SNS:', 'published message with guid: ' + guid);
    }
  });
}

// Close Connection to NATS and stop server when application is killed
process.on('SIGTERM', (signal) => {
  nats.close();
  server.close();
  console.log('From-SNS:', 'Stopped');
});
