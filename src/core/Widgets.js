const Tone = require('tone');
const { atodb } = require('./Util.js');

// The main widget class has some starting points,
// like a mono input connection for sound analysis later
// a canvas that will be added as a line widget
// a drawing loop, and some drawing functions like line
class Widget {
	constructor(line, height=10, color){
		// console.log('=> class Widget()', line);
		// to connect the source to and make it to mono for analysis
		this.mono = new Tone.Mono();
		// the canvas to display the visual in, adjust width and height
		this.cnv = document.createElement('canvas');
		this.cnv.width = window.innerWidth * 0.9;
		this.cnv.height = height;
		// the color for the widget, or undefined
		this.color = color;
		// get the 2d context from canvas
		this.ctx = this.cnv.getContext('2d');
		// create a new widget between the editor lines
		this.widget = window.cm.cm.addLineWidget(line - 1, this.cnv);		
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
		this.ctx.strokeStyle = this.color ? this.color : window.getComputedStyle(document.documentElement).getPropertyValue('--accent');
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
			let amp = Math.abs(arr[i])
			this.scopeScale = Math.max(this.scopeScale, amp > 0.001 ? amp : 0);
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

class Meter extends Widget {
	constructor(...args){
		super(...args);
		// create a RAW meter and use 0-1 range for values instead of dB
		this.meter = new Tone.Analyser("waveform", 256);
		// sum stereo channels to mono and connect to meter
		this.mono.connect(this.meter);
		// the peak value measured for history/smoothing
		this.fast = 0;
		this.slow = 0;
		// smoothing param
		this.fastSmooth = 0.95;
		this.slowSmooth = 0.999;
		// dB scale parameters in visualisation
		this.dbs = [-48, -24, -12, -6, 0];
		this.scaling = 5;
		// the meter gradient
		this.grad = this.ctx.createLinearGradient(0, 0, Math.abs(this.dbs[0]) * this.scaling, 0);
		this.grad.addColorStop(0.00, 'rgb(9, 248, 100)');
		this.grad.addColorStop(0.58, 'rgb(195, 249, 100)');
		this.grad.addColorStop(0.83, 'rgb(255, 193, 9)');
		this.grad.addColorStop(1.00, 'rgb(255, 8, 11)');
		// start the animation
		this.start();
		// console.log('class => Meter');
	}

	draw(){
		// erase the previous drawn things
		this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
		// get the waveform amplitude value from meter
		// get the raw amplitude value
		let raw = Math.max(...this.meter.getValue().map(x => Math.abs(x)));
		// if raw is greater than peak, set new peak
		this.fast = raw > this.fast ? raw : this.fast;
		this.slow = raw > this.slow ? raw : this.slow;
		// convert raw amplitude to dB value
		let mtr = atodb(this.fast);
		let hold = atodb(this.slow);
		let absdB = Math.abs(this.dbs[0]);
		// slowly ramp back to 0 with smoothing
		this.fast *= this.fastSmooth;
		this.slow *= this.slowSmooth;

		// draw the lines and dB levels
		// this.ctx.lineCap = "round";
		this.ctx.font = `8px Verdana`;
		this.ctx.textBaseline = 'top';
		this.ctx.lineWidth = 1;
		this.ctx.strokeStyle = this.color ? this.color : this.ctx.fillStyle = window.getComputedStyle(document.documentElement).getPropertyValue('--accent');

		this.ctx.beginPath();
		for (let i = 0; i < this.dbs.length; i++){
			let x = (absdB + this.dbs[i]) * this.scaling;
			this.ctx.moveTo(x, 0);
			this.ctx.lineTo(x, this.cnv.height);
			this.ctx.stroke();
			this.ctx.fillText(`${this.dbs[i]}`, x + 2, 0);
		}

		// create a gradient for the level meter if now color
		this.ctx.beginPath();
		if (this.color === undefined){			
			this.ctx.fillStyle = this.grad;
		} else {
			this.ctx.fillStyle = this.color;
		}
		
		let dBwidth = (absdB + mtr) * this.scaling; 
		this.ctx.fillRect(0, 9, dBwidth, this.cnv.height);

		// create a thick line for the slow dB meter
		let dBhold = (absdB + hold) * this.scaling;
		this.ctx.lineWidth = 3;
		this.ctx.beginPath();
		this.ctx.moveTo(dBhold, 9)
		this.ctx.lineTo(dBhold, this.cnv.height);
		this.ctx.stroke();

		// this.ctx.font = `6px Verdana`;
		// this.ctx.textBaseline = "top";
		// this.ctx.fillStyle = window.getComputedStyle(document.documentElement).getPropertyValue('--accent');
		// this.ctx.fillText(`${(Math.round(mtr * 100) / 100).toFixed(2)}dB`, absdB * this.scaling + 10, 10);
	}

	delete(){
		super.delete();
		this.meter.disconnect();
		this.meter.dispose();
	}
}

class Spectrum extends Widget {
	constructor(...args){
		super(...args);
		this.fft = new Tone.FFT(1024);
		this.fft.smoothing = 0.7;

		this.mono.connect(this.fft);
		this.start();
	}

	draw(){
		super.draw();
		// get the waveform array and downsample
		let spectrum = this.fft.getValue();

		// get the min and max values of the spectrum for scaling
		const min = Math.min(0.0001, ...spectrum);
		const max = Math.max(-0.0001, ...spectrum);
		this.scopeScale = 1;
		// scale the spectrum accordingly
		spectrum = spectrum.map(x => {
			return (((x - min) / (max - min)) ** 0.5) * -2 + 1;
		});
		// draw the line from downsamples values
		this.line(spectrum);
	}

	delete(){
		super.delete();
		this.fft.disconnect();
		this.fft.dispose();
	}
}

module.exports = { Scope, WaveForm, Spectrum, Meter };