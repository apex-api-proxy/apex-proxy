const AuthError = require('../helpers/AuthError');
const ServiceDiscoveryError = require('../helpers/ServiceDiscoveryError');
const ServiceTimeoutError = require('../helpers/ServiceTimeoutError');

module.exports = () => {
  return (err, incomingRequest, outgoingResponse, next) => {
    if (
      err.constructor === AuthError ||
      err.constructor === ServiceDiscoveryError ||
      err.constructor === ServiceTimeoutError
    ) {
      outgoingResponse.locals.body = err.message;
    }

    next();
  };
};
