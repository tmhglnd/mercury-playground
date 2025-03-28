// The Mercury Playground main code loader
// 

// switch theme in css
switchTheme = (t) => {
	localStorage.setItem('theme', t);
	document.documentElement.className = t;
}
// initial dark mode theme on startup
switchTheme('darkmode');

// global variable for device storage and recall of microphone inputs
window.devices;

// Ask if user is sure to close or refresh and loose all code
window.onbeforeunload = function() {
	return "Code may be lost if you refresh. Are you sure?";
};

window.onload = () => {
	// load requires
	const Tone = require('tone');
	Tone.UserMedia.enumerateDevices().then((devices) => {
		// print the device labels
		window.devices = devices.map(device => device.label);
		console.log("=> Input devices");
		window.devices.forEach((i) => {
			console.log(`- input: ${i}`);
		});
	});
	
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
		// automatically scroll to bottom when new prints are added
		let e = document.getElementById('postWindow');
		e.scrollTop = e.scrollHeight;

		console.log(print);
	}

	const Engine = require('./engine.js');
	const Editor = require('./editor.js');	
	const Canvas = require('./canvas.js');
	// const p5 = require('p5');

	// Empty object to store/update all received oscMessages
	window.oscMessages = {};
	// Is there a client connected?
	window.ioClient = false;
	// Setup osc connection for when running mercury as localhost
	try {
		const io = require('socket.io-client');
		const socket = io();

		socket.on('connected', (id) => {
			window.ioClient = true;
			console.log(`Connected for OSC: ${id}`);
		});
		socket.on('osc', (msg) => {
			// need some switch to allow/disable printing, maybe via set
			// console.log(`Received: ${msg}`);
			if (msg[0] === '/mercury-code'){
				try {
					cm.set(msg[1]);
					cm.evaluate();
				} catch (e) {
					log(`Unable to execute code`);
				}
			} else {
				// forward the msg through a window dispatchEvent 
				forwardOSC(msg);
			}
		});
		window.emit = (msg) => {
			socket.emit('message', msg);
		}
	} catch (e) {
		console.log('Unable to use OSC connection. Clone Mercury from github and run as localhost');
	}

	// WebMIDI Setup
	const { WebMidi } = require("webmidi");
	
	WebMidi.enable()
	.then(() => {
		console.log("=> WebMIDI enabled!");
		
		printMidiDevices();

		WebMidi.inputs.forEach((i) => {			
			// add a listener for all incoming midi messages on all devices
			i.addListener('midimessage', (midi) => {
				let type = midi.message.type;
				let data = midi.message.dataBytes;

				if (window.logMidi) log(`midi in: ${type} ${data}`);
				
				if (type === 'controlchange'){
					// normalize midi values to 0-1 range
					forwardOSC([ `/cc/${data[0]}`, data[1] / 127 ]);
				}
				else if (type === 'noteon'){
					let pitch = data[0];
					let velocity = data[1];

					if (vel > 0){
						// console.log('noteon', note);

						forwardOSC([ `/pitch`, pitch ]);
						forwardOSC([ `/note`, note-36 ]);
						forwardOSC([ `/velocity`, velocity / 127 ]);
						// forwardOSC([ `/note/trigger`, 1 ]);
					}
				}
			});
		});
	})
	.catch((err) => {
		console.log("!!! Error enabling WebMIDI !!!", err);
	});

	window.printMidiDevices = function(){
		WebMidi.inputs.forEach((i) => {
			log(`- midi input: ${i.name}`);
		});
		WebMidi.outputs.forEach((i) => {
			log(`- midi output: ${i.name}`);
		});
	}

	function forwardOSC(msg){
		let address = msg.shift();
		let details = msg;
		// store the osc message values in the object
		window.oscMessages[address] = details;

		// emit an event to the listener if there is one 
		// add a little latency for scheduling safety to reduce clicks
		let event = new CustomEvent(address, { detail: { value: details, time: Tone.immediate() + 0.001 }});
		window.dispatchEvent(event);
	}

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
	cm.soundsMenu();
	cm.modeSwitch();
	cm.soundsListenMenu();
	// cm.settingsMenu();
	
	// Load recent code from localStorage if any
	if (localStorage.getItem('code')){
		cm.set(localStorage.getItem('code'));
	} else {
		cm.clear();
	}

	// or load the hash if this is provided in the url
	let url = new URL(window.location);
	if (url.hash !== ''){
		cm.setHash(url.hash);
	}
	
	Hydra.link('hydra-ui');
}