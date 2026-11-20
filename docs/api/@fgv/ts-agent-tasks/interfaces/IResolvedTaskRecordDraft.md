[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IResolvedTaskRecordDraft

# Interface: IResolvedTaskRecordDraft

What a caller supplies for a resolved record: everything except the fields the repository
owns — the format version, the record revision and the capacity claims.

## Remarks

Claims are computed by the repository and are never caller-issued authority. There is no
`capacityClaims` field here to pass, and the draft converter is strict.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-archived"></a> `archived` | `readonly` | `boolean` | - |
| <a id="property-operations"></a> `operations` | `readonly` | readonly [`IStoredTaskOperation`](../type-aliases/IStoredTaskOperation.md)[] | - |
| <a id="property-recordtype"></a> `recordType` | `readonly` | `"resolved"` | - |
| <a id="property-sourcerevision"></a> `sourceRevision?` | `readonly` | [`ISourceRevision`](ISourceRevision.md) | - |
| <a id="property-stops"></a> `stops?` | `readonly` | readonly [`IStopIntent`](IStopIntent.md)[] | The record's cascade stops. A draft that omits intents the record holds is refused: an intent is evidence and is never dropped. |
| <a id="property-task"></a> `task` | `readonly` | [`ITaskSnapshot`](ITaskSnapshot.md) | - |
| <a id="property-updates"></a> `updates` | `readonly` | readonly [`ITaskUpdate`](ITaskUpdate.md)[] | - |
