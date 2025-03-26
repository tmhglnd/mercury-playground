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
	'room' : (params) => {
		return new Reverb(params);
	},
	'hall' : (params) => {
		return new Reverb(params);
	},
	'reverb' : (params) => {
		return new Reverb(params);
	},
	'tverb' : (params) => {
		return new CustomFreeverb(params);
	},
	'shift' : (params) => {
		return new PitchShift(params);
	},
	'pitchShift' : (params) => {
		return new PitchShift(params);
	},
	// 'tune' : (params) => {
	// 	return new PitchShift(params);
	// },
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
	// 'ppDelay' : (params) => {
	// 	return new PingPongDelay(params);
	// },
	// 'freeverb' : (params) => {
	// 	return new FreeVerb(params);
	// },
	'chorus' : (params) => {
		return new Chorus(Util.mapDefaults(params, ['4/1', 45, 0.5]));
	},
	'double' : (params) => {
		return new Chorus(Util.mapDefaults(params, ['8/1', 8, 1]));
	},
	'workletdelay' : (params) => {
		return new WorkletDelay(params);
	}
}
module.exports = fxMap;

const WorkletDelay = function(_params){
	// apply the default values and convert to arrays where necessary
	_params = Util.mapDefaults(_params, [ 250, 0.5 ]);
	this._delayTime = Util.toArray(_params[0]);
	this._wet = Util.toArray(_params[1]);

	// ToneAudioNode has all the tone effect parameters
	this._fx = new Tone.ToneAudioNode();

	// The crossfader mix
	this._mix = new Tone.Add();
	this._mixDry = new Tone.Gain(0).connect(this._mix.input);
	this._mixWet = new Tone.Gain(0.5).connect(this._mix.addend);

	// A gain node for connecting with input and output
	this._fx.input = new Tone.Gain(1).connect(this._mixDry);
	this._fx.output = new Tone.Gain(1).connect(this._mix.addend);

	// the fx processor
	this._fx.workletNode = Tone.getContext().createAudioWorkletNode('delay-processor');

	// connect input, fx and output
	this._fx.input.chain(this._fx.workletNode, this._fx.output);

	this.set = function(c, time, bpm){
		// some parameter mapping changing input range 0-1 to 1-inf
		const p = this._fx.workletNode.parameters.get('delayTime');
		const dt = Util.assureNum(Util.getParam(this._delayTime, c));
		p.setValueAtTime(dt, time);
		
		const w = Util.clip(Util.getParam(this._wet, c), 0, 1);
		this._fx.output.gain.setValueAtTime(w, time);
		this._mixDry.gain.setValueAtTime(1 - w, time);
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._mix }
	}

	this.delete = function(){
		const nodes = [ this._fx, this._mix, this._mixDry ];

		nodes.forEach((n) => {
			n.disconnect();
			n.dispose();
		});
	}
}

// A Downsampling Chiptune effect. Downsamples the signal by a specified amount
// Resulting in a lower samplerate, making it sound more like 8bit/chiptune
// Programmed with a custom AudioWorkletProcessor, see effects/Processors.js
//
const DownSampler = function(_params){
	// apply the default values and convert to arrays where necessary
	_params = Util.mapDefaults(_params, [ 0.5, 1 ]);
	this._down = Util.toArray(_params[0]);
	this._wet = Util.toArray(_params[1]);

	// ToneAudioNode has all the tone effect parameters
	this._fx = new Tone.ToneAudioNode();

	// The crossfader mix
	this._mix = new Tone.Add();
	this._mixDry = new Tone.Gain(0).connect(this._mix.input);
	// this._mixWet = new Tone.Gain(0.5).connect(this._mix.addend);

	// A gain node for connecting with input and output
	this._fx.input = new Tone.Gain(1).connect(this._mixDry);
	this._fx.output = new Tone.Gain(1).connect(this._mix.addend);

	// the fx processor
	this._fx.workletNode = Tone.getContext().createAudioWorkletNode('downsampler-processor');

	// connect input, fx and output
	this._fx.input.chain(this._fx.workletNode, this._fx.output);

	this.set = function(c, time, bpm){
		// some parameter mapping changing input range 0-1 to 1-inf
		const p = this._fx.workletNode.parameters.get('down');
		const d = Math.floor(1 / (1 - Util.clip(Util.getParam(this._down, c) ** 0.25, 0, 0.999)));
		
		p.setValueAtTime(Util.assureNum(d), time);
		
		const w = Util.clip(Util.getParam(this._wet, c), 0, 1);
		this._fx.output.gain.setValueAtTime(w, time);
		this._mixDry.gain.setValueAtTime(1 - w, time);
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._mix }
	}

	this.delete = function(){
		const nodes = [ this._fx, this._mix, this._mixDry ];

		nodes.forEach((n) => {
			n.disconnect();
			n.dispose();
		});
	}
}

