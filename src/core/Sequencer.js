const Tone = require('tone');
const Util = require('./Util.js');

// Basic Sequencer class for triggering events
class Sequencer {
	constructor(engine){
		// The Tone engine
		this._engine = engine;
		
		// Sequencer specific parameters
		this._count = 0;
		this._beatCount = 0;
		this._time = 1;
		this._offset = 0;
		this._beat = [ 1 ];

		// Tone looper
		this._loop;
		this.makeLoop();

		console.log('=> class Sequencer()');
	}

	bpm(){
		// get the bpm value from Transport
		return Tone.Transport.bpm.value;
	}

	makeLoop(){
		// dispose of previous loop if active
		if (this._loop){
			this._loop.dispose();
		}
		let schedule = Tone.Time(this._offset).toSeconds();

		// create new loop for synth
		this._loop = new Tone.Loop((time) => {
			// Work in Progress on reset after looplength
			// let m = Tone.Transport.getTicksAtTime(time);
			// let mTicks = Tone.Time('1m').toTicks();

			// console.log(m, mTicks)
			// if the bar is equal to the reset value of play
			// if (m % mTicks === 0){
				// this._count = 0;
			// }

			// get beat probability for current count
			let b = Util.getParam(this._beat, this._count);

			// if random value is below probability, then play
			if (Math.random() < b){
				// get the count value
				let c = this._beatCount;

				// trigger some events for this instrument based
				// on the current count and time
				this.event(c, time);

				// increment internal beat counter
				this._beatCount++;
			}
			// increment count for sequencing
			this._count++;
		}, this._time).start(schedule);
	}

	event(c, time){
		// specify some events to be triggered specifically for 
		// the inheritting class
		console.log('Sequencer()', this._name, c, time);
	}

	fadeIn(t){
		// fade in?
	}

	fadeOut(t){
		// delete the sound
		this.delete();
	}

	delete(){
		// dispose loop
		this._loop.dispose();
		console.log('=> disposed Sequencer()');
	}

	start(){
		// restart at offset
		this._loop.start(this._offset);
	}

	stop(){
		// stop sequencer
		this._loop.stop();
	}

	time(t, o=0){
		// set the timing interval and offset
		// this._time = Util.toArray(t);
		this._time = Util.formatRatio(t, this.bpm());
		this._offset = Util.formatRatio(o, this.bpm());
	}

	beat(b, r='off'){
		// set the beat pattern as an array and reset time in bars
		this._beat = Util.toArray(b);
		this._reset = Array.isArray(r)? r[0] : r;
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
module.exports = Sequencer;