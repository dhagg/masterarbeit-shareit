'use strict';

const request = require('request');

/**
* Emits a Event.
*/
module.exports = (cloudevent, callback = false) => {
  sendToEventGrid(cloudevent.source('#' + cloudevent.getSource()), process.env.AZURE_EVENTGATEWAY_URL, process.env.AZURE_EVENTGATEWAY_KEY, () => {
    if (callback) {
      callback();
    }
  });
};

function sendToEventGrid(cloudevent, url, key, callback = false) {
  const options = {
    uri: url,
    body: JSON.stringify(cloudevent.payload),
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
