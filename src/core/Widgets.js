const Tone = require('tone');

class Scope {
	constructor(){
		this.waveform = new Tone.Waveform(4096);
		this.mono = new Tone.Mono().connect(this.waveform);

		this.cnv = document.createElement('canvas');
		let ui = document.getElementById('ui');
		ui.appendChild(this.cnv);

		this.cnv.width = window.innerWidth * 0.9;
		this.cnv.height = 25;

		// get the 2d context from canvas
		this.ctx = this.cnv.getContext('2d');

		this.widget = window.cm.cm.addLineWidget(window.cm.cm.lineCount() - 1, this.cnv);
		
		this.scopeScale = -Infinity;

		// this.anim = requestAnimationFrame(this.draw);
		let framedraw = () => {
			this.draw();
			requestAnimationFrame(framedraw);
		}
		this.anim = requestAnimationFrame(framedraw);
	}

	// connect the scope to a Tone Audio Node with node.connect(scope.input())
	input(){
		return this.mono;
	}

	draw(){
		// get the waveform array and downsample
		let wave = this.waveform.getValue();
		let downArr = this.downsample(wave, 1);
		// erase the previous drawn line
		this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
		// draw the line from downsamples values
		this.line(downArr);
	}

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

	line(arr){
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = window.getComputedStyle(document.documentElement).getPropertyValue('--accent');

		let halfHeight = this.cnv.height / 2;
		// begin the stroke, for every point draw a line, then end the stroke
		this.ctx.beginPath();
		for (let i = 0; i < arr.length; i++){
			let a = arr[i] * (1 / this.scopeScale) * halfHeight + halfHeight;
			if (i === 0) {
				this.ctx.moveTo(0, a);
			} else {
				this.ctx.lineTo(i * (this.cnv.width / arr.length), a);
			}
		}
		this.ctx.stroke();
	}

	delete(){
		cancelAnimationFrame(this.anim);
		this.widget?.clear();
		this.cnv?.remove();
		this.waveform?.disconnect();
		this.waveform?.dispose();
		this.mono?.disconnect();
		this.mono?.dispose();
	}
}
module.exports = { Scope };