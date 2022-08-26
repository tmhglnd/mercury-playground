const Tone = require('tone');
const Util = require('total-serialism').Utility;
const TL = require('total-serialism').Translate;
const Mercury = require('mercury-lang');
const MonoSample = require('./core/MonoSample.js');
const MonoMidi = require('./core/MonoMidi.js');
const MonoSynth = require('./core/MonoSynth.js');
const PolySynth = require('./core/PolySynth.js');
const Tempos = require('./data/genre-tempos.json');

// fade time in seconds TODO: Make this adjustable with code/setting
let crossFade = 1.5;
// array with the insturments playing
let _sounds = [];
let sounds = [];

// parse and evaluate the inputted code
// as an asyncronous function with promise
async function code({ file, engine, canvas, p5canvas }){
	console.log('Evaluating');
	let c = file;

	let t = Tone.Transport.seconds;
	let parser = new Promise((resolve) => {
		return resolve(Mercury(c));
	});
	let parse = await parser;
	// let parse = Mercury(c);
	console.log(`Done: ${((Tone.Transport.seconds - t) * 1000).toFixed(3)}ms`);

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
		return;
	}

	tree.print.forEach((p) => {
		log(p);
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
	t = Tone.Transport.seconds;

	const globalMap = {
		'crossFade' : (args) => {
			// set crossFade time in ms
			crossFade = Number(args[0])/1000;
			log(`crossfade time is ${args[0]}ms`);
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
			if (mute){ engine.silence(); }
			else { engine.resume(); }
		},
		'scale' : (args) => {
			let s = TL.scaleNames();
			let scl = Array.isArray(args[0])? args[0][0] : args[0];
			let rt = Array.isArray(args[1])? args[1][0] : args[1];

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

			objectMap.applyFunctions(args, inst, type);
			return inst;
		},
		'midi' : (obj) => {
			// console.log('make midi', obj);
			let device = obj.type;
			let args = obj.functions;
			let inst = new MonoMidi(engine, device, canvas);

			objectMap.applyFunctions(args, inst, type);
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
		}
	}

	// handle .objects
	for (let o in tree.objects){
		let type = tree.objects[o].object;;
		if (objectMap[type]){
			sounds.push(objectMap[type](tree.objects[o]));
		} else {
			log(`Instrument named '${type}' is not supported`);
		}
	}

	sounds.map((s) => {
		// start new loops;
		s.makeLoop();
	});
	console.log(`Made instruments in: ${((Tone.Transport.seconds - t) * 1000).toFixed(3)}ms`);

	// when all loops started fade in the new sounds and fade out old
	sounds.map((s) => {
		// fade in new sounds;
		s.fadeIn(crossFade);
	});

	_sounds.map((s) => {
		// fade out and delete after fade
		s.fadeOut(crossFade);
	});
	// empty array to trigger garbage collection
	_sounds = [];
}
module.exports = code;