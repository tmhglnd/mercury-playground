import { IAudioNode, IMinimalOfflineAudioContext, IOfflineAudioContext } from '../interfaces';
import { TNativeAudioNode } from './native-audio-node';
import { TNativeOfflineAudioContext } from './native-offline-audio-context';
export declare type TRenderInputsOfAudioNodeFunction = <T extends IMinimalOfflineAudioContext | IOfflineAudioContext>(audioNode: IAudioNode<T>, nativeOfflineAudioContext: TNativeOfflineAudioContext, nativeAudioNode: TNativeAudioNode, trace: readonly IAudioNode<T>[]) => Promise<void>;
//# sourceMappingURL=render-inputs-of-audio-node-function.d.ts.map