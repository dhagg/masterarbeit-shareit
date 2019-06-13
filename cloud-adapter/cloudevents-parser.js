'use strict'

const CloudEvent = require('cloudevents-sdk');

module.exports = function (json) {
  if (json.cloudEventsVersion && json.cloudEventsVersion == '0.1' && json.eventType) {
    var cloudevent = new CloudEvent();
    cloudevent.type(json.eventType);
    if (json.eventTypeVersion)
      cloudevent.eventTypeVersion(json.eventTypeVersion);
    if (json.source)
      cloudevent.source(json.source);
    if (json.eventID)
      cloudevent.id(json.eventID);
    if (json.eventTime)
      cloudevent.time(parseISOString(json.eventTime));
    if (Date.parse(json.contentType))
      cloudevent.contenttype(json.contentType);
    if (json.data)
      cloudevent.data(json.data);
    
    if (json.extensions) {
      json.extensions.forEach((extension) => {
        if (extension.key && extension.value) {
          cloudevent.addExtension(extension.key, extension.value);
        }
      });
    }
    return cloudevent;
  }
  throw 'CloudEvent parsing failed.';
}

function parseISOString(s) {
  var b = s.split(/\D+/);
  return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}
