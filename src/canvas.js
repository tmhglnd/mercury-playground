
// a p5 Canvas
const p5Canvas = (p5, id) => {
	// video variables
	let capture;

	let constraints = {
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
	let cam = 'VIDEO'; //enable while debugging

	p5.setup = (id) => {
		console.log('=> P5.js initialized');
		let cnv = p5.createCanvas(p5.windowWidth, p5.windowHeight);
		cnv.parent(id);

		capture = p5.createCapture(cam);
		capture.hide();
	}

	p5.windowResized = () => {
		p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
		
		capture = p5.createCapture(cam);
		capture.hide();
	}

	p5.draw = () => {
		// p5.background(20, 70, 90);
		p5.background(0);
		p5.translate(p5.width/2, p5.height/2);

		let w;
		let h;

		let aspect = p5.width / p5.height;

		if (aspect < capture.width / capture.height){
			w = p5.height * capture.width / capture.height;
			h = p5.height;
		} else {
			w = p5.width;
			h = p5.width * capture.height / capture.width;
		}
		p5.image(capture, -w/2, -h/2, w, h);
	}
}

const HydraSynth = require('hydra-synth');
const loop = require('raf-loop');

let hydraCanvas = function(c, u) {
	this.canvas = document.getElementById(c);
	this.canvas.width = window.innerWidth;
	this.canvas.height = window.innerHeight; 
	this.canvas.style.width = '100%';
	this.canvas.style.height = '100%';
	// this.canvas.style.imageRendering = 'pixelated';

	this.div = document.getElementById(u);

	this.hydra = new HydraSynth({ 
		canvas: this.canvas, 
		autoLoop : false,
		precision: 'mediump',
		detectAudio: false,
		// makeGlobal: false 
	});
	// this.hydra.setResolution(this.canvas.width, this.canvas.height);

	this.clear = function(){
		solid().out();
		solid().out(o1);
		solid().out(o2);
		solid().out(o3);
		render(o0);
		this.hydra.tick(60);
		this.engine.stop();
	}

	this.eval = function(url){
		let b64 = /\?code=(.+)/.exec(url);

		try {
			let decode = decodeURIComponent(atob(b64[1]));
			eval(decode);
			this.engine.start();
		} catch (err) {
			console.log('Not a valid Hydra url-code');
			this.clear();
			let text = document.getElementById('hydra-code');
			text.value = '<not a valid hydra url>'
		}
	}

	this.link = function(id){
		let div = document.getElementById(id);
		let p = document.createElement('p');

		let text = document.createElement('textarea');
		text.id = 'hydra-code';
		text.value = '<paste hydra url here>'
		text.onchange = () => { this.eval(text.value) };

		// let btn = document.createElement('button');
		// btn.innerHTML = 'run Hydra';
		// p.appendChild(btn);

		p.appendChild(text);
		div.appendChild(p);	
	}

	this.engine = loop((dt) => {
		this.hydra.tick(dt)
	}).start()
}
module.exports = { p5Canvas, hydraCanvas };