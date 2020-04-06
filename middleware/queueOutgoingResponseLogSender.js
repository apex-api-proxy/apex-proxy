const { sendLog } = require('./apexLogger');

const outgoingResponseLogSender = (outgoingResponse) => {
  const correlationId = outgoingResponse.locals.apexCorrelationId;
  const statusCode = outgoingResponse.statusCode;
  const headers = outgoingResponse.getHeaders();
  const body = outgoingResponse.locals.body;

  return () => {
    return sendLog({ correlationId, statusCode, headers, body }).then(() => {
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
