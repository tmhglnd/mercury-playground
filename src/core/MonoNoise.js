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
		// create a noise source from an audioWorkletNode, containing many 
		// types of noises
		this.source = new Tone.ToneAudioNode();
		this.source.workletNode = Tone.getContext().createAudioWorkletNode('noise-processor');
		this.source.input = new Tone.Gain();
		this.source.output = new Tone.Gain(0, 'decibels');
		this.source.volume = this.source.output.gain;
		this.source.input.chain(this.source.workletNode, this.source.output);

		this.source.connect(this.channelStrip());

		// empty method to get rid of stop error
		this.source.stop = () => {};

		// a pink noise source based on a buffer noise 
		// to reduce complex calculation
		this.pink = new Tone.Noise('pink').connect(this.source);
		this.pink.start();
	}

	sourceEvent(c, e, time){
		if (!this.started){
			// this.source.start();
			this.started = true;
		}

		let d = clip(getParam(this._density, c), 0, 1);

		let density = this.source.workletNode.parameters.get('density');
		density.setValueAtTime(d, time);

		return; 
		// set noise type for the generator

		let t = getParam(this._type, c);

		d = 1;
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

		this.source.input.disconnect();
		this.source.input.dispose();
		this.source.output.disconnect();
		this.source.output.dispose();

		this.pink.disconnect();
		this.pink.dispose();
		
		console.log('disposed MonoNoise()', this._wave);
	}
}
module.exports = MonoNoise;