// A distortion algorithm using the tanh (hyperbolic-tangent) as a 
// waveshaping technique. Some mapping to apply a more equal loudness 
// distortion is applied on the overdrive parameter
//
const TanhDistortion = function(_params){
	_params = Util.mapDefaults(_params, [ 2, 1 ]);
	// apply the default values and convert to arrays where necessary
	this._drive = Util.toArray(_params[0]);
	this._wet = Util.toArray(_params[1]);

	// The crossfader for wet-dry (originally implemented with CrossFade)
	// this._mix = new Tone.CrossFade();
	this._mix = new Tone.Add();
	this._mixWet = new Tone.Gain(0).connect(this._mix.input);
	this._mixDry = new Tone.Gain(1).connect(this._mix.addend);	

	// ToneAudioNode has all the tone effect parameters
	this._fx = new Tone.ToneAudioNode();
	// A gain node for connecting with input and output
	this._fx.input = new Tone.Gain(1).connect(this._mixDry);
	this._fx.output = new Tone.Gain(1).connect(this._mixWet);

	// the fx processor
	this._fx.workletNode = Tone.getContext().createAudioWorkletNode('tanh-distortion-processor');

	// connect input, fx, output to wetdry
	this._fx.input.chain(this._fx.workletNode, this._fx.output);

	this.set = function(c, time, bpm){
		// drive amount, minimum drive of 1
		const d = Util.assureNum(Math.max(0, Util.getParam(this._drive, c)) + 1);

		// preamp gain reduction for linear at drive = 1
		const p = 0.8;
		// makeup gain
		const m = 1.0 / (p * (d ** 1.1));

		// set the parameters in the workletNode
		const amount = this._fx.workletNode.parameters.get('amount');
		amount.setValueAtTime(p * d * d, time);

		const makeup = this._fx.workletNode.parameters.get('makeup');
		makeup.setValueAtTime(m, time);

		const wet = Util.clip(Util.getParam(this._wet, c), 0, 1);
		this._mixWet.gain.setValueAtTime(wet);
		this._mixDry.gain.setValueAtTime(1 - wet);
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._mix }
	}

	this.delete = function(){
		let nodes = [ this._fx, this._mix, this._mixDry, this._mixWet ];
		
		nodes.forEach((n) => {
			n.disconnect();
			n.dispose();
		});
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

// A Chorus effect based on the default ToneJS effect
// Also the Double effect if the wetdry is set to 1 (only wet signal)
// 
const Chorus = function(_params){
	// also start the oscillators for the effect
	this._fx = new Tone.Chorus().start();

	this.set = (c, time, bpm) => {
		// convert division to frequency
		let f = Util.divToF(Util.getParam(_params[0], c), bpm);
		this._fx.frequency.setValueAtTime(f, time);
		// delaytime/2 because of up and down through center
		// eg. 25 goes from 0 to 50, 40 goes from 0 to 80, etc.
		Util.atTime(() => {
			this._fx.delayTime = Util.getParam(_params[1], c) / 2;
		}, time);

		// waveform for chorus is not supported in browser instead change wetdry
		let w = Util.getParam(_params[2], c);
		if (isNaN(w)){
			log(`Wavetype is not supported currently, instead change wet/dry with this argument, defaults to 0.5`);
			w = 0.5;
		}
		this._fx.wet.setValueAtTime(w, time);
	}

	this.chain = () => {
		return { 'send' : this._fx, 'return' : this._fx }
	}

	this.delete = () => {
		this._fx.disconnect();
		this._fx.dispose();
	}
}

// A distortion/compression effect of an incoming signal
// Based on an algorithm by Peter McCulloch
// 
const Squash = function(_params){
	_params = Util.mapDefaults(_params, [ 4, 1, 0.28 ]);
	// apply the default values and convert to arrays where necessary
	this._squash = Util.toArray(_params[0]);
	this._wet = Util.toArray(_params[1]);

	// The crossfader for wet-dry (originally implemented with CrossFade)
	// this._mix = new Tone.CrossFade();
	this._mix = new Tone.Add();
	this._mixDry = new Tone.Gain(0).connect(this._mix.input);
	// this._mixWet = new Tone.Gain(0.5).connect(this._mix.addend);	

	// ToneAudioNode has all the tone effect parameters
	this._fx = new Tone.ToneAudioNode();
	// A gain node for connecting with input and output
	this._fx.input = new Tone.Gain(1).connect(this._mixDry);
	this._fx.output = new Tone.Gain(1).connect(this._mix.addend);

	// the fx processor
	this._fx.workletNode = Tone.getContext().createAudioWorkletNode('squash-processor');
	// connect input, fx and output
	this._fx.input.chain(this._fx.workletNode, this._fx.output);

	this.set = function(c, time, bpm){
		let d = Util.assureNum(Math.max(1, Util.getParam(this._squash, c)));
		let m = 1.0 / Math.sqrt(d);
		
		const amount = this._fx.workletNode.parameters.get('amount');
		amount.setValueAtTime(d, time);

		const makeup = this._fx.workletNode.parameters.get('makeup');
		makeup.setValueAtTime(m, time);

		const wet = Util.clip(Util.getParam(this._wet, c));
		this._fx.output.gain.setValueAtTime(m, time);
		this._mixDry.gain.setValueAtTime(1 - wet, time);
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._mix }
	}

	this.delete = function(){
		let nodes = [ this._fx, this._mix, this._mixDry ];

		nodes.forEach((n) => {
			n.disconnect();
			n.dispose();
		});
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
			Util.atTime(() => this._fx.decay = tmp, time);
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

// A simple allpass filter constructed of a Feedback CombFilter,
// a gain node and a subtraction. This works because an allpass filter
// is in the simplest form a feedforward and feedback comb filter combined
// where the feedforward coefficient is negated.
// 
const AllPass = function(dt=10, res=0.5){
	// params: dt = delaytime, res = resonance
	this.out = new Tone.Subtract();
	this.fbcf = new Tone.FeedbackCombFilter(dt, res).connect(this.out.subtrahend);
	this.in = new Tone.Gain(res).fan(this.fbcf, this.out);

	this.connect = function(to){
		// connect to the output node via a "regular" Tone method
		this.out.connect(to);
	}

	this.disconnect = function(){
		// disconnect all the nodes
		[ this.out, this.fbcf, this.in ].forEach(n => n.disconnect());
	}
	
	this.dispose = function(){
		// dispose all the nodes
		[ this.out, this.fbcf, this.in ].forEach(n => n.dispose());
	}
}

// A custom reverberation algorithm written by Timo Hoogland
// The algorithm is based on a combination of the popular
// Freeverb and Schroeder JCRev designs
// It has the quality like a Freeverb, while being also computationally
// less expensive, more in the range of the JCRev
// 
const CustomFreeverb = function(_params){
	_params = Util.mapDefaults(_params, [ 0.5, 1, 1, 0.5 ]);
	_params = _params.map((p) => Util.toArray(p));
	this._wet = _params[0];
	this._size = _params[1];
	this._decay = _params[2];
	this._damp = _params[3];

	// initial delaytimes and resonance values (also factor for multiply)
	this._apIn = [ 0.01388, 0.00452, 0.00148 ];
	this._apOut = [ 0.01261, 0.00773 ];
	this._apQ = 0.423;

	this._delays = [ 0.035306, 0.028957, 0.03667, 0.030749, 
					0.03381, 0.026938, 0.032245, 0.025306 ];
	this._fb = 0.84;

	// the wet/dry mix and output
	this._mix = new Tone.Add();
	this._mixDry = new Tone.Gain(0.5).connect(this._mix.addend);

	// the input allpass diffusion section plus onepole lowpass filter for damp
	this._lpf = new Tone.OnePoleFilter(500, "lowpass");
	this._ap3 = new AllPass(this._apIn[2], this._apQ);
	this._ap3.connect(this._lpf);
	this._ap2 = new AllPass(this._apIn[1], this._apQ);
	this._ap2.connect(this._ap3.in);
	this._ap1 = new AllPass(this._apIn[0], this._apQ);
	this._ap1.connect(this._ap2.in);

	// the input node for Dry and Wet split
	this._fx = new Tone.Gain(1).fan(this._ap1.in, this._mixDry);
	
	// the channel merger for stereo output
	this._out = new Tone.Merge().connect(this._mix);

	// the various outputs for stereo image/mixing
	this._outA = new Tone.Gain(1);
	this._outA.connect(this._out, 0, 0).connect(this._out, 0, 1); // use both LR
	this._outB = new Tone.Subtract().connect(this._out, 0, 0); // use L
	this._outB.output.gain.setValueAtTime(0.2, time); // reduce the side volume
	this._outC = new Tone.Subtract().connect(this._out, 0, 1); // use R
	this._outC.output.gain.setValueAtTime(0.2, time); // reduce the side volume

	// the output outA diffusion section 
	this._ap5 = new AllPass(this._apOut[1], this._apQ);
	this._ap5.connect(this._outA);
	this._ap4 = new AllPass(this._apOut[0], this._apQ);
	this._ap4.connect(this._ap5.in);

	// sum combfilters 1 & 2
	this._s1 = new Tone.Gain(0.2);
	this._s1.fan(this._ap4.in, this._outB, this._outC.subtrahend); 
	this._s2 = new Tone.Gain(0.2);
	this._s2.fan(this._ap4.in, this._outB.subtrahend, this._outC);

	// create 8 combfilters and split between s1 and s2 for summing
	this._combs = [];
	for (var i=0; i<this._delays.length; i++){
		let comb = new Tone.FeedbackCombFilter(this._delays[i], this._fb);
		// comb.output.gain.setValueAtTime(0.2, time);
		comb.connect((i % 2) ? this._s1 : this._s2);
		this._lpf.connect(comb);
		this._combs.push(comb);
	}

	// set the parameters based on the arguments
	this.set = function(c, time){
		let wet = Util.getParam(this._wet, c);
		let size = Util.getParam(this._size, c);
		let decay = Util.getParam(this._decay, c);
		let damp = Util.getParam(this._damp, c);

		// equal power crossfade midpoint -3dB(~0.707) for uncorrelated signals
		let dry = Math.cos(wet * 1.5707);
		this._mixDry.gain.setValueAtTime(dry, time);
		
		wet = Math.cos(wet * 1.5708 + 4.7124);
		this._s1.gain.setValueAtTime(wet, time);
		this._s2.gain.setValueAtTime(wet, time);

		this._lpf.frequency = Util.clip(damp * damp * damp) * 9900 + 100;

		for (var i=0; i<this._combs.length; i++){
			let dt = (Util.clip(size) * 1.8 + 0.5) * this._delays[i];
			let fb = (Util.clip(decay ** 0.5) * 0.37 + 0.8) * this._fb;
			this._combs[i].delayTime.setValueAtTime(dt, time);
			this._combs[i].resonance.setValueAtTime(fb, time);
		}
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._mix }
	}

	this.delete = function(){
		let nodes = [ this._lpf, this._ap5, this._ap4, this._ap3, this._ap2, this._ap1, this._fx, this._outA, this._outB, this._outC, this._s1, this._s2, ...this._combs, this._out, this._mix, this._mixDry ];

		nodes.forEach((n) => { 
			n?.disconnect(); 
			n?.dispose(); 
		});
	}
}

// PitchShift FX
// Shift the pitch up or down in semitones
// Utilizes the default PitchShift FX from ToneJS
// 
const PitchShift = function(_params){
	_params = Util.mapDefaults(_params, [ -12, 1 ]);
	// apply the default values and convert to arrays where necessary
	this._pitch = Util.toArray(_params[0]);
	this._wet = Util.toArray(_params[1]);

	this._fx = new Tone.PitchShift();

	this.set = function(c, time){
		let p = Util.getParam(this._pitch, c);
		let w = Util.getParam(this._wet, c);

		Util.atTime(() => this._fx.pitch = TL.toScale(p), time);
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
// Using Tone.LFO with some specific mappings to fix phase issues
//
const LFO = function(_params){
	_params = Util.mapDefaults(_params, [ '1/8', 'sine', 1 ]);
	_params = _params.map(x => Util.toArray(x));
	this._speed = _params[0];
	this._type = _params[1];
	this._depth = _params[2];

	// the waveshape name options
	this._waveMap = {
		sine : 'sine',
		sineUp : 'sine',
		sineDown : 'sine',
		saw : 'sawtooth',
		sawUp: 'sawtooth',
		sawDown: 'sawtooth',
		up: 'sawtooth',
		down: 'sawtooth',
		square : 'square',
		squareUp : 'square',
		squareDown : 'square',
		rect : 'square',
		triangle : 'triangle',
		tri : 'triangle',
	}

	this._lfo = new Tone.LFO();
	// this._lfo.gain.value = 0;
	this._fx = new Tone.Gain();
	this._lfo.connect(this._fx.gain);

	this.set = function(c, time, bpm){
		let w = Util.getParam(this._type, c);
		if (!this._waveMap[w]){
			console.log(`'${w} is not a valid waveshape`);
			// default wave if wave does not exist
			w = 'sine';
		}
		this._lfo.set({ type: this._waveMap[w] });
		
		let s = Util.getParam(this._speed, c);
		let t = Util.divToS(s, bpm);
		let f = Math.max(0.0001, t);
		this._lfo.frequency.setValueAtTime(1/f, time);

		let a = Util.getParam(this._depth, c);
		Util.atTime(() => {
			this._lfo.min = Math.min(1, Math.max(0, 1 - a));
			this._lfo.max = 1;
			// fix for squarewave not going to 0 fully
			if (this._waveMap[w] === 'square'){ 
				this._lfo.min += -0.1;
			}
			
			// swap high and low point to create a saw down
			if (w === 'down' || w === 'sawDown' || w === 'squareUp' || w === 'sineDown' ){
				let tmp = this._lfo.min;
				this._lfo.min = this._lfo.max;
				this._lfo.max = tmp;
			} 
		}, time);

		if (this._lfo.state !== 'started'){
			// fix incorrect phases for sawtooth sine and triangle
			// simply by starting them a bit later.
			switch (this._waveMap[w]) {
				case 'sine' :
					time += t * 0.25; break;
				case 'triangle' :
					time += t * 0.25; break;
				case 'sawtooth' :
					time += t * 0.5; break;
			}	
			this._lfo.start(time);
		}
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._fx };
	}

	this.delete = function(){
		let nodes = [ this._fx, this._lfo ];
		
		nodes.forEach((n) => {
			n.disconnect();
			n.dispose();
		});
	}
}

// A filter FX, choose between highpass, lowpass and bandpass
// Set the cutoff frequency and Q factor
// Optionally with extra arguments you can apply a modulation
//
const Filter = function(_params){
	// parameter mapping changes based on amount of arguments
	this._static = true;
	if (_params.length < 4){
		if (typeof _params[0] === 'string'){
			_params = Util.mapDefaults(_params, ['low', 1200, 0.45]);
		} else {
			_params = [['low']].concat(Util.mapDefaults(_params, [1200, 0.45]));
		}
	}
	else {
		_params = Util.mapDefaults(_params, ['low', '1/1', 200, 3000, 0.45, 'sine', 0.5]);
		this._static = false;
	}

	this._fx = new Tone.Filter();

	// the following is only used if the parameters for modulation
	// are added as arguments to the fx(filter) function
	if (!this._static){
		this._lfo = new Tone.LFO();
		this._scale = new Tone.ScaleExp();
		this._lfo.connect(this._scale);
		this._scale.connect(this._fx.frequency);
	}

	// available filter types for the filter
	this._types = {
		'lo' : 'lowpass',
		'low' : 'lowpass',
		'lowpass' : 'lowpass',
		'hi' : 'highpass',
		'high' : 'highpass',
		'highpass' : 'highpass',
		'band' : 'bandpass',
		'bandpass': 'bandpass',
	}
	if (this._types[_params[0]]){
		this._fx.set({ type: this._types[_params[0]] });
	} else {
		console.log(`'${_params[0]}' is not a valid filter type. Defaults to lowpass`);
		this._fx.set({ type: 'lowpass' });
	}
	this._fx.set({ rolloff: -24 });

	// available waveforms for the LFO
	this._waveMap = {
		sine : 'sine',
		// sineUp : 'sine',
		// sineDown : 'sine',
		saw : 'sawtooth',
		sawUp: 'sawtooth',
		sawDown: 'sawtooth',
		up: 'sawtooth',
		down: 'sawtooth',
		// square : 'square',
		// squareUp : 'square',
		// squareDown : 'square',
		// rect : 'square',
		triangle : 'triangle',
		tri : 'triangle',
	}

	this.set = function(c, time, bpm){
		let _q;
		// if the filter is static use the settings of frequency and resonance 
		if (this._static){
			let f = Util.getParam(_params[1], c);
			_q = _params[2];

			this._fx.frequency.setValueAtTime(f, time);
			// let rt = Util.divToS(Util.getParam(this._rt, c), bpm);
		} else {
			_q = _params[4];
			let t = Util.divToS(Util.getParam(_params[1], c), bpm);
			let f = 1 / t;
			let lo = Util.clip(Util.getParam(_params[2], c), 5, 19000);
			let hi = Util.clip(Util.getParam(_params[3], c), 5, 19000);

			let w = Util.getParam(_params[5], c);
			if (this._waveMap[w]){
				w = this._waveMap[w];
			} else {
				if (isNaN(w)){
					log(`${w} is not a valid waveshape. Defaults to sine`);
					// default wave if wave does not exist
					w = 'sine';
				} else {
					// w = value between 0 and 1, map to up, down, triangle 
					// 0=down, 0.5=triangle, 1=up
					switch(Math.floor(Util.clip(w, 0, 1)*2.99)){
						case 0: 
							// regular saw up
							w = 'sawtooth'; break;
						case 1:
							w = 'sine'; break;
						case 2:
							w = 'sawtooth';
							// swap hi/lo range for saw down effect
							let tmp = lo; lo = hi; hi = tmp; break;
					}
				}
			}
			this._lfo.set({ type: w });

			let exp = Util.clip(Util.getParam(_params[6], c), 0.01, 100);

			this._scale.min = lo;
			this._scale.max = hi;
			this._scale.exponent = exp;
			this._lfo.frequency.setValueAtTime(f, time);

			this._lfo.max = 1;

			if (this._lfo.state !== 'started'){
				switch (w) {
					case 'sine' :
						time += t * 0.25; break;
					case 'triangle' :
						time += t * 0.25; break;
					case 'sawtooth' :
						time += t * 0.5; break;
				}	
				this._lfo.start(time);
			}
		}

		let r = 1 / (1 - Math.min(0.95, Math.max(0, Util.getParam(_q, c))));
		this._fx.Q.setValueAtTime(r, time);

		// ramptime removed now that modulation is possible
		// if (rt > 0){
		// 	this._fx.frequency.rampTo(f, rt, time);
		// } else {
		// 	this._fx.frequency.setValueAtTime(f, time);
		// }
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._fx };
	}

	this.delete = function(){
		let nodes = [ this._fx, this._lfo, this._scale ];

		nodes.forEach((n) => {
			n?.disconnect();
			n?.dispose();
		});
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

	// replace defaults with provided arguments
	_params = Util.mapDefaults(_params, ['low', 1, '1/16', 4000, 100, 1]);
	// this.defaults.splice(0, _params.length, ..._params);
	_params = _params.map(p => Util.toArray(p));

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
	this._exp = _params[5];

	this.set = function(c, time, bpm){
		this._adsr.attack = Util.divToS(Util.getParam(this._att, c), bpm);
		this._adsr.decay = Util.divToS(Util.getParam(this._rel, c), bpm);

		let min = Util.getParam(this._low, c);
		let max = Util.getParam(this._high, c);
		let range = Math.abs(max - min);
		let lower = Math.min(max, min);
		let exp = 1 / Util.getParam(this._exp, c);

		this._mul.setValueAtTime(range, time);
		this._add.setValueAtTime(lower, time);
		Util.atTime(() => { this._pow.value = exp }, time);

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
		let nodes = [ this._fx, this._adsr, this._mul, this._add, this._pow ];

		nodes.forEach((n) => {
			n.disconnect();
			n.dispose();
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
// Delaytimes are set for left and right independently
// But the feed from the delaylines are fed back into eachother creating
// A nice rhythmic pingpong delay effect
// 
const Delay = function(_params){
	// apply the default values and convert to arrays where necessary
	if (_params.length === 1){ _params[1] = _params[0] }
	else if (_params.length === 2){
		_params[2] = _params[1];
		_params[1] = _params[0];
	}

	_params = Util.mapDefaults(_params, [ '3/16', '2/8', 0.7, 0.6, 0.5 ]);
	this._timeL = Util.toArray(_params[0]);
	this._timeR = Util.toArray(_params[1]);
	this._feedBack = Util.toArray(_params[2]);
	this._fbDamp = Util.toArray(_params[3]);
	this._wet = Util.toArray(_params[4]);

	this._fx = new Tone.Gain(1);
	this._fb = new Tone.Gain(0.5);
	this._mix = new Tone.CrossFade(0.5);
	this._split = new Tone.Split(2);
	this._merge = new Tone.Merge(2);
	this._maxDelay = 3;

	this._delayL = new Tone.Delay({ maxDelay: this._maxDelay });
	this._delayR = new Tone.Delay({ maxDelay: this._maxDelay });
	this._flt = new Tone.Filter(1000, 'lowpass', '-12');

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
		let fb = Math.max(0, Math.min(0.99, Util.getParam(this._feedBack, c) * 0.707));
		let cf = Math.max(10, Util.getParam(this._fbDamp, c) * 8000);

		this._delayL.delayTime.setValueAtTime(dL + Math.random() * 0.001, time);		
		this._delayR.delayTime.setValueAtTime(dR + Math.random() * 0.001, time);
		this._fb.gain.setValueAtTime(Util.assureNum(fb, 0.7), time);
		this._flt.frequency.setValueAtTime(cf, time);

		const wet = Util.clip(Util.getParam(this._wet, c));
		this._mix.fade.setValueAtTime(wet, time);
	}

	this.chain = function(){
		return { 'send' : this._fx, 'return' : this._mix };
	}

	this.delete = function(){
		let nodes = [ this._fx, this._fb, this._mix, this._split, this._merge, this._delayL, this._delayR, this._flt ];

		nodes.forEach((n) => {
			n.disconnect();
			n.dispose();
		});
	}
}

// Old pingpong delay implementation, just using the Tone.PingPongDelay()
// const PingPongDelay = function(_params){
// 	this._fx = new Tone.PingPongDelay();
// 	this._fx.set({ wet: 0.4 });

// 	// console.log('delay', param);
// 	this._dTime = (_params[0] !== undefined)? Util.toArray(_params[0]) : [ '3/16' ];
// 	this._fb = (_params[1] !== undefined)? Util.toArray(_params[1]) : [ 0.3 ];
// 	// let del = new Tone.PingPongDelay(formatRatio(t), fb);

// 	this.set = function(c, time, bpm){
// 		let t = Math.max(0, Util.formatRatio(Util.getParam(this._dTime, c), bpm));
// 		let fb = Math.max(0, Math.min(0.99, Util.getParam(this._fb, c)));

// 		this._fx.delayTime.setValueAtTime(t, time);
// 		this._fx.feedback.setValueAtTime(fb, time);
// 	}

// 	this.chain = function(){
// 		return { 'send' : this._fx, 'return' : this._fx };
// 	}

// 	this.delete = function(){
// 		this._fx.disconnect();
// 		this._fx.dispose();
// 	}
// }

// const FreeVerb = function(_params){
// 	this._fx = new Tone.Freeverb(_params[0], _params[1]);

// 	this.set = function(c, time, bpm){

// 	}

// 	this.chain = function(){
// 		return { 'send' : this._fx, 'return' : this._fx };
// 	}

// 	this.delete = function(){
// 		let nodes = [ this._fx ];

// 		nodes.forEach((n) => {
// 			n.disconnect();
// 			n.dispose();
// 		});
// 	}
// }
