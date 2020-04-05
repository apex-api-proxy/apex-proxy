const redis = require('redis');
const fs = require('fs');
const yaml = require('js-yaml');

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
          const defaultConfig = yaml.safeLoad(fs.readFileSync('config/defaultConfig.yml', 'utf8'));

          outgoingResponse.locals.config = defaultConfig;
        } else {
          outgoingResponse.locals.config = config;
        }

        next();
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

// ({
//   'service-credentials': {
//     postman: '8932407sfdl',
//     dagpay: '98w34lssdf',
//   },

//   'service-hosts': {
//     postman: '42.56.144.53',
//     dagpay: '53.55.63.153',
//   },

//   // global defaults
//   'default:default': {
//     'timeout': 10000,
//     'max-retry-attempts': 4,
//     'backoff': 3500,
//   },

//   // service overrides
//   'postman:dagpay': {
//     timeout: 10000,
//     'max-retry-attempts': 4,
//     backoff: 3500,
//   },

//   'dagpay:postman': {
//     timeout: 10000,
//     'max-retry-attempts': 4,
//     backoff: 3500,
//   },
// });

// const CONFIG_KEY = 'test';

// module.exports = () => {
//   return (outgoingRequest, outgoingResponse, next) => {
//     const client = redis.createClient(PORT, HOST);
//     const headers = outgoingRequest.headers;
//     // const CONFIG_KEY = headers['X-Forwarded-For'] + headers['X-Forwarded-Port'] + headers['Host'];

//     client.on('connect', () => {
//       client.get(CONFIG_KEY, (err, reply) => {
//         if (reply) {
//           outgoingResponse.locals.config = reply;
//         } else {
//           outgoingResponse.locals.config = yaml.safeLoad(
//             fs.readFileSync('config/defaultConfig.yml', 'utf8'),
//           );
//         }

//         console.log(
//           'connect outgoingResponse.locals.config',
//           outgoingResponse.locals.config,
//         );
//         outgoingResponse.send(outgoingResponse.locals.config);
//         // outgoingResponse.send(outgoingResponse.locals.config);
//         // next();
//       });
//     });

//     client.on('error', () => {
//       console.log('Error connecting to configuration store.');
//       try {
//         outgoingResponse.locals.config = yaml.safeLoad(
//           fs.readFileSync('config/defaultConfig.yml', 'utf8'),
//         );
//       } catch (e) {
//         console.log(e);
//       }

//       console.log(
//         'no connect outgoingResponse.locals.config',
//         outgoingResponse.locals.config,
//       );
//       outgoingResponse.send('failed to connect');
//       // outgoingResponse.send(outgoingResponse.locals.config);
//       // next();
//     });
//   };
// };

/* all client microservices must set the following headers:
X-Apex-Requester // calling service's unique name, as specified in admin portal
X-Apex-Responder // called service's unique name, as specified in admin portal

Incorrect values will result in application of global configuration rules
*/

// 'X-Apex-Host': 'dagpay'
