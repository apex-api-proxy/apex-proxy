const express = require('express');
const https = require('https');
const uuid = require('uuid');
const querystring = require('querystring');

const router = express.Router();

const appendApexCorrelationId = (headers) => {
  const possibleHeaders = [
    'X-Apex-Correlation-ID',
    'X-Apex-Correlation-Id',
    'x-apex-correlation-id',
  ];

  if (possibleHeaders.every((h) => !headers[h])) {
    return { ...headers, 'X-Apex-Correlation-ID': uuid.v4() };
  }
  return headers;
};

router.get('/*', (incomingRequest, outgoingResponse) => {
  const incomingRequestPathWithQuery =
    incomingRequest.path + '?' + querystring.stringify(incomingRequest.query);

  const outgoingRequestOptions = {
    method: incomingRequest.method,
    hostname: incomingRequest.headers['host'],
    port: 443,
    path: incomingRequestPathWithQuery,
    headers: appendApexCorrelationId(incomingRequest.headers),
  };

  let incomingResponseBody = '';
  let incomingResponseChunks = [];

  const outgoingRequest = https.request(
    outgoingRequestOptions,
    (incomingResponse) => {
      console.log('incomingRequest headers:', incomingRequest.headers);
      console.log('outgoingRequest headers:', outgoingRequest.getHeaders());

      incomingResponse.on('data', (d) => {
        // Any other possibilities for how responses are sent, except for in chunks?
        if (incomingResponse.headers['transfer-encoding'] === 'chunked') {
          incomingResponseChunks.push(d);
        } else {
          incomingResponseBody += d;
        }
      });

      incomingResponse.on('end', () => {
        outgoingResponse.status(incomingResponse.statusCode);
        outgoingResponse.set(incomingResponse.headers);

        if (incomingResponseChunks.length > 0) {
          outgoingResponse.send(Buffer.concat(incomingResponseChunks));
        } else {
          outgoingResponse.send(incomingResponseBody);
        }
      });
    },
  );

  outgoingRequest.on('error', (error) => {
    console.error(error);
  });

  outgoingRequest.end();
});

module.exports = router;
