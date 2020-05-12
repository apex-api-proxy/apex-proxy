const querystring = require('querystring');
const getTimestamp = require('../helpers/timestamp');

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

const incomingRequestLog = (incomingRequest) => {
  const queryParams = incomingRequest.query;
  let incomingRequestPath = incomingRequest.path;

  if (Object.keys(queryParams).length > 0) {
    incomingRequestPath = incomingRequestPath + '?' + querystring.stringify(queryParams);
  }

  const timestamp = getTimestamp();
  const headers = scrubApexAuthorizationHeader(incomingRequest.headers);
  const correlation_id = headers['X-Apex-Correlation-ID'];
  const method = incomingRequest.method;
  const host = incomingRequest.headers['host'];
  const port = PORT;
  const path = incomingRequestPath;
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

module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    outgoingResponse.locals.logsQueue.enqueue(incomingRequestLog(incomingRequest));

    next();
  };
};
