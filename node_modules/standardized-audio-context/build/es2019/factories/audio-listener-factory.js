import { MOST_NEGATIVE_SINGLE_FLOAT, MOST_POSITIVE_SINGLE_FLOAT } from '../constants';
export const createAudioListenerFactory = (createAudioParam, createNativeChannelMergerNode, createNativeConstantSourceNode, createNativeScriptProcessorNode, isNativeOfflineAudioContext) => {
    return (context, nativeContext) => {
        const nativeListener = nativeContext.listener;
        // Bug #117: Only Chrome, Edge & Opera support the new interface already.
        const createFakeAudioParams = () => {
            const channelMergerNode = createNativeChannelMergerNode(nativeContext, {
                channelCount: 1,
                channelCountMode: 'explicit',
                channelInterpretation: 'speakers',
                numberOfInputs: 9
            });
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const scriptProcessorNode = createNativeScriptProcessorNode(nativeContext, 256, 9, 0);
            const createFakeAudioParam = (input, value) => {
                const constantSourceNode = createNativeConstantSourceNode(nativeContext, {
                    channelCount: 1,
                    channelCountMode: 'explicit',
                    channelInterpretation: 'discrete',
                    offset: value
                });
                constantSourceNode.connect(channelMergerNode, 0, input);
                // @todo This should be stopped when the context is closed.
                constantSourceNode.start();
                Object.defineProperty(constantSourceNode.offset, 'defaultValue', {
                    get() {
                        return value;
                    }
                });
                /*
                 * Bug #62 & #74: Safari does not support ConstantSourceNodes and does not export the correct values for maxValue and
                 * minValue for GainNodes.
                 */
                return createAudioParam({ context }, isOffline, constantSourceNode.offset, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
            };
            let lastOrientation = [0, 0, -1, 0, 1, 0];
            let lastPosition = [0, 0, 0];
            // tslint:disable-next-line:deprecation
            scriptProcessorNode.onaudioprocess = ({ inputBuffer }) => {
                const orientation = [
                    inputBuffer.getChannelData(0)[0],
                    inputBuffer.getChannelData(1)[0],
                    inputBuffer.getChannelData(2)[0],
                    inputBuffer.getChannelData(3)[0],
                    inputBuffer.getChannelData(4)[0],
                    inputBuffer.getChannelData(5)[0]
                ];
                if (orientation.some((value, index) => value !== lastOrientation[index])) {
                    nativeListener.setOrientation(...orientation); // tslint:disable-line:deprecation
                    lastOrientation = orientation;
                }
                const positon = [
                    inputBuffer.getChannelData(6)[0],
                    inputBuffer.getChannelData(7)[0],
                    inputBuffer.getChannelData(8)[0]
                ];
                if (positon.some((value, index) => value !== lastPosition[index])) {
                    nativeListener.setPosition(...positon); // tslint:disable-line:deprecation
                    lastPosition = positon;
                }
            };
            channelMergerNode.connect(scriptProcessorNode);
            return {
                forwardX: createFakeAudioParam(0, 0),
                forwardY: createFakeAudioParam(1, 0),
                forwardZ: createFakeAudioParam(2, -1),
                positionX: createFakeAudioParam(6, 0),
                positionY: createFakeAudioParam(7, 0),
                positionZ: createFakeAudioParam(8, 0),
                upX: createFakeAudioParam(3, 0),
                upY: createFakeAudioParam(4, 1),
                upZ: createFakeAudioParam(5, 0)
            };
        };
        const { forwardX, forwardY, forwardZ, positionX, positionY, positionZ, upX, upY, upZ } = nativeListener.forwardX === undefined ? createFakeAudioParams() : nativeListener;
        return {
            get forwardX() {
                return forwardX;
            },
            get forwardY() {
                return forwardY;
            },
            get forwardZ() {
                return forwardZ;
            },
            get positionX() {
                return positionX;
            },
            get positionY() {
                return positionY;
            },
            get positionZ() {
                return positionZ;
            },
            get upX() {
                return upX;
            },
            get upY() {
                return upY;
            },
            get upZ() {
                return upZ;
            }
        };
    };
};
//# sourceMappingURL=audio-listener-factory.js.map