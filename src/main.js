// The Mercury Playground main code loader
// 

window.onload = () => {
	// load requires
	const Tone = require('tone');
	
	// latency reduces cpu load
	Tone.context.lookAhead = 0.1;
	// Tone.context.samplerate = 44100;

	console.log('Tone settings:');
	console.log(`latency: ${Tone.getContext().lookAhead * 1000}ms`);
	console.log(`samplerate: ${Tone.getContext().sampleRate}Hz`);
	console.log(`PPQ: ${Tone.Transport.PPQ}`);
	
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

	// the code Editor
	// also loads the parser and the worker
	// gets passed the Tone context and Engine
	let cm = new Editor({ context: Tone, engine: Engine });

	// Load all the buttons/menus
	cm.controls();
	// cm.themeMenu();
	cm.links();
	cm.hide();
	cm.tutorialMenu();
	cm.clear();
	
	// Hydra sketch background loader
	// let sketchP5 = new p5(Canvas.p5Canvas, document.getElementById('p5-canvas'));
	const Hydra = new Canvas.hydraCanvas('hydra-canvas');
	Hydra.link('hydra-ui');
}