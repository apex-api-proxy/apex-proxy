const https = require('https');
const querystring = require('querystring');

const TIMEOUT = 10;
const MAX_RETRY_ATTEMPTS = 2;
const BACKOFF = 2000;

// Also add tracing and logging logic to the proxy
module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    let timeoutId;

    const incomingRequestPathWithQuery =
      incomingRequest.path + '?' + querystring.stringify(incomingRequest.query);

    const outgoingRequestOptions = {
      method: incomingRequest.method,
      hostname: incomingRequest.headers['host'],
      port: 443,
      path: incomingRequestPathWithQuery,
      headers: incomingRequest.headers,
    };

    // Probably pass in arguments for all dependencies of sendOutgoingRequest
    const sendOutgoingRequest = () => {
      let incomingResponseBody = '';
      let incomingResponseChunks = [];

      const outgoingRequest = https.request(
        outgoingRequestOptions,
        (incomingResponse) => {
          incomingResponse.on('data', (d) => {
            // Any other possibilities for how responses are sent, except for in chunks?
            if (incomingResponse.headers['transfer-encoding'] === 'chunked') {
              incomingResponseChunks.push(d);
            } else {
              incomingResponseBody += d;
            }
          });

          incomingResponse.on('end', () => {
            clearTimeout(timeoutId);

            outgoingResponse.status(incomingResponse.statusCode);
            outgoingResponse.set(incomingResponse.headers);

            if (incomingResponseChunks.length > 0) {
              outgoingResponse.locals.body = Buffer.concat(
                incomingResponseChunks,
              );
            } else {
              outgoingResponse.locals.body = incomingResponseBody;
            }

            next();
          });
        },
      );

      outgoingRequest.on('error', (error) => {
        console.error(error);
      });

      outgoingRequest.write(incomingRequest.body);

      outgoingRequest.end();

      return outgoingRequest;
    };

    const retryOutgoingRequest = (currentOutgoingRequest, retriesCount) => {
      timeoutId = setTimeout(() => {
        currentOutgoingRequest.abort();

        console.log(`Timed out after ${TIMEOUT}ms`);

        if (retriesCount < MAX_RETRY_ATTEMPTS) {
          setTimeout(() => {
            console.log(`Backed off for ${BACKOFF}ms`);
            const retriedOutgoingRequest = sendOutgoingRequest();

            retryOutgoingRequest(retriedOutgoingRequest, retriesCount + 1);

            retriesCount += 1;
            console.log(`Retry attempt #${retriesCount}`);
          }, BACKOFF);
        } else {
          outgoingResponse.status(504).end();
        }
      }, TIMEOUT);
    };

    const firstOutgoingRequest = sendOutgoingRequest();

    retryOutgoingRequest(firstOutgoingRequest, 0);
  };
};
