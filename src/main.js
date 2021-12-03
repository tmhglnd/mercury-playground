// The Mercury Playground main code loader
// 

window.onload = () => {
	// load requires
	const Tone = require('tone');
	const Engine = require('./engine.js');
	const Editor = require('./editor.js');	
	const Canvas = require('./canvas.js');
	const p5 = require('p5');
	const WebMidi = require("webmidi");

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
		document.getElementById('log').innerHTML += `${message}<br>`
		// document.getElementById('console-log').innerHTML += `${message}<br>`
	};
	console.error = console.debug = console.info = console.log;

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

	// the code Editor
	// also loads the parser and the worker
	// gets passed the Tone context and Engine
	let cm = new Editor({ context: Tone, engine: Engine });

	// Get the tutorials from the server
	fetch("/tutorial")
		.then(function(response) {
			console.log('loading tutorials...');
			return response.json();
		})
		.then(function(data) {
			console.log('=> tutorials loaded');
			cm.tutorialMenu(data);
		})
		.catch(function(error) {
			console.log('!! Error loading tutorials:' + error);
		});

	// Load all the buttons/menus
	cm.controls();
	// cm.themeMenu();
	cm.links();
	cm.hide();
	cm.clear();
	
	// Hydra sketch background loader
	// let sketchP5 = new p5(Canvas.p5Canvas, document.getElementById('p5-canvas'));
	const Hydra = new Canvas.hydraCanvas('hydra-canvas');
	Hydra.link('hydra-ui');
}