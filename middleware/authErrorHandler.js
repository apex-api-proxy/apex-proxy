const AuthError = require('../helpers/AuthError');

module.exports = () => {
  return (err, incomingRequest, outgoingResponse, next) => {
    if (err.constructor === AuthError) {
      outgoingResponse.locals.body = err.message;
    }

    next();
  };
};
