const Tone = require('tone');
const Util = require('./Util.js');
const fxMap = require('./Effects.js');
const TL = require('total-serialism').Translate;
// const Sequencer = require('./Sequencer.js');
const Instrument = require('./Instrument.js');

// Basic class for a poly-instrument
class PolyInstrument extends Instrument {
	constructor(engine, canvas){
		// Inherit from Instrument
		super(engine, canvas);

		// The source to be defined by inheriting class
		this.sources = [];

		// PolyInstrument specific parameters
		this.numVoices = 6;
		this.adsrs = [];
		this.busymap = [];
		this.steal = false;

		this.channelStrip();
		this.createVoices();

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
		// create adsrs and busymap states for every voice
		for (let i=0; i<this.numVoices; i++){
			this.adsrs[i] = this.envelope(this.panner);
			this.busymap[i] = false;
		}
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
		this.manageVoices(c, e, time);
	}

	sourceEvent(c, time, v){
		// trigger some events specifically for a source at index v
		// specified in more detail in the inheriting class
		console.log('PolyInstrument()', this._name, c, v);
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

	delete(){
		// delete super class
		super.delete();
		// disconnect the sound dispose the player
		// this.gain.dispose();
		// this.panner.dispose();

		this.adsrs.map((a) => a.dispose());
		this.sources.map((s) => s.dispose());
		// remove all fx
		// this._fx.map((f) => f.delete());
		console.log('=> disposed PolyInstrument() with FX:', this._fx);
	}
}
module.exports = PolyInstrument;