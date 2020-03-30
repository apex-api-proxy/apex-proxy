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

          sendOutgoingRequest().then(next, resendOutgoingRequest);

          retriesCount += 1;
          console.log(`Retried request (attempt #${retriesCount})\n`);
        }, BACKOFF);
      } else {
        outgoingResponse.status(504);

        const correlationId = incomingRequest.header['X-Apex-Correlation-ID'];
        const headers = incomingRequest.headers;
        apexLogger.sendLog(correlationId, headers, null, 504);
        next();
      }
    };

    outgoingResponse.locals
      .sendOutgoingRequest()
      .then(next, resendOutgoingRequest);
  };
};
