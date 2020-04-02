const redis = require('redis');
const port = process.env.REDIS_PORT;
const host = process.env.REDIS_IP;
const fs = require('fs');
const yaml = require('js-yaml');

module.exports = () => {
	return (req, res, next) => {
		const client = redis.createClient(port, host);
		const headers = req.headers;
		const configKey = headers['X-Forwarded-For'] + headers['X-Forwarded-Port'] + headers['Host'];

		client.on('connect', () => {
		  client.get(configKey, (err, reply) => {
		    if (reply) {
		    	res.locals.config = reply;
		    } else {
		    	res.locals.config = yaml.safeLoad(fs.readFileSync('config/defaultConfig.yml', 'utf8'));
		    }

		    console.log('connect res.locals.config', res.locals.config);
		    res.send('connected!');
		    // res.send(res.locals.config);
		    // next();
		  });
		});

		client.on('error', () => {
		  console.log('Error connecting to configuration store.');
		  try {
		    res.locals.config = yaml.safeLoad(fs.readFileSync('config/defaultConfig.yml', 'utf8'));
		  } catch (e) {
		    console.log(e);
		  }

		  console.log('no connect res.locals.config', res.locals.config);
		  res.send('failed to connect');
		  // res.send(res.locals.config); 
		  // next();
		});
	}
};

/* all client microservices must set the following headers:
X-Apex-Requester // calling service's unique name, as specified in admin portal
X-Apex-Responder // called service's unique name, as specified in admin portal

Incorrect values will result in application of global configuration rules
*/