// 
// server.js
// created 06.02.2021 by Jason Rietzke
// 

'use strict'

require('dotenv/config');

const fs = require('fs');
const url = require('url');
const http = require('http');
const path = require('path');
const tmi = require('tmi.js');
const WebSocket = require('ws');

const port = 8080;
const host = 'localhost';

const wss = new WebSocket.Server({ port: 8090 });

const sockets = [];

wss.on('connection', ws => {
	sockets.push(ws);

	ws.on('message', message => {
		console.log('message received');
	});
	ws.on('close', ws => {
		for(let i = sockets.length - 1; i >= 0; i--) {
			if (sockets[i] == ws) {
				sockets.splice(i, 1);
				return;
			}
		}
	});
});


let server = http.createServer((req, res) => {

	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/html');
	const urlPath = url.parse(req.url).pathname;
	switch (urlPath) {
		case '/':
		case '/index.html':
			return res.end(getPage('greetings/index.html'));
		case '/style.css':
			return res.end(getPage('greetings/style.css'));
		case '/app.js':
			return res.end(getPage('greetings/app.js'));
		default:
			return res.statusCode = 404;
	}

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



// -------- TMI Client --------
const options = {
	options: {
		debug: false
	},
	connection: {
		secure: true,
		reconnect: true
	},
	identity: {
		username: process.env.CLIENT_NAME,
		password: process.env.OAUTH
	},
	channels: [process.env.CHANNEL_NAME]
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
	if (rewardType === '410bf0ce-c8e5-44e4-a5a9-f868e3a538da') {

		const featuredEmotes = getFeaturedEmotes(username);

		for (const socket of sockets) {
			socket.send(JSON.stringify({
				message: `${tags['display-name']} grüßt ${message}`,
				color: tags['color'],
				featuredEmotes : featuredEmotes
			}));
		}
	}
});

function getFeaturedEmotes(username) {
	switch (username) {
		case 'lamacap':
			return ['🍪', '🦙'];
		case 'littlesisterunicorn':
			return ['🦄', '❤️'];
	}
	return [];
}

// ----------------


function getPage(fileName) {
	return fs.readFileSync(path.join(path.join(__dirname, '/public/'), fileName));
}