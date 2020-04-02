const redis = require('redis');
const fs = require('fs');
const yaml = require('js-yaml');

const PORT = process.env.REDIS_PORT;
const HOST = process.env.REDIS_IP;
const CONFIG_KEY = 'test';

module.exports = () => {
  return (outgoingRequest, outgoingResponse, next) => {
    const client = redis.createClient(PORT, HOST);
    const headers = outgoingRequest.headers;
    // const CONFIG_KEY = headers['X-Forwarded-For'] + headers['X-Forwarded-Port'] + headers['Host'];

    client.on('connect', () => {
      client.get(CONFIG_KEY, (err, reply) => {
        if (reply) {
          outgoingResponse.locals.config = reply;
        } else {
          outgoingResponse.locals.config = yaml.safeLoad(
            fs.readFileSync('config/defaultConfig.yml', 'utf8'),
          );
        }

        console.log(
          'connect outgoingResponse.locals.config',
          outgoingResponse.locals.config,
        );
        outgoingResponse.send(outgoingResponse.locals.config);
        // outgoingResponse.send(outgoingResponse.locals.config);
        // next();
      });
    });

    client.on('error', () => {
      console.log('Error connecting to configuration store.');
      try {
        outgoingResponse.locals.config = yaml.safeLoad(
          fs.readFileSync('config/defaultConfig.yml', 'utf8'),
        );
      } catch (e) {
        console.log(e);
      }

      console.log(
        'no connect outgoingResponse.locals.config',
        outgoingResponse.locals.config,
      );
      outgoingResponse.send('failed to connect');
      // outgoingResponse.send(outgoingResponse.locals.config);
      // next();
    });
  };
};

/* all client microservices must set the following headers:
X-Apex-Requester // calling service's unique name, as specified in admin portal
X-Apex-Responder // called service's unique name, as specified in admin portal

Incorrect values will result in application of global configuration rules
*/
