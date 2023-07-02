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
			log(`${d} is not a valid microphone input. defaults to in0`);
			this._device = 0;
		}

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
		this.source.disconnect();
		this.source.dispose();

		console.log('=> disposed MonoInput()', this._sound);
	}
}
module.exports = MonoInput;