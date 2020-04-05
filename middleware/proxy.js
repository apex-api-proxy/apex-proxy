const https = require('https');
const querystring = require('querystring');
const { sendLog } = require('./apexLogger');

const OUTGOING_REQUEST_PORT = 443;

const generateOutgoingRequestOptions = (incomingRequest, outgoingResponse) => {
  const queryParams = incomingRequest.query;
  let incomingRequestPath = incomingRequest.path;

  if (Object.keys(queryParams).length > 0) {
    incomingRequestPath = incomingRequestPath + '?' + querystring.stringify(queryParams);
  }

  return {
    method: incomingRequest.method,
    hostname: outgoingResponse.locals.respondingServiceHost,
    port: OUTGOING_REQUEST_PORT,
    path: incomingRequestPath,
    headers: incomingRequest.headers,
  };
};

const buildOutgoingResponse = (incomingResponse, incomingResponseBody, outgoingResponse) => {
  outgoingResponse.status(incomingResponse.statusCode);
  outgoingResponse.set(incomingResponse.headers);
  outgoingResponse.locals.body = incomingResponseBody;
};

const outgoingRequestLogSender = (incomingRequest, outgoingRequest, outgoingResponse) => {
  const method = outgoingRequest.method;
  const host = outgoingResponse.locals.respondingServiceHost;
  const port = OUTGOING_REQUEST_PORT;
  const path = outgoingRequest.path;
  const headers = incomingRequest.headers;
  const body = incomingRequest.body;
  const correlationId = incomingRequest.headers['X-Apex-Correlation-ID'];

  return () => {
    return sendLog(correlationId, headers, body).then(() => {
      console.log('just logged outgoingRequest above');
    });
  };
};

const incomingResponseLogSender = (incomingResponse, incomingResponseBody, outgoingResponse) => {
  const correlationId = outgoingResponse.locals.apexCorrelationId;
  const headers = incomingResponse.headers;
  const body = incomingResponseBody;
  const status = incomingResponse.statusCode;

  return () => {
    return sendLog(correlationId, headers, body, status).then(() => {
      console.log('just logged incomingResponse above');
    });
  };
};

module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const config = outgoingResponse.locals.config;
    const TIMEOUT = Number(config['timeout']);
    const outgoingRequestOptions = generateOutgoingRequestOptions(
      incomingRequest,
      outgoingResponse,
    );

    outgoingResponse.locals.sendOutgoingRequest = () => {
      return new Promise((resolve, reject) => {
        const logSendersQueue = outgoingResponse.locals.logSendersQueue;
        let timeoutId;

        const outgoingRequest = https.request(outgoingRequestOptions, (incomingResponse) => {
          const incomingResponseChunks = [];
          let incomingResponseBody;

          incomingResponse.on('data', function (d) {
            // Any other possibilities for how responses are sent, except for in chunks?
            // How about streams or, more generally, very large files?
            incomingResponseChunks.push(d);
          });

          incomingResponse.on('end', () => {
            // Ensure that we don't build outgoingResponse if outgoingRequest was aborted;
            // otherwise buildOutgoingResponse() below would throw error
            if (incomingResponse.aborted === false) {
              clearTimeout(timeoutId);

              incomingResponseBody = Buffer.concat(incomingResponseChunks);

              logSendersQueue.enqueue(
                incomingResponseLogSender(incomingResponse, incomingResponseBody, outgoingResponse),
              );

              buildOutgoingResponse(incomingResponse, incomingResponseBody, outgoingResponse);

              resolve();
            }
          });
        });

        outgoingRequest.on('error', (error) => {
          console.log('error while proxy was sending outgoingRequest:');
          console.log(error);
          console.log('\n');
        });

        outgoingRequest.write(incomingRequest.body);

        outgoingRequest.end();

        logSendersQueue.enqueue(
          outgoingRequestLogSender(incomingRequest, outgoingRequest, outgoingResponse),
        );

        timeoutId = setTimeout(() => {
          outgoingRequest.abort();

          console.log(`Timed out after ${TIMEOUT}ms\n`);

          reject(outgoingResponse.locals.sendOutgoingRequest);
        }, TIMEOUT);
      });
    };

    next();
  };
};
