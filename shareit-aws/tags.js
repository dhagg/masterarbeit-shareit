'use strict';

const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

/**
* Writes the received tags of a photo to DynamoDB.
*/
module.exports.write = (event, context, callback) => {
  event.Records.forEach((record) => {
    writeTags(JSON.parse(record.Sns.Message).data);
  });
};

function writeTags(data) {
  if (!('tags' in data)) {
    return errorResponse('tags not found.', 400, event.awsRequestId, callback);
  }

  if (!('id' in data)) {
    return errorResponse('id not found.', 400, event.awsRequestId, callback);
  }

  let tags = data.tags;
  let id = data.id;

  updateTags(tags, id).then(() => {
    let body = JSON.stringify({
      "message": "Success"
    });
    return successResponse(body, callback);
  }).catch((err) => {
    return errorResponse(err, 500, event.awsRequestId, callback);
  });
}

function updateTags(tags, id) {
  return dynamo.update({
    TableName: process.env.DB,
    Key: {
      id: id
    },
    UpdateExpression: "set tags=:a",
    ExpressionAttributeValues:{
      ":a":tags
    }
  }).promise();
}

function successResponse(body, callback) {
  callback(null, {
    statusCode: 200,
    body: body,
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
