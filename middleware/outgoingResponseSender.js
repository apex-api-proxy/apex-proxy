const apexLogger = require('./log');

module.exports = () => {
  return (incomingRequest, outgoingResponse) => {
    const body = outgoingResponse.locals.body;

    console.log('\n\noutgoingResponse: ', outgoingResponse);

    // console.log('outgoingResponse: ', outgoingResponse);

    // apexLogger.sendLog({
    // 	...outgoingResponse,
    // 	body: body
    // })

    outgoingResponse.send(body);
  };
};
