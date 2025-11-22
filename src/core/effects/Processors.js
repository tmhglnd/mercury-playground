
// Various noise type processors for the MonoNoise source
// Type 2 is Pink noise, used from Tone.Noise('pink') instead of calc
//
class NoiseProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors(){
		return [{
			name: 'type',
			defaultValue: 5,
			minValue: 0,
			maxValue: 5
		},{
			name: 'density',
			defaultValue: 0.125,
			minValue: 0,
			maxValue: 1
		}];
	}
	
	constructor(){
		super();
		// sample previous value
		this.prev = 0;
		// latch to a sample 
		this.latch = 0;
		// phasor ramp
		this.phasor = 0;
		this.delta = 0;
	}

	process(inputs, outputs, parameters){
		// input is not used because this is a source
		const input = inputs[0];
		const output = outputs[0];
		const HALF_PI = Math.PI/2;

		// for one output channel generate some noise	
		if (input.length > 0){
			for (let i = 0; i < input[0].length; i++){
				const t = (parameters.type.length > 1) ? parameters.type[i] : parameters.type[0];
				const d = (parameters.density.length > 1) ? parameters.density[i] : parameters.density[0];
			
				// some bipolar white noise -1 to 1
				const biNoise = Math.random() * 2 - 1;
				// empty output
				let out = 0;

				// White noise, Use for every other choice
				if (t < 1){
					out = biNoise * 0.707;
				}
				// Pink noise,  use Tone.Noise('pink') object for simplicity
				else if (t < 2){
					out = input[0][i] * 1.413;
				}
				// Brownian noise
				// calculate a random next value in "step size" and add to 
				// the previous noise signal value creating a "drunk walk" 
				// or brownian motion
				else if (t < 3){		
					this.prev += biNoise * d*d;
					this.prev = Math.asin(Math.sin(this.prev * HALF_PI)) / HALF_PI;
					out = this.prev * 0.707;
				}
				// Lo-Fi (sampled) noise
				// creates random values at a specified frequency and slowly 
				// ramps to that new value
				else if (t < 4){
					// create a ramp from 0-1 at specific frequency/density
					this.phasor = (this.phasor + d * d * 0.5) % 1;
					// calculate the delta
					let dlt = this.phasor - this.delta;
					this.delta = this.phasor;
					// when ramp resets, latch a new noise value
					if (dlt < 0){
						this.prev = this.latch;
						this.latch = biNoise;
					}
					// linear interpolation from previous to next point
					out = this.prev + this.phasor * (this.latch - this.prev);
					out *= 0.707;
				}
				// Dust noise
				// randomly generate an impulse/click of value 1 depending 
				// on the density, average amount of impulses per second
				else if (t < 5){
					out = Math.random() > (1 - d*d*d * 0.5);
				}
				// Crackle noise
				// Pink generator with "wave-loss" leaving gaps
				else {
					let delta = input[0][i] - this.prev;
					this.prev = input[0][i];
					if (delta > 0){
						this.latch = Math.random();
					}
					out = (this.latch < (1 - d*d*d)) ? 0 : input[0][i] * 1.413;
				}
				// send to output whichever noise type was chosen
				output[0][i] = out;
			}
		}		
		return true;
	}
}
registerProcessor('noise-processor', NoiseProcessor);

