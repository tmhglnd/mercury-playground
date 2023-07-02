const Tone = require('tone');
const Util = require('./Util.js');
const TL = require('total-serialism').Translate;

// all the available effects
const fxMap = {
	'drive' : (params) => {
		return new TanhDistortion(params);
	},
	'distort' : (params) => {
		return new TanhDistortion(params);
	},
	'overdrive' : (params) => {
		return new TanhDistortion(params);
	},
	'squash' : (params) => {
		return new Squash(params);
	},
	'compress' : (params) => {
		return new Compressor(params);
	},
	'compressor' : (params) => {
		return new Compressor(params);
	},
	'comp' : (params) => {
		return new Compressor(params);
	},
	'lfo' : (params) => {
		return new LFO(params);
	},
	'tremolo' : (params) => {
		return new LFO(params);
	},
	'flutter' : (params) => {
		return new LFO(params);
	},
	'chip' : (params) => {
		return new DownSampler(params);
	},
	'degrade' : (params) => {
		return new DownSampler(params);
	},
	'reverb' : (params) => {
		return new Reverb(params);
	},
	'shift' : (params) => {
		return new PitchShift(params);
	},
	'pitchShift' : (params) => {
		return new PitchShift(params);
	},
	'tune' : (params) => {
		return new PitchShift(params);
	},
	'filter' : (params) => {
		return new Filter(params);
	},
	'triggerFilter' : (params) => {
		return new TriggerFilter(params);
	},
	'envFilter' : (params) => {
		return new TriggerFilter(params);
	},
	/*'autoFilter' : (params) => {
		return new AutoFilter(params);
	},
	'wobble' : (params) => {
		return fxMap.autoFilter(params);
	},*/
	'delay' : (params) => {
		return new Delay(params);
	},
	'echo' : (params) => {
		return new Delay(params);
	},
	'ppDelay' : (params) => {
		return new PingPongDelay(params);
	},
	'freeverb' : (params) => {
		return new FreeVerb(params);
	}
}
module.exports = fxMap;

// A Downsampling Chiptune effect. Downsamples the signal by a specified amount
// Resulting in a lower samplerate, making it sound more like 8bit/chiptune
// Programmed with a custom AudioWorkletProcessor, see effects/Processors.js
//
const DownSampler = function(_params){
	this._down = (_params[0])? Util.toArray(_params[0]) : [0.5];

	// ToneAudioNode has all the tone effect parameters
	this._fx = new Tone.ToneAudioNode();
	// A gain node for connecting with input and output
	this._fx.input = new Tone.Gain(1);
	this._fx.output = new Tone.Gain(1);
	// the fx processor
	this._fx.workletNode = Tone.getContext().createAudioWorkletNode('downsampler-processor');
	// connect input, fx and output
	this._fx.input.chain(this._fx.workletNode, this._fx.output);

	this.set = function(c, time, bpm){
		// some parameter mapping changing input range 0-1 to 1-inf
		let p = this._fx.workletNode.parameters.get('down');
		let d = Math.floor(1 / (1 - Util.clip(Util.getParam(this._down, c) ** 0.25, 0, 0.999)));
		p.setValueAtTime(Util.assureNum(d), time);
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._fx }
	}

	this.delete = function(){
		this._fx.disconnect();
		this._fx.dispose();
	}
}

// A distortion algorithm using the tanh (hyperbolic-tangent) as a 
// waveshaping technique. Some mapping to apply a more equal loudness 
// distortion is applied on the overdrive parameter
//
const TanhDistortion = function(_params){
	this._drive = (_params[0])? Util.toArray(_params[0]) : [4];

	// ToneAudioNode has all the tone effect parameters
	this._fx = new Tone.ToneAudioNode();
	// A gain node for connecting with input and output
	this._fx.input = new Tone.Gain(1);
	this._fx.output = new Tone.Gain(1);
	// the fx processor
	this._fx.workletNode = Tone.getContext().createAudioWorkletNode('tanh-distortion-processor');
	// connect input, fx and output
	this._fx.input.chain(this._fx.workletNode, this._fx.output);

	this.set = function(c, time, bpm){
		// drive amount, minimum drive of 1
		const d = Util.assureNum(Math.max(1, Math.pow(Util.getParam(this._drive, c), 2) + 1));
		// preamp gain reduction for linear at drive = 1
		const p = 0.4;
		// makeup gain
		const m = 1.0 / p / (d ** 0.6);
		// set the input gain and output gain reduction
		this._fx.input.gain.setValueAtTime(p * d, time);
		this._fx.output.gain.setValueAtTime(m, time);
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._fx }
	}

	this.delete = function(){
		this._fx.disconnect();
		this._fx.dispose();
	}
}

