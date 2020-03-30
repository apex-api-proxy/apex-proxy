const apexLogger = require('./apexLogger');

module.exports = () => {
  return (incomingRequest, outgoingResponse) => {
    const correlationId = outgoingResponse.locals.apexCorrelationId;
    const headers = outgoingResponse.getHeaders();
    const body = outgoingResponse.locals.body.toString();
    const status = outgoingResponse.statusCode;

    apexLogger.sendLog(correlationId, headers, body, status).then(() => {
      console.log('just logged outgoingResponse above');
    });

    outgoingResponse.send(body);
  };
};