// A Downsampling Chiptune effect. Downsamples the signal by a specified amount
// Resulting in a lower samplerate, making it sound more like 8bit/chiptune
// Programmed with a custom AudioWorkletProcessor, see effects/Processors.js
//
class DownSampleProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors() {
		return [{
			name: 'down',
			defaultValue: 8,
			minValue: 1,
			maxValue: 2048
		}];
	}

	constructor(){
		super();
		// the frame counter
		this.count = 0;
		// sample and hold variable array
		this.sah = [];
	}

	process(inputs, outputs, parameters){
		const input = inputs[0];
		const output = outputs[0];

		// if there is anything to process
		if (input.length > 0){
			// for the length of the sample array (generally 128)
			for (let i=0; i<input[0].length; i++){
				const d = (parameters.down.length > 1) ? parameters.down[i] : parameters.down[0];
				// for every channel
				for (let channel=0; channel<input.length; ++channel){
					// upsampling for better results
					// for (let s=0; s<4; s++){
					// 	if (this.count)
					// }

					// if counter equals 0, sample and hold
					if (this.count % d === 0){
						this.sah[channel] = input[channel][i];
					}
					// output the currently held sample
					output[channel][i] = this.sah[channel];
				}
				// increment sample counter
				this.count++;
			}
		}
		return true;
	}
}
registerProcessor('downsampler-processor', DownSampleProcessor);

// A distortion algorithm using the tanh (hyperbolic-tangent) as a 
// waveshaping technique. Some mapping to apply a more equal loudness 
// distortion is applied on the overdrive parameter
//
class TanhDistortionProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors(){
		return [{
			name: 'amount',
			defaultValue: 4,
			minValue: 1
		}, {
			name: 'makeup',
			defaultValue: 0.5,
			minValue: 0,
			maxValue: 2
		}]
	}

	constructor(){
		super();
	}

	process(inputs, outputs, parameters){
		const input = inputs[0];
		const output = outputs[0];

		if (input.length > 0){
			for (let channel=0; channel<input.length; channel++){
				for (let i=0; i<input[channel].length; i++){
					const a = (parameters.amount.length > 1)? parameters.amount[i] : parameters.amount[0];
					const m = (parameters.makeup.length > 1)? parameters.makeup[i] : parameters.makeup[0];
					// simple waveshaping with tanh
					output[channel][i] = Math.tanh(input[channel][i] * a) * m;
				}
			}
		}
		return true;
	}
}
registerProcessor('tanh-distortion-processor', TanhDistortionProcessor);

// A distortion algorithm using the arctan function as a 
// waveshaping technique. Some mapping to apply a more equal loudness 
// distortion is applied on the overdrive parameter
//
class ArctanDistortionProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors(){
		return [{
			name: 'amount',
			defaultValue: 5,
			minValue: 1
		}]
	}

	constructor(){
		super();

		// quarter pi constant and inverse
		this.Q_PI = 0.7853981633974483; // 0.25 * Math.PI;
		this.INVQ_PI = 1.2732395447351628; //1.0 / this.Q_PI;
	}

	process(inputs, outputs, parameters){
		const input = inputs[0];
		const output = outputs[0];

		const gain = parameters.amount[0];
		const makeup = Math.min(1, Math.max(0, 1 - ((Math.atan(gain) - this.Q_PI) * this.INVQ_PI * 0.823)));

		if (input.length > 0){
			for (let channel=0; channel<input.length; channel++){
				for (let i=0; i<input[channel].length; i++){
					output[channel][i] = Math.atan(input[channel][i] * gain) * makeup;
				}
			}
		}
		return true;
	}
}
registerProcessor('arctan-distortion-processor', ArctanDistortionProcessor);

// A distortion/compression effect of an incoming signal
// Based on an algorithm by Peter McCulloch
// 
class SquashProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors(){
		return [{
			name: 'amount',
			defaultValue: 4,
			minValue: 1,
			maxValue: 1024
		}, {
			name: 'makeup',
			defaultValue: 0.5,
			minValue: 0,
			maxValue: 2
		}];
	}

	constructor(){
		super();
	}

	process(inputs, outputs, parameters){
		const input = inputs[0];
		const output = outputs[0];
		
		if (input.length > 0){
			for (let channel=0; channel<input.length; ++channel){
				for (let i=0; i<input[channel].length; i++){
					// (s * a) / ((s * a)^2 * 0.28 + 1) / √a
					// drive amount, minimum of 1
					const a = (parameters.amount.length > 1)? parameters.amount[i] : parameters.amount[0];
					// makeup gain
					const m = (parameters.makeup.length > 1)? parameters.makeup[i] : parameters.makeup[0];
					// set the waveshaper effect
					const s = input[channel][i];
					const x = s * a * 1.412;
					output[channel][i] = (x / (x * x * 0.28 + 1.0)) * m * 0.708;
				}
			}
		}
		return true;
	}
}
registerProcessor('squash-processor', SquashProcessor);


