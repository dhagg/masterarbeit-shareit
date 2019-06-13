'use strict'

/**
* Configuration File for NATS Cloud Adapters.
* See README.md for more infos, how to configure this file.
*/

/**
* Common Configuration
*/
module.exports.nats = {};
module.exports.nats.url = ''; // example: nats://USERNAME:PASSWORD@url.to.nats/
module.exports.nats.clusterID = 'test-cluster';
module.exports.nats.subject = 'share-it-nats-central';

/**
* Configuration for AWS
*/
module.exports.aws = {};
module.exports.aws.clientID = 'awsClient';
module.exports.aws.region = 'us-east-1';
module.exports.aws.actions = [
  {
    eventType: 'azure.functions.imagerecognition.done',
    functionName: '', // example: shareit-nats-central-dev-tags
  },
  {
    eventType: 'aws.s3.objectcreated.put',
    functionName: '', // example: shareit-nats-central-dev-compress
    filter: [
      {
        type: "source",
        regex: /\/upload\//,
      },
    ],
  },
]

/**
* Configuration for Azure
*/
module.exports.azure = {};
module.exports.azure.clientID = 'azureClient';
module.exports.azure.actions = [
  {
    eventType: 'aws.s3.objectcreated.put',
    functionUrl: '', // example: https://appname.azurewebsites.net/api/imagerecognition?code=123secretcode123
    filter: [
      {
        type: "source",
        regex: /\/compressed\//,
      },
    ],
  },
]
