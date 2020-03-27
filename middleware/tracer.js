const uuid = require('uuid');

const appendApexCorrelationIdToRequest = (headers) => {
  let [correlationIdHeaderName, correlationId] = getApexCorrelationIdHeader(
    headers,
  );

  if (correlationIdHeaderName === null) {
    correlationId = uuid.v4();
    return [
      { ...headers, 'X-Apex-Correlation-ID': correlationId },
      correlationId,
    ];
  }

  if (!correlationId) {
    correlationId = uuid.v4();

    return [
      { ...headers, [correlationIdHeaderName]: correlationId },
      correlationId,
    ];
  }

  return [headers, correlationId];
};

const appendApexCorrelationIdToResponse = (headers, requestCorrelationId) => {
  let [
    correlationIdHeaderName,
    existingCorrelationId,
  ] = getApexCorrelationIdHeader(headers);

  if (correlationIdHeaderName === null) {
    return { ...headers, 'X-Apex-Correlation-ID': requestCorrelationId };
  }

  if (existingCorrelationId !== requestCorrelationId) {
    return { ...headers, [correlationIdHeaderName]: requestCorrelationId };
  }

  return headers;
};

const getApexCorrelationIdHeader = (headers) => {
  for (const h in headers) {
    if (h.toLowerCase() === 'x-apex-correlation-id') {
      return [h, headers[h]];
    }
  }

  return [null, null];
};

module.exports = {
  traceRequest: () => {
    return (req, res, next) => {
      console.log('tracing request');
      let apexCorrelationId;

      [req.headers, apexCorrelationId] = appendApexCorrelationIdToRequest(
        req.headers,
      );

      res.locals.apexCorrelationId = apexCorrelationId;

      next();
    };
  },

  traceResponse: () => {
    return (req, res, next) => {
      const resHeaders = res.getHeaders();
      const apexCorrelationId = res.locals.apexCorrelationId;

      const resHeadersWithCorrelationId = appendApexCorrelationIdToResponse(
        resHeaders,
        apexCorrelationId,
      );

      res.set(resHeadersWithCorrelationId);

      next();
    };
  },
};
