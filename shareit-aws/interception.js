'use strict';

const CloudEvent = require('cloudevents-sdk');
const sendEvent = require('./sendEvent');

/**
* Intercept AWS Event, convert it to CloudEvent and Emit the Event.
*/
module.exports.handler = (event) => {
  event.Records.forEach((awsEvent) => {
    var cloudevent = parseEvent(awsEvent);
    sendEvent(cloudevent, () => {})
  });
};

/**
* Convert AWS to CloudEvent
* Handle each EventType differently
* AWS isn't paying attention to case-sensitivity (eventVersion vs. EventVersion)
*/
function parseEvent(awsEvent) {
  var cloudevent = new CloudEvent();
  if (awsEvent.s3) {
    cloudevent.type((awsEvent.eventSource ? toType(awsEvent.eventSource) : 'aws.s3')
      + (awsEvent.eventName ? ('.' + toType(awsEvent.eventName)) : ''));

    cloudevent.source(awsEvent.s3.bucket.arn + "/" + awsEvent.s3.object.key);

    if (awsEvent.eventVersion)
      cloudevent.eventTypeVersion(awsEvent.eventVersion);

    if (awsEvent.eventTime)
      cloudevent.time(parseISOString(awsEvent.eventTime));

    cloudevent.data(awsEvent);

  } else if (awsEvent.Sns) {
    cloudevent.type((awsEvent.eventSource ? toType(awsEvent.eventSource) : 'aws.sns')
      + (awsEvent.Sns.Type ? ('.' + toType(awsEvent.Sns.Type)) : ''));

    cloudevent.source(awsEvent.EventSubscriptionArn);

    if (awsEvent.EventVersion)
      cloudevent.eventTypeVersion(awsEvent.EventVersion);

    if (awsEvent.Sns)
      cloudevent.time(parseISOString(awsEvent.Sns.Timestamp));

    cloudevent.data(awsEvent);

  } else if (awsEvent.dynamodb) {
    cloudevent.type((awsEvent.eventSource ? toType(awsEvent.eventSource) : 'aws.dynamodb')
      + (awsEvent.eventName ? ('.' + toType(awsEvent.eventName)) : 'a'));

    cloudevent.source(awsEvent.eventSourceARN);

    if (awsEvent.eventVersion)
      cloudevent.eventTypeVersion(awsEvent.eventVersion);

    if (awsEvent.eventTime)
      cloudevent.time(parseISOString(awsEvent.eventTime));

    cloudevent.data(awsEvent);

  } else {
    cloudevent.type(awsEvent.eventSource ? toType(awsEvent.eventSource) : 'aws.unknown');
    cloudevent.source('unknown');
    cloudevent.data(awsEvent);
  }
  return cloudevent;
}

/**
* Parse AWS EventType to CloudEvent EventType
* Example: ObjectedCreated:Put -> objectcreated.put
*/
function toType(string) {
  string = string.replace(/:/g, ".");
  string = string.toLowerCase();
  return string;
}

/**
* Parse ISO Date String to Date Object
* Copied from: https://stackoverflow.com/questions/27012854/change-iso-date-string-to-date-object-javascript#answer-27013409
*/
function parseISOString(s) {
  var b = s.split(/\D+/);
  return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}
