[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptObserver

# Interface: IPromptObserver

Single-method async observer hook. `PromptLibrary` fires `observe` once per
public resolve / output call (never for nested resource-binding resolves).

## Remarks

Observer errors never affect the `resolve()` return — the library swallows a
failed `Result` or a thrown/rejected `observe`, logging it to the injected
diagnostic logger at `warn`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-fireandforget"></a> `fireAndForget?` | `readonly` | `boolean` | When `true`, `PromptLibrary` dispatches `observe` without awaiting it, so a slow remote observer (SIEM, network sink) does not extend `resolve()` latency. Defaults to `false` (awaited), which is correct for the cheap in-memory default [PromptObservationStore](../classes/PromptObservationStore.md). Errors are swallowed either way. |

## Methods

### observe()

> **observe**(`record`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`unknown`\>\>

Receives a fully-formed observation record.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `record` | [`IPromptObservationRecord`](../type-aliases/IPromptObservationRecord.md) | The observation record. |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`unknown`\>\>

A `Result` whose failure is swallowed (logged to the library's
diagnostic logger). A rejected promise is likewise swallowed.
