'use strict';

var AWS = require('aws-sdk');
AWS.config.update({region: process.env.REGION});
var SNS = new AWS.SNS({apiVersion: '2010-03-31'});

/**
* Emits a Event.
*/
module.exports = async (cloudevent, callback = false) => {
  sendToSNS(cloudevent);
  
  if (callback) {
    callback();
  }
};

function sendToSNS(cloudevent) {
  var params = {
    Message: cloudevent.toString(),
    TopicArn: process.env.SNS_TOPIC_ARN,
    MessageAttributes: {
      'type': {
        DataType: 'String',
        StringValue: cloudevent.getType()
      },
      'source': {
        DataType: 'String',
        StringValue: cloudevent.getSource()
      }
    }
  };
  
  SNS.publish(params).promise()
  .then((data) => {
    console.log("Message", params.Message, "send sent to the topic", params.TopicArn, "}");
    console.log("MessageID is " + data.MessageId);
  })
  .catch((err) => {
    console.error(err, err.stack);
  });
}