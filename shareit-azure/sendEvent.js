'use strict';

const request = require('request');

/**
* Emits a Event.
*/
module.exports = (cloudevent, callback) => {
  const options = {
    uri: process.env.AWS_TAGS,
    body: JSON.stringify(cloudevent.payload),
    headers: {
      'Content-Type': 'application/json',
      'secret_key': process.env.AWS_TAGS_KEY
    }
  };

  request.post(options, (error, response, body) => {
    if (callback) {
      callback(error);
    }
  });
};
