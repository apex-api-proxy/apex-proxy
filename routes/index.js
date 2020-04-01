const express = require('express');
const {
  logsDbConnector,
  sendAllLogsToDb,
} = require('../middleware/apexLogger');
const queueIncomingRequestLogSender = require('../middleware/queueIncomingRequestLogSender');
const queueOutgoingResponseLogSender = require('../middleware/queueOutgoingResponseLogSender');
const authenticator = require('../middleware/authenticator');
const proxy = require('../middleware/proxy');
const retry = require('../middleware/retry');
const authErrorHandler = require('../middleware/authErrorHandler');
const { responseTracer } = require('../middleware/tracer');

const outgoingResponseSender = require('../middleware/outgoingResponseSender');

const router = express.Router();

router.get(
  '/*',
  logsDbConnector(),
  queueIncomingRequestLogSender(),
  authenticator(),
  proxy(),
  retry(),
  authErrorHandler(),
  responseTracer(),
  queueOutgoingResponseLogSender(),
  sendAllLogsToDb(),
  outgoingResponseSender(),
);

module.exports = router;
