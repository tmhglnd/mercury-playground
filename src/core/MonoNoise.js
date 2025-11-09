const Tone = require('tone');
// const fxMap = require('./Effects.js');
// const TL = require('total-serialism').Translate;
const Instrument = require('./Instrument.js');
const { toArray, getParam, clip } = require('./Util.js');

class MonoNoise extends Instrument {
	constructor(engine, t='white', canvas, line){
		// Inherit from Instrument
		super(engine, canvas, line);

		// synth specific variables;
		this._type = toArray(t);
		this._typeMap = {
			white : 'white',
			pink : 'pink',
			lofi : 'white'
		}
		this._density = [ 0.125 ];

		// this.synth;
		this.started = false;
		this.createSource();

		console.log('=> MonoNoise()', this);
	}

	createSource(){
		// the source connects the Synth + Noise to the channelstrip
		this.source = new Tone.Noise('white').connect(this.channelStrip());

		// this.source.start();
		// this.source = this.synth;
	}

	sourceEvent(c, e, time){
		// set noise type for the generator
		let t = getParam(this._type, c);

		let d = 1;
		if (t !== 'white' && t !== 'pink'){
			d = clip(getParam(this._density, c), 0, 1);
		}

		if (this._typeMap[t]){
			t = this._typeMap[t];
		} else {
			log(`${t} is not a valid noise type`);
			// default wave if wave does not exist
			t = 'white';
		}

		setTimeout(() => {
			if (!this.started){
				this.source.start(Tone.now());
				this.started = true;
			}
			this.source.type = t;
			this.source.playbackRate = d * d;
		}, (time - Tone.context.currentTime) * 1000);
	}

	density(d){
		this._density = toArray(d);
	}

	delete(){
		// delete super class
		super.delete();
		
		console.log('disposed MonoNoise()', this._wave);
	}
}
module.exports = MonoNoise;