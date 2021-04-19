import { IAudioNodeRenderer, IDynamicsCompressorNode, IMinimalOfflineAudioContext, IOfflineAudioContext } from '../interfaces';
export declare type TDynamicsCompressorNodeRendererFactory = <T extends IMinimalOfflineAudioContext | IOfflineAudioContext>() => IAudioNodeRenderer<T, IDynamicsCompressorNode<T>>;
//# sourceMappingURL=dynamics-compressor-node-renderer-factory.d.ts.map