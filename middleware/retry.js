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
        next();
      }
    };

    console.log('in retry');
    // Send outgoingRequest for the 1st time
    // outgoingResponse.locals.sendOutgoingRequest().then(() => {
    //   console.log('got incomingResponse');
    //   next();
    // });
    // }, resendOutgoingRequest);
    outgoingResponse.locals.sendOutgoingRequest().then(
      () => {
        console.log('resolved');
      },
      () => {
        console.log('rejected');
      },
    );
  };
};
