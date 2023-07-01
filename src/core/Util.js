const { noteToMidi, toScale, mtof } = require('total-serialism').Translate;

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

// is argument random?
// return random value between lo and hi range
// else return input
function isRandom(a, l=0, h=1){
	if (String(a).match(/rand(om)?/g)){
		return Math.random() * (h - l) + l;
	}
	return a;
}

// get parameter from 1 or 2d array
function getParam(a, i){
	// also check if value is an osc-address, then use last received value
	// return randLookup(getOSC(lookup(a, i)));
	// return evalExpr(randLookup(lookup(getOSC(a), i)));
	return randLookup(lookup(getOSC(a), i));
}

// retrieve received messages via osc as arguments or pass through
function getOSC(a){
	// only take first value from array to check if an osc-address
	let osc = a[0];
	if (typeof osc !== 'string'){
		// pass through
		return a;
	} else if (osc.match(/^\/[^`'"\s]+/g)){
		if (!window.oscMessages[osc]){
			console.log(`No message received on address ${osc}`);
			return [0];
		}
		return window.oscMessages[osc];
	}
	// pass through
	return a;
}

// global functions for string expressions in eval()
// very experimental currently
window.cos = Math.cos;
window.sin = Math.sin;
window.floor = Math.floor;
window.ceil = Math.ceil;
window.round = Math.round;
window.mod = Math.mod;
window.pow = Math.pow;
window.sqrt = Math.sqrt;
window.pi = Math.PI;
window.twopi = Math.PI * 2;

// check if the string is formatted as an expression, then evaluate it
function evalExpr(a){
	let expr = a;
	if (typeof expr !== 'string'){
		return a;
	} else if (expr.match(/^\{[^{}]+\}$/g)){
		let result = 0;
		// console.log('evaluate this expression:', eval(expr));
		try {
			result = eval(expr);
		} catch (e){
			log(`Unable to evaluate expression: ${expr}`);
		}
		return result;
	}
	// pass through
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

// parse division formats to Tone Loop intervals in seconds
function formatRatio(d, bpm){
	if (String(d).match(/\d+\/\d+/)){
		return eval(String(d)) * 4.0 * 60 / bpm;
	} else if (!isNaN(Number(d))){
		return Number(d) * 4.0 * 60 / bpm;
	} else {
		// print(`${d} is not a valid time value`);
		console.log(`${d} is not a valid time value`);
		return 60 / bpm;
	}
}

// convert division format to seconds based on bpm
function divToS(d, bpm){
	if (String(d).match(/\d+\/\d+/)){
		return eval(String(d)) * 4.0 * 60 / bpm;
	} else if (!isNaN(Number(d))){
		return Number(d) / 1000;
	} else {
		console.log(`${d} is not a valid time value`);
		return 0.1;
	}
}

// convert note and octave (int/float/name) to a midi value
function toMidi(n=0, o=0){
	if (isNaN(n)){
		let _n = noteToMidi(n);
		if (!_n){
			log(`${n} is not a valid number or name`);
			n = 0;
		} else {
			n = _n - 36;
		}
	}
	return toScale(n + o * 12 + 36);
}

module.exports = { lookup, randLookup, isRandom, getParam, toArray, msToS, formatRatio, divToS, toMidi, mtof, noteToMidi }