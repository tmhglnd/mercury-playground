const Tone = require('tone');
const Util = require('./Util.js');
const Sequencer = require('./Sequencer.js');
const WebMidi = require("webmidi");

class MonoMidi extends Sequencer {
	constructor(engine, d='default', canvas){
		super(engine, canvas);

		// Set Midi Device Output
		this._device = WebMidi.getOutputByName(d);
		if (d === 'default'){
			this._device = WebMidi.outputs[0];
		} else if (!this._device){
			log(`${d} is not a valid MIDI Device name, set to default`);
			this._device = WebMidi.outputs[0];
		}

		// Midi specific parameters
		this._note = [];		
		this._velocity = [ 127, 0 ];
		this._dur = [ 100 ];
		this._cc = [];
		this._channel = [ 1 ];
		this._chord = false;
		this._bend = [];

		console.log('=> class MonoMidi', this);
	}

	event(c, time){
		// normalized velocity (0 - 1)
		let g = Util.getParam(this._velocity[0], c);
				
		// get the duration
		let d = Util.divToS(Util.getParam(this._dur, c), this.bpm()) * 1000;

		// get the channel
		let ch = Util.getParam(this._channel, c);

		// timing offset to sync WebMidi and WebAudio
		let offset = WebMidi.time - Tone.context.currentTime * 1000;
		let sync = time * 1000 + offset;

		// send pitchbend message in hires -1 1 at specified channel
		if (this._bend.length > 0){
			let b = Util.lookup(this._bend, c);
			// clip the bend range between -1 and 1 (results in hires 14bit)
			b = Math.min(1.0, Math.max(-1, b));
			this._device.sendPitchBend(b, ch, { time: sync });
		}

		// send control changes!
		this._cc.forEach((cc) => {
			let ctrl = Number(cc[0]);
			let val = Util.getParam(cc[1], c);
			val = Math.max(0, Math.min(127, val));

			this._device.sendControlChange(ctrl, val, ch, { time: sync });
		});

		// only play a note if the notes are provided in the function
		// if (this._note.length > 0){

		// note as interval / octave coordinate
		let o = Util.getParam(this._note[1], c);
		let n = [];
		let i = [];
		if (this._chord){
			i = Util.lookup(this._note[0], c);
			i = Util.toArray(i);
		} else {
			i = [ Util.getParam(this._note[0], c) ];
		}
		
		for (let x=0; x<i.length; x++){
			// reconstruct midi note value, (0, 0) = 36
			// convert to scale and include the octave
			n[x] = Util.toMidi(i[x], o);
		}
		
		// play the note(s)!
		this._device.playNote(n, ch, { duration: d, velocity: g, time: sync });

		// }
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

	bend(b=[0]){
		this._bend = Util.toArray(b);
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
				log(`'${c[0]}' is not a valid CC number`);
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
}
module.exports = MonoMidi;