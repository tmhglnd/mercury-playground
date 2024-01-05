const Tone = require('tone');
const Util = require('./Util.js');
// const fxMap = require('./Effects.js');
const TL = require('total-serialism').Translate;
const Instrument = require('./Instrument');

class MonoSynth extends Instrument {
	constructor(engine, t='saw', canvas){
		// Inherit from Instrument
		super(engine, canvas);

		this._wave = Util.toArray(t);
		this._waveMap = {
			sine : 'sine',
			saw : 'sawtooth',
			square : 'square',
			triangle : 'triangle',
			tri : 'triangle',
			rect : 'square',
			fm: 'fmsine',
			am: 'amsine',
			pwm: 'pwm',
			organ: 'sine4',
		}
		// synth specific variables;
		this._note = [ 0, 0 ];
		this._slide = [ 0 ];
		this._firstSlide = true;
		this._voices = [ 1 ];
		this._detune = [ 0 ];
		// this._noise = [ [ 0 ], [ 1 ] ];

		this.synth;
		this.nx;
		this.nxGain;

		this.createSource();

		console.log('=> MonoSynth()', this);
	}

	createSource(){
		// the source connects the Synth + Noise to the channelstrip
		// this.source = new Tone.Gain(0).connect(this.channelStrip());

		this.synth = new Tone.FatOscillator().connect(this.channelStrip());
		// this.synth = new Tone.FatOscillator().connect(this.source);

		// this.nxGain = new Tone.Gain(0).connect(this.source);
		// this.nx = new Tone.Noise("white", { volume: 0.5 }).connect(this.nxGain);
		// this.nx.connect(this.nxGain);

		this.synth.count = 1;
		this.synth.start();
		this.source = this.synth;
	}

	sourceEvent(c, e, time){
		// set the noise parameters
		// this.nxGain.gain.setValueAtTime(Util.getParam(this._noise[0], c) * 0.25, time);
		// if (this.nxGain.gain.value > 0){ this.nx.start(time); } 
		// else { this.nx.stop(time); }

		// set voice amount for super synth
		let v = Util.getParam(this._voices, c);
		this.synth.count = Math.max(1, Math.floor(v));

		// set the detuning of the unison voices
		// in semitone values from -48 to +48
		let d = Util.getParam(this._detune, c);
		// d = Math.log2(d) * 1200;
		this.synth.spread = d * 100 * 2;

		// set wave to oscillator
		let w = Util.getParam(this._wave, c);
		if (this._waveMap[w]){
			w = this._waveMap[w];
		} else {
			log(`${w} is not a valid waveshape`);
			// default wave if wave does not exist
			w = 'sine';
		}
		this.synth.set({ type: w });

		// set the frequency based on the selected note
		// note as interval / octave coordinate
		let o = Util.getParam(this._note[1], c);
		let i = Util.getParam(this._note[0], c);
		// reconstruct midi note value with scale, (0, 0) = 36
		let n = Util.toMidi(i, o);

		// calculate frequency in 12-TET A4 = 440;
		// let f = Math.pow(2, (n - 69)/12) * 440;
		let f = TL.mtof(n);

		// get the slide time for next note and set the frequency
		let s = Util.divToS(Util.getParam(this._slide, c), this.bpm());
		if (s > 0 && !this._firstSlide){
			this.synth.frequency.rampTo(f, s, time);
		} else {
			this.synth.frequency.setValueAtTime(f, time);
		}
		// first time the synth plays don't slide!
		this._firstSlide = false;
	}

	super(v=[3], d=[0.111]){
		// add unison voices and detune the spread
		// first argument is the detune amount
		// second argument changes the amount of voices
		this._voices = Util.toArray(v);
		this._detune = Util.toArray(d);
	}

	slide(s){
		// portamento from one note to another
		this._slide = Util.toArray(s);
	}

	// noise(v=[0], t=[0]){
		// add noise to the synth sound
		// 3rd parameter for modulation is not supported yet
		// this._noise = [ Util.toArray(v), Util.toArray(t) ];
	// }

	wave2(w){
		// placeholder function for wave2
	}

	delete(){
		// delete super class
		super.delete();
		// dispose the sound source
		// this.source.delete();
		this.adsr.dispose();
		this.synth.dispose();
		this.source.dispose();
		
		// this.nx.dispose();
		// this.nxGain.dispose();
		
		console.log('disposed MonoSynth()', this._wave);
	}
}
module.exports = MonoSynth;