const Tone = require('tone');
const Mercury = require('mercury-lang');
const MonoSample = require('./core/MonoSample.js');

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
	/*cEditor.setValue('');
	tree.print.forEach((p) => {
		print(p);
	});*/

	const globalMap = {
		'tempo' : (args) => {
			engine.setBPM(...args);
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
					console.log(`${a}() is not a function of sample`);
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
	for (let s in sounds){
		sounds[s].makeLoop();
	}
}
module.exports = code;