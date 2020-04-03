const timestamp = require('time-stamp');

module.exports = () => {
	(req, res, next) => {
		res.locals.timestamp = timestamp('YYYY/MM/DD:mm:ss');

		next();
	}
};