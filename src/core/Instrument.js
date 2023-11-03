const Tone = require('tone');
const Util = require('./Util.js');
const fxMap = require('./Effects.js');
const Sequencer = require('./Sequencer.js');

// Basic class for all instruments
class Instrument extends Sequencer {
	constructor(engine, canvas){
		// Inherit from Sequencer
		super(engine, canvas);

		// Instrument specific parameters
		this._gain = [-6, 0];		
		this._pan = [ 0 ];
		this._att = [ 0 ];
		this._sus = [ 0 ];
		this._rel = [ 0 ];

		// Instrument specific Tone Nodes
		this.adsr;
		this.panner;
		this.gain;
		this._fx;

		// The source to be defined by inheriting class
		this.source;

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

		// ramp volume
		let g = 20 * Math.log(Util.getParam(this._gain[0], c) * 0.707);
		let r = Util.msToS(Math.max(0, Util.getParam(this._gain[1], c)));
		this.source.volume.rampTo(g, r, time);

		this.sourceEvent(c, e, time);

		// fade-out running envelope over 5 ms
		if (this.adsr.value > 0){
			let tmp = this.adsr.release;
			this.adsr.release = 0.005;
			this.adsr.triggerRelease(time);
			this.adsr.release = tmp;
			time += 0.005;
		}

		// set shape for playback (fade-in / out and length)
		if (this._att){
			let att = Util.divToS(Util.getParam(this._att, c), this.bpm());
			let dec = Util.divToS(Util.getParam(this._sus, c), this.bpm());
			let rel = Util.divToS(Util.getParam(this._rel, c), this.bpm());

			this.adsr.attack = att;
			this.adsr.decay = dec;
			this.adsr.release = rel;
			
			e = Math.min(this._time, att + dec + rel);
			// e = Math.min(t, att + dec + rel);

			let rt = Math.max(0.001, e - this.adsr.release);
			this.adsr.triggerAttackRelease(rt, time);
		} else {
			// if shape is 'off' only trigger attack
			this.adsr.triggerAttack(time);
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
		// disconnect the sound dispose the player
		this.gain.dispose();
		this.panner.dispose();
		// this.adsr.dispose();
		// remove all fx
		this._fx.map((f) => f.delete());
		console.log('=> disposed Instrument() with FX:', this._fx);
	}

	amp(g, r){
		// set the gain and ramp time
		this._gain[0] = Util.toArray(g);
		this._gain[1] = (r !== undefined)? Util.toArray(r) : [ 0 ];

		// convert amplitude to dBFullScale
		// this._gain[0] = g.map(g => 20 * Math.log(g * 0.707) );
		// this._gain[1] = r.map(r => Util.msToS(Math.max(0, r)) );
	}

	env(...e){
		// set the fade-in, sustain and fade-out times
		this._att = [ 0 ];
		this._rel = [ 0 ];
		this._sus = [ 1 ];

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
module.exports = Instrument;