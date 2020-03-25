const express = require('express');
const https = require('https');
const router = express.Router();

const options = {
  // hostname: 'dagpayapi.azurewebsites.net',
  port: 443,
  path: '/api/employee',
  method: 'GET'
}

/* GET home page. */
router.get('/apex', function(req, res, next) {
	options['hostname'] = req.headers['host'];

	let body = '';

	const request = https.request(options, response => {
	  console.log(`statusCode: ${res.statusCode}`)

	  response.on('data', d => {
	    body += d;
	  })

	  response.on('end', () => {
	    try {
	      const data = JSON.parse(body);

	      res.send(data);
	    } catch (er) {
	    	console.log(er);
	    }
	  });
	})

	request.on('error', error => {
	  console.error(error)
	})

	console.log('\nafter the block\n')

	request.end();
});

module.exports = router;