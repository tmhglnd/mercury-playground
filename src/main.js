
const Tone = require('tone');
const Engine = require('./engine.js');
const Editor = require('./editor.js');

// const Canvas = require('./canvas.js');
// const p5 = require('p5');
// let sketchP5 = new p5(Canvas);

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
/*
// ToneJS
// resume webaudio and transport for livecoding
function resume(){
	try {
		Tone.start();
		Tone.Transport.timeSignature = [4, 4];
		// Tone.Transport.seconds = 0;
		// Tone.Transport.swing = 0.5;
		Tone.Transport.start();
		console.log("Resumed Transport");
	} catch {
		console.error("error enabling ToneJS");
	}
}

// stop the transport end therefore playing the sounds
function silence(){
	try {
		// Tone.Transport.stop();
		Tone.Transport.pause();
	} catch {
		console.error('error stopping sound');
	}
}
*/
/*
// the Mercury parser
const Mercury = MercuryParser;

let samples = {};
let buffers;

let sounds = [];

fetch('./data/samples.json')
	.then(function(response) {
		return response.json();
	})
	.then(function(data) {
		samples = data;
		console.log(samples)

		buffers = new Tone.ToneAudioBuffers({
			urls: samples,
			onload: function(){ 
				console.log('buffers loaded');
				// init();
			}
		});
	})
	.catch(function(error) {
		console.log('error:' + error);
	});

// set initial BPM on pageload to random value
setBPM(Math.floor(Math.random() * 40) + 80);


function print(p){
	// document.querySelector('#console').innerHTML += '> ' + (Array.isArray(p) ? p.join(' ') : p) + '\n';
	cEditor.setValue(cEditor.getValue() + '> ' + (Array.isArray(p) ? p.join(' ') : p) + '\n');
}

// parse and evaluate the inputted code
function code(){
	console.log('Eval at Transport:', Tone.Transport.position);
	resume();

	// let c = document.getElementById('code').value;
	let c = editor.getValue();
	// console.log('evaluate', c);

	let tree = Mercury(c).parseTree;
	console.log('Syntax Tree', tree);

	// handle .print
	// document.querySelector('#console').innerHTML = '';
	cEditor.setValue('');
	tree.print.forEach((p) => {
		print(p);
	});

	const globalMap = {
		'tempo' : (args) => {
			setBPM(...args);
		}, 
		'silence' : () => {
			// silence();
		},
		'scale' : () => {

		},
		'highPass' : () => {

		},
		'lowPass' : () => {

		}
	}

	// handle .global
	Object.keys(tree.global).forEach((g) => {
		if (globalMap[g]){
			globalMap[g](tree.global[g]);
		}
	});

	for (let s in sounds){
		sounds[s].delete();
	}
	sounds = [];

	const objectMap = {
		'sample' : (obj) => {
			// console.log('make sample', obj);
			let type = obj.type;
			let args = obj.functions;			
			let inst = new MonoSample(type);

			// apply arguments to instrument if part of instrument
			Object.keys(args).forEach((a) => {
				if (inst[a]){
					inst[a](...args[a]);
				} else {
					print(`${a}() is not a function of sample`);
				}
			});
			return inst;
		},
		'midi' : (obj) => {
			console.log('make midi', obj);
			let device = obj.type;
			let args = obj.functions;
			let inst = new MonoMidi(device);

			// apply arguments to instrument
			Object.keys(args).forEach((a) => {
				if (inst[a]){
					inst[a](...args[a]);
				} else {
					print(`${a}() is not a function of midi`);
				}
			});
			return inst;
		}
	}

	// let tmpS = [];
	// handle .objects
	Object.keys(tree.objects).forEach((o) => {
		let type = tree.objects[o].object;
		// if (globalMap[o])
		// console.log('make instrument', o);
		if (objectMap[type]){
			sounds.push(objectMap[type](tree.objects[o]));
		} else {
			print(`Instrument named '${type}' is not supported`);
		}
	});

	// start new loops;
	for (let s in sounds){
		sounds[s].makeLoop();
	}
}
/*
// set the bpm for the sequencer
// second argument determines ramptime
// 
function setBPM(bpm, ramp=0){
	if (ramp === 0){
		Tone.Transport.bpm.value = bpm;
	} else {
		Tone.Transport.bpm.rampTo(bpm, ramp / 1000);
	}
	document.getElementById('bpm').innerHTML = `tempo = ${bpm}`;
	console.log(`set bpm to ${bpm}`);
}

// return the bom of the global transport
function getBPM(){
	return Tone.Transport.bpm.value;
}*/
/*
// initialize code
function init(){
	console.log('initializing');
}*/

/*
// lookup a value from array with wrap index
function lookup(a, i){
	return a[i % a.length];
}

// get random value from array
function randLookup(a){
	if (Array.isArray(a)){
		return a[Math.floor(Math.random() * a.length)];
	}
	return a;
}

// convert to array if not an array
function toArray(a){
	return Array.isArray(a) ? a : [a];
}

// convert milliseconds to seconds
function msToS(ms){
	return ms / 1000.0;
}

// parse division formats to Tone Loop intervals
function formatRatio(d){
	if (String(d).match(/\d+\/\d+/)){
		return eval(String(d)) * 4.0 * 60 / getBPM();
	} else if (!isNaN(Number(d))){
		return Number(d) * 4.0 * 60 / getBPM();
	} else {
		print(`${d} is not a valid time value`);
		return 60 / getBPM();
	}
}
*/