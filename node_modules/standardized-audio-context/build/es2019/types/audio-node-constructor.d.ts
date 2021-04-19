import { IAudioNode, IAudioNodeRenderer, IMinimalOfflineAudioContext, IOfflineAudioContext } from '../interfaces';
import { TContext } from './context';
import { TNativeAudioNode } from './native-audio-node';
export declare type TAudioNodeConstructor = new <T extends TContext>(context: T, isActive: boolean, nativeAudioNode: TNativeAudioNode, audioNodeRenderer: T extends IMinimalOfflineAudioContext | IOfflineAudioContext ? IAudioNodeRenderer<T, IAudioNode<T>> : null) => IAudioNode<T>;
//# sourceMappingURL=audio-node-constructor.d.ts.map