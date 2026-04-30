const Tone = require("tone");
const Instrument = require("./Instrument");
const { getParam, toMidi, mtof, setWorkletParam, toArray, divToS } = require("./Util");

class MonoFM extends Instrument {
	constructor(engine, t='fm', canvas, line){
		// inherit from Instrument class
		super(engine, canvas, line);

		// synth specific parameters
		this._harm = [2];
		this._indx = [2];

		this.createSource();

		console.log('=> MonoFM()', this);
	}

	createSource(){
		// the source connects to the channelstrip
		this.source = new Tone.ToneAudioNode();
		this.source.workletNode = Tone.getContext().createAudioWorkletNode('fm-processor');
		this.source.output = new Tone.Gain();
		// connect to the input of the output gain node
		this.source.workletNode.connect(this.source.output.input);
		// connect to the channelstrip
		this.source.connect(this.channelStrip());
		// functions to set/ramp the parameter in a workletnode
		this.source.setParam = (p, v, t) => {
			setWorkletParam(this.source, p, v, t);
		}
		// method to dispose the workletProcessor
		this.source.stop = () => { 
			this.source.workletNode.port.postMessage('dispose'); 
		}
		// a Signal as envelope for the FM modulator
		this.fmASR = new Tone.Signal(0, 'gain');
		this.fmASR.connect(this.source.workletNode.parameters.get('modAmp'));
	}

	sourceEvent(c, e, time){
		// get the harmonicity and modulation index
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

		// apply an envelope to the modulator
		if (this._fmA){
			const atk = Math.max(divToS(getParam(this._fmA, c), this.bpm()), 0.001);
			const sus = Math.max(divToS(getParam(this._fmS, c), this.bpm()), 0.001);
			const rel = Math.max(divToS(getParam(this._fmR, c), this.bpm()), 0.001);
			// schedule the attack of the envelope
			this.fmASR.linearRampTo(1, atk, time);
			// schedule the release of the envelope after attack and sustain
			this.fmASR.linearRampTo(0, rel, time + atk + sus);
		} else {
			// when the shape is 'off' set to 1
			this.fmASR.setValueAtTime(1, time);
		}
	}

	harmonicity(h=[2]){
		// the harmonicity determines the modulation 
		// frequency, as a list of ratios
		this._harm = toArray(h);
	}
	ratio = this.harmonicity;

	index(i=[2]){
		// the index determines the modulation depth
		this._indx = toArray(i);
	}
	depth = this.index;

	fmShape(...e){
		console.log('fmshape', e);
		// set the attack/sustain/release times for modulator
		this._fmA = this._fmS = this._fmR = [0];

		if (e[0] === 'off' || e[0] < 0){
			this._fmA = null;
		} else {
			switch(e.length){
				case 1: 
					this._fmA = [1]; 
					this._fmR = toArray(e[0]); break;
				case 2:
					this._fmA = toArray(e[0]);
					this._fmR = toArray(e[1]); break;
				default:
					this._fmA = toArray(e[0]);
					this._fmS = toArray(e[1]);
					this._fmR = toArray(e[2]); break;
			}
		}
	}

	delete(){
		super.delete();
		console.log('disposed MonoFM()');
	}
}
module.exports = MonoFM;