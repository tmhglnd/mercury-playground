import { IAudioNodeRenderer, IConvolverNode, IMinimalOfflineAudioContext, IOfflineAudioContext } from '../interfaces';
export declare type TConvolverNodeRendererFactory = <T extends IMinimalOfflineAudioContext | IOfflineAudioContext>() => IAudioNodeRenderer<T, IConvolverNode<T>>;
//# sourceMappingURL=convolver-node-renderer-factory.d.ts.map