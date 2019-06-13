'use strict';

const request = require('request');

/**
* Sends events created in this environment to HTTP-Endpoints.
*/
module.exports.handler = (context, eventGridEvent) => {
  sendToHttpEndpoint(eventGridEvent, process.env.AWS_GATEWAY_URL, process.env.AWS_GATEWAY_KEY, () => {
    context.log("sent to AWS");
  });
};

function sendToHttpEndpoint(cloudevent, url, key, callback = false) {
  const options = {
    uri: url,
    body: JSON.stringify(cloudevent),
    headers: {
      'aeg-sas-key': key,
      'content-type': 'application/json',
    }
  };

  return request.post(options, (err, data) => {
    if(err) {
      console.log(err);
    }
  });

  if (callback) {
    callback();
  }
}
