const Tone = require('tone');
const Util = require('total-serialism').Utility;
const TL = require('total-serialism').Translate;
const Mercury = require('mercury-lang');
const MonoSample = require('./core/MonoSample.js');
const MonoMidi = require('./core/MonoMidi.js');
const MonoSynth = require('./core/MonoSynth.js');
const MonoInput = require('./core/MonoInput.js');
const PolySynth = require('./core/PolySynth.js');
const PolySample = require('./core/PolySample.js');
const Tempos = require('./data/genre-tempos.json');
const MonoOSC = require('./core/MonoOSC.js');
const { divToS } = require('./core/Util.js');

// cross-fade time
let crossFade = 2;
// arrays with the current and previous instruments playing for crossfade
let _sounds = [];
let sounds = [];

// global variables easily accessed
// window.time = Tone.now();
// window.transport = Tone.getTransport().position;

// parse and evaluate the inputted code
// as an asyncronous function with promise
function code({ file, engine, canvas, p5canvas }){
	let silenced = false;
	let c = file;

	let t = window.performance.now();
	// let parser = new Promise((resolve) => {
	// 	return resolve(Mercury(c));
	// });
	// let parse = await parser;
	let parse = Mercury(c);
	console.log(`Evaluated in: ${(window.performance.now() - t).toFixed(1)}ms`);

	let tree = parse.parseTree;
	let errors = parse.errors;
	
	console.log('ParseTree', tree);
	console.log('Errors', errors);

	// handle .print and .errors
	let l = document.getElementById('console-log');
	l.innerHTML = '';
	errors.forEach((e) => {
		log(e);
	});
	if (errors.length > 0){
		// return if the code contains any syntax errors
		log(`Could not run because of syntax error`);
		log(`Please see Help for more information`);
		return;
	}

	tree.print.forEach((p) => {
		log(p);
		// log('\n');
		// log(Util.plot(p, { log: false, data: false, height: 8 }));
		// log('\n');
	});

	// hide canvas and noLoop
	p5canvas.hide();
	// handle .display to p5
	tree.display.forEach((p) => {
		// restart canvas if view is used
		let n = Util.mul(Util.normalize(p), 255);
		p5canvas.sketch.fillCanvas(n);
		p5canvas.display();
	});

	// set timer to check 
	t = window.performance.now();

	const globalMap = {
		'crossFade' : (args) => {
			// set crossFade time in ms
			crossFade = divToS(args[0], engine.getBPM());
			// crossFade = Number(args[0])/1000;
			log(`crossfade time is ${crossFade}ms`);
		},
		'tempo' : (args) => {
			let t = args[0];
			if (isNaN(t)){
				t = Tempos[args[0].toLowerCase()];
				if (t === undefined){
					log(`tempo ${args[0]} is not a valid genre or number`);
					return;
				}
				args[0] = t;
			}
			engine.setBPM(...args);
			// log(`set bpm to ${bpm}`);
		}, 
		'silence' : (mute) => {
			if (mute){ 
				engine.silence(); 
				silenced = true;
			}
		},
		'scale' : (args) => {
			let s = TL.scaleNames();
			let scl = Array.isArray(args[0])? args[0][0] : args[0];
			let rt = Array.isArray(args[1])? args[1][0] : args[1];

			if (scl.match(/(none|null|off)/)){
				TL.setScale('chromatic');
				TL.setRoot('c');
				document.getElementById('scale').innerHTML = '';
				return;
			}

			if (s.indexOf(scl) > -1){
				TL.setScale(scl)
			} else {
				log(`${scl} is not a valid scale`);
			}
			if (rt){
				TL.setRoot(rt)
			}

			let tmpS = TL.getScale().scale;
			let tmpR = TL.getScale().root;
			document.getElementById('scale').innerHTML = `scale = ${tmpR} ${tmpS}`;
			// log(`set scale to ${tmpR} ${tmpS}`);
		},
		'amp' : (args) => {
			engine.setVolume(...args);
			// log(`set volume to ${args[0]}`);
		},
		'highPass' : (args) => {
			engine.setHiPass(...args);
			// log(`set bpm to ${args[0]} Hz`);
		},
		'lowPass' : (args) => {
			engine.setLowPass(...args);
			// log(`set bpm to ${args[0]} Hz`);
		},
		'samples' : (args) => {
			// load samples in the audiobuffer
			// this can be a single url to a soundfile
			// or a url to a folder that will be searched through
			// console.log('Loading samples', args);
			engine.addBuffers(args);
			// args.forEach((a) => {
			// });
		},
		'midiDelay' : (args) => {
			// set some additional latency for all the midi
			// TO DO
		},
		'midiLog' : (args) => {
			if (isNaN(args[0])){
				window.midiLog = args[0] === 'on' ? 1 : 0;
			} else {
				window.midiLog = (args[0] > 0);
			}
			if (window.midiLog){
				printMidiDevices();
			}
		},
		'midiEnable' : (args) => {
			if (isNaN(args[0])){
				window.midiEnable = args[0] === 'on' ? 1 : 0;
			} else {
				window.midiLog = (args[0] > 0);
			}
		}
	}

	const objectMap = {
		'sample' : (obj) => {
			// console.log('make sample', obj);
			let type = obj.type;
			let args = obj.functions;			
			let inst = new MonoSample(engine, type, canvas);

			objectMap.applyFunctions(args, inst, type);
			return inst;
		},
		'loop' : (obj) => {
			// console.log('make sample', obj);
			let type = obj.type;
			let args = obj.functions;			
			let inst = new MonoSample(engine, type, canvas);

			objectMap.applyFunctions(args, inst, type);
			return inst;
		},
		'synth' : (obj) => {
			// console.log('make synth', obj);
			let type = obj.type;
			let args = obj.functions;			
			let inst = new MonoSynth(engine, type, canvas);

			objectMap.applyFunctions(args, inst, type);
			return inst;
		},
		'polySynth' : (obj) => {
			let type = obj.type;
			let args = obj.functions;
			let inst = new PolySynth(engine, type, canvas);
			// let inst = new PolySample(engine, type, canvas);

			objectMap.applyFunctions(args, inst, type);
			return inst;
		},
		'polySample' : (obj) => {
			let type = obj.type;
			let args = obj.functions;
			let inst = new PolySample(engine, type, canvas);
			
			objectMap.applyFunctions(args, inst, type);
			return inst;
		},
		'midi' : (obj) => {
			// console.log('make midi', obj);
			let device = obj.type;
			let args = obj.functions;
			let inst = new MonoMidi(engine, device, canvas);

			objectMap.applyFunctions(args, inst, device);
			return inst;
		},
		'applyFunctions' : (args, inst, type) => {
			// apply arguments to instrument if part of instrument
			Object.keys(args).forEach((a) => {
				if (inst[a]){
					inst[a](...args[a]);
				} else {
					log(`${a}() is not a function of ${type}`);
				}
			});
			return inst;
		},
		'input' : (obj) => {
			let device = obj.type;
			let args = obj.functions;
			let inst = new MonoInput(engine, device, canvas);
			// apply arguments to instrument
			Object.keys(args).forEach((a) => {
				if (inst[a]){
					inst[a](...args[a]);
				} else {
					log(`${a}() is not a function of input`);
				}
			});
			return inst;
		},
		'osc' : (obj) => {
			let type = obj.type;
			let args = obj.functions;
			let inst = new MonoOSC(engine, type, canvas);

			// for OSC we specifically allow all methods because they are used
			// as addresses for sending messages
			Object.keys(args).forEach((a) => {
				if (inst[a]){
					inst[a](...args[a]);
				} else {
					inst.addMessage(a, ...args[a]);
					// console.log(`Make osc message function with ${a}, ${args[a]}`);
				}
			})

			return inst;
		}
	}

	// handle .global
	Object.keys(tree.global).forEach((g) => {
		if (globalMap[g]){
			globalMap[g](tree.global[g]);
		}
	});

	// if silenced break out of everything
	if (silenced){
		return;
	}

	// copy current sounds over with reference
	// _sounds = sounds.slice();
	_sounds = [...sounds];
	// empty previous sounds
	sounds = [];

	// handle .objects
	for (let o in tree.objects){
		let type = tree.objects[o].object;;
		if (objectMap[type]){
			sounds.push(objectMap[type](tree.objects[o]));
		} else {
			log(`Instrument named '${type}' is not supported`);
		}
	}

	// get all the current counts and store in dict
	let countTransfer = {};
	_sounds.map((s) => {
		countTransfer[s._name] = {
			count: s._count,
			beat: s._beatCount
		}
	});

	sounds.map((s) => {
		// create and start new loops
		s.makeLoop(countTransfer);
	});
	
	// transferCount(_sounds, sounds);
	// when all loops started fade in the new sounds and fade out old
	if (!sounds.length){
		startSound(sounds);
	}
	removeSound(_sounds, crossFade);
	startSound(sounds, crossFade);

	// resume the engine if it's not playing yet
	engine.resume();

	console.log(`Made instruments in: ${(window.performance.now() - t).toFixed(1)}ms`);
}
	
function getSound(){
	return sounds;
}

function transferCount(prevSounds, newSounds){
	// transfer the time of the previous sound to the new sound object
	// to preserve continuity when re-evaluating code
	// first just go over all the existing instruments and transfer the counts
	for (let s=0; s<prevSounds.length; s++){
		if (newSounds[s]){
			newSounds[s]._count = prevSounds[s]._count;
			newSounds[s]._beatCount = prevSounds[s]._beatCount;
		}
	}	
	// But also check for specific names and apply those where needed
	prevSounds.map((prev) => {
		newSounds.map((cur) => {
			if (cur._name === prev._name){
				cur._count = prev._count;
				cur._beatCount = prev._beatCount;
			}
		});
	});
}

function startSound(s, f=0){
	// fade in new sounds
	s.map((_s) => {
		_s.fadeIn(f);
	});
}

function removeSound(s, f=0) {
	s.map((_s) => {
		// fade out and delete after fade
		_s.fadeOut(f);
	});
	// empty array to trigger garbage collection
	s.length = 0;
}
module.exports = { code, removeSound, getSound };