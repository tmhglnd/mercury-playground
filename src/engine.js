const Tone = require('tone');

let samples = {};
let buffers;

// get the sample file paths from server
fetch("/samples")
	.then(function(response) {
		console.log('loading sounds...');
		return response.json();
	})
	.then(function(data) {
		samples = data;

		buffers = new Tone.ToneAudioBuffers({
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
	})
	.catch(function(error) {
		console.log('error:' + error);
	});

// resume webaudio and transport for livecoding
function resume(){
	try {
		Tone.start();

		if (Tone.Transport.state !== 'started'){
			Tone.Transport.start();
			
			Tone.Transport.timeSignature = [4, 4];
			// Tone.Transport.swing = 0.5;

			Tone.getDestination().volume.rampTo(0, 0.1);
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
		Tone.getDestination().volume.rampTo(-Infinity, 1);
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
		Tone.Transport.bpm.value = bpm;
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

module.exports = { resume, silence, setBPM, getBPM, getBuffers };

// set initial BPM on pageload to random value
setBPM(Math.floor(Math.random() * 40) + 80);