'use strict';

const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

/**
* Read Meta-Data of uploaded photos from DynamoDB and return it to Browser.
*/
module.exports.get = (event, context, callback) => {
  if (event.httpMethod == "GET") {
    return readPhotos().then((photos) => {
      successResponse(photos.Items, callback);
    }).catch((err) => {
      errorResponse(err.message, 500, context.awsRequestId, callback);
    });
  }
};

function readPhotos(team) {
  return dynamo.scan({
    TableName: process.env.DB,
  }).promise();
}

function successResponse(photos, callback) {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      photos: photos
    }),
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
    },
  });
}

function errorResponse(errorMessage, statusCode, awsRequestId, callback) {
  console.log("error");
  callback(null, {
    statusCode: statusCode,
    body: JSON.stringify({
      errorMessage: errorMessage,
      Reference: awsRequestId,
    }),
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
      "Content-Type": "text/plain",
    },
  });
}
