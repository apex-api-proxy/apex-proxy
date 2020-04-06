const ServiceTimeoutError = require('../helpers/ServiceTimeoutError');

module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const config = outgoingResponse.locals.config;

    const MAX_RETRY_ATTEMPTS = Number(config['max-retry-attempts']);
    const BACKOFF = Number(config['backoff']);

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

        next(
          new ServiceTimeoutError(
            `Apex retried your request ${MAX_RETRY_ATTEMPTS} additional time(s), but every request timed out.`,
          ),
        );
      }
    };

    // Send outgoingRequest for the 1st time
    outgoingResponse.locals.sendOutgoingRequest().then(next, resendOutgoingRequest);
  };
};
