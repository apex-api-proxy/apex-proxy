const timestamp = require('time-stamp');

module.exports = () => {
  return timestamp('YYYY/MM/DD:mm:ss:ms');
};
