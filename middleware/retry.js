const fs = require('fs');
const yaml = require('js-yaml');
const apexLogger = require('./log');

module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    // Extract reading config data to its own middleware?
    let config;

    try {
      config = yaml.safeLoad(fs.readFileSync('config/config.yml', 'utf8'));
    } catch (e) {
      console.log(e);
    }

    const MAX_RETRY_ATTEMPTS = config['max retry attempts'];
    const BACKOFF = config['backoff'];

    let retriesCount = 0;

    const resendOutgoingRequest = (sendOutgoingRequest) => {
      if (retriesCount < MAX_RETRY_ATTEMPTS) {
        setTimeout(() => {
          console.log(`Backed off for ${BACKOFF}ms`);

          sendOutgoingRequest().then(
            (incomingResponse) => {
              outgoingResponse.status(incomingResponse.statusCode);
              console.log('successful response status code: ', incomingResponse.statusCode);
              apexLogger.sendLog(incomingResponse);
              next(); 
            }, 
            resendOutgoingRequest
          );

          retriesCount += 1;
          console.log(`Retried request (attempt #${retriesCount})\n`);
        }, BACKOFF);
      } else {
        outgoingResponse.status(504);
        apexLogger.sendLog(outgoingResponse);
        next();
      }
    };

    outgoingResponse.locals.firstOutgoingRequest().then(
      next,
      () => resendOutgoingRequest(outgoingResponse.locals.sendOutgoingRequest),
    );
  };
};
