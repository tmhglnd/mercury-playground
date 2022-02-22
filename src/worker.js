const Tone = require('tone');
const TL = require('total-serialism').Translate;
const Mercury = require('mercury-lang');
const MonoSample = require('./core/MonoSample.js');
const MonoMidi = require('./core/MonoMidi.js');
const MonoSynth = require('./core/MonoSynth.js');

// fade time in seconds TODO: Make this adjustable with code/setting
let crossFade = 1.5;
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

	let parse = Mercury(c);
	let tree = parse.parseTree;
	let errors = parse.errors;

	console.log('ParseTree', tree);
	console.log('Errors', errors);

	// handle .print and .errors
	let l = document.getElementById('console-log');
	l.innerHTML = '';
	errors.forEach((e) => {
		l.innerHTML += `${e}<br>`;
		console.error(e);
	});

	tree.print.forEach((p) => {
		l.innerHTML += `${p}<br>`;
		console.log(p);
	});

	const globalMap = {
		'crossFade' : (args) => {
			// set crossFade time in ms
			crossFade = Number(args[0])/1000;
		},
		'tempo' : (args) => {
			engine.setBPM(...args);
		}, 
		'silence' : (mute) => {
			if (mute){ engine.silence(); }
			else { engine.resume(); }
		},
		'scale' : (args) => {
			let s = TL.scaleNames();
			if (s.indexOf(args[0]) > -1){
				TL.setScale(args[0])
			} else {
				console.log(`${args[0]} is not a valid scale`);
			}
			if (args[1]){
				TL.setRoot(args[1])
			}
			console.log('scale', args);
			console.log(TL.getSettings());
		},
		'amp' : (args) => {
			engine.setVolume(...args);
		},
		'highPass' : (args) => {
			engine.setHiPass(...args);
		},
		'lowPass' : (args) => {
			engine.setLowPass(...args);
		}
	}

	// handle .global
	Object.keys(tree.global).forEach((g) => {
		if (globalMap[g]){
			globalMap[g](tree.global[g]);
		}
	});

	// copy current sounds over
	_sounds = sounds.slice();
	// empty previous sounds
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

	for (let s=0; s<_sounds.length; s++){
		// fade out and delete
		_sounds[s].fadeOut(crossFade);
		// _sounds[s].delete();
	}
}
module.exports = code;