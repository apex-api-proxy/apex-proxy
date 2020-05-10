const express = require('express');

const {
  configStoreConnector,
  configFetcher,
  respondingServiceRouter,
} = require('../middleware/configStore');

const { sendAllLogsToDb } = require('../middleware/apexLogger');
const queueIncomingRequestLogSender = require('../middleware/queueIncomingRequestLogSender');
const queueOutgoingResponseLogSender = require('../middleware/queueOutgoingResponseLogSender');
const basicAuthenticator = require('../middleware/basicAuthenticator');
const proxy = require('../middleware/proxy');
const retry = require('../middleware/retry');
const customErrorsHandler = require('../middleware/customErrorsHandler');
const { responseTracer } = require('../middleware/tracer');
const outgoingResponseSender = require('../middleware/outgoingResponseSender');

const router = express.Router();

router.all(
  '/*',
  queueIncomingRequestLogSender(),
  configStoreConnector(),
  basicAuthenticator(),
  respondingServiceRouter(),
  configFetcher(),
  proxy(),
  retry(),
  customErrorsHandler(),
  responseTracer(),
  queueOutgoingResponseLogSender(),
  sendAllLogsToDb(),
  outgoingResponseSender(),
);

module.exports = router;
