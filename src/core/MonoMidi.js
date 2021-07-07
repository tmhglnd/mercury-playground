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

		this._count = 0;
		this._beatCount = 0;
		
		this._beat = [ 1 ];
		this._note = [ 0, 0 ];
		
		this._time = 1;
		this._offset = 0;
		
		this._velocity = [ 127, 0 ];
		this._dur = [ 100 ];
		
		this._cc = [];
		this._channel = [ 1 ];
		this._chord = false;
		this._loop;

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
				let d = Util.divToS(Util.getParam(this._dur, c), this._bpm) * 1000;

				// get the channel
				let ch = Util.getParam(this._channel, c);

				// note as interval / octave coordinate
				let o = Util.getParam(this._note[1], c);
				let n;
				if (this._chord){
					let i = Util.lookup(this._note[0], c);
					// reconstruct midi note value, (0, 0) = 36
					n = [];
					for (let x=0; x<i.length; x++){
						n[x] = i[x] + (o * 12) + 36;
					}
				} else {
					let i = Util.getParam(this._note[0], c);
					// reconstruct midi note value, (0, 0) = 36
					n = i + (o * 12) + 36;
				}

				// timing offset to sync WebMidi and WebAudio
				let offset = WebMidi.time - Tone.context.currentTime * 1000;
				let sync = time * 1000 + offset;

				// send control changes!
				this._cc.forEach((cc) => {
					let ctrl = Number(cc[0]);
					let val = Util.getParam(cc[1], c);
					val = Math.max(0, Math.min(127, val));
					
					this._device.sendControlChange(ctrl, val, ch, { time: sync });
				});

				// play the note!
				this._device.playNote(n, ch, { duration: d, velocity: g, time: sync });

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

		console.log('=> Disposed:', 'Midi', this._device);
	}

	time(t, o=0){
		// set the timing interval and offset
		this._time = Util.formatRatio(t, this._engine.getBPM());
		this._offset = Util.formatRatio(o, this._engine.getBPM());
	}

	beat(b){
		// set the beat pattern as an array
		this._beat = Util.toArray(b);
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

	out(c){
		this._channel = Util.toArray(c);
	}

	chord(c){
		this._chord = false;
		if (c === 'on' || c === 1){
			this._chord = true;
		}
	}

	add_fx(...cc){
		// control parameters via control change midi messages
		this._cc = [];
		cc.forEach((c) => {
			if (isNaN(c[0])){
				console.log(`'${c[0]}' is not a valid CC number`);
			} else {
				let cc = [];
				cc[0] = c[0];
				cc[1] = Util.toArray(c[1]);
				this._cc.push(cc);
			}
		});
	}

	sync(s){
		// send out midiclock messages to sync external devices
		// on this specific midi output and channel
		// this._sync;
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
}
module.exports = MonoMidi;