// A Compressor effect, allowing to reduce the dynamic range of a signal
// Set the threshold (in dB's), the ratio, the attack and release time in ms
// or relative to the tempo
//
const Compressor = function(_params){
	// replace defaults with provided params
	this.defaults = [-30, 6, 10, 80];
	this.defaults.splice(0, _params.length, ..._params);
	_params = this.defaults.map(p => Util.toArray(p));	

	this._fx = new Tone.Compressor({
		threshold: -24,
		ratio: 4,
		knee: 8,
		attack: 0.005,
		release: 0.07
	});

	this._thr = _params[0];
	this._rat = _params[1];
	this._att = _params[2];
	this._rel = _params[3];

	this.set = function(c, time, bpm){
		this._fx.threshold.setValueAtTime(Util.getParam(this._thr, c), time);
		this._fx.ratio.setValueAtTime(Math.min(20, Util.getParam(this._rat, c)), time);
		this._fx.attack.setValueAtTime(Util.divToS(Util.getParam(this._att, c)), time);
		this._fx.release.setValueAtTime(Util.divToS(Util.getParam(this._rel, c)), time);
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return': this._fx }
	}

	this.delete = function(){
		this._fx.disconnect();
		this._fx.dispose();
	}
}

// A distortion/compression effect of an incoming signal
// Based on an algorithm by Peter McCulloch
// 
const Squash = function(_params){
	this._squash = (_params[0])? Util.toArray(_params[0]) : [1];

	// ToneAudioNode has all the tone effect parameters
	this._fx = new Tone.ToneAudioNode();
	// A gain node for connecting with input and output
	this._fx.input = new Tone.Gain(1);
	this._fx.output = new Tone.Gain(1);
	// the fx processor
	this._fx.workletNode = Tone.getContext().createAudioWorkletNode('squash-processor');
	// connect input, fx and output
	this._fx.input.chain(this._fx.workletNode, this._fx.output);

	this.set = function(c, time, bpm){
		let d = Util.assureNum(Math.max(1, Util.getParam(this._squash, c)));
		let p = this._fx.workletNode.parameters.get('amount');
		let m = 1.0 / Math.sqrt(d);
		p.setValueAtTime(d, time);
		this._fx.output.gain.setValueAtTime(m, time);
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._fx }
	}

	this.delete = function(){
		this._fx.disconnect();
		this._fx.dispose();
	}
}

// Reverb FX
// Add a reverb to the sound to give it a feel of space
// 
const Reverb = function(_params){
	this._fx = new Tone.Reverb();

	this._wet = (_params[0] !== undefined)? Util.toArray(_params[0]) : [ 0.5 ];
	this._size = (_params[1] !== undefined)? Util.toArray(_params[1]) : [ 1.5 ];

	this.set = function(c, time){
		let tmp = Math.min(10, Math.max(0.1, Util.getParam(this._size, c)));
		if (this._fx.decay != tmp){
			this._fx.decay = tmp; 
		}

		let wet = Math.min(1, Math.max(0, Util.getParam(this._wet, c)));
		this._fx.wet.setValueAtTime(wet, time);
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._fx };
	}

	this.delete = function(){
		this._fx.disconnect();
		this._fx.dispose();
	}
}

