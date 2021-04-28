const Tone = require('tone');
const Util = require('./Util.js');
const fxMap = require('./Effects.js');

// simple mono sample playback
class MonoSample {
	constructor(s='kick_min', engine){
		this._bufs = engine.getBuffers();
		this._bpm = engine.getBPM();

		console.log('=> MonoSample()', s);
		
		this._sound = s;
		this._count = 0;
		
		this._beat = [1];

		//this._note = n;
		this._speed = [1];
		
		this._time = 1;
		this._offset = 0;

		// playback start position
		this._pos = [ 0 ];
		
		// default gain value -6 dB
		this._gain = [-6, 0];
		
		this._pan = [[0], [0], [0]];

		this._att = [ 0 ];
		this._sus = [ 0 ];
		this._rel = [ 0 ];

		this.sample;
		this.seq;
		this.panner;
		this.adsr;
		this._fx;

		this.sound(this._sound);
		this.makeSampler();
		// this.makeLoop();
	}

	makeSampler(){
		this.panner = new Tone.Panner(0).toDestination();
		// this.sample = new Tone.Player(buffers.get('kick_min')).toDestination();
		this.adsr = new Tone.AmplitudeEnvelope({
			attack: 0,
			decay: 0,
			sustain: 1,
			release: 0.001,
			attackCurve: "exponential",
			releaseCurve: "exponential"
		});
		this.adsr.connect(this.panner);
		this.sample = new Tone.Player().connect(this.adsr);
		// this.sample = new Tone.Player().connect(this.panner);

		// this.sample.load(this._sound);
		this.sample.autostart = false;
		// console.log('MonoSample()', this.sample.numberOfOutputs);
	}

	makeLoop(){
		// dispose of previous loop if active
		if (this._loop){
			this._loop.dispose();
		}
		let now = Tone.now();
		let then = Tone.Time(this._offset).toSeconds();
		// let then = this._offset * 2.0 * (60 / getBPM());

		// console.log('makeLoop()', this._time);

		// create new loop for synth
		this._loop = new Tone.Loop((time) => {
			// get the count value
			let c = this._count;
			// get beat probability
			let b = Util.randLookup(Util.lookup(this._beat, c));
			
			// get timing TODO?

			// if random value is below probability, then play
			if (Math.random() < b){
				// get the sample from array
				let f = Util.randLookup(Util.lookup(this._sound, c));
				if (this._bufs.has(f)){
					this.sample.buffer = this._bufs.get(f);
				} else {
					// default sample if file does not exist
					this.sample.buffer = this._bufs.get('kick_min');
				}
				// the duration of the buffer in seconds
				let dur = this.sample.buffer.duration;

				// get speed and if 2d array pick randomly
				let s = Util.randLookup(Util.lookup(this._speed, c));

				this.sample.reverse = s < 0;
				this.sample.playbackRate = Math.abs(s);
				
				// ramp volume
				let g = Util.lookup(this._gain[0], c);
				let r = Util.lookup(this._gain[1], c);
				this.sample.volume.rampTo(g, r, time);

				// set panning
				let p = Util.randLookup(Util.lookup(this._pan, c));
				p = (p === 'random')? Math.random() * 2 - 1 : p;
				this.panner.pan.rampTo(p, Util.msToS(1));

				// get the start position
				let o = dur * Util.randLookup(Util.lookup(this._pos, c));
				// end position for playback
				let e = this._time;

				// set shape for playback (fade-in / out and length)
				if (this._att){
					let att = Util.divToS(Util.lookup(this._att, c), this._bpm);
					let dec = Util.divToS(Util.lookup(this._sus, c), this._bpm);
					let rel = Util.divToS(Util.lookup(this._rel, c), this._bpm);

					this.adsr.attack = att;
					this.adsr.decay = dec;
					this.adsr.release = rel;
					
					e = Math.min(this._time, att + dec + rel);
				}

				// when sample is loaded, start
				if (this.sample.loaded){
					this.sample.start(time, o, e);
					// calculate the release trigger time
					let rt = Math.max(0.001, e - this.adsr.release);
					this.adsr.triggerAttackRelease(rt, time);
				}
			}
			// increment count for sequencing
			this._count++;
		}, this._time).start(then);
	}

	delete(){
		// dispose loop
		this._loop.dispose();
		
		// disconnect the sound dispose the player
		// this.sample.disconnect();
		// this.sample.dispose();

		// remove all fx
		// TODO: garbage collect and remove after fade out
		// this._fx.map((f) => f.dispose());
	}

	stop(){
		// stop sequencer
		this._loop.stop();
	}

	start(){
		// restart at offset
		this._loop.start(this._offset);
	}

	sound(s){
		// load all soundfiles and return as array
		this._sound = this.checkBuffer(Util.toArray(s));
	}

	checkBuffer(a){
		// check if file is part of the loaded samples
		return a.map((s) => {
			if (Array.isArray(s)) {
				return this.checkBuffer(s);
			}
			// error if soundfile does not exist
			else if (!this._bufs.has(s)){
				// set default (or an ampty soundfile?)
				console.log(`sample ${s} not found`);
				return 'kick_min';
			}
			return s;
		});
	}

	amp(g, r){
		// set the gain and ramp time
		g = Util.toArray(g);
		r = (r !== undefined)? Util.toArray(r) : [ 0 ];
		// convert amplitude to dBFullScale
		this._gain[0] = g.map(g => 20 * Math.log(g * 0.707) );
		this._gain[1] = r.map(r => Util.msToS(Math.max(0, r)) );
	}

	time(t, o=0){
		// set the timing interval and offset
		this._time = Util.formatRatio(t, this._bpm);
		this._offset = Util.formatRatio(o, this._bpm);
	}

	beat(b){
		// set the beat pattern as an array
		this._beat = Util.toArray(b);
	}

	speed(s){
		// set the speed pattern as an array
		this._speed = Util.toArray(s);
	}

	offset(o){
		// set the playback start position as an array
		this._pos = Util.toArray(o);
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
		console.log('shape()', this._att, this._rel, this._sus);
	}

	stretch(){
		// placeholder
	}

	name(n){
		// placeholder function for name
		// is not used besides when parsing in mercury-lang
		this._name = n;
	}

	group(g){
		// placeholder function for group
		// is not used besides when parsing in mercury-lang
		this._group = g;
	}

	pan(p){
		this._pan = Util.toArray(p);
	}

	add_fx(...fx){
		this._fx = [];
		console.log('Effects currently disabled');
/*
		fx.forEach((f) => {
			if (fxMap[f[0]]){
				this._fx.push(fxMap[f[0]](f.slice(1)));
			} else {
				console.log(`Effect ${f[0]} does not exist`);
			}
		});

		this.sample.chain(...this._fx, Tone.Destination);*/
	}
}
module.exports = MonoSample;