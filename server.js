//
// server.js
// created 06.02.2021 by Jason Rietzke
//

"use strict";

const fs = require("fs");
const url = require("url");
const http = require("http");
const path = require("path");
const tmi = require("tmi.js");
const WebSocket = require("ws");

const port = 80;

let server = http.createServer((req, res) => {
	res.statusCode = 200;
	res.setHeader("Content-Type", "text/html");
	const urlPath = url.parse(req.url).pathname;
	switch (urlPath) {
		case "/":
		case "/index.html":
			return res.end(getPage("greetings/index.html"));
		case "/style.css":
			return res.end(getPage("greetings/style.css"));
		case "/app.js":
			return res.end(getPage("greetings/app.js"));
		default:
			return (res.statusCode = 404);
	}
});

const wss = new WebSocket.Server({ server: server });

const sockets = [];

const lurkUsers = [];

wss.on("connection", (ws) => {
	sockets.push(ws);

	ws.on("message", (message) => {
		console.log("message received");
	});
	ws.on("close", (ws) => {
		for (let i = sockets.length - 1; i >= 0; i--) {
			if (sockets[i] == ws) {
				sockets.splice(i, 1);
				return;
			}
		}
	});
});

server.on("error", (err) => {
	console.log(err);
});

server.listen(port, () => {
	console.log(`Server running at http://manasoup.lamacap.dev:${port}/`);
});

// -------- TMI Client --------
const options = {
	options: {
		debug: false,
	},
	connection: {
		secure: true,
		reconnect: true,
	},
	identity: {
		username: process.env.CLIENT_NAME,
		password: process.env.OAUTH,
	},
	channels: [process.env.CHANNEL_NAME],
};

console.log("Options:");
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
client.on("message", (channel, tags, message, self) => {
	if (self) return;

	if (lurkUsers.includes(tags["display-name"])) {
		lurkUsers.splice(lurkUsers.indexOf(tags["display-name"]), 1);
		client.say(channel, `WB @${tags["display-name"]}, schön, dass du zurück bist <3`);
	} else if (message.toLowerCase() === "!lurk" && !lurkUsers.includes(tags["display-name"])) {
		lurkUsers.push(tags["display-name"]);
		client.say(channel, `@${tags["display-name"]} bis Später :)`);
	}

	if (message.toLowerCase() === "!lurklist") {
		const message = "@" + tags["display-name"] + ": ";
		if (lurkUsers.length > 0) {
			lurkUsers.forEach((user) => {
				message += user + " – ";
			});
			message.slice(0, -3);
		} else {
			message += "jeder ist extrem aufmerksam :P";
		}
		client.say(channel, message);
	}
});

// Receiving Host Event
client.on("hosted", (channel, username, viewers, autohost) => {
	client.say(
		channel,
		`@${username} bringt ${viewers} geile Schlangen mit – Schaut auf jeden Fall vorbei https://twitch.tv/${username}`
	);
	for (const socket of sockets) {
		socket.send(
			JSON.stringify({
				topic: "raid",
				amount: viewers,
			})
		);
	}
});

// Doing Host Event
client.on("hosting", (channel, target, viewers) => {
	console.log("HOSTING");
});

// Receiving Rading Event
client.on("raided", (channel, username, viewers, tags) => {
	client.say(
		channel,
		`@${tags["display-name"]} bringt ${viewers} geile Schlangen mit – Schaut auf jeden Fall vorbei https://twitch.tv/${username}`
	);
	for (const socket of sockets) {
		socket.send(
			JSON.stringify({
				topic: "raid",
				amount: viewers,
			})
		);
	}
});

// Receiving Subscription
client.on("subscription", (channel, username, method, message, tags) => {
	for (const socket of sockets) {
		socket.send(
			JSON.stringify({
				topic: "subscription",
				message: `${tags["display-name"]} gönnt sich eine ManaSuppe${message ? ": " + message : ""}`,
				color: tags["color"],
				featuredEmotes: ["❤️"],
			})
		);
	}
});