// Dattorro Reverberator
// Thanks to port by khoin, taken from:
// https://github.com/khoin/DattorroReverbNode
// based on the paper from Jon Dattorro:
// https://ccrma.stanford.edu/~dattorro/EffectDesignPart1.pdf
// with small modifications to work in Mercury
//
// In jurisdictions that recognize copyright laws, this software is to
// be released into the public domain.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
// THE AUTHOR(S) SHALL NOT BE LIABLE FOR ANYTHING, ARISING FROM, OR IN
// CONNECTION WITH THE SOFTWARE OR THE DISTRIBUTION OF THE SOFTWARE.
// 
class DattorroReverb extends AudioWorkletProcessor {
	static get parameterDescriptors() {
		return [
			["preDelay", 0, 0, sampleRate - 1, "k-rate"],
			// ["bandwidth", 0.9999, 0, 1, "k-rate"],	
			["inputDiffusion1", 0.75, 0, 1, "k-rate"],
			["inputDiffusion2", 0.625, 0, 1, "k-rate"],
			["decay", 0.5, 0, 1, "k-rate"],
			["decayDiffusion1", 0.7, 0, 0.999999, "k-rate"],
			["decayDiffusion2", 0.5, 0, 0.999999, "k-rate"],
			["damping", 0.005, 0, 1, "k-rate"],
			["excursionRate", 0.5, 0, 2, "k-rate"],
			["excursionDepth", 0.7, 0, 2, "k-rate"],
			["wet", 0.7, 0, 2, "k-rate"],
			// ["dry", 0.7, 0, 2, "k-rate"]
		].map(x => new Object({
			name: x[0],
			defaultValue: x[1],
			minValue: x[2],
			maxValue: x[3],
			automationRate: x[4]
		}));
	}

	constructor(options) {
		super(options);

		this._Delays = [];
		// Pre-delay is always one-second long, rounded to the nearest 128-chunk
		this._pDLength = sampleRate + (128 - sampleRate % 128);
		this._preDelay = new Float32Array(this._pDLength);
		this._pDWrite = 0;
		this._lp1 = 0.0;
		this._lp2 = 0.0;
		this._lp3 = 0.0;
		this._excPhase = 0.0;

		[
			0.004771345, 0.003595309, 0.012734787, 0.009307483, // pre-tank
			0.022579886, 0.149625349, 0.060481839, 0.1249958, // left-loop
			0.030509727, 0.141695508, 0.089244313, 0.106280031 // right-loop
		].forEach(x => this.makeDelay(x));

		this._taps = Int16Array.from([
			0.008937872, 0.099929438, 0.064278754, 0.067067639, 
			0.066866033, 0.006283391, 0.035818689, // left-output
			0.011861161, 0.121870905, 0.041262054, 0.08981553, 
			0.070931756, 0.011256342, 0.004065724 // right-output
		], x => Math.round(x * sampleRate));
	}

	makeDelay(length) {
		// len, array, write, read, mask
		let len = Math.round(length * sampleRate);
		let nextPow2 = 2 ** Math.ceil(Math.log2((len)));
		this._Delays.push([
			new Float32Array(nextPow2), len - 1, 0 | 0, nextPow2 - 1
		]);
	}

	writeDelay(index, data) {
		return this._Delays[index][0][this._Delays[index][1]] = data;
	}

	readDelay(index) {
		return this._Delays[index][0][this._Delays[index][2]];
	}

