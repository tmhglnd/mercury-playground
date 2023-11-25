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

		// send note as midi
		let o = Util.getParam(this._note[1], c);
		let i = Util.getParam(this._note[0], c);
		let t = (a !== '')? `/${a}/note` : `/note`;
		this.sendMessage(t, Util.toMidi(i, o), time);

		// for every message (function)
		this.messages.forEach((msg) => {
			// create the tag with main address / function
			// or just the fuction if main addres is "" or default
			let tag = (a !== '')? `/${a}/${msg[0]}` : `/${msg[0]}`;
			// get all the current values 
			let args = Util.toArray(msg[1]);
			let send = [];
			args.forEach((arg) => {
				send.push(Util.getParam(Util.toArray(arg), c));
			});
			this.sendMessage(tag, ...send, time);
		});
	}
	
	sendMessage(addr, msg, time){
		// only send if there is a osc client available
		if (window.ioClient){
			setTimeout(() => {
				window.emit([addr, msg]);
			}, (time - Tone.context.currentTime) * 1000);
		}
	}

	addMessage(addr, ...msg){
		// add all the messages to the array
		this.messages.push([addr, msg]);
	}

	amp(a){
		this.messages.push(['gain', Util.toArray(a)]);
	}

	add_fx(){}	
}
module.exports = MonoOSC;