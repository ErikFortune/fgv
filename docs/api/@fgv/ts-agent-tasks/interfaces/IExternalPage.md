[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IExternalPage

# Interface: IExternalPage\<TDetails\>

A typed page of a reconciliation listing or ordered feed. See `ISourceReconcilePage`.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tdetails"></a> `TDetails` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-checkpoint"></a> `checkpoint?` | `readonly` | `string` |
| <a id="property-completeness"></a> `completeness` | `readonly` | `"gap"` \| `"complete"` \| `"partial"` |
| <a id="property-coverage"></a> `coverage` | `readonly` | [`SourceReconcileCoverage`](../type-aliases/SourceReconcileCoverage.md) |
| <a id="property-issues"></a> `issues` | `readonly` | readonly `string`[] |
| <a id="property-nextcursor"></a> `nextCursor?` | `readonly` | `string` |
| <a id="property-observations"></a> `observations` | `readonly` | readonly `object`[] |
