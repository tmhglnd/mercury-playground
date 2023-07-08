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
		// // synth specific variables;
		this._note = [ 0, 0 ];
		this._slide = [ 0 ];
		this._voices = [ 1 ];
		this._detune = [ 0 ];

		this.synth;
		this.createSource();

		console.log('=> MonoSynth()', this);
	}

	createSource(){
		this.synth = new Tone.FatOscillator().connect(this.channelStrip());
		this.synth.count = 1;
		this.synth.start();
		this.source = this.synth;
	}

	sourceEvent(c, e, time){
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
		if (s > 0){
			this.synth.frequency.rampTo(f, s, time);
		} else {
			this.synth.frequency.setValueAtTime(f, time);
		}
	}

	super(d=[0.1], v=[3]){
		// add unison voices and detune the spread
		// first argument is the detune amount
		// second argument changes the amount of voices
		this._voices = Util.toArray(v);
		this._detune = Util.toArray(d);
	}

	fat(...a){
		// alias for super synth
		this.super(...a);
	}

	slide(s){
		// portamento from one note to another
		this._slide = Util.toArray(s);
	}

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
		
		console.log('disposed MonoSynth()', this._wave);
	}
}
module.exports = MonoSynth;