// PitchShift FX
// Shift the pitch up or down with semitones
// 
const PitchShift = function(_params){
	this._fx = new Tone.PitchShift();

	this._pitch = (_params[0] !== undefined)? Util.toArray(_params[0]) : [-12];
	this._wet = (_params[1] !== undefined)? Util.toArray(_params[1]) : [1];

	this.set = function(c, time){
		let p = Util.getParam(this._pitch, c);
		let w = Util.getParam(this._wet, c);

		this._fx.pitch = TL.toScale(p);
		// this._fx.pitch = p;
		this._fx.wet.setValueAtTime(w, time);
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._fx };
	}

	this.delete = function(){
		this._fx.disconnect();
		this._fx.dispose();
	}
}

// LFO FX
// a Low Frequency Oscillator effect, control tempo, type and depth
//
const LFO = function(_params){
	this._waveMap = {
		sine : 'sine',
		saw : 'sawtooth',
		square : 'square',
		rect : 'square',
		triangle : 'triangle',
		tri : 'triangle',
	}

	this._lfo = new Tone.LFO('8n', 0, 1);
	this._fx = new Tone.Gain();
	this._lfo.connect(this._fx.gain);
	// this._fx = new Tone.Tremolo('8n').start();

	this._speed = (_params[0]) ? Util.toArray(_params[0]) : ['1/8'];
	this._type = (_params[1]) ? Util.toArray(_params[1]) : ['sine'];
	this._depth = (_params[2] !== undefined) ? Util.toArray(_params[2]) : [ 1 ];

	this.set = function(c, time, bpm){
		let w = Util.getParam(this._type, c);
		if (this._waveMap[w]){
			w = this._waveMap[w];
		} else {
			console.log(`'${w} is not a valid waveshape`);
			// default wave if wave does not exist
			w = 'sine';
		}
		this._lfo.set({ type: w });
		
		let s = Util.getParam(this._speed, c);
		let f = Math.max(0.0001, Util.divToS(s, bpm));
		this._lfo.frequency.setValueAtTime(1/f, time);

		let a = Util.getParam(this._depth, c);
		this._lfo.min = Math.min(1, Math.max(0, 1 - a));

		this._lfo.start(time);
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._fx };
	}

	this.delete = function(){
		let blocks = [ this._fx, this._lfo ];
		
		blocks.forEach((b) => {
			b.disconnect();
			b.dispose();
		});
	}
}

// A filter FX, choose between highpass, lowpass and bandpass
// Set the cutoff frequency and Q factor
//
const Filter = function(_params){
	this._fx = new Tone.Filter();

	this._types = {
		'lo' : 'lowpass',
		'low' : 'lowpass',
		'lowpass' : 'lowpass',
		'hi' : 'highpass',
		'high' : 'highpass',
		'highpass' : 'highpass',
		'band' : 'bandpass',
		'bandpass': 'bandpass'
	}
	if (this._types[_params[0]]){
		this._fx.set({ type: this._types[_params[0]] });
	} else {
		console.log(`'${_params[0]}' is not a valid filter type`);
		this._fx.set({ type: 'lowpass' });
	}
	this._fx.set({ rolloff: -24 });

	this._cutoff = (_params[1]) ? Util.toArray(_params[1]) : [ 1000 ];
	this._q = (_params[2]) ? Util.toArray(_params[2]) : [ 0.5 ];
	this._rt = (_params[3]) ? Util.toArray(_params[3]) : [ 0 ];

	this.set = function(c, time, bpm){
		let f = Util.getParam(this._cutoff, c);
		let r = 1 / (1 - Math.min(0.95, Math.max(0, Util.getParam(this._q, c))));
		let rt = Util.divToS(Util.getParam(this._rt, c), bpm);

		if (rt > 0){
			this._fx.frequency.rampTo(f, rt, time);
		} else {
			this._fx.frequency.setValueAtTime(f, time);
		}

		this._fx.Q.setValueAtTime(r, time);
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._fx };
	}

	this.delete = function(){
		this._fx.disconnect();
		this._fx.dispose();
	}
}

