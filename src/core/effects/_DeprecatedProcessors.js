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

// A custom written Delay audioworkletprocessor
// In the first place as a test for how to write custom delaylines 
// With the potential to create more complicated FX for the browser
// 
class DelayProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors(){
		return [{
			name : 'delayTime',
			defaultValue: 100,
			minValue: 0,
			maxValue: 1000
		}]
	}

	constructor(){
		super();
		// maximum delayline 2 seconds at 48kHz
		this.maxDelay = 44100 * 5;
		// the delaybuffer to be used
		this.delayBuffer = new Float32Array(this.maxDelay);
		// the delay write index
		this.index = 0;
	}

	process(inputs, outputs, parameters){
		const input = inputs[0];
		const output = outputs[0];

		// if there is anything to process
		if (input.length === 0) return true;
		
		// for every channel
		for (let channel = 0; channel < 1; channel++){
			// no sound int channel continue to the next channel
			if (!input[channel]) continue;

			// for every sample in the blocksize
			for (let i=0; i<input[0].length; i++){

				// calculate delaytime from ms to samples
				const delayTime = parameters.delayTime.length > 1 ? parameters.delayTime[i] : parameters.delayTime[0];
				
				const dt = Math.floor(delayTime * 0.001 * 44100);
				// read from the delayline at the readindex and output
				output[channel][i] = this.delayBuffer[this.index];
				// write a value to the delayline at current position
				this.delayBuffer[this.index] = input[channel][i] + output[channel][i] * 0.9;
				// increment the write index
				this.index = (this.index + 1) % dt;
			}
		}
		return true;
	}
}
registerProcessor('delay-processor', DelayProcessor);