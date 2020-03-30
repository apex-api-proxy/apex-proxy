const apexLogger = require('./log');

module.exports = () => {
  return (incomingRequest, outgoingResponse) => {
  	const headers = outgoingResponse.req.headers;
  	const correlationId = headers['X-Apex-Correlation-ID'];
    const body = outgoingResponse.locals.body.toString();
    const status = outgoingResponse.statusCode;

    apexLogger.sendLog(correlationId, headers, body, status);

    outgoingResponse.send(body);
  };
};