// A automated filter (filter with envelope) that is triggered by the note
// Set the filter type (lowpass, highpass, bandpass)
// Set the attack and release time
// Set the low and high filter range
// Set the curve mode
//
const TriggerFilter = function(_params){
	this._fx = new Tone.Filter(1000, 'lowpass', -24);
	this._adsr = new Tone.Envelope({
		attackCurve: "linear",
		decayCurve: "linear",
		sustain: 0,
		release: 0.001
	});
	this._mul = new Tone.Multiply();
	this._add = new Tone.Add();
	this._pow = new Tone.Pow(3);

	this._adsr.connect(this._pow.connect(this._mul));
	this._mul.connect(this._add);
	this._add.connect(this._fx.frequency);

	this._types = {
		'lo' : 'lowpass',
		'low' : 'lowpass',
		'lowpass' : 'lowpass',
		'hi' : 'highpass',
		'high' : 'highpass',
		'highpass' : 'highpass',
		'band' : 'bandpass',
		'bandpass': 'bandpass'
	}

	this.defaults = ['low', 1, '1/16', 4000, 30];
	// replace defaults with provided arguments
	this.defaults.splice(0, _params.length, ..._params);
	_params = this.defaults.map(p => Util.toArray(p));

	if (this._types[_params[0][0]]){
		this._fx.set({ type: this._types[_params[0][0]] });
	} else {
		log(`'${_params[0][0]}' is not a valid filter type. Defaulting to lowpass`);
		this._fx.set({ type: 'lowpass' });
	}

	this._att = _params[1];
	this._rel = _params[2];
	this._high = _params[3];
	this._low = _params[4];

	this.set = function(c, time, bpm){
		this._adsr.attack = Util.divToS(Util.getParam(this._att, c), bpm);
		this._adsr.decay = Util.divToS(Util.getParam(this._rel, c), bpm);

		let min = Util.getParam(this._low, c);
		let max = Util.getParam(this._high, c);
		let range = Math.abs(max - min);
		let lower = Math.min(max, min);

		this._mul.setValueAtTime(range, time);
		this._add.setValueAtTime(lower, time);

		// fade-out running envelope over 5 ms
		if (this._adsr.value > 0){
			this._adsr.triggerRelease(time);
			time += this._adsr.release;
		}
		this._adsr.triggerAttack(time, 1);
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._fx };
	}

	this.delete = function(){
		let blocks = [ this._fx, this._adsr, this._mul, this._add, this._pow ];

		blocks.forEach((b) => {
			b.disconnect();
			b.dispose();
		});
	}
}

/*const AutoFilter = function(_params){
	console.log('FX => AutoFilter()', _params);

	this._fx = new Tone.AutoFilter('8n', 100, 4000);

	this.set = function(c, time, bpm){

	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._fx }
	}

	this.delete = function(){
		this._fx.disconnect();
		this._fx.dispose();
	}
}*/

// Custom stereo delay implementation with lowpass filter in feedback loop
const Delay = function(_params){
	this._fx = new Tone.Gain(1);
	this._fb = new Tone.Gain(0.5);
	this._mix = new Tone.CrossFade(0.5);
	this._split = new Tone.Split(2);
	this._merge = new Tone.Merge(2);
	this._maxDelay = 5;

	this._delayL = new Tone.Delay({ maxDelay: this._maxDelay });
	this._delayR = new Tone.Delay({ maxDelay: this._maxDelay });
	this._flt = new Tone.Filter(1000, 'lowpass', '-12');

	if (_params.length === 2){
		_params[2] = _params[1];
		_params[1] = _params[0];
	}
	// All params and defaults
	this._timeL = (_params[0] !== undefined)? Util.toArray(_params[0]) : [ '2/16' ];
	this._timeR = (_params[1] !== undefined)? Util.toArray(_params[1]) : [ '3/16' ];
	this._feedBack = (_params[2] !== undefined)? Util.toArray(_params[2]) : [ 0.7 ];
	this._fbDamp = (_params[3] !== undefined)? Util.toArray(_params[3]) : [ 0.6 ];

	// split the signal
	this._fx.connect(this._mix.a);
	this._fx.connect(this._fb);

	this._fb.connect(this._split);
	// the feedback node connects to the delay L + R
	this._split.connect(this._delayL, 0, 0);
	this._split.connect(this._delayR, 1, 0);
	// merge back
	this._delayL.connect(this._merge, 0, 0);
	this._delayR.connect(this._merge, 0, 1);
	// the delay is the input chained to the sample and returned
	// the delay also connects to the onepole filter
	this._merge.connect(this._flt);
	// the output of the onepole is stored back in the gain for feedback
	this._flt.connect(this._fb);
	// connect the feedback also to the crossfade mix
	this._fb.connect(this._mix.b);

	this.set = function(c, time, bpm){
		let dL = Math.min(this._maxDelay, Math.max(0, Util.formatRatio(Util.getParam(this._timeL, c), bpm)));
		let dR = Math.min(this._maxDelay, Math.max(0, Util.formatRatio(Util.getParam(this._timeR, c), bpm)));
		let ct = Math.max(10, Util.getParam(this._fbDamp, c) * 5000);
		let fb = Math.max(0, Math.min(0.99, Util.getParam(this._feedBack, c) * 0.707));

		this._delayL.delayTime.setValueAtTime(dL, time);
		this._delayR.delayTime.setValueAtTime(dR, time);
		this._flt.frequency.setValueAtTime(ct, time);
		this._fb.gain.setValueAtTime(fb, time);
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._mix };
	}

	this.delete = function(){
		let blocks = [ this._fx, this._fb, this._mix, this._split, this._merge, this._delayL, this._delayR, this._flt ];

		blocks.forEach((b) => {
			b.disconnect();
			b.dispose();
		});
	}
}