	readDelayAt(index, i) {
		let d = this._Delays[index];
		return d[0][(d[2] + i) & d[3]];
	}

	// cubic interpolation
	// O. Niemitalo: 
	// https://www.musicdsp.org/en/latest/Other/49-cubic-interpollation.html
	readDelayCAt(index, i) {
		let d = this._Delays[index],
			frac = i - ~~i,
			int = ~~i + d[2] - 1,
			mask = d[3];

		let x0 = d[0][int++ & mask],
			x1 = d[0][int++ & mask],
			x2 = d[0][int++ & mask],
			x3 = d[0][int & mask];

		let a = (3 * (x1 - x2) - x0 + x3) / 2,
			b = 2 * x2 + x0 - (5 * x1 + x3) / 2,
			c = (x2 - x0) / 2;

		return (((a * frac) + b) * frac + c) * frac + x1;
	}

	// First input will be downmixed to mono if number of channels is not 2
	// Outputs Stereo.
	process(inputs, outputs, parameters) {
		const pd = ~~parameters.preDelay[0],
			// bw = parameters.bandwidth[0], // replaced by using damping
			fi = parameters.inputDiffusion1[0],
			si = parameters.inputDiffusion2[0],
			dc = parameters.decay[0],
			ft = parameters.decayDiffusion1[0],
			st = parameters.decayDiffusion2[0],
			dp = 1 - parameters.damping[0],
			ex = parameters.excursionRate[0] / sampleRate,
			ed = parameters.excursionDepth[0] * sampleRate / 1000,
			we = parameters.wet[0]; //* 0.6, // lo & ro both mult. by 0.6 anyways
			// dr = parameters.dry[0];

		// write to predelay and dry output
		if (inputs[0].length == 2) {
			for (let i = 127; i >= 0; i--) {
				this._preDelay[this._pDWrite + i] = (inputs[0][0][i] + inputs[0][1][i]) * 0.5;

				// removed the dry parameter, this is handled in the Tone Node
				// outputs[0][0][i] = inputs[0][0][i] * dr;
				// outputs[0][1][i] = inputs[0][1][i] * dr;
			}
		} else if (inputs[0].length > 0) {
			this._preDelay.set(
				inputs[0][0],
				this._pDWrite
			);
			// for (let i = 127; i >= 0; i--)
			// 	outputs[0][0][i] = outputs[0][1][i] = inputs[0][0][i] * dr;
		} else {
			this._preDelay.set(
				new Float32Array(128),
				this._pDWrite
			);
		}

		let i = 0 | 0;
		while (i < 128) {
			let lo = 0.0,
				ro = 0.0;

			// input damping (formerly known as bandwidth bw, now uses dp)
			this._lp1 += dp * (this._preDelay[(this._pDLength + this._pDWrite - pd + i) % this._pDLength] - this._lp1);

			// pre-tank
			let pre = this.writeDelay(0, this._lp1 - fi * this.readDelay(0));
			pre = this.writeDelay(1, fi * (pre - this.readDelay(1)) + this.readDelay(0));
			pre = this.writeDelay(2, fi * pre + this.readDelay(1) - si * this.readDelay(2));
			pre = this.writeDelay(3, si * (pre - this.readDelay(3)) + this.readDelay(2));

			let split = si * pre + this.readDelay(3);

			// excursions
			// could be optimized?
			let exc = ed * (1 + Math.cos(this._excPhase * 6.2800));
			let exc2 = ed * (1 + Math.sin(this._excPhase * 6.2847));

			// left loop
			// tank diffuse 1
			let temp = this.writeDelay(4, split + dc * this.readDelay(11) + ft * this.readDelayCAt(4, exc));
			// long delay 1
			this.writeDelay(5, this.readDelayCAt(4, exc) - ft * temp);
			// damp 1
			this._lp2 += dp * (this.readDelay(5) - this._lp2);
			temp = this.writeDelay(6, dc * this._lp2 - st * this.readDelay(6)); // tank diffuse 2
			// long delay 2
			this.writeDelay(7, this.readDelay(6) + st * temp);

			// right loop 
			// tank diffuse 3
			temp = this.writeDelay(8, split + dc * this.readDelay(7) + ft * this.readDelayCAt(8, exc2));
			// long delay 3
			this.writeDelay(9, this.readDelayCAt(8, exc2) - ft * temp);
			// damp 2
			this._lp3 += dp * (this.readDelay(9) - this._lp3);
			// tank diffuse 4
			temp = this.writeDelay(10, dc * this._lp3 - st * this.readDelay(10));
			// long delay 4
			this.writeDelay(11, this.readDelay(10) + st * temp);

			lo = this.readDelayAt(9, this._taps[0]) +
				this.readDelayAt(9, this._taps[1]) -
				this.readDelayAt(10, this._taps[2]) +
				this.readDelayAt(11, this._taps[3]) -
				this.readDelayAt(5, this._taps[4]) -
				this.readDelayAt(6, this._taps[5]) -
				this.readDelayAt(7, this._taps[6]);

			ro = this.readDelayAt(5, this._taps[7]) +
				this.readDelayAt(5, this._taps[8]) -
				this.readDelayAt(6, this._taps[9]) +
				this.readDelayAt(7, this._taps[10]) -
				this.readDelayAt(9, this._taps[11]) -
				this.readDelayAt(10, this._taps[12]) -
				this.readDelayAt(11, this._taps[13]);

			outputs[0][0][i] += lo * we;
			outputs[0][1][i] += ro * we;

			this._excPhase += ex;

			i++;

			for (let j = 0, d = this._Delays[0]; j < this._Delays.length; d = this._Delays[++j]) {
				d[1] = (d[1] + 1) & d[3];
				d[2] = (d[2] + 1) & d[3];
			}
		}

		// Update preDelay index
		this._pDWrite = (this._pDWrite + 128) % this._pDLength;

		return true;
	}
}
registerProcessor('dattorro-reverb', DattorroReverb);

