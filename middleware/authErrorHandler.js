module.exports = () => {
  return (err, incomingRequest, outgoingResponse, next) => {
    outgoingResponse.status(403);
    outgoingResponse.locals.body =
      'Apex could not authenticate the supplied Bearer token.';

    next();
  };
};
