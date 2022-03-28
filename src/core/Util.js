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
	return randLookup(lookup(a, i));
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

module.exports = { lookup, randLookup, isRandom, getParam, toArray, msToS, formatRatio, divToS }