[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Compiled](../README.md) / ICompiledCandidate

# Interface: ICompiledCandidate

Represents a compiled resource candidate with JSON value and merge properties.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="ispartial"></a> `isPartial` | `boolean` | Indicates if this is a partial resource that needs to be merged. |
| <a id="mergemethod"></a> `mergeMethod` | [`ResourceValueMergeMethod`](../../../../../type-aliases/ResourceValueMergeMethod.md) | The method to use when merging this candidate with others. |
| <a id="valueindex"></a> `valueIndex` | [`CandidateValueIndex`](../../../../../type-aliases/CandidateValueIndex.md) | The global index of the JSON value of the candidate. |
