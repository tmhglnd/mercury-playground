const Tone = require('tone');
const { toArray, getParam, isRandom, lookup, divToS } = require('./Util.js');
const Instrument = require('./Instrument.js');
// const fxMap = require('./Effects.js');
// const TL = require('total-serialism').Translate;
// const Sequencer = require('./Sequencer.js');

// Basic class for a poly-instrument
class PolyInstrument extends Instrument {
	constructor(engine, canvas, line){
		// Inherit from Instrument
		super(engine, canvas, line);

		// The source to be defined by inheriting class
		this.sources = [];

		// PolyInstrument specific parameters
		this.numVoices = 8;
		this.adsrs = [];
		this.busymap = [];
		this.next = 0;
		this._steal = true;

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
		let p = getParam(this._pan, c);
		p = isRandom(p, -1, 1);
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
		
		// the first free voices available;
		let free = [];
		
		// set all busymaps based on current amplitude value
		for (let i=0; i<this.busymap.length; i++){
			// consider the voice busy if amplitude is > -40dB
			// because of exponential ramp otherwise voice stays busy too long
			this.busymap[i] = this.adsrs[i].gain.getValueAtTime(time) > 0.01;
			if (!this.busymap[i]){
				free.push(i);
			}
		}

		// get the notes from the note array to know how many voices
		// need to be triggered at once
		let notes = toArray(lookup(this._note[0], c));

		for (let n = 0; n < notes.length; n++){
			// if any voices are free
			if (free.length > 0 || this._steal){
				let i;
				if (this._steal){
					// if stealing is enabled just take the next voice
					i = this.next;
					this.next = (this.next + 1) % this.numVoices;
				} else {
					// get a free voice and make the list smaller
					i = free.pop();
				}
				// if voice is free set all parameters for the source on index i
				this.sourceEvent(c, time, i, n);
				
				// set shape for playback (fade-in / out and length)
				if (this._att){
					const att = Math.max(divToS(getParam(this._att, c), this.bpm()), 0.001);
					const dec = Math.max(divToS(getParam(this._dec, c), this.bpm()), 0);
					const rel = Math.max(divToS(getParam(this._rel, c), this.bpm()), 0.001);
					
					// short ramp for retrigger, fades out the envelope over 
					// 2 ms. use the retrigger time to schedule the event
					//  a bit later as well
					let retrigger = 0;
					if (this.adsrs[i].gain.getValueAtTime(time) > 0.01){
						retrigger = 0.002;
						// short ramp for retrigger, fades out the previous ramp
						this.adsrs[i].gain.linearRampTo(0.0, retrigger, time);
					}
					// trigger the envelope and release after specified time
					this.adsrs[i].gain.linearRampTo(1.0, att, time + retrigger);
					this.adsrs[i].gain.exponentialRampTo(0.0, rel * 5, time + att + dec + retrigger);
				} else {
					// if shape is off only trigger attack
					// when voice stealing is 'off' this will lead to all 
					// voices set to busy!
					// if shape is 'off' turn on the gain of the envelope
					this.adsrs[i].gain.setValueAtTime(1.0, time);
				}
			}
		}
	}

	voices(v){
		log(`Changing voice amount is not yet supported. You can use voice-stealing with steal(on)`);
		// TODO change voice amount
		// set the voiceamount for the polyphonic synth
		// this.numVoices = Math.max(1, isNaN(Number(v))? 6 : Number(v));
		// this.createVoices();
	}

	steal(s=0){
		// enable/disable the voice stealing (default = off)
		this._steal = false;
		if (s === 'on' || s == 1){
			this._steal = true;
		} else if (s === 'off' || s == 0){
			this._steal = false;
		} else {
			log(`${s} is not a valid argument for steal()`);
		}
	}

	delete(){
		// delete super class
		super.delete();
		// disconnect the sound dispose the player
		this.gain.disconnect();
		this.gain.dispose();
		this.panner.disconnect();
		this.panner.dispose();

		this.adsrs.map((a) => {
			a.disconnect();
			a.dispose();
		});
		this.sources.map((s) => {
			s.stop();
			s.disconnect();
			s.dispose();
		});
		// remove all fx
		// this._fx.map((f) => f.delete());
		console.log('=> disposed PolyInstrument() with FX:', this._fx);
	}
}
module.exports = PolyInstrument;