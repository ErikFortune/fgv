[Home](../../README.md) > [Runtime](../README.md) > CompiledResourceCollection

# Class: CompiledResourceCollection

A compiled resource collection implements Runtime.IResourceManager | IResourceManager
by reconstructing runtime objects from compiled data. This provides an efficient way to load
and use pre-compiled resource collections without rebuilding them from scratch.

**Implements:** [`IResourceManager<IResource>`](../../interfaces/IResourceManager.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[conditions](./CompiledResourceCollection.conditions.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyConditionCollector](../../type-aliases/ReadOnlyConditionCollector.md)

</td><td>

A Conditions.ReadOnlyConditionCollector | ReadOnlyConditionCollector which

</td></tr>
<tr><td>

[conditionSets](./CompiledResourceCollection.conditionSets.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyConditionSetCollector](../../type-aliases/ReadOnlyConditionSetCollector.md)

</td><td>

A Conditions.ReadOnlyConditionSetCollector | ReadOnlyConditionSetCollector which

</td></tr>
<tr><td>

[decisions](./CompiledResourceCollection.decisions.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyAbstractDecisionCollector](../../type-aliases/ReadOnlyAbstractDecisionCollector.md)

</td><td>

A Decisions.ReadOnlyAbstractDecisionCollector | ReadOnlyAbstractDecisionCollector which

</td></tr>
<tr><td>

[qualifierTypes](./CompiledResourceCollection.qualifierTypes.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyQualifierTypeCollector](../../type-aliases/ReadOnlyQualifierTypeCollector.md)

</td><td>

A QualifierTypes.ReadOnlyQualifierTypeCollector | ReadOnlyQualifierTypeCollector which

</td></tr>
<tr><td>

[qualifiers](./CompiledResourceCollection.qualifiers.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyQualifierCollector](../../interfaces/IReadOnlyQualifierCollector.md)

</td><td>

A Qualifiers.IReadOnlyQualifierCollector | ReadOnlyQualifierCollector which

</td></tr>
<tr><td>

[resourceIds](./CompiledResourceCollection.resourceIds.md)

</td><td>

`readonly`

</td><td>

readonly [ResourceId](../../type-aliases/ResourceId.md)[]

</td><td>

The resource IDs contained in this compiled resource collection.

</td></tr>
<tr><td>

[resourceTypes](./CompiledResourceCollection.resourceTypes.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyResourceTypeCollector](../../type-aliases/ReadOnlyResourceTypeCollector.md)

</td><td>

A ResourceTypes.ResourceTypeCollector | ResourceTypeCollector which

</td></tr>
<tr><td>

[candidateValues](./CompiledResourceCollection.candidateValues.md)

</td><td>

`readonly`

</td><td>

readonly JsonValue[]

</td><td>

The candidate values in the collection.

</td></tr>
<tr><td>

[builtResources](./CompiledResourceCollection.builtResources.md)

</td><td>

`readonly`

</td><td>

IReadOnlyValidatingResultMap&lt;[ResourceId](../../type-aliases/ResourceId.md), [IResource](../../interfaces/IResource.md)&gt;

</td><td>

A read-only result map of all built resources, keyed by resource ID.

</td></tr>
<tr><td>

[numResources](./CompiledResourceCollection.numResources.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The number of resources in this resource manager.

</td></tr>
<tr><td>

[numCandidates](./CompiledResourceCollection.numCandidates.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The number of candidates in this resource manager.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[create(params)](./CompiledResourceCollection.create.md)

</td><td>

`static`

</td><td>

Creates a new Runtime.CompiledResourceCollection | CompiledResourceCollection object.

</td></tr>
<tr><td>

[getBuiltResource(id)](./CompiledResourceCollection.getBuiltResource.md)

</td><td>



</td><td>

Gets a built resource by ID for runtime resolution.

</td></tr>
<tr><td>

[validateContext(context)](./CompiledResourceCollection.validateContext.md)

</td><td>



</td><td>

Validates a context declaration against the qualifiers managed by this resource manager.

</td></tr>
<tr><td>

[getBuiltResourceTree()](./CompiledResourceCollection.getBuiltResourceTree.md)

</td><td>



</td><td>

Gets a resource tree built from the resources in this collection.

</td></tr>
</tbody></table>
