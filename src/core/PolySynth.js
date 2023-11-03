const Tone = require('tone');
const Util = require('./Util.js');
const PolyInstrument = require('./PolyInstrument');

class PolySynth extends PolyInstrument {
	constructor(engine, t='saw', canvas){
		// Inherit from PolyInstrument
		super(engine, canvas);

		// synth specific variables;
		this._wave = Util.toArray(t);
		this._note = [ 0, 0 ];
		this._slide = [ 0 ];
		this._voices = [ 1 ];
		this._detune = [ 0 ];

		this.createSources();

		console.log('=> PolySynth()', this);
	}

	createSources(){
		for (let i=0; i<this.numVoices; i++){
			this.sources[i] = new Tone.FatOscillator().connect(this.adsrs[i]);
			this.sources[i].count = 1;
			this.sources[i].start();
		}
	}

	sourceEvent(c, time, id, num){
		// ramp volume
		let g = 20 * Math.log(Util.getParam(this._gain[0], c) * 0.707);
		let r = Util.msToS(Math.max(0, Util.getParam(this._gain[1], c)));
		this.sources[id].volume.rampTo(g, r, time);

		// set voice amount for super synth
		let v = Util.getParam(this._voices, c);
		this.sources[id].count = Math.max(1, Math.floor(v));

		// set the detuning of the unison voices
		// in semitone values from -48 to +48
		let d = Util.getParam(this._detune, c);
		// d = Math.log2(d) * 1200;
		this.sources[id].spread = d * 100 * 2;

		// set wave to oscillator
		let w = Util.getParam(this._wave, c);
		this.sources[id].set({ type: Util.assureWave(w) });

		// set the frequency based on the selected note
		// note as interval / octave coordinate
		let o = Util.getParam(this._note[1], c);
		// let i = Util.getParam(this._note[0], c);
		let i = Util.toArray(Util.lookup(this._note[0], c))[num];
		let f = Util.noteToFreq(i, o);

		// get the slide time for next note and set the frequency
		let s = Util.divToS(Util.getParam(this._slide, c), this.bpm());
		if (s > 0){
			this.sources[id].frequency.rampTo(f, s, time);
		} else {
			this.sources[id].frequency.setValueAtTime(f, time);
		}
	}

	note(i=0, o=0){
		// set the note as semitone interval and octave offset
		// (0, 0) = MidiNote 36
		this._note = [Util.toArray(i), Util.toArray(o)];
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
		
		console.log('disposed MonoSynth()', this._wave);
	}
}
module.exports = PolySynth;