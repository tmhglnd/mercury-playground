
// const p5 = require('p5');
const Canvas = (p5) => {
	// video variables
	this.capture;
	this.aspect;

	this.constraints = {
		audio: false,
		video: {
			facingMode: {
				exact: 'user'
				// exact: 'environment'
			},
			// mandatory: {
				// 	minWidth: 1280,
				// 	minHeight: 720
				// },
			// optional: [{ 
			// 	maxFrameRate: 60,
			// }]
		}
	};
	// this.cam = this.constraints;
	this.cam = 'VIDEO'; //enable while debugging

	p5.setup = () => {
		console.log('=> P5.js initialized');
		p5.createCanvas(p5.windowWidth, p5.windowHeight);
		
		this.capture = p5.createCapture(this.cam);
		this.capture.hide();
	}

	p5.windowResized = () => {
		p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
		
		this.capture = p5.createCapture(this.cam);
		this.capture.hide();
	}

	p5.draw = () => {
		p5.background(0);
		p5.translate(this.width/2, this.height/2);

		let w;
		let h;

		this.aspect = this.width / this.height;

		if (this.aspect < this.capture.width / this.capture.height){
			w = this.height * this.capture.width / this.capture.height;
			h = this.height;
		} else {
			w = this.width;
			h = this.width * this.capture.height / this.capture.width;
		}
		p5.image(this.capture, -w/2, -h/2, w, h);
	}
}
module.exports = Canvas;