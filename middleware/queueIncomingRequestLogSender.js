const querystring = require('querystring');
const { sendLog } = require('./apexLogger');

const PORT = process.env.PORT;

const scrubApexAuthorizationHeader = (headers) => {
  const authorizationHeaderName = getApexAuthorizationHeaderName(headers);

  return { ...headers, [authorizationHeaderName]: '[scrubbed]' };
};

const getApexAuthorizationHeaderName = (headers) => {
  for (const headerName in headers) {
    if (headerName.toLowerCase() === 'x-apex-authorization') {
      // Return early, assuming there's exactly 1 header whose name
      // matches 'x-apex-authorization'
      return headerName;
    }
  }
};

const incomingRequestLogSender = (incomingRequest, outgoingResponse) => {
  const queryParams = incomingRequest.query;
  let incomingRequestPath = incomingRequest.path;

  if (Object.keys(queryParams).length > 0) {
    incomingRequestPath = incomingRequestPath + '?' + querystring.stringify(queryParams);
  }

  const method = incomingRequest.method;
  const host = incomingRequest.headers['host'];
  const port = PORT;
  const path = incomingRequestPath;
  const headers = scrubApexAuthorizationHeader(incomingRequest.headers);
  const body = incomingRequest.body;
  const correlationId = headers['X-Apex-Correlation-ID'];

  return async () => {
    let result;

    await outgoingResponse.locals.connectToLogsDb.then((client) => {
      result = sendLog({ client, correlationId, method, host, port, path, headers, body }).then(
        () => {
          console.log('just logged incomingRequest above');
        },
      );
    });

    return result;
  };
};

module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const logSendersQueue = outgoingResponse.locals.logSendersQueue;

    logSendersQueue.enqueue(incomingRequestLogSender(incomingRequest, outgoingResponse));

    next();
  };
};
