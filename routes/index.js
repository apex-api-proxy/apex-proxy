const express = require('express');
const proxiedRequestSender = require('../middleware/proxiedRequestSender');
const tracer = require('../middleware/tracer');
// const https = require('https');
// const querystring = require('querystring');

const router = express.Router();

router.get('/*', proxiedRequestSender(), tracer.traceResponse(), (req, res) => {
  const outgoingResponseBody = res.locals.body;
  res.send(outgoingResponseBody);
});

module.exports = router;
