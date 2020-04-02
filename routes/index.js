const express = require('express');
const proxy = require('../middleware/proxy');
const retry = require('../middleware/retry');
const tracer = require('../middleware/tracer');
const apexLogger = require('../middleware/apexLogger');
const config = require('../middleware/config');

const outgoingResponseSender = require('../middleware/outgoingResponseSender');

const router = express.Router();

router.get(
  '/*',
  config(),
  // apexLogger.init(),
  proxy(),
  // retry(),
  tracer.traceResponse(),
  outgoingResponseSender(),
);

module.exports = router;
