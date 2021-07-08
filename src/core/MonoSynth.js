const Tone = require('tone');
const Util = require('./Util.js');
const fxMap = require('./Effects.js');

// simple mono synth with sequencing and envelope
class MonoSynth {
	constructor(t='saw', engine){
		this._engine = engine;
		this._bpm = engine.getBPM();

		console.log('=> MonoSynth()', t);

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
			// fat: 'fat'
		}
		// this.sound(s);

		this._count = 0;
		this._beatCount = 0;
		
		this._time = 1;
		this._offset = 0;
		this._beat = [ 1 ];
		
		this._note = [ 0, 0 ];
		this._slide = [ 0 ];
		
		// default gain value -6 dB
		this._gain = [ -6, 0 ];

		this._att = [ 0.1 ];
		this._sus = [ 0 ];
		this._rel = [ 0.5 ];

		this._pan = [ 0 ];

		this._loop;
		this.synth;
		this.panner;
		this.adsr;

		this._fx;

		this.makeSynth();
		this.makeLoop();
	}

	makeSynth(){
		this.panner = new Tone.Panner(0).toDestination();
		this.gain = new Tone.Gain(0).connect(this.panner);
		// this.sample = new Tone.Player(buffers.get('kick_min')).toDestination();
		this.adsr = new Tone.AmplitudeEnvelope({
			attack: 0,
			decay: 0,
			sustain: 1,
			release: 0.001,
			attackCurve: "linear",
			decayCurve: "exponential",
			releaseCurve: "linear"
		});
		this.adsr.connect(this.gain);

		this.synth = new Tone.OmniOscillator().connect(this.adsr);
		this.synth.start();
	}

	makeLoop(){
		// dispose of previous loop if active
		if (this._loop){
			this._loop.dispose();
		}
		let schedule = Tone.Time(this._offset).toSeconds();

		// create new loop for synth
		this._loop = new Tone.Loop((time) => {
			// get beat probability for current count
			let b = Util.getParam(this._beat, this._count);

			// if random value is below probability, then play
			if (Math.random() < b){
				// get the count value
				let c = this._beatCount;

				// set FX parameters
				if (this._fx){
					for (let f=0; f<this._fx.length; f++){
						this._fx[f].set(c, time, this._bpm);
					}
				}

				// set wave to oscillator
				let w = Util.getParam(this._wave, c);
				if (this._waveMap[w]){
					w = this._waveMap[w];
				} else {
					console.log(`'${w} is not a valid waveshape`);
					// default wave if wave does not exist
					w = 'sine';
				}
				this.synth.set({ type: w });
				
				// ramp volume
				let g = Util.getParam(this._gain[0], c);
				let r = Util.getParam(this._gain[1], c);
				this.synth.volume.rampTo(g, r, time);

				// set panning
				let p = Util.getParam(this._pan, c);
				p = (p === 'random')? Math.random() * 2 - 1 : p;
				// this.panner.pan.rampTo(p, Util.msToS(1));
				this.panner.pan.setValueAtTime(p, time);

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

				// set the frequency based on the selected note
				// note as interval / octave coordinate
				let o = Util.getParam(this._note[1], c);
				let i = Util.getParam(this._note[0], c);
				// reconstruct midi note value, (0, 0) = 36
				let n = i + (o * 12) + 36;
				// calculate frequency in 12-TET A4 = 440;
				let f = Math.pow(2, (n - 69)/12) * 440;
				
				// get the slide time for next note
				let s = Util.divToS(Util.getParam(this._slide, c));
				if (s > 0){
					this.synth.frequency.rampTo(f, s, time);
				} else {
					this.synth.frequency.setValueAtTime(f, time);
				}

				// calculate the release trigger time
				let rt = Math.max(0.001, e - this.adsr.release);
				this.adsr.triggerAttackRelease(rt, time);

				// increment internal beat counter
				this._beatCount++;
			}
			// increment count for sequencing
			this._count++;
		}, this._time).start(schedule);
	}

	fadeOut(t){
		// fade out the sound upon evaluation of new code
		this.gain.gain.rampTo(0, t);
		setTimeout(() => {
			this.delete();
		}, t * 1000);
	}

	fadeIn(t){
		// fade in the sound upon evaluation of code
		this.gain.gain.rampTo(1, t);
	}

	delete(){
		// dispose loop
		this._loop.dispose();
		// disconnect the sound dispose the player
		// this.panner.disconnect();
		this.panner.dispose();
		// this.gain.disconnect();
		this.gain.dispose();
		// this.adsr.disconnect();
		this.adsr.dispose();
		// this.synth.disconnect();
		this.synth.dispose();
		// remove all fx
		// TODO: garbage collect and remove after fade out
		// this._fx.map((f) => f.dispose());
		console.log('=> Disposed:', this._wave);
	}

	stop(){
		// stop sequencer
		this._loop.stop();
	}

	start(){
		// restart at offset
		this._loop.start(this._offset);
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
		this._time = Util.formatRatio(t, this._engine.getBPM());
		this._offset = Util.formatRatio(o, this._engine.getBPM());
	}

	note(i=0, o=0){
		// set the note as semitone interval and octave offset
		// (0, 0) = MidiNote 36
		this._note = [Util.toArray(i), Util.toArray(o)];
	}

	beat(b){
		// set the beat pattern as an array
		this._beat = Util.toArray(b);
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
		// console.log('shape()', this._att, this._rel, this._sus);
	}

	slide(s){
		this._slide = Util.toArray(s);
	}

	wave2(w){
		// placeholder function for wave2
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
				console.log(`Effect ${f[0]} does not exist`);
			}
		});
		// if any fx working
		if (this._fx){
			// disconnect the panner
			this.panner.disconnect();
			// iterate over effects and get chain
			this._ch = this._fx.map((f) => { return f.chain() });
			// add all effects in chain and connect to Destination
			this.panner.chain(...this._ch, Tone.Destination);
		}
	}
}
module.exports = MonoSynth;