const apexLogger = require('./apexLogger');

const logOutgoingResponse = (outgoingResponse, body) => {
  const correlationId = outgoingResponse.locals.apexCorrelationId;
  const headers = outgoingResponse.getHeaders();
  const status = outgoingResponse.statusCode;

  return () => {
    return apexLogger.sendLog(correlationId, headers, body, status).then(() => {
      console.log('just logged outgoingResponse above');
    });
  };
};

module.exports = () => {
  return (incomingRequest, outgoingResponse) => {
    const body = outgoingResponse.locals.body.toString();
    const logSendersQueue = outgoingResponse.locals.logSendersQueue;

    logSendersQueue.enqueue(logOutgoingResponse(outgoingResponse, body));

    logSendersQueue.sendAllLogs();

    outgoingResponse.send(body);
  };
};
