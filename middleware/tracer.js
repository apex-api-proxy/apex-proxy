const uuid = require('uuid');

const APEX_CORRELATION_ID_HEADER_NAME = 'X-Apex-Correlation-ID';

const addApexCorrelationIdToRequest = (headers) => {
  let [correlationIdHeaderName, correlationId] = getApexCorrelationIdHeader(headers);

  // If incoming request doesn't already have the correlation ID header
  if (correlationIdHeaderName === null) {
    correlationId = uuid.v4();
    return [{ ...headers, [APEX_CORRELATION_ID_HEADER_NAME]: correlationId }, correlationId];
  }

  const formattedHeaders = capitalizeCorrelationIdHeaderName(headers, correlationIdHeaderName);

  // If incoming request has an empty correlation ID header
  if (!correlationId) {
    correlationId = uuid.v4();

    return [
      { ...formattedHeaders, [APEX_CORRELATION_ID_HEADER_NAME]: correlationId },
      correlationId,
    ];
  }

  // If incoming request already has a valid correlation ID header
  return [formattedHeaders, correlationId];
};

const addApexCorrelationIdToResponse = (headers, requestCorrelationId) => {
  const [correlationIdHeaderName, incomingResponseCorrelationId] = getApexCorrelationIdHeader(
    headers,
  );

  // If incoming response doesn't have the correlation ID header
  if (correlationIdHeaderName === null) {
    return {
      ...headers,
      [APEX_CORRELATION_ID_HEADER_NAME]: requestCorrelationId,
    };
  }

  const formattedHeaders = capitalizeCorrelationIdHeaderName(headers, correlationIdHeaderName);

  // If incoming response's correlation ID header value doesn't match
  // that of the outgoing request's correlation ID
  if (incomingResponseCorrelationId !== requestCorrelationId) {
    return {
      ...formattedHeaders,
      [APEX_CORRELATION_ID_HEADER_NAME]: requestCorrelationId,
    };
  }

  return formattedHeaders;
};

// Find name and value of header whose name matches 'X-Apex-Correlation-ID'
// when ignoring case
const getApexCorrelationIdHeader = (headers) => {
  for (const h in headers) {
    if (h.toLowerCase() === 'x-apex-correlation-id') {
      // Return early, assuming there's at most 1 header whose name matches
      // 'x-apex-correlation-id'
      return [h, headers[h]];
    }
  }

  return [null, null];
};

// Ensure header name matches 'X-Apex-Correlation-Id' exactly, including case
// All incomingRequest header names are downcased by Express
const capitalizeCorrelationIdHeaderName = (headers, unformattedHeaderName) => {
  if (unformattedHeaderName === APEX_CORRELATION_ID_HEADER_NAME) {
    return headers;
  }

  const result = { ...headers };

  result[APEX_CORRELATION_ID_HEADER_NAME] = result[unformattedHeaderName];

  delete result[unformattedHeaderName];

  return result;
};

module.exports = {
  requestTracer: () => {
    return (incomingRequest, outgoingResponse, next) => {
      const [headers, apexCorrelationId] = addApexCorrelationIdToRequest(incomingRequest.headers);

      incomingRequest.headers = headers;

      // Save correlation ID so it remains available later for responseTracer
      outgoingResponse.locals.apexCorrelationId = apexCorrelationId;

      next();
    };
  },

  responseTracer: () => {
    return (incomingRequest, outgoingResponse, next) => {
      const headers = outgoingResponse.getHeaders();
      const apexCorrelationId = outgoingResponse.locals.apexCorrelationId;

      const headersWithCorrelationId = addApexCorrelationIdToResponse(headers, apexCorrelationId);

      outgoingResponse.set(headersWithCorrelationId);

      next();
    };
  },
};
