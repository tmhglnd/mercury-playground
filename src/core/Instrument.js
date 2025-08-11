const Tone = require('tone');
const { toArray, getParam, isRandom, atodb, msToS, divToS } = require('./Util.js');
const Widget = require('./Widgets.js');
const fxMap = require('./Effects.js');
const Sequencer = require('./Sequencer.js');

// Basic class for all instruments
class Instrument extends Sequencer {
	constructor(engine, canvas, line){
		// Inherit from Sequencer
		super(engine, canvas, line);

		// Instrument specific parameters
		this._gain = [ 0.5, 0 ];		
		this._pan = [ 0 ];
		this._att = [ 0 ];
		this._dec = [ 0 ];
		this._rel = [ 0 ];

		// Instrument specific Tone Nodes
		this.adsr;
		this.panner;
		this.gain;
		this._fx;

		// The source to be defined by inheriting class
		this.source;

		// A place to add widgets to
		this._widgets = [];

		console.log('=> class Instrument()');
	}

	channelStrip(){
		// gain => output
		this.gain = new Tone.Gain(0).toDestination();
		// panning => gain
		this.panner = new Tone.Panner(0).connect(this.gain);
		// adsr => panning
		this.adsr = this.envelope(this.panner);
		// return Node to connect source => adsr
		return this.adsr;
	}

	envelope(d){
		// the adsr is a basic Gain node with lin/exp rampTo functions 
		return new Tone.Gain(0).connect(d);
	}

	event(c, time){
		// console.log('=> Instrument()', c);
		// end position for playback
		let e = this._time;

		// set FX parameters
		if (this._fx){
			for (let f = 0; f < this._fx.length; f++){
				this._fx[f].set(c, time, this.bpm());
			}
		}
		
		// set panning
		let p = getParam(this._pan, c);
		p = isRandom(p, -1, 1);
		this.panner.pan.setValueAtTime(p, time);

		// ramp volume
		let g = atodb(getParam(this._gain[0], c) * 0.707);
		let r = msToS(Math.max(0, getParam(this._gain[1], c)));
		this.source.volume.rampTo(g, r, time);

		this.sourceEvent(c, e, time);
		// let play = this.sourceEvent(c, e, time);
		// if (!play){ return; }

		// set shape for playback (fade-in / out and length)
		if (this._att){
			const att = Math.max(divToS(getParam(this._att, c), this.bpm()), 0.001);
			const dec = Math.max(divToS(getParam(this._dec, c), this.bpm()), 0);
			const rel = Math.max(divToS(getParam(this._rel, c), this.bpm()), 0.001);

			// fade-out running envelope over 2 ms
			// use the retrigger time to schedule the event a bit later as well
			// let retrigger = 0;
			// if (this.adsr.gain.getValueAtTime(time) > 0){
			// 	this.adsr.gain.linearRampTo(0, 0.002, time);
			// 	retrigger = 0.002;
			// }
			// trigger the envelope and release after specified time
			this.adsr.gain.linearRampTo(1.0, att, time);
			// exponential rampto * 5 for a good sounding exponential ramp
			this.adsr.gain.exponentialRampTo(0.0, rel * 5, time + att + dec);
			// this.adsr.gain.linearRampTo(0.0, rel, time + att + dec);
		} else {
			// if shape is 'off' turn on the gain of the envelope
			this.adsr.gain.setValueAtTime(1.0, time);
		}
	}

	sourceEvent(c, time){
		// trigger some events specifically for a source
		// specified in more detail in the inheriting class
		console.log('Instrument()', this._name, c);
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
			// wait a little bit extra before deleting to avoid clicks
		}, t * 1000 + 100);
	}

	delete(){
		// delete super class
		super.delete();
		// disconnect the gain, panner and adsr and dispose
		this.gain.disconnect();
		this.gain.dispose();

		this.panner.disconnect();
		this.panner.dispose();

		this.adsr?.disconnect();
		this.adsr?.dispose();

		// dispose the sound source (depending on inheriting class)
		this.source?.stop();
		this.source?.disconnect();
		this.source?.dispose();

		// remove all fx
		this._fx.map((f) => f.delete());
		this._widgets.map(w => w?.delete());

		console.log('=> disposed Instrument() with FX:', this._fx, 'and widgets:', this._widgets);
	}

	amp(g, r){
		// set the gain and ramp time
		this._gain[0] = toArray(g);
		this._gain[1] = (r !== undefined)? toArray(r) : [ 0 ];

		// convert amplitude to dBFullScale
		// this._gain[0] = g.map(g => 20 * Math.log(g * 0.707) );
		// this._gain[1] = r.map(r => Util.msToS(Math.max(0, r)) );
	}

	env(...e){
		// set the fade-in, decay and fade-out times
		this._att = [ 0 ];
		this._rel = [ 0 ];
		this._dec = [ 0 ];

		if (e[0] === 'off' || e[0] < 0){
			this._att = null;
		} else {
			if (e.length === 1){
				// one argument is release time
				this._att = [ 1 ];
				this._rel = toArray(e[0]);
			} else if (e.length === 2){
				// two arguments is attack & release
				this._att = toArray(e[0]);
				this._rel = toArray(e[1]);
			} else {
				// three is attack stustain and release
				this._att = toArray(e[0]);
				this._dec = toArray(e[1]);
				this._rel = toArray(e[2]);
			}
		}
	}

	pan(p){
		// the panning position of the sound
		this._pan = toArray(p);
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

	scope(h=30){
		let w = new Widget.Scope(this._line, h);
		this._widgets.push(w);
		this.gain.connect(w.input());
	}

	waveform(h=30){
		let w = new Widget.WaveForm(this._line, h);
		this._widgets.push(w);
		this.gain.connect(w.input());
	}

	spectrum(h=30){
		let w = new Widget.Spectrum(this._line, h);
		this._widgets.push(w);
		this.gain.connect(w.input());
	}
}
module.exports = Instrument;