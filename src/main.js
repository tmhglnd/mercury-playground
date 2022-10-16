// The Mercury Playground main code loader
// 

// switch theme in css
switchTheme = (t) => {
	localStorage.setItem('theme', t);
	document.documentElement.className = t;
}
// initial dark mode theme on startup
switchTheme('darkmode');

// osc connection for When running mercury as localhost
try {
	const io = require('socket.io-client');
	const socket = io();
	socket.on('connected', (id) => {
		console.log(`Connected for OSC: ${id}`);
	});
	// socket.on('osc', (msg) => {
		// console.log(`Received: ${msg}`);
	// });
} catch (e) {
	console.log('Not able to set up osc connection');
}

window.onload = () => {
	// load requires
	const Tone = require('tone');
	
	// console.log catch function
	if (typeof console != "undefined"){ 
		if (typeof console.log != 'undefined'){
			console.olog = console.log;
		} else {
			console.olog = () => {};
		}
	}
	console.log = (...message) => {
		console.olog(...message);
		document.getElementById('log').innerHTML += `${message}<br>`;
		// document.getElementById('console-log').innerHTML += `${message}<br>`
	};
	console.error = console.debug = console.info = console.log;

	// global log function for in-window console
	window.log = (print) => {
		// console.log('printing', typeof print);
		let p = JSON.stringify(print).replace(/\,/g, ' ').replace(/\"/g, '');
		document.getElementById('console-log').innerHTML += `${p}<br>`;
		console.log(...print);
	}

	const Engine = require('./engine.js');
	const Editor = require('./editor.js');	
	const Canvas = require('./canvas.js');
	// const p5 = require('p5');
	const WebMidi = require("webmidi");

	// WebMIDI Setup
	WebMidi.enable(function (err) {
		if (err) {
			console.log("!! error enabling WebMIDI", err);
		} else {
			console.log("=> webMidi enabled");
			WebMidi.inputs.forEach((i) => {
				console.log('- inputs: ', i.name);
			});
			WebMidi.outputs.forEach((i) => {
				console.log('- outputs: ', i.name);
			});
		}
	});

	// Initialize random BPM
	Engine.randomBPM();

	// Hydra sketch background loader
	const Hydra = new Canvas.hydraCanvas('hydra-canvas');
	// const sketchP5 = new p5(Canvas.p5Canvas, 'p5-canvas');
	const sketchP5 = new Canvas.p5Canvas('p5-canvas');

	// the code Editor
	// also loads the parser and the worker
	// gets passed the Tone context and Engine
	let cm = new Editor({ context: Tone, engine: Engine, canvas: Hydra, p5canvas: sketchP5 });

	// Load all the buttons/menus
	cm.controls();
	// cm.themeMenu();
	cm.links();
	cm.hide();
	cm.tutorialMenu();
	cm.modeSwitch();
	cm.clear();
	
	Hydra.link('hydra-ui');
}