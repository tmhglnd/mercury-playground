
const Gen  = require('total-serialism').Generative;
const Algo = require('total-serialism').Algorithmic;
const Mod  = require('total-serialism').Transform;
const Rand = require('total-serialism').Stochastic;
const Stat = require('total-serialism').Statistic;
const TL   = require('total-serialism').Translate;
const Util = require('total-serialism').Utility;

const functionMap = {
	// All the Array transformation/generation methods
	// From the total-serialism Node package
	// 
	// Generative Methods
	// 
	// generate an array of ints between specified range
	'spread' : (...v) => {
		return Gen.spread(...v);
	},
	// generate an array of floats between range
	'spreadFloat' : (...v) => {
		return Gen.spreadFloat(...v);
	},
	'spreadF' : (...v) => {
		return Gen.spreadFloat(...v);
	},
	// generate an array of ints between specified range (inclusive)
	'spreadInclusive' : (...v) => {
		return Gen.spreadInclusive(...v);
	},
	// generate an array of floats between range (inclusive)
	'spreadInclusiveFloat' : (...v) => {
		return Gen.spreadInclusiveFloat(...v);
	},
	'spreadInclusiveF' : (...v) => {
		return Gen.spreadInclusiveFloat(...v);
	},
	// generate an array between range (exponentially)
	'spreadExp' : (...v) => {
		return Gen.spreadExp(...v);
	},
	'spreadExpFloat' : (...v) => {
		return Gen.spreadExpFloat(...v);
	},
	'spreadExpF' : (...v) => {
		return Gen.spreadExpFloat(...v);
	},
	'spreadInclusiveExp' : (...v) => {
		return Gen.spreadInclusiveExp(...v);
	},
	'spreadIncExp' : (...v) => {
		return Gen.spreadInclusiveExp(...v);
	},
	'spreadInclusiveExpFloat' : (...v) => {
		return Gen.spreadInclusiveExpFloat(...v);
	},
	'spreadIncExpF' : (...v) => {
		return Gen.spreadInclusiveExpFloat(...v);
	},
	// fill an array with duplicates of a value
	'fill' : (...v) => {
		return Gen.fill(...v);
	},
	// generate an array from a sinewave function
	'sine' : (...v) => {
		return Gen.sine(...v);
	},
	'sineFloat' : (...v) => {
		return Gen.sineFloat(...v);
	},
	'sineF' : (...v) => {
		return Gen.sineFloat(...v);
	},
	'sinF' : (...v) => {
		return Gen.sineFloat(...v);
	},
	// generate an array from a cosine function
	'cosine' : (...v) => {
		return Gen.cosine(...v);
	},
	'cosineFloat' : (...v) => {
		return Gen.cosineFloat(...v);
	},
	'cosineF' : (...v) => {
		return Gen.cosineFloat(...v);
	},
	'cosF' : (...v) => {
		return Gen.cosineFloat(...v);
	},
	// generate an array from a sawtooth function
	'saw' : (...v) => {
		return Gen.saw(...v);
	},
	'sawFloat' : (...v) => {
		return Gen.sawFloat(...v);
	},
	'sawF' : (...v) => {
		return Gen.sawFloat(...v);
	},
	// generate an array from a squarewave function
	'square' : (...v) => {
		return Gen.square(...v);
	},
	'rect' : (...v) => {
		return Gen.square(...v);
	},
	'squareFloat' : (...v) => {
		return Gen.squareFloat(...v);
	},
	'squareF' : (...v) => {
		return Gen.squareFloat(...v);
	},
	'rectF' : (...v) => {
		return Gen.squareFloat(...v);
	},
	// 
	// Algorithmic Methods
	// 
	// generate a euclidean rhythm evenly spacing n-beats amongst n-steps
	// switched to fastEuclid method
	'euclid' : (...v) => {
		// return Algo.euclid(...v);
		return Algo.fastEuclid(...v);
	},
	'euclidean' : (...v) => {
		// return Algo.euclid(...v);
		return Algo.fastEuclid(...v);
	},
	// generate a rhythm based on a hexadecimal string (0-f)
	'hexBeat' : (...v) => {
		// console.log("@hexBeat", v);
		return Algo.hexBeat(v[0]);
	},
	'hex' : (...v) => {
		return Algo.hexBeat(v[0]);
	},
	// generate the numbers in the fibonacci sequence
	'fibonacci' : (...v) => {
		return Algo.fibonacci(...v);
	},
	// generate the pisano periods from the fibonacci sequence
	'pisano' : (...v) => {
		return Algo.pisano(...v);
	},
	// generate the numbers in the fibonacci sequence
	'pell' : (...v) => {
		return Algo.pell(...v);
	},
	// generate the numbers in the fibonacci sequence
	'lucas' : (...v) => {
		return Algo.lucas(...v);
	},
	// generate the numbers in the fibonacci sequence
	'threeFibonacci' : (...v) => {
		return Algo.threeFibonacci(...v);
	},
	// 
	// Stochastic Methods
	// 
	// set the random number generator seed
	'randomSeed' : (...v) => {
		Rand.seed(v[0]);
	},
	// generate an array of random integers in range
	'random' : (...v) => {
		return Rand.random(...v);
	},
	'rand' : (...v) => {
		return Rand.random(...v);
	},
	// generate an array of random floats
	'randomFloat' : (...v) => {
		return Rand.randomFloat(...v);
	},
	'randomF' : (...v) => {
		return Rand.randomFloat(...v);
	},
	'randF' : (...v) => {
		return Rand.randomFloat(...v);
	},
	// generate a random walk (drunk)
	'drunk' : (...v) => {
		return Rand.drunk(...v);
	},
	'drunkFloat' : (...v) => {
		return Rand.drunkFloat(...v);
	},
	'drunkF' : (...v) => {
		return Rand.drunkFloat(...v);
	},
	// generate random values picked from an urn
	'urn' : (...v) => {
		return Rand.urn(...v);
	},
	// generate an array of coin tosses
	'coin' : (...v) => {
		return Rand.coin(v[0]);
	},
	// generate an array of dice rolls
	'dice' : (...v) => {
		return Rand.dice(v[0]);
	},
	// generate random clave patterns
	'clave' : (...v) => {
		return Rand.clave(...v);
	},
	// generate an array of twelveTone notes
	'twelveTone' : () => {
		return Rand.twelveTone();
	},
	// choose values at random from a ring provided
	'choose' : (...v) => {
		return Rand.choose(...v);
	},
	// pick values randomly from a ring provided and remove chosen
	'pick' : (...v) => {
		return Rand.pick(...v);
	},
	// shuffle the items in an array, influenced by the random seed
	'shuffle' : (v) => {
		return Rand.shuffle(v);
	},
	'scramble' : (v) => {
		return Rand.shuffle(v);
	},
	// expand an array based upon the pattern within an array
	// arbitrarily choosing the next 
	'expand' : (...v) => {
		// check if arguments are correct
		v[0] = (Array.isArray(v[0])) ? v[0] : [v[0]];
		v[1] = Math.max(2, (Array.isArray(v[1])) ? v[1][0] : v[1]);
		return Rand.expand(v[0], v[1]);
	},
	// 
	// Transformational Methods
	// 
	// duplicate an array with an offset added to every value
	'clone' : (...v) => {
		return Mod.clone(...v);
	},
	// combine multiple numbers/arrays into one
	'combine' : (...v) => {
		return Mod.combine(...v);
	},
	'concat' : (...v) => {
		return Mod.combine(...v);
	},
	'join' : (...v) => {
		return Mod.combine(...v);
	},
	// duplicate an array certain amount of times
	'duplicate' : (...v) => {
		return Mod.duplicate(...v);
	},
	'dup' : (...v) => {
		return Mod.duplicate(...v);
	},
	'copy' : (...v) => {
		return Mod.duplicate(...v);
	},
	// repeat the individual values of an array by a certain amount
	'repeat' : (...v) => {
		return Mod.repeat(...v);
	},
	// Pad an array with zeroes (or any other value) up to the length specified.
	'pad' : (...v) => {
		return Mod.pad(...v);
	},
	// add zeroes to a rhythm to make it play once over a certain amount of bars
	'every' : (...v) => {
		return Mod.every(...v);
	},
	// flatten a multidimensional array to 1D (or specified)
	'flat' : (...v) => {
		return Util.flatten(...v);
	},
	// invert an array around a center point
	'invert' : (...v) => {
		return Mod.invert(...v);
	},
	'inverse' : (...v) => {
		return Mod.invert(...v);
	},
	'flip' : (...v) => {
		return Mod.invert(...v);
	},
	'filter' : (...v) => {
		return Mod.filter(v[0], v.slice(1, v.length));
	},
	'inv' : (...v) => {
		return Mod.invert(...v);
	},
	// lookup the values from an array based on another array
	'lookup' : (...v) => {
		return Mod.lookup(...v);
	},
	'get' : (...v) => {
		return Mod.lookup(...v);
	},
	// interleave multiple arrays into one
	'lace' : (...v) => {
		return Mod.lace(...v);
	},
	'zip' : (...v) => {
		return Mod.lace(...v);
	},
	// merge arrays into a 2D-array
	'merge' : (...v) => {
		return Mod.merge(...v);
	},
	'mix' : (...v) => {
		return Mod.merge(...v);
	},
	// generate a palindrome of an array
	'palindrome' : (...v) => {
		return Mod.palindrome(...v);
	},
	'palin' : (...v) => {
		return Mod.palindrome(...v);
	},
	'mirror' : (...v) => {
		return Mod.palindrome(...v);
	},
	// rotate an array in positive or negative direction
	'rotate' : (...v) => {
		return Mod.rotate(...v);
	},
	'rot' : (...v) => {
		return Mod.rotate(...v);
	},
	'turn' : (...v) => {
		return Mod.rotate(...v);
	},
	// reverse an array
	'reverse' : (...v) => {
		return Mod.reverse(...v);
	},
	'rev' : (...v) => {
		return Mod.reverse(...v);
	},
	'retrograde' : (...v) => {
		return Mod.reverse(...v);
	},
	// sort an array in ascending or descending order
	'sort' : (...v) => {
		return Stat.sort(...v);
	},
	// spray values on the non-zero places of another array
	'spray' : (...v) => {
		return Mod.spray(...v);
	},
	// slice an array into one or multiple parts
	'slice' : (...v) => {
		return Mod.slice(...v);
	},
	// split an array recursively till the end
	'split' : (...v) => {
		return Mod.split(...v);
	},
	// cut a piece of the array and return
	'cut' : (...v) => {
		return Mod.slice(...v)[0];
	},
	// stretch an array to a specified length, interpolating values
	'stretch' : (...v) => {
		return Util.trunc(functionMap['stretchFloat'](...v));
	},
	'stretchF' : (...v) => {
		return functionMap['stretchFloat'](...v);
	},
	'stretchFloat' : (...v) => {
		// swap because of implementation in total-serialism
		v[0] = (Array.isArray(v[0])) ? v[0] : [v[0]];
		v[1] = Math.max(2, (Array.isArray(v[1])) ? v[1][0] : v[1]);
		return Mod.stretch(...v);
	},
	// remove duplicates from an array, leave order intact
	'unique' : (...v) => {
		return Mod.unique(...v);
	},
	'thin' : (...v) => {
		return Mod.unique(...v);
	},
	// 
	// Translate Methods
	//
	'tempo' : (...v) => {
		TL.setTempo(v[0]);
		return TL.getTempo();
	},
	'scale' : (...v) => {
		TL.setScale(...v);
		return TL.getSettings().map;
	},
	'scaleNames' : (...v) => {
		return TL.getScales();
	},
	'tuning' : (...v) => {
		console.log('set tuning', v);
	},
	'root' : (v) => {
		TL.setRoot(v[0]);
		return TL.getSettings().root;
	},
	'toScale' : (...v) => {
		return TL.toScale(...v);
	},
	// tempo translate methods
	'division2ms' : (...v) => {
		return TL.divisionToMs(...v);
	},
	'd2ms' : (...v) => {
		return TL.divisionToMs(...v);
	},
	'division2ratio' : (...v) => {
		return TL.divisionToRatio(...v);
	},
	'd2r' : (...v) => {
		return TL.divisionToRatio(...v);
	},
	'ratio2ms' : (...v) => {
		return TL.ratioToMs(...v);
	},
	'r2ms' : (...v) => {
		return TL.ratioToMs(...v);
	},
	'time2ratio' : (...v) => {
		return TL.timevalueToRatio(...v);
	},
	't2r' : (...v) => {
		return TL.timevalueToRatio(...v);
	},
	// pitch translate methods
	'note2midi' : (...v) => {
		return TL.ntom(...v);
	},
	'n2m' : (...v) => {
		return TL.ntom(...v);
	},
	'note2freq' : (...v) => {
		return TL.noteToFreq(...v);
	},
	'n2f' : (...v) => {
		return TL.noteToFreq(...v);
	},
	'midi2note' : (...v) => {
		return TL.midiToNote(...v);
	},
	'm2n' : (...v) => {
		return TL.midiToNote(...v);
	},
	'midi2freq' : (...v) => {
		return TL.midiToFreq(...v);
	},
	'm2f' : (...v) => {
		return TL.midiToFreq(...v);
	},
	'freq2midi' : (...v) => {
		return TL.freqToMidi(...v);
	},
	'f2m' : (...v) => {
		return TL.freqToMidi(...v);
	},
	'freq2note' : (...v) => {
		return TL.freqToNote(...v);
	},
	'f2n' : (...v) => {
		return TL.freqToNote(...v);
	},
	'relative2midi' : (...v) => {
		return TL.relativeToMidi(...v);
	},
	'r2m' : (...v) => {
		return TL.relativeToMidi(...v);
	},
	'relative2freq' : (...v) => {
		return TL.relativeToFreq(...v);
	},
	'r2f' : (...v) => {
		return TL.relativeToFreq(...v);
	},
	'ratio2cent' : (...v) => {
		return TL.ratioToCent(...v);
	},
	'rtc' : (...v) => {
		return TL.ratioToCent(...v);
	},
	// 
	// Statistic Methods
	// 
	// IMPLEMENTATION NEEDED
	// maximum
	// minimum
	// mean
	// median
	// mode

	// 
	// Utility Methods
	// 
	// wrap values between a low and high range
	'wrap' : (...v) => {
		return Util.wrap(...v);
	},
	// fold values between a low and high range
	'fold' : (...v) => {
		return Util.fold(...v);
	},
	// clip values between a low and high range
	'clip' : (...v) => {
		return Util.constrain(...v);
	},
	'constrain' : (...v) => {
		return Util.constrain(...v);
	},
	// scale values from an input range to an output range
	'map' : (...v) => {
		return Util.map(...v);
	},
	// add 1 or more values to an array
	'add' : (...v) => {
		return Util.add(...v);
	},
	// subtract 1 or more values from an array
	'subtract' : (...v) => {
		return Util.subtract(...v);
	},
	'sub' : (...v) => {
		return Util.subtract(...v);
	},
	// multiply 1 or more values to an array
	'multiply' : (...v) => {
		return Util.multiply(...v);
	},
	'mul' : (...v) => {
		return Util.multiply(...v);
	},
	// divide 1 or more values from an array
	'divide' : (...v) => {
		return Util.divide(...v);
	},
	'div' : (...v) => {
		return Util.divide(...v);
	},
	// normalize an array to 0-1 range
	'normalize' : (...v) => {
		return Util.normalize(...v);
	},
	'norm' : (...v) => {
		return Util.normalize(...v);
	},
	// take the modulus of an array
	'modulo' : (...v) => {
		return Util.mod(...v);
	},
	'mod' : (...v) => {
		return Util.mod(...v);
	}
}
exports.functionMap = functionMap;