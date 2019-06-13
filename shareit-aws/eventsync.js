'use strict';

const CloudEvent = require('cloudevents-sdk');
const eventParser = require('./cloudevents-parser');
const request = require('request');

/**
* Sends events created in this environment to Event Grid.
*/
module.exports.handler = (event, context, callback) => {
  event.Records.forEach((record) => {
    if(record.Sns.Type == "Notification") {
      var cloudevent = eventParser(JSON.parse(record.Sns.Message));
      sendToEventGrid(cloudevent, context)
    }
  });
};

function sendToEventGrid(cloudevent, context) {
  // Event Grid requires a source that starts with "#"
  cloudevent.source('#' + cloudevent.getSource());
  
  var params = {
    headers: {
      'aeg-sas-key': process.env.AZURE_EVENTGATEWAY_KEY,
      'content-type': 'application/json',
    },
    body: cloudevent.toString(),
  }
  
  request.post(process.env.AZURE_EVENTGATEWAY_URL, params, (err, res, body) => {
    if (err) {
      context.fail(err);
      throw new Error(err);
      return console.log(cloudevent, err);
    }
    console.log('Event ' + cloudevent.getType() + ' successfully emitted.');
    context.succeed();
  });
  
}
