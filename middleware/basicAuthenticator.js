const basicAuth = require('basic-auth');

class Service {
  static findOne(credentials) {
    const stubbedCredentials = {
      name: 'postman',
      pass: '8932407sfdl',
    };

    return new Promise((resolve, reject) => {
      if (credentials.name !== stubbedCredentials.name) {
        reject();
      } else if (credentials.pass !== stubbedCredentials.pass) {
        reject();
      }

      resolve();
    });
  }
}

module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const proxyAuthorizationHeader =
      incomingRequest.headers['proxy-authorization'];

    if (proxyAuthorizationHeader === undefined) {
      outgoingResponse.status(407);
      outgoingResponse.set({ 'Proxy-Authenticate': 'Basic' });

      next(
        new Error(
          "Request must be authenticated with the 'Proxy-Authorization' header",
        ),
      );
    } else {
      const credentials = basicAuth.parse(proxyAuthorizationHeader);

      console.log(credentials);

      if (credentials === undefined) {
        outgoingResponse.status(403);

        next(new Error('The supplied authentication credentials are invalid.'));
      } else {
        Service.findOne(credentials).then(next, () => {
          outgoingResponse.status(403);

          next(
            new Error(
              'A service could not be found or authenticated with the supplied credentials.',
            ),
          );
        });
      }
    }
  };
};
