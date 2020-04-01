const passport = require('passport');
const BearerStrategy = require('passport-http-bearer').Strategy;

class Service {
  static findOne(token, callback) {
    const stubToken = '89sfioq34eafs';

    if (token === stubToken) {
      callback(null, new Service());
    }
  }
}

passport.use(
  new BearerStrategy((token, done) => {
    Service.findOne({ token }, (error, service) => {
      if (error) {
        return done(error);
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
    // passport.authenticate(
    //   'bearer',
    //   { session: false },
    //   (error, service, info) => {
    //     if (error) {
    //       outgoingResponse.status(500);
    //       return next(error);
    //     }
    //     if (!service) {
    //       outgoingResponse.status(403);
    //       next();
    //     }

    //     next();
    //   },
    // )(incomingRequest, outgoingResponse, next);

    // next(new Error('Could not authenticate'));
    next();
  };
};
