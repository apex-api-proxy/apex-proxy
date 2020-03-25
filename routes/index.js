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

	console.log('options: ', options);

	const request = https.request(options, response => {
	  console.log(`statusCode: ${res.statusCode}`)

	  response.on('data', d => {
	  	console.log('type of d: ', typeof d);
	    process.stdout.write(d)
	    body += d;
	  })

	  response.on('end', () => {
	  	console.log('executing the block...');

	    try {
	      const data = JSON.parse(body);
	      // Write back something interesting to the user:
	      console.log('\ndata in the block: \n', data)
	      response.write(typeof data);

	      res.send(data);
	    } catch (er) {

	    }
	  });
	})

	request.on('error', error => {
	  console.error(error)
	})

	// request.on('end', () => {
	// 	console.log('executing the block...');

	//   try {
	//     const data = JSON.parse(body);
	//     // Write back something interesting to the user:
	//     response.write(typeof data);
	//     response.end();

	//     res.send(data);
	//   } catch (er) {

	//   }
	// });

	console.log('\nafter the block\n')

	request.end();
});

module.exports = router;

// const req = https.request(options, res => {
//   console.log(`statusCode: ${res.statusCode}`)

//   res.on('data', d => {
//     process.stdout.write(d)
//   })
// })

// req.on('error', error => {
//   console.error(error)
// })

// req.end()