const Tone = require('tone');
const Util = require('./Util.js');

// all the available effects
const fxMap = {
	'drive' : (params) => {
		return new Drive(params);
	},
	'distortion' : (params) => {
		return new Drive(params);
	},
	'overdrive' : (params) => {
		return new Drive(params);
	},
	'chip' : (params) => {
		return new BitCrusher(params);
	},
	'reverb' : (params) => {
		return new Reverb(params);
	}, 
	/* 'delay' : (param) => {
		// console.log('delay', param);
		let t = (param[0] !== undefined)? param[0] : '3/16';
		let fb = (param[1] !== undefined)? param[1] : 0.3;
		let del = new Tone.PingPongDelay(formatRatio(t), fb);

		return del;
	} */
}
module.exports = fxMap;

const Drive = function(_params) {
	console.log('FX => Drive()', _params);

	this.args = (_params[0])? _params[0] : 1.5;
	this._drive = Util.toArray(this.args);

	this._fx = new Tone.WaveShaper();

	this.shaper = function(amount){
		// drive curve, minimum drive of 1
		const d = Math.pow(amount, 2);
		// makeup gain
		const m = Math.pow(d, 0.6);
		// preamp gain reduction for linear at drive = 1
		const p = 0.4;
		// set the waveshaping effect
		this._fx.setMap((x) => {
			return Math.tanh(x * p * d) / p / m;
		});
	}
	
	this.set = function(c){
		let d = Util.randLookup(Util.lookup(this._drive, c));
		this.shaper(isNaN(d)? 1 : Math.max(1, d));
	}

	this.chain = function(){
		return this._fx;
	}

	this.delete = function(){
		this._fx.disconnect();
		this._fx.dispose();
	}
}

const BitCrusher = function(_params) {
	console.log('FX => BitCrusher()', _params);

	this._fx = new Tone.BitCrusher(_params[0]);

	this.set = function(c){

	}

	this.chain = function(){
		return this._fx;
	}

	this.delete = function(){
		this._fx.disconnect();
		this._fx.dispose();
	}
}

const Reverb = function(_params) {
	console.log('FX => Reverb()', _params);

	// this._fltr = new Tone.OnePoleFilter();
	this._fx = new Tone.Reverb();
	// this._fx = new Tone.Gain(1).chain(this._rev, this._fltr);
	// this._fx = new Tone.Freeverb();
	// this._fx = new Tone.JCReverb();

	// this._cutoff = 5000;
	this._wet = (_params[0])? Util.toArray(_params[0]) : [0.4];
	this._size = (_params[1])? Util.toArray(_params[1]) : [7];

	this.set = function(c){
		// this._fltr.frequency.value = this._cutoff;
		this._fx.decay = Math.min(10, Math.max(0.1, Util.lookup(this._size, c)));
		this._fx.wet.value = Util.lookup(this._wet, c);
		// this._fx.roomSize.value = Util.lookup(this._size, c);
	}

	this.chain = function(){
		return this._fx;
	}

	this.delete = function(){
		this._fx.disconnect();
		this._fx.dispose();
	}
}