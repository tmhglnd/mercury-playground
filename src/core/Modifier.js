const Tone = require('tone');
const { toArray, getParam } = require('./Util.js');
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
		// for every change that is in the object
		Object.keys(this._change).forEach((setting) => {
			// get the value from the array based on the counter
			let value = getParam(this._change[setting], c);
			// apply the value to the setting via globalMap method
			if (this._globalMap[setting]){
				setTimeout(() => {
					this._globalMap[setting]([value]);
				}, (time - Tone.context.currentTime) * 1000 + 5);
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
				this._change[s[0]] = toArray(s[1]);
			}
		});
		console.log(this._change);
	}

	// placeholders
	amp(){}
	env(){}
	
	delete(){
		super.delete();
		console.log('=> disposed Modifier()', this._device);
	}
}
module.exports = Modifier;