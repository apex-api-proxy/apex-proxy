const express = require('express');
const proxiedRequestSender = require('../middleware/proxiedRequestSender');
const tracer = require('../middleware/tracer');
const apexLogger = require('../middleware/log');
// const https = require('https');
// const querystring = require('querystring');
 
const router = express.Router();

router.get('/*', proxiedRequestSender(), tracer.traceResponse(), apexLogger.init, (req, res) => {
  const outgoingResponseBody = res.locals.body;
  // console.log('index res keys: ', Object.keys(res));
  // console.log('outgoingResponseBody: ', outgoingResponseBody.toString('utf8'));
  console.log('stringified outgoingResponseBody: ', outgoingResponseBody[0]); 

  apexResponse = {
  	...res,
  	body: outgoingResponseBody
	};
	apexLogger.sendLog(apexResponse);

  res.send('response!');
});

// const asciiConverter = (data) => {
// 	let buff = Buffer.from(data, 'base64');
// 	return buff.toString('ascii');
// 	// return data.map(x => x.charCodeAt().toString(2))
// 	// 	.reduce((accumulator, current) => { return accumulator + current; }, '')
// };


module.exports = router;
 