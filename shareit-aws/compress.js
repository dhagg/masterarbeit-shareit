'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamo = new AWS.DynamoDB.DocumentClient();
const sharp = require('sharp');

/**
* Read an Image from S3 Bucket, Compresses and Resizes it and writes it back to S3.
*/
module.exports.compress = (event, context, callback) => {
  compress(event.data.s3.object.key);
};

function compress(img) {
  var params = { Bucket: process.env.PHOTOBUCKET, Key: img };
  s3.getObject(params, function(err, data) {
    if (err) { return console.log(err); }
    return sharp(data.Body)
      .resize({ width: 700, height: 1400, fit: 'inside' })
      .jpeg({quality: 75})
      .toBuffer()
      .then((buffer) => {

        params.Key = params.Key.replace("upload/", "compressed/");
        params.Body = buffer;

        s3.putObject(params, function(err, data) {
          if (err) { return console.log(err); }

          var id = params.Key.replace("compressed/", "").replace(".jpg", "");

          updateCompressedPath(id, params.Key).then(() => {
            return console.log("Done");
          }).catch((err) => {
            return console.log(err);
          });
        });
      });
  });
};

/**
* Update CompressedUrl in DynamoDB.
*/
function updateCompressedPath(id, path) {
  return dynamo.update({
    TableName: process.env.DB,
    Key: {
      id: id
    },
    UpdateExpression: "set url_compressed=:a",
    ExpressionAttributeValues:{
      ":a":path
    }
  }).promise();
}