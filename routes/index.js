var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  return fetch('https://dagpayapi.azurewebsites.net/api/employee');
});

module.exports = router;
