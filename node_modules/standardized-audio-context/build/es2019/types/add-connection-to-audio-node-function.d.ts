import { IAudioNode } from '../interfaces';
import { TContext } from './context';
export declare type TAddConnectionToAudioNodeFunction = <T extends TContext>(source: IAudioNode<T>, destination: IAudioNode<T>, output: number, input: number, isOffline: boolean) => boolean;
//# sourceMappingURL=add-connection-to-audio-node-function.d.ts.map