const Tone = require('tone');
const Util = require('./Util.js');
const Sequencer = require('./Sequencer.js');
// const { globalMap } = require('./../worker.js');

class Modifier extends Sequencer {
	constructor(engine, d='default', canvas, globals){
		super(engine, canvas);

		this._globalMap = globals;
		this._change = {};

		console.log('=> class Modifier', this);
	}

	event(c, time){
		Object.keys(this._change).forEach((k) => {
			let setting = k;
			let value = Util.getParam(this._change[k], c);

			if (this._globalMap[setting]){
				setTimeout(() => {
					this._globalMap[setting]([value]);
				}, (time - Tone.context.currentTime) * 1000 + 5);
				// }, (time * 1000);
				// Tone.Transport.scheduleOnce(() => {
				// 	this._globalMap[setting]([value]);
				// }, time);
			}
		});
	}

	// named add_fx due to alias remapping from change/cc/fx
	add_fx(...settings){
		// adjust settings via change() method from modifier
		this._change = {};
		settings.forEach((s) => {
			if (!isNaN(s[0])){
				log(`${s[0]} is not a name or string`)
			} else {
				this._change[s[0]] = s[1];
			}
		});
		console.log(this._change);
	}

	amp(){}
	env(){}
	
	delete(){
		// delete super class
		super.delete();

		console.log('=> disposed Modifier()', this._device);
	}
}
module.exports = Modifier;