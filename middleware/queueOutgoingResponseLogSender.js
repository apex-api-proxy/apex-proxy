const { sendLog } = require('./apexLogger');
const getTimestamp = require('../helpers/timestamp');

const outgoingResponseLogSender = (outgoingResponse) => {
  const timestamp = getTimestamp();
  const correlationId = outgoingResponse.locals.apexCorrelationId;
  const statusCode = outgoingResponse.statusCode;
  const headers = outgoingResponse.getHeaders();
  const body = outgoingResponse.locals.body;

  return async () => {
    let sentLog;

    await outgoingResponse.locals.connectToLogsDb.then((client) => {
      sentLog = sendLog({ timestamp, client, correlationId, statusCode, headers, body }).then(() => {
        console.log('just logged outgoingResponse above');
      });
    });

    return sentLog;
  };
};

module.exports = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const logSendersQueue = outgoingResponse.locals.logSendersQueue;

    logSendersQueue.enqueue(outgoingResponseLogSender(outgoingResponse));

    next();
  };
};
