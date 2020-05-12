const http = require('http');
const querystring = require('querystring');
const rawBody = require('raw-body');
const getTimestamp = require('../helpers/timestamp');

// const OUTGOING_REQUEST_PORT = process.env.HTTPS_PORT;
const OUTGOING_REQUEST_PORT = 3000;

const removeApexAuthorizationHeader = (headers) => {
  const {
    'x-apex-authorization': authorizationHeader,
    ...headersWithoutApexAuthorization
  } = headers;

  return headersWithoutApexAuthorization;
};

const removeApexRespondingServiceNameHeader = (headers) => {
  const {
    'x-apex-responding-service-name': respondingServiceNameHeader,
    ...headersWithoutApexRespondingServiceName
  } = headers;

  return headersWithoutApexRespondingServiceName;
};

const generateOutgoingRequestHeaders = (incomingRequest, outgoingResponse) => {
  const incomingRequestHeaders = incomingRequest.headers;

  const headersWithHost = {
    ...incomingRequestHeaders,
    Host: outgoingResponse.locals.respondingServiceHost,
  };
  const headersWithoutApexAuthorization = removeApexAuthorizationHeader(headersWithHost);
  const headersWithoutApexRespondingServiceName = removeApexRespondingServiceNameHeader(
    headersWithoutApexAuthorization,
  );

  return headersWithoutApexRespondingServiceName;
};

const generateOutgoingRequestOptions = (incomingRequest, outgoingResponse) => {
  const queryParams = incomingRequest.query;
  let incomingRequestPath = incomingRequest.path;

  if (Object.keys(queryParams).length > 0) {
    incomingRequestPath = incomingRequestPath + '?' + querystring.stringify(queryParams);
  }

  const outgoingRequestHeaders = generateOutgoingRequestHeaders(incomingRequest, outgoingResponse);

  return {
    method: incomingRequest.method,
    hostname: outgoingResponse.locals.respondingServiceHost,
    port: OUTGOING_REQUEST_PORT,
    path: incomingRequestPath,
    headers: outgoingRequestHeaders,
  };
};

const buildOutgoingResponse = (incomingResponse, incomingResponseBody, outgoingResponse) => {
  outgoingResponse.status(incomingResponse.statusCode);
  outgoingResponse.set(incomingResponse.headers);
  outgoingResponse.locals.body = incomingResponseBody;
};

const outgoingRequestLog = (incomingRequest, outgoingRequest, outgoingResponse) => {
  const timestamp = getTimestamp();
  const correlation_id = outgoingResponse.locals.apexCorrelationId;
  const method = outgoingRequest.method;
  const host = outgoingResponse.locals.respondingServiceHost;
  const port = OUTGOING_REQUEST_PORT;
  const path = outgoingRequest.path;
  const headers = generateOutgoingRequestHeaders(incomingRequest, outgoingResponse);
  const body = incomingRequest.body;

  return {
    timestamp,
    correlation_id,
    method,
    host,
    port,
    path,
    headers,
    body,
  };
};

const incomingResponseLog = (incomingResponse, incomingResponseBody, outgoingResponse) => {
  const timestamp = getTimestamp();
  const correlation_id = outgoingResponse.locals.apexCorrelationId;
  const status_code = incomingResponse.statusCode;
  const headers = incomingResponse.headers;
  const body = incomingResponseBody;

  return {
    timestamp,
    correlation_id,
    status_code,
    headers,
    body,
  };
};

module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const getIncomingRequestRawBody = rawBody(incomingRequest);

    const config = outgoingResponse.locals.config;
    const TIMEOUT = Number(config['timeout']);
    const outgoingRequestOptions = generateOutgoingRequestOptions(
      incomingRequest,
      outgoingResponse,
    );

    outgoingResponse.locals.sendOutgoingRequest = () => {
      return new Promise((resolve, reject) => {
        const logsQueue = outgoingResponse.locals.logsQueue;
        let timeoutId;

        const outgoingRequest = http.request(outgoingRequestOptions, (incomingResponse) => {
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

              logsQueue.enqueue(
                incomingResponseLog(incomingResponse, incomingResponseBody, outgoingResponse),
              );

              buildOutgoingResponse(incomingResponse, incomingResponseBody, outgoingResponse);

              resolve();
            }
          });
        });

        outgoingRequest.on('error', (error) => {
          // Already handling aborting outgoingRequest, no need to also log
          // this error to console
          if (error.message !== 'socket hang up') {
            console.log('error while proxy was sending outgoingRequest:');
            console.log(error);
            console.log('\n');
          }
        });

        getIncomingRequestRawBody.then((rawBody) => {
          outgoingRequest.end(rawBody);
        });

        logsQueue.enqueue(outgoingRequestLog(incomingRequest, outgoingRequest, outgoingResponse));

        timeoutId = setTimeout(() => {
          outgoingRequest.abort();

          console.log(`Timed out after ${TIMEOUT}ms\n`);
          console.log('---------------------------\n');

          reject(outgoingResponse.locals.sendOutgoingRequest);
        }, TIMEOUT);
      });
    };

    next();
  };
};
