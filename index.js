var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');

// End point
var LINEBOT_ENDPOINT_EVENTS = 'https://trialbot-api.line.me/v1/events';
var LINEBOT_ENDPOINT_PROFILES = 'https://trialbot-api.line.me/v1/profiles';
var LINEBOT_ENDPOINT_MSGCONTENT = 'https://trialbot-api.line.me/v1/bot/message/';
var LINEBOT_ENDPOINT_MSGCONTENT_CONTENT = '/content';
var LINEBOT_ENDPOINT_MSGCONTENT_PREVIEW = '/content/preview';

// Channel
var LINEBOT_BOTAPI_TOCHANNEL = 1383378250;

// Event type
var LINEBOT_EVENTTYPE_SENDMESSAGE = '138311608800106203';
var LINEBOT_EVENTTYPE_SENDMULTIMESSAGE = '140177271400161403';
var LINEBOT_EVENTTYPE_RECEIVEMESSAGE = '138311609000106303';
var LINEBOT_EVENTTYPE_RECEIVEOPERATION = '138311609100106403';

// Content type
var LINEBOT_CONTENTTYPE_TEXT = 1;
var LINEBOT_CONTENTTYPE_IMAGE = 2;
var LINEBOT_CONTENTTYPE_VIDEO = 3;
var LINEBOT_CONTENTTYPE_AUDIO = 4;
var LINEBOT_CONTENTTYPE_LOCATION = 7;
var LINEBOT_CONTENTTYPE_STICKER = 8;
var LINEBOT_CONTENTTYPE_CONTACT = 10;

// Operation type
var LINEBOT_OPTYPE_ADDFRIEND = 4;
var LINEBOT_OPTYPE_BLOCKED = 8;

// Official sticker
var LINEBOT_STK_PKGID_OFFICIAL_MIN = 1;
var LINEBOT_STK_PKGID_OFFICIAL_MAX = 4;

// Request headers
var REQEST_HEADERS = {
  'Content-Type':'application/json; charser=UTF-8',
  'X-Line-ChannelID': process.env.LINEBOT_CHANNEL_ID,
  'X-Line-ChannelSecret': process.env.LINEBOT_CHANNEL_SECRET,
  'X-Line-Trusted-User-With-ACL': process.env.LINEBOT_MID
};

// Fixie proxy
var proxyRequest = request.defaults({'proxy': process.env.FIXIE_URL});

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.post('/callback', function(req, res){
  console.log('/callback called');
  console.log(req.body);

  var result = req.body.result;
  if (!result || !result.length || !result[0].content) {
    res.status(470).send();
    console.log('/callback response error send');
    console.log(JSON.stringify(req.body.content, true));
    console.log(JSON.stringify(req.body.to, true));
    return;
  }

  res.status(200).send();
  console.log('/callback response send');

  result.forEach(function(item, index) {
    console.log('result ' + (index + 1));
    console.log(JSON.stringify(item.content, true));
    console.log(JSON.stringify(item.to, true));

    switch (item.eventType) {
    case LINEBOT_EVENTTYPE_RECEIVEMESSAGE:
      receiveMessage(req, res, item);
      break;
    case LINEBOT_EVENTTYPE_RECEIVEOPERATION:
      receiveOperation(req, res, item);
      break;
    default:
      break;
    }
  });
});


// Receiving messages
function receiveMessage(req, res, msg) {
  var eventType = LINEBOT_EVENTTYPE_SENDMESSAGE;
  var contentBody = null;

  switch (msg.content.contentType) {
  case LINEBOT_CONTENTTYPE_TEXT:
    contentBody = {
      'contentType': LINEBOT_CONTENTTYPE_TEXT,
      'toType': 1,
      'text': msg.content.text + msg.content.text
    };
    break;
  case LINEBOT_CONTENTTYPE_STICKER:
    if (LINEBOT_STK_PKGID_OFFICIAL_MIN <= msg.content.contentMetadata.STKPKGID
        && msg.content.contentMetadata.STKPKGID <= LINEBOT_STK_PKGID_OFFICIAL_MAX)
    {
      eventType = LINEBOT_EVENTTYPE_SENDMULTIMESSAGE;
      var sticker = {
        'contentType': LINEBOT_CONTENTTYPE_STICKER,
        'toType': 1,
        'contentMetadata': {
          'STKID': msg.content.contentMetadata.STKID,
          'STKPKGID': msg.content.contentMetadata.STKPKGID,
          'STKVER': msg.content.contentMetadata.STKVER
        }
      };

      contentBody = {
        'messageNotified': 0,
        'messages': [sticker, sticker]
      };
    } else {
      contentBody = {
        'contentType': LINEBOT_CONTENTTYPE_TEXT,
        'toType': 1,
        'text': 'タイオウシテイマセン……'
      };
    }
    break;
  default:
    contentBody = {
      'contentType': LINEBOT_CONTENTTYPE_TEXT,
      'toType': 1,
      'text': 'カイドクフノウデス……'
    };
    break;
  }

  var contents = {
    'to': [msg.content.from],
    'toChannel': LINEBOT_BOTAPI_TOCHANNEL,
    'eventType': eventType,
    'content': contentBody
  };

  var options = {
    url: LINEBOT_ENDPOINT_EVENTS,
    method: 'POST',
    headers: REQEST_HEADERS,
    json: true,
    body: contents
  };

  console.log('Response body = ' + JSON.stringify(contentBody, true));

  proxyRequest(options, function (error, response, body) {
    if (error) {
      console.log('Error = ' + error);
    }
    console.log('Resonse = ' + JSON.stringify(response));
    console.log('Body = ' + JSON.stringify(body));
  });
}

// Receiving operations
function receiveOperation(req, res, operation) {
  var mid = operation.content.params[0];
  var options = {
    url: LINEBOT_ENDPOINT_PROFILES + '?mids=' + mid,
    method: 'GET',
    headers: REQEST_HEADERS,
    json: true
  };

  proxyRequest(options, function (error, response, body) {
    if (error) {
      console.log('Error = ' + error);
    }
    console.log('Resonse = ' + JSON.stringify(response));
    console.log('Body = ' + JSON.stringify(body));

    var displayName = body.contacts[0].displayName;

    switch (operation.content.opType) {
    case LINEBOT_OPTYPE_ADDFRIEND:
      console.log('Added as friend by ' + displayName);
      break;
    case LINEBOT_OPTYPE_BLOCKED:
      console.log('Blocked from ' + displayName);
      return;
    default:
      return;
    }

    var contents = {
      'to': [mid],
      'toChannel': LINEBOT_BOTAPI_TOCHANNEL,
      'eventType': LINEBOT_EVENTTYPE_SENDMESSAGE,
      'content': {
        'contentType': LINEBOT_CONTENTTYPE_TEXT,
        'toType': 1,
        'text': 'ヨウコソ、' + displayName + 'サン！'
      }
    };

    var options = {
      url: LINEBOT_ENDPOINT_EVENTS,
      method: 'POST',
      headers: REQEST_HEADERS,
      json: true,
      body: contents
    };

    proxyRequest(options, function (error, response, body) {
      if (error) {
        console.log('Error = ' + error);
      }
      console.log('Resonse = ' + JSON.stringify(response, true));
      console.log('Body = ' + JSON.stringify(body, true));
    });

  });
}

app.listen(app.get('port'), function() {
  console.log('Server listening on port %s!', app.get('port'));
});
