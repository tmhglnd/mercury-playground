const Tone = require('tone');
const Util = require('./Util.js');
// const fxMap = require('./Effects.js');
const TL = require('total-serialism').Translate;
const Instrument = require('./Instrument');

class MonoSynth extends Instrument {
	constructor(engine, t='saw', canvas, line){
		// Inherit from Instrument
		super(engine, canvas, line);

		this._wave = Util.toArray(t);
		this._waveMap = {
			sine : 'sine',
			saw : 'sawtooth',
			square : 'square',
			triangle : 'triangle',
			tri : 'triangle',
			rect : 'square',
			organ: 'sine4',
			// noise: 'white',
			// white: 'white',
			// pink: 'pink',
			// brown: 'brown'
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
		this.synth = new Tone.ToneAudioNode();
		this.synth.workletNode = Tone.getContext().createAudioWorkletNode('polyblep-oscillator');
		this.synth.input = new Tone.Gain();
		this.synth.output = new Tone.Gain(0, 'decibels');
		this.synth.volume = this.synth.output.gain;
		this.synth.input.chain(this.synth.workletNode, this.synth.output);

		this.synth.connect(this.channelStrip());
		this.synth.start = () => {};
		this.synth.stop = () => {};

		this.synth.type = (w, time) => {
			let waveMap = {
				'sine' : 0,
				'sawtooth' : 1,
				'square' : 2,
				'triangle' : 3
			}
			let wave = this.synth.workletNode.parameters.get('wave');
			wave.setValueAtTime(waveMap[w] ?? 0, time);
		}
		this.synth.numVoices = (n, time) => {
			let voices = this.synth.workletNode.parameters.get('voices');
			voices.setValueAtTime(n, time);
		}
		this.synth.detune = (d, time) => {
			let detune = this.synth.workletNode.parameters.get('detune');
			detune.setValueAtTime(d, time);
		}

		// this.synth = new Tone.FatOscillator().connect(this.channelStrip());
		// this.synth = new Tone.Noise('white').connect(this.channelStrip());

		// some ideas for adding the noise oscillator to the synth
		// this.nxGain = new Tone.Gain(0).connect(this.source);
		// this.nx = new Tone.Noise("white", { volume: 0.5 }).connect(this.nxGain);
		// this.nx.connect(this.nxGain);

		// this.synth.count = 1;
		this.synth.start();
		this.source = this.synth;

		// this creates empty functions for the noise oscillator so no errors with note
		// this.synth.set = this.synth.set ? this.synth.set : ()=>{};
		// this.synth.frequency = this.synth.frequency ? this.synth.frequency : { setValueAtTime : ()=>{}, rampTo : ()=>{}}
	}

	sourceEvent(c, e, time){
		// set the noise parameters
		// this.nxGain.gain.setValueAtTime(Util.getParam(this._noise[0], c) * 0.25, time);
		// if (this.nxGain.gain.value > 0){ this.nx.start(time); } 
		// else { this.nx.stop(time); }

		// set voice amount for super synth
		let v = Util.getParam(this._voices, c);
		// this.synth.count = Math.max(1, Math.floor(v));
		this.synth.numVoices(v, time);

		// set the detuning of the unison voices
		// in semitone values from -48 to +48
		let d = Util.getParam(this._detune, c);
		// d = Math.log2(d) * 1200;
		// this.synth.spread = d * 100 * 2;
		this.synth.detune(d, time);

		// set wave to oscillator
		let w = Util.getParam(this._wave, c);
		if (this._waveMap[w]){
			w = this._waveMap[w];
		} else {
			log(`${w} is not a valid waveshape`);
			// default wave if wave does not exist
			w = 'sine';
		}
		this.synth.type(w, time);
		// this.synth.set({ type: w });

		// set the frequency based on the selected note
		// note as interval / octave coordinate
		let o = Util.getParam(this._note[1], c);
		let i = Util.getParam(this._note[0], c);
		// reconstruct midi note value with scale, (0, 0) = 36
		let n = Util.toMidi(i, o);
		// if (!n){
		// 	return false;
		// }

		// calculate frequency in 12-TET A4 = 440;
		// let f = Math.pow(2, (n - 69)/12) * 440;
		let f = TL.mtof(n);

		const freq = this.synth.workletNode.parameters.get('freq');
		// get the slide time for next note and set the frequency
		let s = Util.divToS(Util.getParam(this._slide, c), this.bpm());
		if (s > 0 && !this._firstSlide){
			freq.linearRampToValueAtTime(f, Tone.now() + s);
			// this.synth.frequency.rampTo(f, s, time);
		} else {
			freq.setValueAtTime(f, time);
			// this.synth.frequency.setValueAtTime(f, time);
		}
		// first time the synth plays don't slide!
		this._firstSlide = false;
		// return true;
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
		
		// this.nx.dispose();
		// this.nxGain.dispose();
		
		console.log('disposed MonoSynth()', this._wave);
	}
}
module.exports = MonoSynth;