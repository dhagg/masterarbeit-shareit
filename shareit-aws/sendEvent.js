'use strict';

const NatsStreaming = require('node-nats-streaming');
const CloudEvent = require('cloudevents-sdk');

const config = {
  nats: {
    url: process.env.NATS,
    clusterID: 'test-cluster',
    clientID: 'awsSender',
    subject: 'share-it-nats-central'
  }
};

/**
* Emits a Event.
*/
module.exports = async (cloudevent, callback) => {
  var nats = NatsStreaming.connect(config.nats.clusterID, config.nats.clientID, config.nats.url); 
  
  nats.on('connect', async () => {
    await nats.publish(config.nats.subject, cloudevent.toString(), async () => {
      nats.close();
      if(callback) {
        callback();
      }
    });
  });
};