// Old pingpong delay implementation, just using the Tone.PingPongDelay()
const PingPongDelay = function(_params){
	this._fx = new Tone.PingPongDelay();
	this._fx.set({ wet: 0.4 });

	// console.log('delay', param);
	this._dTime = (_params[0] !== undefined)? Util.toArray(_params[0]) : [ '3/16' ];
	this._fb = (_params[1] !== undefined)? Util.toArray(_params[1]) : [ 0.3 ];
	// let del = new Tone.PingPongDelay(formatRatio(t), fb);

	this.set = function(c, time, bpm){
		let t = Math.max(0, Util.formatRatio(Util.getParam(this._dTime, c), bpm));
		let fb = Math.max(0, Math.min(0.99, Util.getParam(this._fb, c)));

		this._fx.delayTime.setValueAtTime(t, time);
		this._fx.feedback.setValueAtTime(fb, time);
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._fx };
	}

	this.delete = function(){
		this._fx.disconnect();
		this._fx.dispose();
	}
}

const FreeVerb = function(_params){
	this._fx = new Tone.Freeverb(_params[0], _params[1]);

	this.set = function(c, time, bpm){

	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._fx };
	}

	this.delete = function(){
		let blocks = [ this._fx ];

		blocks.forEach((b) => {
			b.disconnect();
			b.dispose();
		});
	}
}

// squash/compress an incoming signal
// based on algorithm by Peter McCulloch
const SquashDeprecated = function(_params){
	this._compress = (_params[0] !== undefined)? Util.toArray(_params[0]) : [1];

	this._fx = new Tone.WaveShaper();

	this.shaper = function(amount){
		// (a * c) / ((a * c)^2 * 0.28 + 1) / √c
		// drive amount, minimum of 1
		const c = amount;
		// makeup gain
		const m = 1.0 / Math.sqrt(c);
		// set the waveshaper effect
		this._fx.setMap((x) => {
			return (x * c) / ((x * c) * (x * c) * 0.28 + 1) * m; 
		});
	}
	
	this.set = function(c){
		let d = Util.getParam(this._compress, c);
		this.shaper(isNaN(d)? 1 : Math.max(1, d));
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._fx };
	}

	this.delete = function(){
		this._fx.disconnect();
		this._fx.dispose();
	}
}

// A distortion algorithm using the tanh (hyperbolic-tangent) as a 
// waveshaping technique. Some mapping to apply a more equal loudness 
// distortion is applied on the overdrive parameter
//
const DriveDeprecated = function(_params){
	this._drive = (_params[0] !== undefined)? Util.toArray(_params[0]) : [1.5];

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
		let d = Util.getParam(this._drive, c);
		this.shaper(isNaN(d)? 1 : Math.max(1, d));
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._fx };
	}

	this.delete = function(){
		this._fx.disconnect();
		this._fx.dispose();
	}
}