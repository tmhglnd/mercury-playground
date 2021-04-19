import { IAudioNode, IAudioParam, IMinimalOfflineAudioContext, IOfflineAudioContext } from '../interfaces';
import { TNativeAudioParam } from './native-audio-param';
import { TNativeOfflineAudioContext } from './native-offline-audio-context';
export declare type TRenderAutomationFunction = <T extends IMinimalOfflineAudioContext | IOfflineAudioContext>(nativeOfflineAudioContext: TNativeOfflineAudioContext, audioParam: IAudioParam, nativeAudioParam: TNativeAudioParam, trace: readonly IAudioNode<T>[]) => Promise<void>;
//# sourceMappingURL=render-automation-function.d.ts.map