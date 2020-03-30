const apexLogger = require('./log');

module.exports = () => {
  return (incomingRequest, outgoingResponse) => {
    const body = outgoingResponse.locals.body;

    outgoingResponse.send(body);
  };
};
