import { IAudioNode, IAudioNodeRenderer, IMinimalOfflineAudioContext, IOfflineAudioContext } from '../interfaces';
import { TContext } from './context';
import { TNativeAudioNode } from './native-audio-node';
export declare type TAddAudioNodeConnectionsFunction = <T extends TContext>(audioNode: IAudioNode<T>, audioNodeRenderer: T extends IMinimalOfflineAudioContext | IOfflineAudioContext ? IAudioNodeRenderer<T, IAudioNode<T>> : null, nativeAudioNode: TNativeAudioNode) => void;
//# sourceMappingURL=add-audio-node-connections-function.d.ts.map