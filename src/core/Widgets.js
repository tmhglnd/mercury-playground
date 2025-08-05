const Tone = require('tone');

// The main widget class has some starting points,
// like a mono input connection for sound analysis later
// a canvas that will be added as a line widget
// a drawing loop, and some drawing functions like line
class Widget {
	constructor(line){
		// console.log('=> class Widget()', line);
		// to connect the source to and make it to mono for analysis
		this.mono = new Tone.Mono();
		// the canvas to display the visual in, adjust width and height
		this.cnv = document.createElement('canvas');
		this.cnv.width = window.innerWidth * 0.9;
		this.cnv.height = 30;

		// get the 2d context from canvas
		this.ctx = this.cnv.getContext('2d');
		// create a new widget between the editor lines
		this.widget = window.cm.cm.addLineWidget(line-1, this.cnv);
		// this.widget = window.cm.cm.addLineWidget(line, this.cnv);		
		// the auto scaling for the scope
		this.scopeScale = -Infinity;
	}

	// connect the scope to a Tone Audio Node with node.connect(scope.input())
	input(){
		return this.mono;
	}

	// start the rendering of the animation based on AnimationFrame
	start(){
		let framedraw = () => {
			this.draw();
			this.anim = requestAnimationFrame(framedraw);
		}
		// store in variable for canceling later
		this.anim = requestAnimationFrame(framedraw);
	}

	// to be replaced by the draw() of inheriting class
	draw(){
		// erase the previous drawn line
		this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);

		this.ctx.lineCap = "round";
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = window.getComputedStyle(document.documentElement).getPropertyValue('--accent');
	}

	// draw a line with a scaling factor based on an array of y values
	line(arr, scale=1){
		let halfHeight = this.cnv.height / 2;
		// begin the stroke, for every point draw a line, then end the stroke
		this.ctx.beginPath();
		for (let i = 0; i < arr.length; i++){
			let a = arr[i] * scale * (1 / this.scopeScale) * halfHeight + halfHeight;
			if (i === 0) {
				this.ctx.moveTo(0, a);
			} else {
				this.ctx.lineTo(i * (this.cnv.width / arr.length), a);
			}
		}
		this.ctx.stroke();
	}

	// remove all traces
	delete(){
		cancelAnimationFrame(this.anim);
		this.widget.clear();
		this.cnv.remove();
		this.mono.disconnect();
		this.mono.dispose();
	}
}

// A scope widget, displays the audio signal with a fast
// zoomed in scope. Has more erratic behaviour than waveform
class Scope extends Widget {
	constructor(...args){
		// console.log('=> class Scope()');
		super(...args);

		// create the waveform analysis from Tone
		this.waveform = new Tone.Waveform(4096);
		this.mono.connect(this.waveform);

		// start the animation
		this.start();
	}

	draw(){
		super.draw();
		// get the waveform array and downsample
		let wave = this.waveform.getValue();
		let downArr = this.downsample(wave, 1);
		// draw the line from downsamples values
		this.line(downArr);
	}

	// the downsample lets you take a array of values and reduce the 
	// amount of values, while averaging them
	downsample(arr, down=1){
		let sum = 0, out = [];
		for (let i = 0; i < arr.length; i++){
			this.scopeScale = Math.max(this.scopeScale, Math.abs(arr[i]));
			sum += arr[i];

			if (i % down === down - 1){
				out.push(sum / down);
				sum = 0;
			}
		}
		return out;
	}

	delete(){
		super.delete();

		this.waveform.disconnect();
		this.waveform.dispose();
	}
}

// The waveform class is a slower analysis that shows the RMS Amplitude
// of the signal measured of a short period of time
// This visualisation looks more like a waveform display in a DAW
class WaveForm extends Widget {
	constructor(...args){
		// console.log('=> class WaveForm()');
		super(...args);
		
		// create the meter and use 0-1 range for values instead of dB
		this.meter = new Tone.Meter();
		this.meter.normalRange = true;
		this.meter.smoothing = 0;

		this.mono.connect(this.meter);

		// an array to keep a history of amplitude values, initially 0'ed
		this._historySize = 128;
		this._history = new Array(this._historySize).fill(0);

		// start the animation
		this.start();
	}

	draw(){
		super.draw();
		// get the waveform amplitude value from meter
		let mtr = this.meter.getValue();
		// push to history array and slice the history
		this._history.push(mtr);
		this._history = this._history.slice(this._history.length - this._historySize, this._history.length);
		// check if this is a higher amplitude for auto-scaling
		this.scopeScale = Math.max(mtr, this.scopeScale);

		// draw the line from downsamples values
		this.line(this._history);
		// draw the same line, but inversed, to get a waveform outline
		this.line(this._history, -1);
	}

	delete(){
		super.delete();

		this.meter.disconnect();
		this.meter.dispose();
	}
}

class Spectrum extends Widget {
	constructor(){
		super();
		this.fft = new Tone.FFT(1024);
		this.fft.normalRange = true;
		this.fft.smoothing = 0;

		this.mono.connect(this.fft);
		// this.scopeScale = ;
		this.start();
	}

	draw(){
		// get the waveform array and downsample
		let spectrum = this.fft.getValue();
		// console.log('spectrum', Math.max(...spectrum));
		this.scopeScale = Math.max(this.scopeScale, Math.max(...spectrum));
		// draw the line from downsamples values
		this.line(spectrum);
	}

	delete(){
		super.delete();
		this.fft.disconnect();
		this.fft.dispose();
	}
}

module.exports = { Scope, WaveForm, Spectrum };