// Hydra Canvas
const p5 = require('p5');
const HydraSynth = require('hydra-synth');
const loop = require('raf-loop');

let hydraCanvas = function(c, u) {
	this.canvas = document.getElementById(c);
	this.canvas.width = window.innerWidth;
	this.canvas.height = window.innerHeight; 
	this.canvas.style.width = '100%';
	this.canvas.style.height = '100%';
	this.canvas.style.display = 'none';
	this.canvas.style.imageRendering = 'pixelated';

	this.timeout = false;
	this.timer = 40;

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

		// not displaying the canvas when no visuals are rendered
		let text = document.getElementById('hydra-code');
		text.value = '<paste hydra code for background visuals>'
		this.canvas.style.display = 'none';
	}

	this.eval = function(code){
		if (this.timeout){
			// the timeout makes sure not too many visuals are evaluated
			// in a short amount of time
			return;
		}

		if (code === ''){
			this.clear();
		}
		// removed eval from base64 code
		// try {
		// 	let b64 = /\?code=(.+)/.exec(code);
		// 	let decode = decodeURIComponent(atob(b64[1]));
		// 	eval(decode);
		// 	this.engine.start();
		// 	this.canvas.style.display = 'inline';
		// } catch (err) {
		try {
			eval(code);
			this.engine.start();
			this.canvas.style.display = 'inline';

			// start the timeout, wait this.timer ms
			this.timeout = true;
			setInterval(() => this.timeout = false, this.timer);
		} catch (err) {
			console.log('Not a valid Hydra url-code');
			console.log(err);
			this.clear();
		}
	}

	this.link = function(id){
		let div = document.getElementById(id);
		let p = document.createElement('p');

		let text = document.createElement('textarea');
		text.width = '25%';
		text.id = 'hydra-code';
		text.value = '<paste hydra code for background visuals>'
		text.onchange = () => { 
			this.eval(text.value);
			this.style.height = 0;
			this.style.height = (this.scrollHeight) + "px";
		};

		let btn = document.createElement('button');
		btn.innerHTML = 'code with Hydra';
		btn.onclick = () => { window.open('https://hydra.ojack.xyz/', '_blank'); }
		
		let btn2 = document.createElement('button');
		btn2.innerHTML = 'collaborate in Flok';
		btn2.onclick = () => { window.open('https://next.flok.cc', '_blank'); }

		div.appendChild(text);
		div.appendChild(btn);
		div.appendChild(btn2);
		// div.appendChild(p);	
	}

	this.engine = loop((dt) => {
		this.hydra.tick(dt)
	}).start()
}

// p5 Canvas
const p5Canvas = function(c) {
	this.div = document.getElementById(c);
	this.div.style.display = 'none';

	this.display = function(d) {
		this.div.style.display = 'inline';
		// this.sketch.loop();
	}

	this.hide = function() {
		this.div.style.display = 'none';
		// this.sketch.noLoop();
	}

	this.sketch = new p5((p) => {
		p.WRAP = true;
		p.values = [];

		p.setup = (id) => {
			console.log('=> P5.js initialized');
			let cnv = p.createCanvas(p.windowWidth, p.windowHeight);
			cnv.parent(id);
			p.noLoop();
		}
	
		p.windowResized = () => {
			p.resizeCanvas(p.windowWidth, p.windowHeight);
			p.fillCanvas(p.values);
		}

		p.fillCanvas = (a) => {
			p.values = a;

			let l = a.length;
			if (l > 0){
				p.background(0);

				let w = Math.ceil(Math.sqrt(l*p.width/p.height));
				let h = Math.ceil(l / w);

				for (let i=0; i<l; i++){
					let r1 = p.width/w;
					let r2 = p.height/h;

					p.noStroke();
					let v = p.values[i];

					if (Array.isArray(v)){
						p.colorMode(p.RGB)
						p.fill(v[0], v[1], v[2]);
					} else {
						p.fill(v);
					}

					if (p.WRAP){
						let x = i % w;
						let y = Math.floor(i / w);
	
						p.rect(x*r1-0.5, y*r2-0.5, r1+1, r2+1);
					} else {
						p.rect(i*p.width/l, 0, p.width/l+0.5, p.height); 
					}
				}
			}
		}
	
		p.draw = () => {
			// p.background(0);
		}
	}, c);
	// bind the listview to the global window for use in Hydra
	window.listView = this.sketch.canvas;
}
module.exports = { hydraCanvas, p5Canvas };