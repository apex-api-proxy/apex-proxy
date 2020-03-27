const express = require('express');
const proxy = require('../middleware/proxy');
const tracer = require('../middleware/tracer');
// const https = require('https');
// const querystring = require('querystring');

const router = express.Router();

router.get('/*', proxy(), tracer.traceResponse(), (req, res) => {
  const outgoingResponseBody = res.locals.body;
  res.send(outgoingResponseBody);
});

module.exports = router;
