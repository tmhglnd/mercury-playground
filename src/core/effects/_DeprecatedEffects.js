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

		this._delayL.delayTime.setValueAtTime(dL - Math.random() * 0.005, time);		
		this._delayR.delayTime.setValueAtTime(dR - Math.random() * 0.005, time);
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
// 
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

// class workletFX {
// 	constructor(fx){
// 		// ToneAudioNode has all the tone effect parameters
// 		this._fx = new Tone.ToneAudioNode();
// 		// A gain node for connecting with input and output
// 		this._fx.input = new Tone.Gain(1);
// 		this._fx.output = new Tone.Gain(1);
// 		// the fx processor
// 		this._fx.workletNode = new Tone.getContext().createAudioWorkletNode(fx);
// 		// connect input, fx and output
// 		this._fx.input.chain(this._fx.workletNode, this._fx.output);
// 	}
// 	connect() {
// 		return this._fx;
// 	}
// 	dispose() {
// 		this._fx.dispose();
// 	}
// 	setParam(param, value, time) {
// 		const p = this._fx.workletNode.parameters.get(param);
// 		p.setValueAtTime(value, time);
// 	}
// }