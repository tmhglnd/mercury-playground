// The Mercury web-app server
const express = require("express");
const app = express();
const socket = require('socket.io');
const osc = require('node-osc');

app.use(express.static("public"));

app.get("/", (request, response) => {
	response.sendFile(__dirname + "/public/index.html");
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});

// for OSC connection when using localhost via npm start
const io = socket(server);
const inPort = 8000;
const outPort = 9000;

io.sockets.on('connection', (socket) => {
	console.log('Connected', socket.id);
	socket.emit('connected', socket.id);

	const oscServer = new osc.Server(inPort, '127.0.0.1');
	oscServer.on('listening', () => {
		console.log(`Send messages to Mercury on port ${inPort}`);
	});
	oscServer.on('message', (msg) => {
		socket.emit('osc', msg);
		console.log('Send:', msg);
	});

	const oscClient = new osc.Client('127.0.0.1', outPort);
	console.log(`Receive messages from Mercury on port ${outPort}`);
	socket.on('message', (msg) => {
		oscClient.send(msg);
		console.log(`Received: ${msg}`);
	});

	socket.on('disconnect', () => {
		oscServer.close();
		console.log('Disconnected', socket.id);
	});
});
