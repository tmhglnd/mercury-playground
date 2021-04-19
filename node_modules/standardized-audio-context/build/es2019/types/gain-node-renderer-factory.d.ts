import { IAudioNodeRenderer, IGainNode, IMinimalOfflineAudioContext, IOfflineAudioContext } from '../interfaces';
export declare type TGainNodeRendererFactory = <T extends IMinimalOfflineAudioContext | IOfflineAudioContext>() => IAudioNodeRenderer<T, IGainNode<T>>;
//# sourceMappingURL=gain-node-renderer-factory.d.ts.map