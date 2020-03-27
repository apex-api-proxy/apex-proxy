const https = require('https');
const querystring = require('querystring');

const TIMEOUT = 1000;
const MAX_RETRY_ATTEMPTS = 2;
const BACKOFF = 2000;

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

        if (retriesCount < MAX_RETRY_ATTEMPTS) {
          setTimeout(() => {
            const retriedOutgoingRequest = sendOutgoingRequest();

            retryOutgoingRequest(retriedOutgoingRequest, retriesCount + 1);

            retriesCount += 1;
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
