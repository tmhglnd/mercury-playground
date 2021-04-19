// all the available effects
const fxMap = {
	'drive' : (params) => {
		// console.log('drive', params);
		let d = (params[0])? params[0] : 1;
		return new Tone.Distortion(d);
	},
	'reverb' : (param) => {
		// console.log('reverb', param);

		// let amp = new Tone.Gain(0).toDestination();
		let verb = new Tone.Reverb();
		// amp.gain.rampTo( (param[0] !== undefined)? param[0] : 0.5, 0.01 );
		verb.decay = (param[0])? param[0] : 5;

		return verb;
	}, 
	'delay' : (param) => {
		// console.log('delay', param);
		let t = (param[0] !== undefined)? param[0] : '3/16';
		let fb = (param[1] !== undefined)? param[1] : 0.3;
		let del = new Tone.PingPongDelay(formatRatio(t), fb);

		return del;
	}
}
module.exports = fxMap;