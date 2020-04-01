const https = require('https');
const querystring = require('querystring');
const fs = require('fs');
const yaml = require('js-yaml');
const apexLogger = require('./apexLogger');

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

module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    console.log('incomingRequest: ', incomingRequest);
    // Extract reading config data to its own middleware?
    let config;

    try {
      config = yaml.safeLoad(fs.readFileSync('config/config.yml', 'utf8'));
    } catch (e) {
      console.log(e);
    }

    const TIMEOUT = config['timeout'];

    const outgoingRequestOptions = generateOutgoingRequestOptions(
      incomingRequest,
    );

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

                const correlationId = outgoingResponse.locals.apexCorrelationId;
                const headers = incomingResponse.headers;
                const body = incomingResponseBody.toString();
                const status = incomingResponse.statusCode;

                apexLogger
                  .sendLog(correlationId, headers, body, status)
                  .then(() => {
                    console.log('just logged incomingResponse above');
                  });

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
          console.log('error while proxy was sending outgoingRequest:');
          console.error(error);
          console.log('\n');
        });

        outgoingRequest.write(incomingRequest.body);

        outgoingRequest.end();

        const correlationId = incomingRequest.headers['X-Apex-Correlation-ID'];
        const headers = incomingRequest.headers;
        const body = incomingRequest.body;
        const method = outgoingRequest.method;
        const path = outgoingRequest.path;

        apexLogger.sendLog(correlationId, headers, body).then(() => {
          console.log('just logged outgoingRequest above');
        });

        timeoutId = setTimeout(() => {
          outgoingRequest.abort();

          console.log(`Timed out after ${TIMEOUT}ms\n`);

          reject(outgoingResponse.locals.sendOutgoingRequest);
        }, TIMEOUT);
      }).catch((e) => console.log(e));
    };

    next();
  };
};