// Receiving Resub
client.on("resub", (channel, username, months, message, tags, methods) => {
	let cumulativeMonths = tags["msg-param-cumulative-months"];
	for (const socket of sockets) {
		socket.send(
			JSON.stringify({
				topic: "subscription",
				message: `${tags["display-name"]} gönnt sich die ${cumulativeMonths}. ManaSuppe${
					message ? ": " + message : ""
				}`,
				color: tags["color"],
				featuredEmotes: ["❤️"],
			})
		);
	}
});

// Receiving gifted Sub
client.on("subgift", (channel, username, streakMonths, recipient, methods, tags) => {
	for (const socket of sockets) {
		socket.send(
			JSON.stringify({
				topic: "subscription",
				message: `${tags["display-name"]} spendiert eine ManaSuppen an ${recipient}`,
				color: tags["color"],
				featuredEmotes: ["❤️"],
			})
		);
	}
});

// Receiving Cheer (Bits)
client.on("cheer", (channel, tags, message) => {
	console.log(tags["bits"], "bits by", tags["display-name"]);
	const amount = parseInt(tags["bits"]) / 10 < 200 ? parseInt(tags["bits"]) / 10 : 200;
	for (const socket of sockets) {
		socket.send(
			JSON.stringify({
				topic: "cheer",
				message: `${tags["display-name"]} gönnt ${tags["bits"]} Bits: ${message}`,
				color: tags["color"],
				amount: amount,
			})
		);
	}
});

// Receiving Redeem (ChannelPoint Events)
client.on("redeem", (channel, username, rewardType, tags, message) => {
	console.log("Redeem:", `${username}: ${message} got ${rewardType} with tags: ${tags}`);

	let topic = "";
	let notification = "";
	switch (rewardType) {
		case "410bf0ce-c8e5-44e4-a5a9-f868e3a538da":
			topic = "greetings";
			notification = getGreetingsNotification(tags, message);
			break;
		case "d63de6b1-2dab-42fd-a2d7-6aad829ba9fd":
			topic = "good-night";
			notification = getGoodNightNotification(tags, message);
			break;
	}

	const featuredEmotes = getFeaturedEmotes(username);
	for (const socket of sockets) {
		socket.send(
			JSON.stringify({
				topic: topic,
				message: notification,
				color: tags["color"],
				featuredEmotes: featuredEmotes,
			})
		);
	}
});

function getGreetingsNotification(tags, message) {
	const notifications = [
		`${tags["display-name"]} grüßt ${message}`,
		`${tags["display-name"]} freut sich ${message} zu sehen`,
		`${tags["display-name"]} umarmt ${message}`,
		`${tags["display-name"]} hat ${message} erwartet`,
		`${tags["display-name"]} rennt freudig auf ${message} zu`,
	];
	const index = parseInt(getRandom(0, notifications.length - 1));
	return notifications[index];
}

function getGoodNightNotification(tags, message) {
	const notifications = [
		`${tags["display-name"]} wünscht ${message} eine gute Nacht`,
		`${tags["display-name"]} wünscht ${message} süße Träume`,
		`${tags["display-name"]} gibt ${message} einen Gutenachtkuss`,
		`${tags["display-name"]} vermisst ${message} jetzt schon`,
	];
	const index = parseInt(getRandom(0, notifications.length - 1));
	return notifications[index];
}

function getFeaturedEmotes(username) {
	switch (username) {
		case "manasoup_dev":
			return ["🥃", "🍺"];
		case "snackerony":
			return ["☕️"];
		case "lamacap":
			return ["🍪", "🦙"];
		case "littlesisterunicorn":
			return ["🦄", "❤️"];
		case "vermonicus":
			return ["🐉"];
		case "blackgirl3000":
			return ["🖌", "🎨"];
		case "derrudl":
			return ["🪨"];
		case "zefix_aoe":
			return ["⚔️", "🗡"];
		case "mrs_bloed":
			return ["🦶"];
		case "karl_bloed":
			return ["🦡"];
		case "rennsemmel81":
			return ["🐙"];
		case "r5_dev":
			return ["5️⃣"];
		case "donnerknalli":
			return ["🔺", "👁️⃤"];
	}
	return [];
}

// ----------------

function getPage(fileName) {
	return fs.readFileSync(path.join(path.join(__dirname, "/public/"), fileName));
}

function getRandom(min, max) {
	return Math.random() * (max - min + 1) + min;
}
