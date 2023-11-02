const Tone = require('tone');
const Util = require('./Util.js');
// const fxMap = require('./Effects.js');
const Instrument = require('./Instrument.js');

class MonoSample extends Instrument {
	constructor(engine, s, canvas){
		super(engine, canvas);

		this._bufs = this._engine.getBuffers();
		this._sound;
		this.sound(s);

		// sample variables
		this._speed = [ 1 ];
		this._rev = false;
		this._stretch = [ 0 ];
		this._note = [ 'off' ];
		this._tune = [ 261.6255653 ];

		// playback start position
		this._pos = [ 0 ];

		this.sample;
		this.createSource();

		console.log('=> MonoSample()', this);
	}

	createSource(){
		this.sample = new Tone.Player().connect(this.channelStrip());
		this.sample.autostart = false;
		this.source = this.sample;
	}

	sourceEvent(c, e, time){
		// get the sample from array
		let f = Util.getParam(this._sound, c);

		if (this.sample.buffer){
			// clean-up previous buffer
			this.sample.buffer.dispose();
		}
		if (this._bufs.has(f)){	
			this.sample.buffer = this._bufs.get(f);
			// this.sample.buffer = this._bufs.get(f).slice(0);
		} else {
			// default sample if file does not exist
			this.sample.buffer = this._bufs.get('kick_min');
			// this.sample.buffer = this._bufs.get('kick_min').slice(0);
		}
		// the duration of the buffer in seconds
		let dur = this.sample.buffer.duration;

		// get speed and if 2d array pick randomly
		let s = Util.getParam(this._speed, c);

		// check if note is not 'off'
		let i = Util.getParam(this._note[0], c);
		if (i !== 'off'){
			// note as interval / octave coordinate
			let o = Util.getParam(this._note[1], c);
			let t = Util.getParam(this._tune, c);

			// reconstruct midi note value with scale, (0, 0) = 36
			let n = Util.toMidi(i, o);
			let r = Util.mtof(n) / t;
			s = s * r;
		}

		// reversing seems to reverse every time the 
		// value is set to true (so after 2 times reverse
		// it becomes normal playback again) no fix yet
		// this.sample.reverse = s < 0.0;

		let l = Util.lookup(this._stretch, c);
		let n = 1;
		if (l){
			n = dur / (60 * 4 / this.bpm()) / l;
		}
		// playbackrate can not be 0 or negative
		this.sample.playbackRate = Math.max(Math.abs(s) * n, 0.0001);

		// get the start position
		let o = dur * Util.getParam(this._pos, c);

		// when sample is loaded, start
		// this.sample.start(time, o, e);
		this.sample.start(time, o);
		// if (this.sample.loaded){
		// }
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
				log(`sample ${s} not found`);
				return 'kick_909';
			}
			return s;
		});
	}

	speed(s){
		// set the speed pattern as an array
		this._speed = Util.toArray(s);
	}

	tune(t=60){
		// set the fundamental midi note for this sample in Hz, MIDI or Notename
		this._tune = Util.toArray(t);
		this._tune = this._tune.map((t) => {
			if (typeof t === 'number'){
				if (Math.floor(t) !== t){
					return t;
				}
				return Util.mtof(t);
			}
			return Util.mtof(Util.noteToMidi(t));
		});
	}

	stretch(s){
		// set the stretch loop bar length
		this._stretch = Util.toArray(s);
	}

	offset(o){
		// set the playback start position as an array
		this._pos = Util.toArray(o);
	}

	delete(){
		// delete super class
		super.delete();
		// disconnect the sound dispose the player
		this.source.dispose();
		this.sample.dispose();

		console.log('=> disposed MonoSample()', this._sound);
	}
}
module.exports = MonoSample;