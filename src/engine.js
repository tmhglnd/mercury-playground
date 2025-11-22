const Tone = require('tone');
const { divToS } = require('./core/Util.js');

// load extra AudioWorkletProcessors from file
// transformed to inline with browserify brfs
const fs = require('fs');
const fxExtensions = fs.readFileSync('./src/core/effects/Processors.js', 'utf-8');
Tone.getContext().addAudioWorkletModule(URL.createObjectURL(new Blob([ fxExtensions ], { type: 'text/javascript' })));

// latency reduces cpu load
// Tone.context.latencyHint = 'playback';
Tone.context.lookAhead = 0.1;
// Tone.context.updateInterval = 0.5;
Tone.context.samplerate = 44100;

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
		console.log('=> sounds loaded', buffers);
		// remove the logging function to the innerHTML from here on
		console.log = console.olog;
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
	t = divToS(ramp, getBPM());
	if (t > 0){
		Tone.Transport.bpm.rampTo(bpm, t);
	} else {
		Tone.Transport.bpm.setValueAtTime(bpm, Tone.now());
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

// add files to the buffer from a single File Link
// an array or file paths, or a json of { name:file, ... }
function addBuffers(uploads){
	// for every file from uploads
	uploads.forEach((f) => {
		let n = f;
		let url = f;
		if (f.name){
			// get the filename from File object
			n = f.name;
			url = URL.createObjectURL(f);
		}
		if (Array.isArray(f)){
			// if array use first value as the name
			n = f[0];
			url = f[1];
		}
		if (n.endsWith('.json')){
			// read from json if loaded is a json file
			addBufferFromJson(url);
		} else {
			// otherwise read the soundfile regularly
			addBufferFromURL(url, n);
		}
	});
}

// add a single file to the buffer from URL
// use the name as reference in the buffer
// if name is undefined it will be constructed from the URL
// 
function addBufferFromURL(url, n){
	// get file name from url string
	n = n.split('\\').pop().split('/').pop();
	// remove extension 
	n = n.replace(/\.\w+/g, '');
	// replace whitespaces with _
	n = n.replace(/[\s]+/g, '_');
	// remove leading/trailing whitespace
	n = n.trim().replace(/[\s]+/g, '_');

	// add to ToneAudioBuffers
	buffers.add(n, url, () => {
		log(`sound added as: ${n}`);
		URL.revokeObjectURL(url);

		// also add soundfiles to menu for easy selection
		let m = document.getElementById('sounds');
		let o = document.createElement('option');
		o.value = o.innerHTML = n;
		m.appendChild(o);
	}, (e) => {
		log(`error adding sound from: ${n}`);
	});
}

async function addBufferFromJson(url){
	// get the json file via fetch
	let response = await fetch(url);
	let files = await response.json();
	// if there is a _base use that as the start of the url
	let base = files['_base'];
	delete files['_base'];

	Object.keys(files).forEach((f) => {
		if (Array.isArray(files[f])){
			let idx = 0;
			files[f].forEach((i) => {
				// when array is used increment the filename with _x
				let u = (base)? base + i : i;
				let n = (idx > 0)? f + '_' + idx : f;
				addBufferFromURL(u, n);
				idx++;
			});
		} else {
			if (base){
				files[f] = base + files[f];
			}
			addBufferFromURL(files[f], f);
		}
	});
}

// master effects chain for Tone
const GN = new Tone.Gain(1);
const LP = new Tone.Filter(18000, 'lowpass');
const HP = new Tone.Filter(5, 'highpass');
Tone.Destination.chain(LP, HP, GN);

// set the lowpass frequency cutoff and ramptime
function setLowPass(f, t=0){
	f = (f === 'default')? 18000 : f;
	t = divToS(t, getBPM());
	if (t > 0){
		LP.frequency.rampTo(f, t, Tone.now());
	} else {
		LP.frequency.setValueAtTime(f, Tone.now());
	}
}

// set the highpass frequency cutoff and ramptime
function setHiPass(f, t=0){
	f = (f === 'default')? 5 : f;
	t = divToS(t, getBPM());
	if (t > 0){
		HP.frequency.rampTo(f, t, Tone.now());
	} else {
		HP.frequency.setValueAtTime(f, Tone.now());
	}
}

// set the main volume
function setVolume(g, t=0){
	g = (g === 'default')? 1 : g;
	t = divToS(t, getBPM());
	if (t > 0){
		GN.gain.rampTo(g, t, Tone.now());
	} else {
		GN.gain.setValueAtTime(g, Tone.now());
	}
}

// a meter to see the volume of the sound
const MTR = new Tone.Meter(0.7);
MTR.normalRange = true;
GN.connect(MTR);

setInterval(() => { console.log(`volume: ${Math.round(MTR.getValue(), 0.01)}`) }, 25);

// create a Tone Recording and connect to the final output Node
// console.log('creating recording', window.isSafari);
const Recorder = window.isSafari ? null : new Tone.Recorder({ mimeType: 'audio/webm' });
if (Recorder){
	GN.connect(Recorder);
}

function isRecording(){
	// returns 'started' if the recording is recording
	return Recorder.state;
}

async function record(on, f){
	if (window.isSafari){
		log('Recording not supported by Safari Browser');
		return;
	}
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