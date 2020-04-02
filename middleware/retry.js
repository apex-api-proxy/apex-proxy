const fs = require('fs');
const yaml = require('js-yaml');

module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    let config;

    if (res.locals.config) {
      config = res.locals.config;
    } else {
      next();
    }

    const MAX_RETRY_ATTEMPTS = config['max retry attempts'];
    const BACKOFF = config['backoff'];

    let retriesCount = 0;

    const resendOutgoingRequest = (sendOutgoingRequest) => {
      if (retriesCount < MAX_RETRY_ATTEMPTS) {
        setTimeout(() => {
          console.log(`Backed off for ${BACKOFF}ms`);

          console.log('sendOutgoingRequest:', sendOutgoingRequest);
          sendOutgoingRequest().then(next, resendOutgoingRequest);

          retriesCount += 1;
          console.log(`Retried request (attempt #${retriesCount})\n`);
        }, BACKOFF);
      } else {
        outgoingResponse.status(504);
        next();
      }
    };

    outgoingResponse.locals
      .sendOutgoingRequest()
      .then(next, resendOutgoingRequest);
  };
};
