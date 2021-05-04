// The Mercury Playground main code loader
// 

window.onload = () => {
	const Tone = require('tone');
	const Engine = require('./engine.js');
	const Editor = require('./editor.js');	
	const Canvas = require('./canvas.js');
	const p5 = require('p5');

	// the code Editor
	// also loads the parser and the worker
	// gets passed the Tone context and Engine
	let cm = new Editor({ context: Tone, engine: Engine });

	fetch("/tutorial")
		.then(function(response) {
			return response.json();
		})
		.then(function(data) {
			console.log('tutorials', data);
			cm.tutorialMenu(data);
		})
		.catch(function(error) {
			console.log('Error loading tutorials:' + error);
		});

	cm.controls();
	cm.themeMenu();
	cm.links();
	cm.hide();
	cm.clear();
	
	// let sketchP5 = new p5(Canvas.p5Canvas, document.getElementById('p5-canvas'));
	const Hydra = new Canvas.hydraCanvas('hydra-canvas');
	Hydra.link('hydra-ui');	
}

// WebMIDI Setup
// WebMidi.enable(function (err) {
// 	if (err) {
// 		console.log("error enabling WebMIDI", err);
// 	} else {
// 		console.log("WebMidi enabled");
// 		console.log(WebMidi.inputs);
//     	console.log(WebMidi.outputs);
// 	}
// });
