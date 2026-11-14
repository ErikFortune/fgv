[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ISourceReconcileReport

# Interface: ISourceReconcileReport

What one reconciliation pass did.

## Remarks

`complete` is true only when the pass reached the end of an `all-bindings` listing with no gap,
no stop and no page that claimed less. `cursor` is the committed position after the pass — it
moves only past pages whose every observation committed.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-complete"></a> `complete` | `readonly` | `boolean` |
| <a id="property-cursor"></a> `cursor?` | `readonly` | `string` |
| <a id="property-issues"></a> `issues` | `readonly` | readonly `string`[] |
| <a id="property-observations"></a> `observations` | `readonly` | readonly [`ISourceObservationReport`](ISourceObservationReport.md)[] |
| <a id="property-pages"></a> `pages` | `readonly` | `number` |
| <a id="property-sourceid"></a> `sourceId` | `readonly` | `string` |
| <a id="property-stopped"></a> `stopped?` | `readonly` | [`SourceReconcileStop`](../type-aliases/SourceReconcileStop.md) |
