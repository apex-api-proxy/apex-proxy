const express = require('express');
const proxy = require('../middleware/proxy');
const retry = require('../middleware/retry');
const tracer = require('../middleware/tracer');
const apexLogger = require('../middleware/log');

const outgoingResponseSender = require('../middleware/outgoingResponseSender');

const router = express.Router();

router.get(
  '/*',
  proxy(),
  retry(),
  tracer.traceResponse(),
  outgoingResponseSender(),
);

module.exports = router;
 