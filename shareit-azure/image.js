'use strict';

const request = require('request');
const CloudEvent = require('cloudevents-sdk');
const sendEvent = require('./sendEvent');

/**
* Calls the REST API of Cognitive Services in Azure.
* Emits an CloudEvent with the tags assigned to the image.
*/
module.exports.recognition = function (context, req) {
  var imageUrl = undefined;
  var imageId = undefined;

  var reqEvent = req.body;

  // Check if the event is a CloudEvent. Read imageUrl and imageId.
  if (reqEvent.cloudEventsVersion && reqEvent.cloudEventsVersion == "0.1") {
    if (reqEvent.eventType && reqEvent.eventType.startsWith("aws.s3.objectcreated.")) {
      if (reqEvent.data && reqEvent.data.s3 && reqEvent.data.s3.bucket && reqEvent.data.s3.object)
        imageUrl = "https://s3.amazonaws.com/" + reqEvent.data.s3.bucket.name + "/" + reqEvent.data.s3.object.key;
        imageId = reqEvent.data.s3.object.key.split("/")[1].split(".")[0];
    }
  }

  if (!(imageUrl && imageId)) {
      context.res = {
          body: "imageUrl or imageId could not be found.",
      }
      context.log("imageUrl or imageId could not be found.")
      context.done();
      return;
  }

  // Options for Cognitive Services
  // See: https://westus.dev.cognitive.microsoft.com/docs/services/56f91f2d778daf23d8ec6739/operations/56f91f2e778daf14a499e1fa
  const params = {
      'visualFeatures': 'Tags',
      'details': '',
      'language': 'en'
  };

  // HTTP Options for Cognitive Services
  const options = {
      uri: process.env.COGNITIVE_SERVICE_URI,
      qs: params,
      body: '{"url": ' + '"' + imageUrl + '"}',
      headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': process.env.COGNITIVE_SERVICE_KEY
      }
  };

  // Start Request to the REST API
  request.post(options, async (error, response, body) => {
      if (error) {
          context.res = {
              body: 'Error: ' + error,
          }
          context.log(error);
          context.done();
          return;
      }

      let jsonResponse = JSON.parse(body);

      if (jsonResponse.tags) {
          // Filter tags for tags with confidence equal to or bigger than 0.7
          var tags = [];
          jsonResponse.tags.forEach(element => {
              if (element.confidence >= 0.7) {
                  tags.push(element.name);
              }
          });

          // Create CloudEvent
          var cloudevent = new CloudEvent()
              .type('azure.functions.imagerecognition.done')
              .eventTypeVersion('1.0')
              .source(imageUrl)
              .data({
                  id: imageId,
                  tags: tags
              });

          // Emit Event
          sendEvent(cloudevent, () => {
              context.done();
              return;
          })
      } else {
          context.res = {
              body: 'Error: Invalid image',
          }
          context.log('Error: Invalid image');
          context.done();
          return;
      }
  });
};
