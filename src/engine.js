const Tone = require('tone');

// get the sample file paths from json
console.log('loading sounds...');
let samples = require('./data/samples.json');
let buffers = new Tone.ToneAudioBuffers({
	urls: samples,
	onload: function(){ 
		console.log('=> sounds loaded');
		// init();
		// remove loading screen, because probably this
		// is the last thing that is done
		setTimeout(() => {
			document.getElementById('load').className = 'hideLoad';
		}, 2500);
	}
});

// resume webaudio and transport for livecoding
function resume(){
	try {
		Tone.start();

		if (Tone.Transport.state !== 'started'){
			Tone.Transport.start();
			
			Tone.Transport.timeSignature = [4, 4];
			// Tone.Transport.swing = 0.5;

			Tone.getDestination().volume.rampTo(0, 0.01);
			console.log("Resumed Transport");
		}
	} catch {
		console.error("!! error enabling ToneJS");
	}
}

// stop the transport end therefore playing the sounds
function silence(){
	try {
		Tone.Transport.pause();
		Tone.getDestination().volume.rampTo(-Infinity, 0.5);
		// Tone.stop();
	} catch {
		console.error('error stopping sound');
	}
}

// set the bpm for the sequencer
// second argument determines ramptime
// 
function setBPM(bpm, ramp=0){
	if (ramp === 0){
		Tone.Transport.bpm.setValueAtTime(bpm, Tone.now());
	} else {
		Tone.Transport.bpm.rampTo(bpm, ramp / 1000);
	}
	document.getElementById('bpm').innerHTML = `tempo = ${bpm}`;
	console.log(`set bpm to ${bpm}`);
}

// return the bom of the global transport
function getBPM(){
	return Tone.Transport.bpm.value;
}

function getBuffers(){
	return buffers;
}

// master effects chain for Tone
const GN = new Tone.Gain(1);
const LP = new Tone.Filter(18000, 'lowpass');
const HP = new Tone.Filter(5, 'highpass');
Tone.Destination.chain(LP, HP, GN);

// set the lowpass frequency cutoff and ramptime
function setLowPass(f, t=0){
	if (t>0){
		LP.frequency.rampTo(f, t/1000, Tone.now());
	} else {
		LP.frequency.setValueAtTime(f, Tone.now());
	}
}

// set the highpass frequency cutoff and ramptime
function setHiPass(f, t=0){
	if (t>0){
		HP.frequency.rampTo(f, t/1000, Tone.now());
	} else {
		HP.frequency.setValueAtTime(f, Tone.now());
	}
}

// set the main volume
function setVolume(g, t=0){
	if (t>0){
		GN.gain.rampTo(g, t/1000, Tone.now());
	} else {
		GN.gain.setValueAtTime(g, Tone.now());
	}
}

module.exports = { resume, silence, setBPM, getBPM, getBuffers, setLowPass, setHiPass, setVolume };

// set initial BPM on pageload to random value
setBPM(Math.floor(Math.random() * 40) + 80);