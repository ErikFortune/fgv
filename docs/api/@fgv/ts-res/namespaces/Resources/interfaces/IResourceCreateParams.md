[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / IResourceCreateParams

# Interface: IResourceCreateParams

Parameters used to create a [Resource](../../../classes/Resource.md) object.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="candidates"></a> `candidates` | readonly [`ResourceCandidate`](../../../classes/ResourceCandidate.md)[] | Array of [candidates](../../../classes/ResourceCandidate.md) for the resource. |
| <a id="decisions"></a> `decisions` | [`AbstractDecisionCollector`](../../Decisions/classes/AbstractDecisionCollector.md) | [AbstractDecisionCollector](../../Decisions/classes/AbstractDecisionCollector.md) used to create the optimized decision. |
| <a id="id"></a> `id?` | `string` | The id of the resource. |
| <a id="resourcetype"></a> `resourceType?` | [`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\> | Optional [type](../../../classes/ResourceType.md) of the resource. If not specified, the type will be inferred from the candidates. |
