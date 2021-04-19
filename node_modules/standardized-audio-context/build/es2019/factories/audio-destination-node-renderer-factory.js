export const createAudioDestinationNodeRenderer = (renderInputsOfAudioNode) => {
    let nativeAudioDestinationNodePromise = null;
    const createAudioDestinationNode = async (proxy, nativeOfflineAudioContext, trace) => {
        const nativeAudioDestinationNode = nativeOfflineAudioContext.destination;
        await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioDestinationNode, trace);
        return nativeAudioDestinationNode;
    };
    return {
        render(proxy, nativeOfflineAudioContext, trace) {
            if (nativeAudioDestinationNodePromise === null) {
                nativeAudioDestinationNodePromise = createAudioDestinationNode(proxy, nativeOfflineAudioContext, trace);
            }
            return nativeAudioDestinationNodePromise;
        }
    };
};
//# sourceMappingURL=audio-destination-node-renderer-factory.js.map