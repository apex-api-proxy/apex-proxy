const timestamp = require('time-stamp');

module.exports = () => {
  return `${timestamp('YYYY/MM/DD HH:mm:ss.ms')}+00`;
};
