const Tone = require('tone');
const Util = require('./Util.js');
const fxMap = require('./Effects.js');
const TL = require('total-serialism').Translate;
const Instrument = require('./Instrument.js');
// const Sequencer = require('./Sequencer.js');

// Basic class for all instruments
class PolyInstrument extends Instrument {
	constructor(engine){
		// Inherit from Sequencer
		super(engine);

		// Instrument specific parameters
		// this._gain = [-6, 0];		
		// this._pan = [ 0 ];
		// this._att = [ 0 ];
		// this._sus = [ 0 ];
		// this._rel = [ 0 ];

		// Instrument specific Tone Nodes
		// this.panner;
		// this.adsr;
		// this.gain;
		// this.amp;
		// this._fx;

		// The source to be defined by inheriting class
		// this.source;

		// PolyInstrument specific parameters
		this.numVoices = 8;
		this.sources = [];
		this.adsrs = [];
		this.busymap = [];

		this.channelStrip();
		this.createVoices();
		this.createSources();

		console.log('=> class PolyInstrument()');
	}

	channelStrip(){
		// gain => output
		this.gain = new Tone.Gain(0).toDestination();
		// panning => gain
		this.panner = new Tone.Panner(0).connect(this.gain);
		// adsr => panning
	}

	createVoices(){
		for (let i=0; i<this.numVoices; i++){
			this.adsrs[i] = this.envelope(this.panner);
			this.busymap[i] = false;
		}
	}

	createSources(){
		for (let i=0; i<this.numVoices; i++){
			this.sources[i] = new Tone.OmniOscillator();
			this.sources[i].type = 'sawtooth';
			this.sources[i].connect(this.adsrs[i]);
			this.sources[i].start();
		}
	}

	envelope(d){
		// return an Envelope and connect to next node
		return new Tone.AmplitudeEnvelope({
			attack: 0,
			attackCurve: "linear",
			decay: 0,
			decayCurve: "linear",
			sustain: 1,
			release: 0.001,
			releaseCurve: "linear"
		}).connect(d);
	}

	event(c, time){
		// console.log('=> Instrument()', c);
		// end position for playback
		let e = this._time;

		// set FX parameters
		if (this._fx){
			for (let f=0; f<this._fx.length; f++){
				this._fx[f].set(c, time, this.bpm());
			}
		}
		
		// set panning
		let p = Util.getParam(this._pan, c);
		p = Util.isRandom(p, -1, 1);
		this.panner.pan.setValueAtTime(p, time);

		// use notes from array to trigger multiple voices
		// check which voice is playing and trigger a new voice
		// voice includes:
		// sound source (synth, sample)
		// envelope
		// parameters to be set for source and envelope
		// set all parameters for that voice
		
		// this.sourceEvent(c, e, time);
		this.manageVoices(c, e, time);
	}

	sourceEvent(c, time, v){
		// trigger some events specifically for a source
		// specified in more detail in the inheriting class
		// console.log('Instrument()', this._name, c);

		// ramp volume
		let g = Util.getParam(this._gain[0], c);
		let r = Util.getParam(this._gain[1], c);
		this.sources[v].volume.rampTo(g, r, time);

		// set the frequency based on the selected note
		// note as interval / octave coordinate
		let o = Util.getParam(this._note[1], c);
		let i = Util.getParam(this._note[0], c);
		
		if (isNaN(i)){
			let _i = TL.noteToMidi(i);
			if (!_i){
				log(`${i} is not a valid number or name`);
				i = 0;
			} else {
				i = _i - 48;
			}
		}
		// reconstruct midi note value, (0, 0) = 36
		// let n = i + (o * 12) + 36;
		let n = TL.toScale(i + o * 12 + 36);

		// calculate frequency in 12-TET A4 = 440;
		// let f = Math.pow(2, (n - 69)/12) * 440;
		let f = TL.mtof(n);

		this.sources[v].frequency.setValueAtTime(f, time);
	}

	manageVoices(c, e, time){
		// TODO: option for voice stealing can be included
		
		// the first free voice available;
		let free = -1;
		
		// set all busymaps based on current amplitude value
		for (let i=0; i<this.busymap.length; i++){
			this.busymap[i] = this.adsrs[i].value > 0;
			if (!this.busymap[i]){
				free = i;
			}
		}
		
		if (free > -1){
			let i = free;
			// if voice is free set all parameters for the source on index i
			this.sourceEvent(c, time, i);
			
			// set shape for playback (fade-in / out and length)
			if (this._att){
				let att = Util.divToS(Util.lookup(this._att, c), this.bpm());
				let dec = Util.divToS(Util.lookup(this._sus, c), this.bpm());
				let rel = Util.divToS(Util.lookup(this._rel, c), this.bpm());
	
				this.adsrs[i].attack = att;
				this.adsrs[i].decay = dec;
				this.adsrs[i].release = rel;
				
				e = Math.min(this._time, att + dec + rel);
			}
	
			// if (this.adsr.value > 0){
			// 	// fade-out running envelope over 5 ms
			// 	let tmp = this.adsr.release;
			// 	this.adsr.release = 0.005;
			// 	this.adsr.triggerRelease(time);
			// 	this.adsr.release = tmp;
			// 	time += 0.005;
			// }
	
			// trigger the envelope
			let rt = Math.max(0.001, e - this.adsrs[i].release);
			this.adsrs[i].triggerAttackRelease(rt, time);
			// the voice is now busy
			// this.busymap[i] = true;
		}
	}

