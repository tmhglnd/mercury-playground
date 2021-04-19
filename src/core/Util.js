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
function formatRatio(d, bpm){
	if (String(d).match(/\d+\/\d+/)){
		return eval(String(d)) * 4.0 * 60 / bpm;
	} else if (!isNaN(Number(d))){
		return Number(d) * 4.0 * 60 / bpm;
	} else {
		print(`${d} is not a valid time value`);
		return 60 / bpm;
	}
}

module.exports = { lookup, randLookup, toArray, msToS, formatRatio }