const basicAuth = require('basic-auth');

const { authenticateService } = require('./configStore');
const AuthError = require('../helpers/AuthError');

const handleNoCredentials = (outgoingResponse, next) => {
  outgoingResponse.status(407);

  next(
    new AuthError(
      "Request must be authenticated with credentials provided in the 'X-Apex-Authorization' header.",
    ),
  );
};

const handleInvalidCredentials = (outgoingResponse, next) => {
  outgoingResponse.status(400);

  next(new AuthError("The provided credentials in the 'X-Apex-Authorization' header are invalid."));
};

const handleAuthenticationSuccess = (outgoingResponse, next, serviceName) => {
  outgoingResponse.locals.requestingServiceName = serviceName;
  next();
};

const handleAuthenticationFailure = (outgoingResponse, next) => {
  outgoingResponse.status(403);

  next(
    new AuthError(
      "A service could not be found or authenticated with the credentials provided in the 'X-Apex-Authorization' header.",
    ),
  );
};

module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const proxyAuthorizationHeader = incomingRequest.headers['x-apex-authorization'];

    if (proxyAuthorizationHeader === undefined) {
      handleNoCredentials(outgoingResponse, next);
      return;
    }

    const credentials = basicAuth.parse(proxyAuthorizationHeader);

    if (credentials === undefined) {
      handleInvalidCredentials(outgoingResponse, next);
      return;
    }

    authenticateService(outgoingResponse, credentials.name, credentials.pass).then(
      () => {
        handleAuthenticationSuccess(outgoingResponse, next, credentials.name);
      },
      () => {
        handleAuthenticationFailure(outgoingResponse, next);
      },
    );
  };
};
