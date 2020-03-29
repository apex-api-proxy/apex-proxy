const https = require('https');
const querystring = require('querystring');

const TIMEOUT = 5000;

const generateOutgoingRequestOptions = (incomingRequest) => {
  const incomingRequestPathWithQuery =
    incomingRequest.path + '?' + querystring.stringify(incomingRequest.query);

  return {
    method: incomingRequest.method,
    hostname: incomingRequest.headers['host'],
    port: 443,
    path: incomingRequestPathWithQuery,
    headers: incomingRequest.headers,
  };
};

const buildOutgoingResponse = (
  incomingResponse,
  incomingResponseBody,
  outgoingResponse,
) => {
  outgoingResponse.status(incomingResponse.statusCode);
  outgoingResponse.set(incomingResponse.headers);
  outgoingResponse.locals.body = incomingResponseBody;
};

// Also add tracing and logging logic to the proxy
module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const outgoingRequestOptions = generateOutgoingRequestOptions(
      incomingRequest,
    );

    // Probably pass in arguments for all dependencies of sendOutgoingRequest
    outgoingResponse.locals.sendOutgoingRequest = () => {
      return new Promise((resolve, reject) => {
        let timeoutId;

        const outgoingRequest = https.request(
          outgoingRequestOptions,
          (incomingResponse) => {
            const incomingResponseChunks = [];
            let incomingResponseBody;

            incomingResponse.on('data', (d) => {
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

                buildOutgoingResponse(
                  incomingResponse,
                  incomingResponseBody,
                  outgoingResponse,
                );

                resolve();
              }
            });
          },
        );

        outgoingRequest.on('error', (error) => {
          // console.error(error);
        });

        outgoingRequest.write(incomingRequest.body);

        outgoingRequest.end();

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
