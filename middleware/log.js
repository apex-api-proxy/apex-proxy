require('dotenv').config();
node_ssh = require('node-ssh');
ssh = new node_ssh();

console.log(process.env.TIMESCALE_IP);

ssh.connect({
  host: `${process.env.TIMESCALE_HOSTNAME}`,
  username: `${process.env.SSH_USERNAME}`,
  privateKey: `${process.env.SSH_KEY_LOCATION}`
})
.then( _ => {
	console.log('Connected to remote server');
})
.catch( e => {
	console.log(e);
})