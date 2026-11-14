[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Compiled](../README.md) / ICompiledResource

# Interface: ICompiledResource

Represents a compiled resource with an identifier and associated candidates.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-candidates"></a> `candidates` | readonly [`ICompiledCandidate`](ICompiledCandidate.md)[] | Array of candidate values for this resource. |
| <a id="property-decision"></a> `decision` | [`DecisionIndex`](../../../../../type-aliases/DecisionIndex.md) | Index reference to the decision that determines when this resource applies. |
| <a id="property-id"></a> `id` | [`ResourceId`](../../../../../type-aliases/ResourceId.md) | The unique identifier of the resource. |
| <a id="property-type"></a> `type` | [`ResourceTypeIndex`](../../../../../type-aliases/ResourceTypeIndex.md) | Index reference to the resource type of this resource. |
