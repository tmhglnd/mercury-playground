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
		this._dec = [ 0 ];
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
		let g = Util.atodb(Util.getParam(this._gain[0], c) * 0.707);
		let r = Util.msToS(Math.max(0, Util.getParam(this._gain[1], c)));
		this.source.volume.rampTo(g, r, time);
		// this.source.gain.rampTo(g, r, time);

		this.sourceEvent(c, e, time);
		// let play = this.sourceEvent(c, e, time);
		// if (!play){ return; }

		// fade-out running envelope over 5 ms
		// retrigger temporarily disabled to reduce distortion
		// if (this.adsr.value > 0){
		// 	let tmp = this.adsr.release;
		// 	this.adsr.release = 0.004;
		// 	this.adsr.triggerRelease(time-0.004);
		// 	this.adsr.release = tmp;
		// 	time += 0.010;
		// }

		// set shape for playback (fade-in / out and length)
		if (this._att){
			let att = Util.divToS(Util.getParam(this._att, c), this.bpm());
			let dec = Util.divToS(Util.getParam(this._dec, c), this.bpm());
			let rel = Util.divToS(Util.getParam(this._rel, c), this.bpm());

			this.adsr.attack = Math.max(0.001, att);
			this.adsr.decay = dec;
			this.adsr.release = Math.max(0.001, rel);

			// trigger the envelope and release after a short while
			this.adsr.triggerAttack(time);
			this.adsr.triggerRelease(time + att + dec);
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
		this.gain.disconnect();
		this.gain.dispose();

		this.panner.disconnect();
		this.panner.dispose();
		// this.adsr.dispose();
		// remove all fx
		this._fx.map((f) => f.delete());
		console.log('=> disposed Instrument() with FX:', this._fx);

		this.deleteScope();
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
				this._rel = Util.toArray(e[0]);
			} else if (e.length === 2){
				// two arguments is attack & release
				this._att = Util.toArray(e[0]);
				this._rel = Util.toArray(e[1]);
			} else {
				// three is attack stustain and release
				this._att = Util.toArray(e[0]);
				this._dec = Util.toArray(e[1]);
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

	scope(){
		this._waveform = new Tone.Waveform(4096);
		this._mono = new Tone.Mono().connect(this._waveform);
		this.gain.connect(this._mono);

		this._waveCnv = document.createElement('canvas');
		let ui = document.getElementById('ui');
		ui.appendChild(this._waveCnv);

		this._waveCnv.width = window.innerWidth * 0.9;
		this._waveCnv.height = 30;
		this._waveCnv.style.color = 'var(--accent)';

		// console.log(window.cm.cm.addLineWidget());
		this._waveWidget = window.cm.cm.addLineWidget(window.cm.cm.lineCount()-1, this._waveCnv);

		this._scopeMax = -Infinity;

		let drawWaveform = () => {
			// console.log(this._waveform.getValue());
			let wave = this._waveform.getValue();
	
			let downsample = 1, sum = 0, downArr = [];
			// let max = -Infinity;
			for (let i = 0; i < wave.length; i++){
				// min = Math.min(min, wave[i]);
				this._scopeMax = Math.max(this._scopeMax, Math.abs(wave[i]));
				sum += wave[i];
				if (i % downsample === downsample - 1){
					downArr.push(sum / downsample); 
					sum = 0;
				}
			}
			let ctx = this._waveCnv.getContext('2d');
			let halfHeight = this._waveCnv.height / 2;
			let width = this._waveCnv.width;

			ctx.clearRect(0, 0, this._waveCnv.width, this._waveCnv.height);
			ctx.beginPath();
			for (let i = 0; i < downArr.length; i++){
				let a = downArr[i] * (1 / this._scopeMax) * halfHeight + halfHeight;
				if (i === 0) {
					ctx.moveTo(0, a);
				} else {
					ctx.lineTo(i * (width / downArr.length), a);
				}
			}			
			ctx.lineWidth = 2;
			ctx.strokeStyle = window.getComputedStyle(document.documentElement).getPropertyValue('--accent');
			ctx.stroke();

			requestAnimationFrame(drawWaveform);
		}
		this._wvfrm = requestAnimationFrame(drawWaveform);
	}

	deleteScope(){
		this._waveCnv?.remove();
		this._mono?.disconnect();
		this._mono?.dispose();
		this._waveform?.disconnect();
		this._waveform?.dispose();
		this._waveWidget?.clear();
		cancelAnimationFrame(this._wvfrm);
	}
}
module.exports = Instrument;