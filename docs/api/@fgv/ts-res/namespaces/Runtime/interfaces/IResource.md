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
| <a id="property-candidates"></a> `candidates` | `readonly` | readonly [`IResourceCandidate`](IResourceCandidate.md)[] | The available candidates for this resource |
| <a id="property-decision"></a> `decision` | `readonly` | [`ConcreteDecision`](../../Decisions/classes/ConcreteDecision.md) | The decision used to select candidates |
| <a id="property-id"></a> `id` | `readonly` | `string` | The resource identifier |
| <a id="property-name"></a> `name` | `readonly` | `string` | The resource name |
| <a id="property-resourcetype"></a> `resourceType` | `readonly` | [`IResourceType`](../../ResourceTypes/interfaces/IResourceType.md) | The resource type |
