const AuthError = require('../helpers/AuthError');
const ServiceDiscoveryError = require('../helpers/ServiceDiscoveryError');

module.exports = () => {
  return (err, incomingRequest, outgoingResponse, next) => {
    if (err.constructor === AuthError || err.constructor === ServiceDiscoveryError) {
      outgoingResponse.locals.body = err.message;
    }

    next();
  };
};
