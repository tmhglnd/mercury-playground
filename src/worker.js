const Tone = require('tone');
const Mercury = require('mercury-lang');
const MonoSample = require('./core/MonoSample.js');
const MonoMidi = require('./core/MonoMidi.js');
const MonoSynth = require('./core/MonoSynth.js');

// fade time in seconds
let crossFade = 1;
// array with the insturments playing
let _sounds = [];
let sounds = [];

// parse and evaluate the inputted code
function code({ file, engine }){
	console.log('evaluate', file);
	// console.log('Eval at Transport:', Tone.Transport.position);
	// resume();

	// let c = document.getElementById('code').value;
	// let c = editor.getValue();
	let c = file;
	// console.log('evaluate', c);

	let tree = Mercury(c).parseTree;
	console.log('Syntax Tree', tree);

	// handle .print
	// document.querySelector('#console').innerHTML = '';
	// cEditor.setValue('');
	tree.print.forEach((p) => {
		console.log(p);
	});

	const globalMap = {
		'tempo' : (args) => {
			engine.setBPM(...args);
		}, 
		'silence' : (mute) => {
			if (mute){ engine.silence(); }
			else { engine.resume(); }
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

	_sounds = sounds.slice();
	for (let s=0; s<_sounds.length; s++){
		_sounds[s].fadeOut(crossFade);
		// _sounds[s].delete();
	}
	sounds = [];

	const objectMap = {
		'sample' : (obj) => {
			// console.log('make sample', obj);
			let type = obj.type;
			let args = obj.functions;			
			let inst = new MonoSample(type, engine);

			// apply arguments to instrument if part of instrument
			Object.keys(args).forEach((a) => {
				if (inst[a]){
					inst[a](...args[a]);
				} else {
					console.log(`${a}() is not a function of sample`);
				}
			});
			return inst;
		},
		'loop' : (obj) => {
			// console.log('make sample', obj);
			let type = obj.type;
			let args = obj.functions;			
			let inst = new MonoSample(type, engine);

			// apply arguments to instrument if part of instrument
			Object.keys(args).forEach((a) => {
				if (inst[a]){
					inst[a](...args[a]);
				} else {
					console.log(`${a}() is not a function of loop`);
				}
			});
			return inst;
		},
		'synth' : (obj) => {
			console.log('make synth', obj);
			let type = obj.type;
			let args = obj.functions;			
			let inst = new MonoSynth(type, engine);

			// apply arguments to instrument if part of instrument
			Object.keys(args).forEach((a) => {
				if (inst[a]){
					inst[a](...args[a]);
				} else {
					console.log(`${a}() is not a function of synth`);
				}
			});
			return inst;
		},
		'midi' : (obj) => {
			// console.log('make midi', obj);
			let device = obj.type;
			let args = obj.functions;
			let inst = new MonoMidi(device, engine);

			// apply arguments to instrument
			Object.keys(args).forEach((a) => {
				if (inst[a]){
					inst[a](...args[a]);
				} else {
					console.log(`${a}() is not a function of midi`);
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
			console.log(`Instrument named '${type}' is not supported`);
		}
	});

	// start new loops;
	for (let s=0; s<sounds.length; s++){
		sounds[s].makeLoop();
		sounds[s].fadeIn(crossFade);
	}
}
module.exports = code;