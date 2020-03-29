const https = require('https');
const querystring = require('querystring');

module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const incomingRequestPathWithQuery =
      incomingRequest.path + '?' + querystring.stringify(incomingRequest.query);

    const outgoingRequestOptions = {
      method: incomingRequest.method,
      hostname: incomingRequest.headers['host'],
      port: 443,
      path: incomingRequestPathWithQuery,
      headers: incomingRequest.headers,
    };

    let incomingResponseBody = '';
    let incomingResponseChunks = [];

    const outgoingRequest = https.request(
      outgoingRequestOptions,
      (incomingResponse) => {
        incomingResponse.on('data', (d) => {
          // Any other possibilities for how responses are sent, except for in chunks?
          console.log("incomingResponse.headers['transfer-encoding']: ", incomingResponse.headers['transfer-encoding'])
          if (incomingResponse.headers['transfer-encoding'] === 'chunked') {
            incomingResponseChunks.push(d);
          } else {
            incomingResponseBody += d;
          }
        });

        incomingResponse.on('end', () => {
          outgoingResponse.status(incomingResponse.statusCode);
          outgoingResponse.set(incomingResponse.headers);

          // console.log('incomingRequest headers:', incomingRequest.headers);
          // console.log('outgoingRequest headers:', outgoingRequest.getHeaders());

          console.log('chunks: ', incomingResponseChunks);
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

    // console.log('incomingRequest.body: ', incomingRequest.body);
    outgoingRequest.write(incomingRequest.body);

    outgoingRequest.end();
  };
};
