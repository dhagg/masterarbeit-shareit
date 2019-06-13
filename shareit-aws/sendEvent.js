'use strict';

const CloudEvent = require('cloudevents-sdk');
const request = require('request');

/**
* Emits a Event.
*/
module.exports = async (cloudevent, callback) => {
  if (cloudevent.getType().startsWith("aws.s3.objectcreated")) {
    if (cloudevent.getSource().startsWith("arn:aws:s3:::" + process.env.PHOTOBUCKET + "/compressed/")) {
      const options = {
        uri: process.env.AZURE_IMAGERECOGNITION,
        body: cloudevent.toString(),
        headers: {
            'Content-Type': 'application/json',
        }
      };
      
      return request.post(options, async (error, response, body) => {
        if (callback) {
          callback(error);
        }
      })
    }
  }
};
