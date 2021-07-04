const Tone = require('tone');
const Util = require('./Util.js');
const fxMap = require('./Effects.js');

// simple midi playback
class MonoMidi {
	constructor(d){
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

				// ramp volume
				let g = Util.getParam(this._velocity[0], c);

				let dur = Util.getParam(this._dur, c);

				this._device.playNote('C4', this._channel, { duration: dur, velocity: this._velocity})
				// increment internal beat counter
				this._beatCount++;
			}
			// increment count for sequencing
			this._count++;
		}, this._time).start(schedule);
	}

	fadeOut(t){
		// fade out the sound upon evaluation of new code
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
		// this._time = formatRatio(t);
		// this._offset = formatRatio(o);
	}

	beat(b){
		// set the beat pattern as an array
		// this._beat = toArray(b);
	}

	note(){}

	amp(){}

	env(d){
		// this._dur = toArray(d);
	}

	out(){}

	chord(){}

	sync(){}

	name(){}

	group(){}
}
module.exports = MonoMidi;