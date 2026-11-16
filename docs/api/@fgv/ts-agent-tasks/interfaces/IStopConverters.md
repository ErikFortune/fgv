[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IStopConverters

# Interface: IStopConverters

Converters for cascade stops (T9): the persisted intent, the requests that act on it, and what a
source declares about stopping.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-capabilities"></a> `capabilities` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISourceCapabilities`](ISourceCapabilities.md)\> | - |
| <a id="property-inspect"></a> `inspect` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IStopInspectRequest`](IStopInspectRequest.md)\> | - |
| <a id="property-intent"></a> `intent` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IStopIntent`](IStopIntent.md)\> | One persisted intent, with its structural invariants. |
| <a id="property-intents"></a> `intents` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IStopIntent`](IStopIntent.md)[]\> | A record's intents: unique ids, one root, at most one latching intent per mode. |
| <a id="property-intentstate"></a> `intentState` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`StopIntentState`](../type-aliases/StopIntentState.md)\> | - |
| <a id="property-marker"></a> `marker` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IStopCommandMarker`](IStopCommandMarker.md)\> | - |
| <a id="property-mode"></a> `mode` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`StopMode`](../type-aliases/StopMode.md)\> | - |
| <a id="property-projectedtarget"></a> `projectedTarget` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IProjectedStopTarget`](../type-aliases/IProjectedStopTarget.md)\> | - |
| <a id="property-reconcile"></a> `reconcile` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IStopReconcileRequest`](IStopReconcileRequest.md)\> | - |
| <a id="property-release"></a> `release` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReleaseStop`](IReleaseStop.md)\> | - |
| <a id="property-request"></a> `request` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IStopRequest`](IStopRequest.md)\> | - |
| <a id="property-target"></a> `target` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IStopTarget`](IStopTarget.md)\> | - |
| <a id="property-targetstate"></a> `targetState` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`StopTargetState`](../type-aliases/StopTargetState.md)\> | - |
