[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / IResource

# Interface: IResource

Interface for a resource that can be used in the runtime layer.
This provides the minimal properties needed from a resource without requiring
the full Resources layer dependencies.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="candidates"></a> `candidates` | `readonly` | readonly [`IResourceCandidate`](IResourceCandidate.md)[] | The available candidates for this resource |
| <a id="decision"></a> `decision` | `readonly` | [`ConcreteDecision`](../../Decisions/classes/ConcreteDecision.md) | The decision used to select candidates |
| <a id="id"></a> `id` | `readonly` | `string` | The resource identifier |
| <a id="name"></a> `name` | `readonly` | `string` | The resource name |
| <a id="resourcetype"></a> `resourceType` | `readonly` | [`IResourceType`](../../ResourceTypes/interfaces/IResourceType.md) | The resource type |
