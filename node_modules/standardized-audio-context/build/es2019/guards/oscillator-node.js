export const isOscillatorNode = (audioNode) => {
    return 'detune' in audioNode && 'frequency' in audioNode;
};
//# sourceMappingURL=oscillator-node.js.map