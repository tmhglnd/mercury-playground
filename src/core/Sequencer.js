const Tone = require('tone');
const Util = require('./Util.js');

// Basic Sequencer class for triggering events
class Sequencer {
	constructor(engine, canvas){
		// The Tone engine
		this._engine = engine;
		this._canvas = canvas;
		
		// Sequencer specific parameters
		this._count = 0;
		this._beatCount = 0;
		this._time = 1;
		this._subdiv = [ 1 ];
		this._offset = 0;
		this._beat = [ 1 ];
		this._human = 0;
		this._follow = null;

		this._emitter = new Tone.Emitter();

		// visual code
		this._visual = [];

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

		if (this._follow){
			console.log('is following', this._follow);

			// document.addEventListener(this._follow, (e) => console.log('received from emitter:', e), false);
			this._emitter.on(this._follow, (time) => console.log('recieved', time));
			return;
		}

		// create new loop for synth
		this._loop = new Tone.Loop((time) => {
			// convert transport time to Ticks and convert reset time to ticks
			let ticks = Tone.Transport.getTicksAtTime(time);
			let rTicks = Tone.Time(`${this._reset}m`).toTicks();

			// if reset per bar is a valid argument
			if (this._reset > 0){
				// if ticks % resetTicks === 0 then reset
				if (ticks % rTicks === 0){
					this._count = 0;
					this._beatCount = 0;
				}
			}
			// set subdivision speeds
			this._loop.playbackRate = Util.getParam(this._subdiv, this._count);

			// humanize method is interesting to add
			this._loop.humanize = Util.getParam(this._human, this._count);

			// get beat probability for current count
			let b = Util.getParam(this._beat, this._count);

			// if random value is below probability, then play
			if (Math.random() < b){
				// get the count value
				let c = this._beatCount;

				// trigger some events for this instrument based
				// on the current count and time
				this.event(c, time);

				// also emit the count to all listeners
				// console.log('emitter', this._name, c, time);
				// this._emitter.debug = true;
				this._emitter.emit(this._name, time);
				// this._emitter = new CustomEvent(this._follow, { detail: [c, time ], bubbles: true, cancelable: true, composed: false});
				// document.dispatchEvent(this._emitter);

				// osc-connection needs syncing with Tone Transport
				// emit([`/trigger`, 1]);

				// execute a visual event for Hydra
				if (this._visual.length > 0){
					this._canvas.eval(Util.getParam(this._visual, c));
				}

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

	visual(v){
		this._visual = Util.toArray(v);
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

	time(t, o=0, s=[1]){
		// set the timing interval and offset
		this._time = Util.formatRatio(t, this.bpm());
		this._offset = Util.formatRatio(o, this.bpm());
		// set timing division optionally, also possible via timediv()
		// this.timediv(s);
	}

	timediv(s){
		// set timing subdivisions for the loop
		let tmp = Util.toArray(s);
		this._subdiv = [];
		for (let i=0; i<tmp.length; i++){
			let sub = Math.max(0.001, Math.floor(tmp[i]));
			for (let j=0; j<sub; j++){
				this._subdiv.push(sub);
			}
		}
	}

	beat(b, r='off'){
		// set the beat pattern as an array and reset time in bars
		this._beat = Util.toArray(b);
		this._reset = Math.floor(r);
		if (r === 'off' || r < 1){
			this._reset = -1;
		}
	}

	human(h){
		// set the humanizing factor for the instrument in seconds
		this._human = Util.toArray(h).map(x => Util.divToS(x));
	}

	follow(l){
		// set the name of another instrument to listen to for triggering
		// can currently only be one instrument
		this._follow = Array.isArray(l) ? l[0] : l;
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