	note(i=0, o=0){
		// set the note as semitone interval and octave offset
		// (0, 0) = MidiNote 36
		this._note = [Util.toArray(i), Util.toArray(o)];
	}

	fadeIn(t){
		// fade in the sound upon evaluation of code
		this.gain.gain.rampTo(1, t, Tone.now());
	}

	fadeOut(t){
		// fade out the sound upon evaluation of new code
		this.gain.gain.rampTo(0, t, Tone.now());
		setTimeout(() => {
			this.delete();
		}, t * 1000);
	}

	delete(){
		// delete super class
		super.delete();
		// disconnect the sound dispose the player
		this.gain.dispose();
		this.panner.dispose();

		this.adsrs.map((a) => a.dispose());
		this.sources.map((s) => s.dispose());

		// this.adsr.dispose();
		// remove all fx
		this._fx.map((f) => f.delete());
		console.log('=> disposed PolyInstrument() with FX:', this._fx);
	}

	amp(g, r){
		// set the gain and ramp time
		g = Util.toArray(g);
		r = (r !== undefined)? Util.toArray(r) : [ 0 ];
		// convert amplitude to dBFullScale
		this._gain[0] = g.map(g => 20 * Math.log(g * 0.707) );
		this._gain[1] = r.map(r => Util.msToS(Math.max(0, r)) );
	}

	env(...e){
		// set the fade-in, sustain and fade-out times
		this._att = [ 0 ];
		this._rel = [ 0 ];
		this._sus = [ 0 ];

		if (e[0] === 'off' || e[0] < 0){
			this._att = null;
		} else {
			if (e.length === 1){
				// one argument is release time
				this._att = [ 1 ];
				this._rel = Util.toArray(e[0]);
			} else if (e.length === 2){
				// two arguments is attack & release
				this._att = Util.toArray(e[0]);
				this._rel = Util.toArray(e[1]);
			} else {
				// three is attack stustain and release
				this._att = Util.toArray(e[0]);
				this._sus = Util.toArray(e[1]);
				this._rel = Util.toArray(e[2]);
			}
		}
	}

	pan(p){
		// the panning position of the sound
		this._pan = Util.toArray(p);
	}

	add_fx(...fx){
		// the effects chain for the sound
		this._fx = [];
		// console.log('Effects currently disabled');
		fx.forEach((f) => {
			if (fxMap[f[0]]){
				let tmpF = fxMap[f[0]](f.slice(1));
				this._fx.push(tmpF);
			} else {
				log(`Effect ${f[0]} does not exist`);
			}
		});
		// if any fx working
		if (this._fx.length){
			console.log(`Adding effect chain`, this._fx);
			// disconnect the panner
			this.panner.disconnect();
			// iterate over effects and get chain (send/return)
			this._ch = [];
			this._fx.map((f) => { this._ch.push(f.chain()) });
			// add all effects in chain and connect to Destination
			// every effect connects it's return to a send of the next
			// allowing to chain multiple effects within one process
			let pfx = this._ch[0];
			this.panner.connect(pfx.send);
			for (let f=1; f<this._ch.length; f++){
				if (pfx){
					pfx.return.connect(this._ch[f].send);
				}
				pfx = this._ch[f];
			}
			// pfx.return.connect(Tone.Destination);
			pfx.return.connect(this.gain);
		}
	}
}
module.exports = PolyInstrument;

// class Voice {
// 	constructor(destination){
// 		this._busy = false;
		
// 		this.source = new Tone.OmniOscillator('sawtooth');
// 		this.adsr = new Tone.AmplitudeEnvelope({
// 			attack: 0,
// 			attackCurve: "linear",
// 			decay: 0,
// 			decayCurve: "linear",
// 			sustain: 1,
// 			release: 0.001,
// 			releaseCurve: "linear"
// 		});

// 		this.source.connect(this.adsr);
// 		this.adsr.connect(destination);
// 	}

// 	busy(){
// 		return this.busy;
// 	}


// }
// module.exports = Voice;