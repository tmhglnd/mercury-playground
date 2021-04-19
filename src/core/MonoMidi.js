import * as Tone from 'tone';

// simple midi playback
class MonoMidi {
	constructor(d){
		console.log('midi');
		// console.log('MonoSample init:', s, t, b);
		this._device = WebMidi.getOutputByName(d);
		this._channel = 1;
		
		this._count = 0;
		
		this._beat = [1];
		this._note = [0, 0];
		this._time = 1;
		this._offset = 0;
		
		// default gain value -6 dB
		this._velocity = [127, 0];

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
		let now = Tone.now();
		let then = Tone.Time(this._offset).toSeconds();

		// create new loop
		this._loop = new Tone.Loop((time) => {
			// get the count value
			let c = this._count;
			// get beat probability
			let b = randLookup(lookup(this._beat, c));
			
			// if random value is below probability, then play
			if (Math.random() < b){
				// ramp volume
				let g = lookup(this._velocity[0], c);

				let dur = lookup(this._dur, c);

				this._device.playNote('C4', this._channel, { duration: dur, velocity: this._velocity})
			}
			// increment count for sequencing
			this._count++;
		}, this._time).start(then);
	}

	delete(){
		// dispose loop
		this._loop.dispose();
	}

	time(t, o=0){
		// set the timing interval and offset
		this._time = formatRatio(t);
		this._offset = formatRatio(o);
	}

	beat(b){
		// set the beat pattern as an array
		this._beat = toArray(b);
	}

	note(){}

	amp(){}

	env(d){
		this._dur = toArray(d);
	}

	out(){}

	chord(){}

	sync(){}

	name(){}

	group(){}
}
module.exports = MonoMidi;