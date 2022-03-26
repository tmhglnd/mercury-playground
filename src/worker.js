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
// as an asyncronous function with promise
async function code({ file, engine }){
	console.log('Evaluating');
	let c = file;

	let t = Tone.Transport.seconds;
	let parser = new Promise((resolve, reject) => {
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
	tree.print.forEach((p) => {
		log(p);
	});

	if (errors.length > 0){
		// return if the code contains any syntax errors
		log(`Code not executed because of syntax error`);
		return;
	}

	const globalMap = {
		'crossFade' : (args) => {
			// set crossFade time in ms
			crossFade = Number(args[0])/1000;
			// log(`set crossfade time to ${args[0]} ms`);
		},
		'tempo' : (args) => {
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
			let inst = new MonoSample(type, engine);

			// apply arguments to instrument if part of instrument
			Object.keys(args).forEach((a) => {
				if (inst[a]){
					inst[a](...args[a]);
				} else {
					log(`${a}() is not a function of sample`);
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
					log(`${a}() is not a function of loop`);
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
					log(`${a}() is not a function of synth`);
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
					log(`${a}() is not a function of midi`);
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
			log(`Instrument named '${type}' is not supported`);
		}
	});

	t = Tone.Transport.seconds;
	console.log('Making loops');

	sounds.map(async (s) => {
		// start new loops;
		await s.makeLoop();
	});
	console.log(`Done: ${((Tone.Transport.seconds - t) * 1000).toFixed(3)}ms`);

	sounds.map(async (s) => {
		// fade in new sounds;
		s.fadeIn(crossFade);
	});

	_sounds.map(async (s) => {
		// fade out and delete after fade
		s.fadeOut(crossFade);
	});
}
module.exports = code;