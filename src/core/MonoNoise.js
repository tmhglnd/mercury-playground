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
			'white' : 0,
			'pink' : 1,
			'brownian' : 2,
			'brown' : 2,
			'red' : 2,
			'lofi' : 3,
			'dust' : 4,
			'crackle' : 5
		}
		this._density = [ 0.25 ];
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
	}

	sourceEvent(c, e, time){
		// set noise type for the generator
		let t = getParam(this._type, c);
		if (Object.hasOwn(this._typeMap, t)){
			t = this._typeMap[t];
		} else {
			log(`${t} is not a valid noise type`);
			// default wave if wave does not exist
			t = 0;
		}
		let type = this.source.workletNode.parameters.get('type');
		type.setValueAtTime(t, time);

		// set the density amount (only valid for brownian, lofi, dust, crackle)
		let d = clip(getParam(this._density, c), 0.01, 1);
		let density = this.source.workletNode.parameters.get('density');
		density.setValueAtTime(d, time);

		// start the pink noise source also
		if (!this.started){
			this.pink.start(time);
			this.started = true;
		}
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
		
		console.log('disposed MonoNoise()');
	}
}
module.exports = MonoNoise;