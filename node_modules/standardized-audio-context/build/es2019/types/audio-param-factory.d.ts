import { IAudioNode, IAudioParam } from '../interfaces';
import { TContext } from './context';
import { TNativeAudioParam } from './native-audio-param';
export declare type TAudioParamFactory = <T extends TContext>(audioNode: IAudioNode<T>, isAudioParamOfOfflineAudioContext: boolean, nativeAudioParam: TNativeAudioParam, maxValue?: null | number, minValue?: null | number) => IAudioParam;
//# sourceMappingURL=audio-param-factory.d.ts.map