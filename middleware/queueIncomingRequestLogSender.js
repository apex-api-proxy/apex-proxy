const querystring = require('querystring');
const { sendLog } = require('./apexLogger');

const incomingRequestLogSender = (incomingRequest, outgoingResponse) => {
  const queryParams = incomingRequest.query;
  let incomingRequestPath = incomingRequest.path;

  if (Object.keys(queryParams).length > 0) {
    incomingRequestPath = incomingRequestPath + '?' + querystring.stringify(queryParams);
  }

  const method = incomingRequest.method;
  const host = incomingRequest.headers['host'];
  const port = 443;
  const path = incomingRequestPath;
  const headers = incomingRequest.headers;
  const body = incomingRequest.body;
  const correlationId = headers['X-Apex-Correlation-ID'];

  return async () => {
    let result;

    await outgoingResponse.locals.connectToLogsDb.then(() => {
      result = sendLog(correlationId, headers, body).then(() => {
        console.log('just logged incomingRequest above');
      });
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
