// This middleware isn't actually being used right now

const passport = require('passport');
const BearerStrategy = require('passport-http-bearer').Strategy;

class Service {
  static findOne({ token }, callback) {
    const stubToken = '89sfioq34eafs';

    console.log('token:', token);
    if (token === stubToken) {
      callback(null, new Service());
    } else {
      callback(null, false);
    }
  }
}

passport.use(
  new BearerStrategy((token, done) => {
    Service.findOne({ token }, (err, service) => {
      if (err) {
        return done(err);
      }

      if (!service) {
        return done(null, false);
      }

      return done(null, service, { scope: 'all' });
    });
  }),
);

module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    passport.authenticate('bearer', { session: false }, (err, service, info) => {
      if (err) {
        outgoingResponse.status(500);

        next(err);
      }

      if (!service) {
        outgoingResponse.status(403);
        next(new Error('Apex could not authenticate the supplied Bearer token.'));
      }

      next();
    })(incomingRequest, outgoingResponse, next);
  };
};
