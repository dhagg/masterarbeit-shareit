'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamo = new AWS.DynamoDB.DocumentClient();
const fileType = require('file-type');
const sha1 = require('sha1');

/**
* Upload a new Photo to the S3 Bucket and write a new entry to DynamoDB.
*/
module.exports.upload = (event, context, callback) => {
  let request = event.body;
  if (typeof request == "string") {
    request = JSON.parse(request);
  }

  if (!('base64String' in request)) {
    return errorResponse('base64String not found.', 400, event.awsRequestId, callback);
  }

  // Read Infos of Image
  let base64String = request.base64String;
  let buffer = new Buffer(base64String, 'base64');
  let fileMime = fileType(buffer);

  if (fileMime === null || fileMime.mime != "image/jpeg") {
    return errorResponse('The file supplied is not a valid JPEG.', 415, event.awsRequestId, callback);
  }

  let file = getFile(fileMime, buffer);
  let params = file.params;

  // Insert to S3
  s3.putObject(params, function(err, data) {
    if (err) {
      return errorResponse(err, 500, event.awsRequestId, callback);
    }

    var timestamp = Date.now();
    var item = {
      id: file.uploadFile.id,
      url_original: file.uploadFile.name,
      url_compressed: file.uploadFile.name,
      timestamp: timestamp
    };

    // Write Meta-Data to DynamoDB
    createDBEntry(item).then(() => {
      let body = JSON.stringify({
        "message": "Success",
        "file": file.uploadFile
      });
      return successResponse(body, callback);
    }).catch((err) => {
      return errorResponse(err, 500, event.awsRequestId, callback);
    });
  });
};

function getFile(fileMime, buffer) {
  let fileExt = fileMime.ext;
  let hash = sha1(new Buffer(new Date().toString()));
  let fileName = "upload/" + hash + '.' + fileExt;

  let params = {
    Bucket: process.env.PHOTOBUCKET,
    Key: fileName,
    Body: buffer
  };

  let uploadFile = {
    size: buffer.toString('ascii').length,
    type: fileMime.mime,
    name: fileName,
    id: hash
  };

  return {
    'params': params,
    'uploadFile': uploadFile
  };
}

function createDBEntry(item) {
  return dynamo.put({
    TableName: process.env.DB,
    Item: item,
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
