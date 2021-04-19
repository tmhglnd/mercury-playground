export interface ISetValueCurveAutomationEvent {
    readonly duration: number;

    readonly startTime: number;

    readonly type: 'setValueCurve';

    readonly values: Float32Array;
}
