[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Compiled](../README.md) / ICompiledConditionSet

# Interface: ICompiledConditionSet

Represents a compiled set of conditions that must be satisfied together.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="conditions"></a> `conditions` | readonly [`ConditionIndex`](../../../../../type-aliases/ConditionIndex.md)[] | Array of indices referencing the conditions in this set. |
| <a id="metadata"></a> `metadata?` | [`ICompiledConditionSetMetadata`](ICompiledConditionSetMetadata.md) | Optional metadata containing human-readable information about this condition set. |
