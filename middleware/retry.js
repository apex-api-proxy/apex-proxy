const MAX_RETRY_ATTEMPTS = 2;
const BACKOFF = 4000;

module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
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
        next();
      }
    };

    // Send outgoingRequest for the 1st time
    outgoingResponse.locals
      .sendOutgoingRequest()
      .then(next, resendOutgoingRequest);
  };
};
