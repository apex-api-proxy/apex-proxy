const AuthError = require('../helpers/AuthError');
const RouterError = require('../helpers/RouterError');
const ServiceTimeoutError = require('../helpers/ServiceTimeoutError');

module.exports = () => {
  return (err, incomingRequest, outgoingResponse, next) => {
    if (
      err.constructor === AuthError ||
      err.constructor === RouterError ||
      err.constructor === ServiceTimeoutError
    ) {
      outgoingResponse.locals.body = err.message;
    }

    next();
  };
};
