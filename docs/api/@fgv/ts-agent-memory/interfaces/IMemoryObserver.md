[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryObserver

# Interface: IMemoryObserver

Single-method async observer hook. The store fires `observe` once per public
`get` / `put` / `delete` call when observers are wired.

## Remarks

Observer errors never affect the store operation — the store swallows a
failed `Result` or a thrown / rejected `observe`, logging it to the injected
diagnostic logger at `warn`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-fireandforget"></a> `fireAndForget?` | `readonly` | `boolean` | When `true`, the store dispatches `observe` without awaiting it, so a slow remote observer (SIEM, network sink) does not extend the store operation's latency. Defaults to `false` (awaited), which is correct for the cheap in-memory default [MemoryObservationStore](../classes/MemoryObservationStore.md). Errors are swallowed either way. |

## Methods

### observe()

> **observe**(`record`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`unknown`\>\>

Receives a fully-formed observation record.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `record` | [`IMemoryObservationRecord`](IMemoryObservationRecord.md) | The observation record. |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`unknown`\>\>

A `Result` whose failure is swallowed (logged to the store's
diagnostic logger). A rejected promise is likewise swallowed.
