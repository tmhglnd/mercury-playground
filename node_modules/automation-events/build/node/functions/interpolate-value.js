"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.interpolateValue = void 0;

const interpolateValue = (values, theoreticIndex) => {
  const lowerIndex = Math.floor(theoreticIndex);
  const upperIndex = Math.ceil(theoreticIndex);

  if (lowerIndex === upperIndex) {
    return values[lowerIndex];
  }

  return (1 - (theoreticIndex - lowerIndex)) * values[lowerIndex] + (1 - (upperIndex - theoreticIndex)) * values[upperIndex];
};

exports.interpolateValue = interpolateValue;
