const { sendLog } = require('./apexLogger');

const logOutgoingResponse = (outgoingResponse) => {
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
  return (incomingRequest, outgoingResponse) => {
    const body = outgoingResponse.locals.body;
    const logSendersQueue = outgoingResponse.locals.logSendersQueue;

    logSendersQueue.enqueue(logOutgoingResponse(outgoingResponse));

    logSendersQueue.sendAllLogs();

    outgoingResponse.send(body);
  };
};
