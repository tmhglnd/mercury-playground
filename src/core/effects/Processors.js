
// A white noise generator at -6dBFS to test AudioWorkletProcessor
//
class NoiseProcessor extends AudioWorkletProcessor {
	process(inputs, outputs, parameters){
		const output = outputs[0];

		output.forEach((channel) => {
			for (let i=0; i<channel.length; i++) {
				channel[i] = Math.random() - 0.5;
			}
		});
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
	constructor(){
		super();
	}

	process(inputs, outputs, parameters){
		const input = inputs[0];
		const output = outputs[0];

		if (input.length > 0){
			for (let channel=0; channel<input.length; ++channel){
				for (let i=0; i<input[channel].length; i++){
					// simple waveshaping with tanh
					output[channel][i] = Math.tanh(input[channel][i]);
				}
			}
		}
		return true;
	}
}
registerProcessor('tanh-distortion-processor', TanhDistortionProcessor);

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
					// set the waveshaper effect
					const s = input[channel][i];
					const p = (s * a) / ((s * a) * (s * a) * 0.28 + 1.0);
					output[channel][i] = p;
				}
			}
		}
		return true;
	}
}
registerProcessor('squash-processor', SquashProcessor);