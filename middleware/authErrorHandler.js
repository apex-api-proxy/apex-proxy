module.exports = () => {
  return (err, incomingRequest, outgoingResponse, next) => {
    outgoingResponse.locals.body = err.message;

    next();
  };
};
