const Tone = require("tone");
const Instrument = require("./Instrument");
const { getParam, toMidi, mtof, setWorkletParam, toArray } = require("./Util");

class MonoFM extends Instrument {
	constructor(engine, t='fm', canvas, line){
		// inherit from Instrument class
		super(engine, canvas, line);

		this._harm = [2];
		this._indx = [2];

		console.log('=> MonoFM()', this);

		this.createSource();
	}

	createSource(){
		// the source connects to the channelstrip
		this.source = new Tone.ToneAudioNode();
		this.source.workletNode = Tone.getContext().createAudioWorkletNode('fm-processor');
		this.source.output = new Tone.Gain();
		this.source.workletNode.connect(this.source.output.input);

		this.source.connect(this.channelStrip());

		// a function to set the parameter in a workletnode
		this.source.setParam = (p, v, t) => {
			setWorkletParam(this.source, p, v, t);
		}

		// method to dispose the workletProcessor
		this.source.stop = () => { 
			this.source.workletNode.port.postMessage('dispose'); 
		}
	}

	sourceEvent(c, e, time){
		const h = getParam(this._harm, c);
		this.source.setParam('harmonicity', h, time);

		const d = getParam(this._indx, c);
		this.source.setParam('index', d, time);

		// get the interval and octave, calculate the note
		// calculate the frequency based on the note
		const i = getParam(this._note[0], c);
		const o = getParam(this._note[1], c);
		const n = toMidi(i, o);
		const f = mtof(n);
		this.source.setParam('frequency', f, time);
	}

	ratio(h=[2]){
		// the harmonicity determines the modulation 
		// frequency, as a list of ratios
		this._harm = toArray(h);
	}
	harmonicity = this.ratio;

	index(i=[2]){
		// the index determines the modulation depth
		this._indx = toArray(i);
	}
	depth = this.index;

	delete(){
		super.delete();
		console.log('disposed MonoFM()');
	}
}
module.exports = MonoFM;