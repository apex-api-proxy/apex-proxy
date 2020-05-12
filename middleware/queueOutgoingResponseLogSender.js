const getTimestamp = require('../helpers/timestamp');

const outgoingResponseLog = (outgoingResponse) => {
  const timestamp = getTimestamp();
  const correlation_id = outgoingResponse.locals.apexCorrelationId;
  const status_code = outgoingResponse.statusCode;
  const headers = outgoingResponse.getHeaders();
  const body = outgoingResponse.locals.body;

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
    outgoingResponse.locals.logsQueue.enqueue(outgoingResponseLog(outgoingResponse));

    next();
  };
};
