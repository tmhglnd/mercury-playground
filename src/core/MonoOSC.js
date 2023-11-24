const Tone = require('tone');
const Sequencer = require('./Sequencer.js');
const Util = require('./Util.js');

class MonoOSC extends Sequencer {
	constructor(engine, addr='default', canvas){
		super(engine, canvas);

		// start address
		if (addr === 'default'){
			this.address = [''];
		} else { 
			this.address = Util.toArray(addr);
		}
		// array for messages
		this.messages = [];

		console.log('=> class OSC', this);
	}

	event(c, time){
		// get the start of the address
		let a = Util.getParam(this.address, c);

		// for every message (function)
		this.messages.forEach((msg) => {
			// create the tag with main address / function
			// or just the fuction if main addres is "" or default
			let tag = `/${msg[0]}`;
			if (a !== ''){
				tag = `/${a}/${msg[0]}`;
			}

			// get all the current values 
			let args = Util.toArray(msg[1]);
			let send = [];
			args.forEach((arg) => {
				send.push(Util.getParam(Util.toArray(arg), c));
			});
			// only send if there is a osc client available
			if (window.ioClient){
				setTimeout(() => {
					window.emit([tag, ...send]);
				}, (time - Tone.context.currentTime) * 1000);
			}
		});
	}

	addMessage(addr, ...msg){
		// add all the messages to the array
		this.messages.push([addr, msg]);
	}

	amp(){}

	env(){}

	out(){}

	pan(){}

	add_fx(){}	
}
module.exports = MonoOSC;