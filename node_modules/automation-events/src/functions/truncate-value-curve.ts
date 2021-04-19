import { interpolateValue } from './interpolate-value';

export const truncateValueCurve = (values: Float32Array, originalDuration: number, targetDuration: number): Float32Array => {
    const length = values.length;
    const truncatedLength = Math.floor((targetDuration / originalDuration) * length) + 1;
    const truncatedValues = new Float32Array(truncatedLength);

    for (let i = 0; i < truncatedLength; i += 1) {
        const time = (i / (truncatedLength - 1)) * targetDuration;
        const theoreticIndex = (time / originalDuration) * (length - 1);

        truncatedValues[i] = interpolateValue(values, theoreticIndex);
    }

    return truncatedValues;
};
