const { sendLog } = require('./apexLogger');

const outgoingResponseLogSender = (outgoingResponse) => {
  const correlationId = outgoingResponse.locals.apexCorrelationId;
  const headers = outgoingResponse.getHeaders();
  const status = outgoingResponse.statusCode;
  const body = outgoingResponse.locals.body;

  return () => {
    return sendLog(correlationId, headers, body, status).then(() => {
      console.log('just logged outgoingResponse above');
    });
  };
};

module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const logSendersQueue = outgoingResponse.locals.logSendersQueue;

    logSendersQueue.enqueue(outgoingResponseLogSender(outgoingResponse));

    next();
  };
};
