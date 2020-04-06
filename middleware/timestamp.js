const timestamp = require('time-stamp');

module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    outgoingResponse.locals.timestamp = timestamp('YYYY/MM/DD:mm:ss');

    next();
  };
};
