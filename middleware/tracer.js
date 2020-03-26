const uuid = require('uuid');

const appendApexCorrelationId = (headers) => {
  let correlationIdHeaderName;

  for (const h in headers) {
    if (h.toLowerCase() === 'x-apex-correlation-id') {
      correlationIdHeaderName = h;
    }
  }

  if (
    correlationIdHeaderName === undefined ||
    !headers[correlationIdHeaderName]
  ) {
    return { ...headers, 'X-Apex-Correlation-ID': uuid.v4() };
  }

  return headers;
};

module.exports = () => {
  return (req, res, next) => {
    req.headers = appendApexCorrelationId(req.headers);

    next();
  };
};
