const express = require('express');
const apexLogger = require('../middleware/apexLogger');
const authenticator = require('../middleware/authenticator');
const proxy = require('../middleware/proxy');
const retry = require('../middleware/retry');
const authErrorHandler = require('../middleware/authErrorHandler');
const { traceResponse } = require('../middleware/tracer');

const outgoingResponseSender = require('../middleware/outgoingResponseSender');

const router = express.Router();

router.get(
  '/*',
  apexLogger.init(),
  apexLogger.queueIncomingRequestLogSender(),
  authenticator(),
  proxy(),
  retry(),
  authErrorHandler(),
  traceResponse(),
  apexLogger.queueOutgoingResponseLogSender(),
  outgoingResponseSender(),
);

module.exports = router;
