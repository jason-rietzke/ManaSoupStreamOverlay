// 
// server.js
// created 06.02.2021 by Jason Rietzke
// 

'use strict'

const http = require('http');
const tmi = require('tmi.js');


const port = 8080;
const host = 'localhost';


let server = http.createServer((req, res) => {

	const options = {
		options: {
			debug: false
		},
		connection: {
			secure: true,
			reconnect: true
		},
		identity: {
			username: 'LamaCap', // process.env.CLIENT_NAME,
			password: 'oauth:9hhqahreuwgysv21ocypwsarg5yiao' //process.env.OAUTH
		},
		channels: ["ManaSoup_DEV"] //process.env.CHANNEL_NAME
	}
	
	console.log('Options:');
	console.log(options);
	
	const client = new tmi.Client(options);
	client.connect();
	client.on("connecting", (address, port) => {
		console.log(`connected to ${address}:${port}`);
	});
	client.on("disconnected", (reason) => {
		console.log("tmi client disconnected: ", reason);
	});
	
	// Receiving a Message
	client.on("message", (channel, userstate, message, self) => {
		if (self) return;
		console.log('Message: ', message);
		client.say(channel, `@${userstate.username}, heya!`);
	});
	
	// Receiving Host Event
	client.on("hosted", (channel, username, viewers, autohost) => {
		console.log("HOST");
	});
	
	// Doing Host Event
	client.on("hosting", (channel, target, viewers) => {
		console.log("HOSTING");
	});
	
	// Receiving Rading Event
	client.on("raided", (channel, username, viewers, tags) => {
		console.log("RAIDED");
	});
	
	// Receiving Subscription
	client.on("subscription", (channel, username, method, message, userstate) => {
		console.log("SUBSCRIPTION");
	});
	
	// Receiving Cheer (Bits)
	client.on("cheer", (channel, tags, message) => {
		console.log("CHEER");
	});
	
	// Receiving Redeem (ChannelPoint Events)
	client.on("redeem", (channel, username, rewardType, tags, message) => {
		console.log('Redeem:', `${username}: ${message} got ${rewardType} with tags: ${tags}`);
	});


	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/html');
	res.end('Hello World');

});


server.addListener('upgrade', (req, res, head) => {
	// Do Websocket stuff
});

server.on('error', (err) => {
	console.log(err);
});

server.listen(port, host, () => {
	console.log(`Server running at http://${host}:${port}/`);
});
