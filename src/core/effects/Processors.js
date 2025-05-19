
// A white noise generator at -6dBFS to test AudioWorkletProcessor
//
// class NoiseProcessor extends AudioWorkletProcessor {
// 	process(inputs, outputs, parameters){
// 		const output = outputs[0];

// 		output.forEach((channel) => {
// 			for (let i=0; i<channel.length; i++) {
// 				channel[i] = Math.random() - 0.5;
// 			}
// 		});
// 		return true;
// 	}
// }
// registerProcessor('noise-processor', NoiseProcessor);

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
			for (let channel=0; channel<input.length; ++channel){
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

class sineProcessorProcessor extends AudioWorkletProcessor {

  static get parameterDescriptors() {
    const params = [
            
    ]
    return params
  }
 
  constructor( options ) {
    super( options )
    this.port.onmessage = this.handleMessage.bind( this )
    this.initialized = false
    
  }

  handleMessage( event ) {
    if( event.data.key === 'init' ) {
      this.memory = event.data.memory
      this.initialized = true
    }else if( event.data.key === 'set' ) {
      this.memory[ event.data.idx ] = event.data.value
    }else if( event.data.key === 'get' ) {
      this.port.postMessage({ key:'return', idx:event.data.idx, value:this.memory[event.data.idx] })     
    }
  }

  process( inputs, outputs, parameters ) {
    if( this.initialized === true ) {
      const output = outputs[0]
      const channel0 = output[ 0 ]
		
      const len    = channel0.length
      const memory = this.memory 
      

      for( let i = 0; i < len; ++i ) {
              
        memory[0]  = cycle(200)
      
        channel0[ i ] = memory[ 0 ]
		
      }
    }
    return true
  }
}
    
registerProcessor( 'sineProcessor', sineProcessorProcessor)