[Home](../README.md) > IResourceManager

# Interface: IResourceManager

Interface defining the read-only properties that the runtime resource resolver needs
from a resource manager. This abstraction allows the runtime to work with different
implementations without requiring the full ResourceManagerBuilder build mechanics.

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

[conditions](./IResourceManager.conditions.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyConditionCollector](../type-aliases/ReadOnlyConditionCollector.md)

</td><td>

A Conditions.ReadOnlyConditionCollector | ReadOnlyConditionCollector which

</td></tr>
<tr><td>

[conditionSets](./IResourceManager.conditionSets.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyConditionSetCollector](../type-aliases/ReadOnlyConditionSetCollector.md)

</td><td>

A Conditions.ReadOnlyConditionSetCollector | ReadOnlyConditionSetCollector which

</td></tr>
<tr><td>

[decisions](./IResourceManager.decisions.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyAbstractDecisionCollector](../type-aliases/ReadOnlyAbstractDecisionCollector.md)

</td><td>

A Decisions.ReadOnlyAbstractDecisionCollector | ReadOnlyAbstractDecisionCollector which

</td></tr>
<tr><td>

[builtResources](./IResourceManager.builtResources.md)

</td><td>

`readonly`

</td><td>

IReadOnlyValidatingResultMap&lt;[ResourceId](../type-aliases/ResourceId.md), TR&gt;

</td><td>

A read-only result map of all built resources, keyed by resource ID.

</td></tr>
<tr><td>

[numResources](./IResourceManager.numResources.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The number of resources in this resource manager.

</td></tr>
<tr><td>

[resourceIds](./IResourceManager.resourceIds.md)

</td><td>

`readonly`

</td><td>

readonly [ResourceId](../type-aliases/ResourceId.md)[]

</td><td>

The resource IDs that this resource manager can resolve.

</td></tr>
<tr><td>

[numCandidates](./IResourceManager.numCandidates.md)

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

[getBuiltResource(id)](./IResourceManager.getBuiltResource.md)

</td><td>



</td><td>

Gets a built resource by ID for runtime resolution.

</td></tr>
<tr><td>

[getBuiltResourceTree()](./IResourceManager.getBuiltResourceTree.md)

</td><td>



</td><td>

Gets a resource tree built from the resources in this resource manager.

</td></tr>
<tr><td>

[validateContext(context)](./IResourceManager.validateContext.md)

</td><td>



</td><td>

Validates a context declaration against the qualifiers managed by this resource manager.

</td></tr>
</tbody></table>
