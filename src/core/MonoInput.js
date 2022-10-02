const Tone = require('tone');
const Instrument = require('./Instrument.js');

class MonoInput extends Instrument {
	constructor(engine, d, canvas){
		super(engine, canvas);

		if (d === 'default'){
			this._device = 0;
		} else if (d.match(/in(\d+)/g)){
			this._device = Number(d.match(/in(\d+)/)[1]);
		} else {
			log(`${d} is not a valid microphone input. set to default`);
			this._device = 0;
		}
		// log(`Opened microphone: ${window.devices[this._device]}`);

		this.mic;
		this.createSource();

		console.log('=> MonoInput()', this);
	}

	createSource(){
		this.mic = new Tone.UserMedia().connect(this.channelStrip());
		this.mic.open(this._device).then(() => {
			log(`Opened microphone: ${window.devices[this._device]}`);
		}).catch((e) => {
			log(`Unable to use microphone`);
		});
		this.mic.channelInterpretation = 'discrete';
		console.log(`Number of inputs: ${this.mic.numberOfOutputs}`);
		console.log(`Number of outputs: ${this.mic.numberOfOutputs}`);
		console.log(`channelInterpretation: ${this.mic.channelInterpretation}`);
		console.log(`channelCount: ${this.mic.channelCount}`);
		console.log(`channelCountMode: ${this.mic.channelCountMode}`);
		this.source = this.mic;
	}

	sourceEvent(c, e, time){
		return;	
	}

	delete(){
		// delete super class
		super.delete();
		// disconnect the sound dispose the player
		this.source.close();
		this.source.dispose();

		console.log('=> disposed MonoInput()', this._sound);
	}
}
module.exports = MonoInput;