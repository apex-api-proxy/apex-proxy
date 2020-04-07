const redis = require('redis');

const ServiceDiscoveryError = require('../helpers/ServiceDiscoveryError');

const PORT = process.env.REDIS_PORT;
const HOST = process.env.REDIS_IP;

const configStoreConnector = () => {
  return (outgoingRequest, outgoingResponse, next) => {
    outgoingResponse.locals.connectToConfigStore = new Promise((resolve, reject) => {
      const client = redis.createClient(PORT, HOST);

      client.on('connect', () => {
        resolve(client);
      });

      client.on('error', (err) => {
        console.log('An error occurred while connecting to the config store:');
        console.error(err);
        console.log('\n');
      });
    });

    next();
  };
};

const authenticateService = (outgoingResponse, nameCandidate, passwordCandidate) => {
  return new Promise((resolve, reject) => {
    outgoingResponse.locals.connectToConfigStore.then((client) => {
      client.hget('service-credentials', nameCandidate, (err, password) => {
        // Currently not handling `err`, but could add logic for this later

        if (password === null) {
          // If no service exists with name `nameCandidate`
          reject();
        } else if (passwordCandidate === password) {
          resolve();
        } else {
          // If passwordCandidate is incorrect
          reject();
        }
      });
    });
  });
};

const handleNoRespondingServiceName = (outgoingResponse, next) => {
  outgoingResponse.status(400);

  next(
    new ServiceDiscoveryError(
      "Request must provide the responding service's name in the 'X-Apex-Responding-Service-Name' header.",
    ),
  );
};

const handleRespondingServiceDiscoveryFailure = (outgoingResponse, next) => {
  outgoingResponse.status(404);

  next(
    new ServiceDiscoveryError(
      "A responding service could not be found with the service name provided in the 'X-Apex-Responding-Service-Name' header.",
    ),
  );
};

const respondingServiceDiscovery = () => {
  return (incomingRequest, outgoingResponse, next) => {
    outgoingResponse.locals.connectToConfigStore.then((client) => {
      const respondingServiceName = incomingRequest.headers['x-apex-responding-service-name'];

      if (respondingServiceName === undefined) {
        handleNoRespondingServiceName(outgoingResponse, next);
        return;
      }

      client.hget('service-hosts', respondingServiceName, (err, respondingServiceHost) => {
        // Currently not handling `err`, but could add logic for this later

        if (respondingServiceHost === null) {
          handleRespondingServiceDiscoveryFailure(outgoingResponse, next);
          return;
        }

        outgoingResponse.locals.respondingServiceHost = respondingServiceHost;

        next();
      });
    });
  };
};

const configFetcher = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const requestingServiceName = outgoingResponse.locals.requestingServiceName;
    const respondingServiceName = incomingRequest.headers['x-apex-responding-service-name'];

    outgoingResponse.locals.connectToConfigStore.then((client) => {
      client.hgetall(`${requestingServiceName}:${respondingServiceName}`, (err, config) => {
        // Currently not handling `err`, but could add logic for this later
        if (config === null) {
          client.hgetall('default:default', (err, defaultConfig) => {
            // Currently not handling `err`, but could add logic for this later
            outgoingResponse.locals.config = defaultConfig;
            next();
          });
        } else {
          outgoingResponse.locals.config = config;
          next();
        }
      });
    });
  };
};

module.exports = {
  configStoreConnector,
  authenticateService,
  respondingServiceDiscovery,
  configFetcher,
};
