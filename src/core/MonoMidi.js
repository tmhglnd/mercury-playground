const Tone = require('tone');
const Util = require('./Util.js');
const fxMap = require('./Effects.js');

// simple midi playback
class MonoMidi {
	constructor(d='default', engine){
		this._bpm = engine.getBPM();
		this._engine = engine;
		
		console.log('=> MonoMidi()', d);
		// console.log('MonoSample init:', s, t, b);
		this._device = WebMidi.getOutputByName(d);
		if (d === 'default'){
			this._device = WebMidi.outputs[0];
		} else if (!this._device){
			console.log('Not a valid MIDI Device name, set to default');
			this._device = WebMidi.outputs[0];
		}

		this._channel = 1;
		
		this._count = 0;
		this._beatCount = 0;
		
		this._beat = [ 1 ];
		this._note = [ 0, 0 ];

		this._time = 1;
		this._offset = 0;
		
		this._velocity = [ 127, 0 ];
		this._dur = 0.1;

		this._loop;
		// this._midi;
		// this.seq;
		// this.panner;
		// this._fx;

		// this.sound(this._sound);
		// this.makeSampler();
		this.makeLoop();
	}

	makeLoop(){
		// dispose of previous loop if active
		if (this._loop){
			this._loop.dispose();
		}
		let schedule = Tone.Time(this._offset).toSeconds();

		// create new loop
		this._loop = new Tone.Loop((time) => {
			// get beat probability for current count
			let b = Util.getParam(this._beat, this._count);
			
			// if random value is below probability, then play
			if (Math.random() < b){
				// get the count value
				let c = this._beatCount;
				
				// normalized velocity (0 - 1)
				let g = Util.getParam(this._velocity[0], c);
				
				// get the duration
				let d = Util.getParam(this._dur, c);

				// note as interval / octave coordinate
				let i = Util.getParam(this._note[0], c);
				let o = Util.getParam(this._note[1], c);
				// reconstruct midi note value, (0, 0) = 36
				let n = i + (o * 12) + 36;

				// timing offset to sync WebMidi and WebAudio
				let offset = WebMidi.time - Tone.context.currentTime * 1000;
				let sync = time * 1000 + offset;

				this._device.playNote(n, 10, { duration: d, velocity: g, time: sync });
				// increment internal beat counter
				this._beatCount++;
			}
			// increment count for sequencing
			this._count++;
		}, this._time).start(schedule);
	}

	fadeOut(t){
		// fade out the sound upon evaluation of new code
		// no fade out possible with midi-notes
		this.delete();
	}

	fadeIn(t){
		// fade in the sound upon evaluation of code
	}

	delete(){
		// dispose loop
		this._loop.dispose();
	}

	time(t, o=0){
		// set the timing interval and offset
		this._time = Util.formatRatio(t, this._engine.getBPM());
		this._offset = Util.formatRatio(o, this._engine.getBPM());
	}

	beat(b){
		// set the beat pattern as an array
		// this._beat = toArray(b);
	}

	note(i=0, o=0){
		// set the note as semitone interval and octave offset
		// (0, 0) = MidiNote 36
		this._note = [Util.toArray(i), Util.toArray(o)];
	}

	amp(g, r){
		// set the gain and ramp time
		g = Util.toArray(g);
		r = (r !== undefined)? Util.toArray(r) : [ 0 ];
		// convert amplitude to velocity range
		this._velocity[0] = g.map(g => Math.min(1, Math.max(0, g*g)));
		// this._velocity[0] = g.map(g => Math.floor(Math.min(127, Math.max(0, g * 127))));
		this._velocity[1] = r;
	}

	env(d){
		this._dur = Util.toArray(d);
	}

	out(){}

	chord(){}

	sync(){}

	name(){}

	group(){}
}
module.exports = MonoMidi;