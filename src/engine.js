const Tone = require('tone');

// load extra AudioWorkletProcessors from file
// transformed to inline with browserify brfs
// const fs = require('fs');
// const fxExtensions = fs.readFileSync('./src/core/effects/noise.js', 'utf-8');
// Tone.getContext().addAudioWorkletModule(URL.createObjectURL(new Blob([ fxExtensions ], { type: 'text/javascript' })));

Tone.getContext().addAudioWorkletModule('https://raw.githubusercontent.com/GoogleChromeLabs/web-audio-samples/main/src/audio-worklet/basic/one-pole-filter/one-pole-processor.js').then(() => console.log('one-pole-processor loaded')).catch((e) => console.log(e));

Tone.getContext().addAudioWorkletModule('https://raw.githubusercontent.com/GoogleChromeLabs/web-audio-samples/main/src/audio-worklet/basic/bit-crusher/bit-crusher-processor.js').then(() => console.log('bit-crusher-processor loaded')).catch((e) => console.log(e));

// latency reduces cpu load
// Tone.context.latencyHint = 'playback';
Tone.context.lookAhead = 0.1;
// Tone.context.updateInterval = 0.5;
// Tone.context.samplerate = 44100;

console.log('=> Engine settings:');
console.log(`latency: ${Tone.getContext().lookAhead * 1000}ms`);
console.log(`updateInterval: ${Tone.getContext().updateInterval * 1000}ms`);
console.log(`latencyHint: ${Tone.getContext().latencyHint}`);
console.log(`samplerate: ${Tone.getContext().sampleRate}Hz`);
console.log(`PPQ: ${Tone.Transport.PPQ}`);

// get the sample file paths from json
let loadingID = setInterval(() => {
	console.log('downloading sounds...');
}, 2500);

let samples = require('./data/samples.json');
let buffers = new Tone.ToneAudioBuffers({
	urls: samples,
	onload: function(){ 
		clearInterval(loadingID);
		console.log('=> sounds loaded');
		// remove the logging function to the innerHTML from here on
		console.log = console.olog;
		// console.log(buffers);
		// init();
		// remove loading screen, because probably this
		// is the last thing that is done
		setTimeout(() => {
			document.getElementById('load').className = 'hideLoad';
		}, 1000);
	}
});

// resume webaudio and transport for livecoding
function resume(){
	try {
		Tone.start();

		if (Tone.Transport.state !== 'started'){
			Tone.Transport.timeSignature = [4, 4];
			// Tone.Transport.swing = 0.5;
			// a bit of latency for safety
			Tone.Transport.start('+0.1');
			// Tone.getDestination().volume.rampTo(0, 0.01);
			// console.log("Resumed Transport");
		}
		// record(true);
	} catch {
		console.error("!! error enabling ToneJS");
	}
}

// stop the transport end therefore playing the sounds
function silence(){
	try {
		// Tone.getDestination().volume.rampTo(-Infinity, 0.01);
		// Tone.Transport.pause();
		// Stop the transport instead of pause to make sure transport starts from 0 again.
		Tone.Transport.stop();
		// Tone.stop();
		// record(false);
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
}

// return the bpm of the global transport
function getBPM(){
	return Tone.Transport.bpm.value;
}

// return the PPQ (pulses per quarter note) of the transport
function getPPQ(){
	return Tone.Transport.PPQ;
}

// generate a random bpm between 75 and 150
function randomBPM(){
	// set initial BPM on pageload to random value
	setBPM(Math.floor(Math.random() * 75) + 75);
}

// get all the contents of the buffers
function getBuffers(){
	return buffers;
}

// add files to the buffer
function addBuffers(uploads){
	// for every file from uploads
	for (let f of uploads){
		// remove extension 
		let n = f.name.replace(/\.\w+/g, '');
		// replace whitespace with _
		n = n.replace(/[-\s]+/g, '_');
		// remove leading/trailing whitespace and to lower case
		n = n.toLowerCase().trim();
		// add to ToneAudioBuffers
		let url = URL.createObjectURL(f);
		buffers.add(n, url, () => {
			log(`${f.name} added as ${n}`);
			URL.revokeObjectURL(url);
			// also add soundfiles to menu for easy selection
			let m = document.getElementById('sounds');
			let o = document.createElement('option');
			o.value = o.innerHTML = n;
			m.appendChild(o);
		}, () => {
			log(`error adding sound ${f.name}`);
		});
	}
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

// create a Tone Recording and connect to the final output Node
const Recorder = new Tone.Recorder({ mimeType: 'audio/webm' });
GN.connect(Recorder);

function isRecording(){
	// returns 'started' if the recording is recording
	return Recorder.state;
}

async function record(on, f){
	if (on){
		// start the recording process
		Recorder.start();
	} else {
		// stop the recording process
		// the recorded audio is returned as a blob
		const recording = await Recorder.stop();
		// download the recording by creating an anchor element and blob url
		const url = URL.createObjectURL(recording);
		const anchor = document.createElement("a");
		anchor.download = `${f}.webm`;
		anchor.href = url;
		anchor.click();
	}
}

module.exports = { resume, silence, setBPM, getBPM, randomBPM, getBuffers, addBuffers, setLowPass, setHiPass, setVolume, record, isRecording };