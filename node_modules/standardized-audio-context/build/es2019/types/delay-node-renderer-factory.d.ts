import { IAudioNodeRenderer, IDelayNode, IMinimalOfflineAudioContext, IOfflineAudioContext } from '../interfaces';
export declare type TDelayNodeRendererFactory = <T extends IMinimalOfflineAudioContext | IOfflineAudioContext>(maxDelayTime: number) => IAudioNodeRenderer<T, IDelayNode<T>>;
//# sourceMappingURL=delay-node-renderer-factory.d.ts.map