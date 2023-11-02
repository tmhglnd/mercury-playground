const Tone = require('tone');
const Util = require('./Util.js');
const PolyInstrument = require('./PolyInstrument.js');

class PolySample extends PolyInstrument {
	constructor(engine, s, canvas){
		// Inherit from PolyInstrument
		super(engine, canvas);

		this._bufs = this._engine.getBuffers();
		this._sound;
		this.sound(s);

		// sample variables
		this._speed = [ 1 ];
		this._rev = false;
		this._stretch = [ 0 ];

		// playback start position
		this._pos = [ 0 ];

		this.sample;
		this._note = [ 0, 0 ];
		this._tune = [ 261.6255653 ];

		// this._slide = [ 0 ];
		this._voices = [ 1 ];
		this._detune = [ 0 ];

		this.createSources();

		console.log('=> PolySample()', this);
	}

	createSources(){
		for (let i=0; i<this.numVoices; i++){
			this.sources[i] = new Tone.Player().connect(this.adsrs[i]);
			this.sources[i].autostart = false;
		}
	}

	sourceEvent(c, time, id, num){
		// ramp volume
		let g = 20 * Math.log(Util.getParam(this._gain[0], c) * 0.707);
		let r = Util.msToS(Math.max(0, Util.getParam(this._gain[1], c)));
		this.sources[id].volume.rampTo(g, r, time);


		// let o = Util.getParam(this._note[1], c);
		// let i = Util.getParam(this._note[0], c);
		// let i = Util.toArray(Util.lookup(this._note[0], c))[num];
		// let f = Util.noteToFreq(i, o);

		// get the sample from array
		let b = Util.getParam(this._sound, c);

		if (this.sources[id].buffer){
			// clean-up previous buffer
			this.sources[id].buffer.dispose();
		}
		if (this._bufs.has(b)){	
			this.sources[id].buffer = this._bufs.get(b);
		} else {
			// default sample if file does not exist
			this.sources[id].buffer = this._bufs.get('kick_min');
		}
		// the duration of the buffer in seconds
		let dur = this.sources[id].buffer.duration;

		// get speed and if 2d array pick randomly
		let s = Util.getParam(this._speed, c);

		// set the playbackrate based on the selected note
		// note as interval / octave coordinate
		// check if note is not 'off'
		let i = Util.toArray(Util.lookup(this._note[0], c))[num];
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
		this.sources[id].playbackRate = Math.max(Math.abs(s) * n, 0.0001);

		// get the start position
		let p = dur * Util.getParam(this._pos, c);

		// when sample is loaded, start
		this.sources[id].start(time, p);
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

	note(i=0, o=0){
		// set the note as semitone interval and octave offset
		// (0, 0) = MidiNote 36
		this._note = [Util.toArray(i), Util.toArray(o)];
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
		
		console.log('disposed PolySample()', this._sound);
	}
}
module.exports = PolySample;