// A custom written Delay audioworkletprocessor
// In the first place as a test for how to write custom delaylines 
// With the potential to create more complicated FX for the browser
//
// class DelayProcessor extends AudioWorkletProcessor {
// 	static get parameterDescriptors(){
// 		return [{
// 			name : 'delayTime',
// 			defaultValue: 100,
// 			minValue: 0,
// 			maxValue: 1000
// 		}]
// 	}

// 	constructor(){
// 		super();
// 		// maximum delayline 2 seconds at 48kHz
// 		this.maxDelay = 44100 * 5;
// 		// the delaybuffer to be used
// 		this.delayBuffer = new Float32Array(this.maxDelay);
// 		// the delay write index
// 		this.index = 0;
// 	}

// 	process(inputs, outputs, parameters){
// 		const input = inputs[0];
// 		const output = outputs[0];

// 		// if there is anything to process
// 		if (input.length === 0) return true;
		
// 		// for every channel
// 		for (let channel = 0; channel < 1; channel++){
// 			// no sound int channel continue to the next channel
// 			if (!input[channel]) continue;

// 			// for every sample in the blocksize
// 			for (let i=0; i<input[0].length; i++){

// 				// calculate delaytime from ms to samples
// 				const delayTime = parameters.delayTime.length > 1 ? parameters.delayTime[i] : parameters.delayTime[0];
				
// 				const dt = Math.floor(delayTime * 0.001 * 44100);
// 				// read from the delayline at the readindex and output
// 				output[channel][i] = this.delayBuffer[this.index];
// 				// write a value to the delayline at current position
// 				this.delayBuffer[this.index] = input[channel][i] + output[channel][i] * 0.9;
// 				// increment the write index
// 				this.index = (this.index + 1) % dt;
// 			}
// 		}
// 		return true;
// 	}
// }
// registerProcessor('delay-processor', DelayProcessor);