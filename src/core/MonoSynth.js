import * as Tone from 'tone';

// simple mono synth with sequencing and envelope
class MonoSynth {
	constructor(n=['c3'], t=['1n', 0], b=[1]){
		this._count = 0;
		this._beat = [1];
		this._note = n;
		this._time = t[0];
		this._offset = t[1];
		this._gain = -6;
		
		this.attack = 0.1;
		this.decay = 0;
		this.release = 0.5;

		this.synth;
		this.seq;
		this._fx;

		this.makeSynth();
		this.makeLoop();
	}

	makeSynth(){
		this.synth = new Tone.Synth({
			oscillator: {
				type: 'sine'
			},
			envelope: {
				attack: msToS(2),
				decay: msToS(1),
				sustain: 1,
				release: msTos(500),
			}
		}).toDestination();
		if (this._fx){
			this.synth.connect(this._fx);
			// for (let f in fx){
			// 	this.synth.connect(this.fx[f]);
			// }
		}
	}

	makeLoop(){
		// dispose of previous loop if active
		if (this._loop){
			this._loop.dispose();
		}
		// create new loop for synth
		this._loop = new Tone.Loop((time) => {
			// get the count value
			let c = this._count;
			// get beat probability
			let b = this._beat[c % this._beat.length];
			// get timing

			// if random value is below probability, then play
			if (Math.random() < b){
				let n = this._note[c % this._note.length];
				// if note is array, pick randomly
				if (Array.isArray(n)){
					n = n[Math.floor(Math.random() * n.length)];
				}
				// ramp volume
				this.synth.volume.rampTo(this._gain, 0.1);
				// trigger envelope
				// this.synth.triggerAttackRelease(n, this.attack, time);
				this.synth.triggerAttack(n, time);
				this.synth.triggerRelease(`+${this.decay}`);
			}
			// increment count for sequencing
			this._count++;
		}, this._time).start(this._offset);
	}

	delete(){
		// dispose loop
		this._loop.dispose();
	}

	stop(){
		// stop sequencer
		this._loop.stop();
	}

	start(){
		// restart at offset
		this._loop.start(this._offset);
	}

	gain(g){
		// convert amplitude to dBFullScale
		this._gain = 20 * Math.log(g);
		this.makeLoop();
	}

	note(n){
		this._note = toArray(n);
		this.makeLoop();
	}

	time(t, o=0){
		if (String(t).match(/\d+\/\d*/)){
			// console.log(t);
			eval(t);
		}
		this._time = t;
		this.makeLoop();
	}

	beat(b){
		this._beat = toArray(b);
	}

	shape(a=2, r){
		if (r === undefined){
			r = a;
			a = 2;
		}
	}

	effect(f){
		console.log('no function fx()');
		// if (f === 'reverb'){
		// 	this._fx = new Tone.Freeverb().toDestination();
		// }
		this.makeSynth();
	}
}
module.exports = MonoSynth;