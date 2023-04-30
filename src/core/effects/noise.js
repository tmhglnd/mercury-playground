
// A white noise generator at -6dBFS
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
registerProcessor('white-noise', NoiseProcessor);

/**
 * A simple One pole filter.
 *
 * @class OnePoleProcessor
 * @extends AudioWorkletProcessor
 */
class OnePoleProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors() {
		return [{
			name: 'frequency',
			defaultValue: 250,
			minValue: 0,
			maxValue: 0.5 * sampleRate,
		}];
	}

	constructor() {
		super();
		this.updateCoefficientsWithFrequency_(250);
	}

	updateCoefficientsWithFrequency_(frequency) {
		this.b1_ = Math.exp(-2 * Math.PI * frequency / sampleRate);
		this.a0_ = 1.0 - this.b1_;
		this.z1_ = 0;
	}

	process(inputs, outputs, parameters) {
		const input = inputs[0];
		const output = outputs[0];

		const frequency = parameters.frequency;
		const isFrequencyConstant = frequency.length === 1;

		for (let channel = 0; channel < output.length; ++channel) {
			const inputChannel = input[channel];
			const outputChannel = output[channel];

			// If |frequency| parameter doesn't chnage in the current render quantum,
			// we don't need to update the filter coef either.
			if (isFrequencyConstant) {
				this.updateCoefficientsWithFrequency_(frequency[0]);
			}

			for (let i = 0; i < outputChannel.length; ++i) {
				if (!isFrequencyConstant) {
					this.updateCoefficientsWithFrequency_(frequency[i]);
				}
				this.z1_ = inputChannel[i] * this.a0_ + this.z1_ * this.b1_;
				outputChannel[i] = this.z1_;
			}
		}

		return true;
	}
}
registerProcessor('one-pole-processor', OnePoleProcessor);

// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * A AudioWorklet-based BitCrusher demo from the spec example.
 *
 * @class BitCrusherProcessor
 * @extends AudioWorkletProcessor
 * @see https://webaudio.github.io/web-audio-api/#the-bitcrusher-node
 */
class BitCrusherProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors() {
		return [{
			name: 'bitDepth',
			defaultValue: 12,
			minValue: 1,
			maxValue: 16
		}, {
			name: 'frequencyReduction',
			defaultValue: 0.5,
			minValue: 0,
			maxValue: 1,
		}, ];
	}

	constructor() {
		super();
		this.phase_ = 0;
		this.lastSampleValue_ = 0;
	}

	process(inputs, outputs, parameters) {
		const input = inputs[0];
		const output = outputs[0];

		// AudioParam array can be either length of 1 or 128. Generally, the code
		// should prepare for both cases. In this particular example, |bitDepth|
		// AudioParam is constant but |frequencyReduction| is being automated.
		const bitDepth = parameters.bitDepth;
		const frequencyReduction = parameters.frequencyReduction;
		const isBitDepthConstant = bitDepth.length === 1;

		for (let channel = 0; channel < input.length; ++channel) {
			const inputChannel = input[channel];
			const outputChannel = output[channel];
			let step = Math.pow(0.5, bitDepth[0]);
			for (let i = 0; i < inputChannel.length; ++i) {
				// We only take care |bitDepth| because |frequencuReduction| will always
				// have 128 values.
				if (!isBitDepthConstant) {
					step = Math.pow(0.5, bitDepth[i]);
				}
				this.phase_ += frequencyReduction[i];
				if (this.phase_ >= 1.0) {
					this.phase_ -= 1.0;
					this.lastSampleValue_ =
						step * Math.floor(inputChannel[i] / step + 0.5);
				}
				outputChannel[i] = this.lastSampleValue_;
			}
		}

		return true;
	}
}
registerProcessor('bit-crusher-processor', BitCrusherProcessor);