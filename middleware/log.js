require('dotenv').config();
node_ssh = require('node-ssh');
const ssh = new node_ssh();
const pgp = require('pg-promise')();
const db = pgp({
  host: `${process.env.TIMESCALE_IP}`,
  port: 5432,
	database: 'tutorial',
	user: `${process.env.DB_USER}`,
	password: `${process.env.DB_PASSWORD}`
})

ssh.connect({
  host: `${process.env.TIMESCALE_HOSTNAME}`,
  username: `${process.env.SSH_USERNAME}`,
  privateKey: `${process.env.SSH_KEY_LOCATION}`
})
.then( _ => {
	console.log('connected!')
	db.any('SELECT * FROM conditions')
	.then(response => {
		console.log('response: ', response);
	})
	.catch(e => {
		console.log(e);
	})
})
.catch(e => {
	console.log(e);
})


// const cn = {
//     host: 'localhost',
//     port: 5432,
//     database: 'my-database-name',
//     user: 'user-name',
//     password: 'user-password',
//     max: 30 // use up to 30 connections
// };