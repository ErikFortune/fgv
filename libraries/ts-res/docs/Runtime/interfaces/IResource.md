[Home](../../README.md) > [Runtime](../README.md) > IResource

# Interface: IResource

Interface for a resource that can be used in the runtime layer.
This provides the minimal properties needed from a resource without requiring
the full Resources layer dependencies.

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

[id](./IResource.id.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The resource identifier

</td></tr>
<tr><td>

[name](./IResource.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The resource name

</td></tr>
<tr><td>

[resourceType](./IResource.resourceType.md)

</td><td>

`readonly`

</td><td>

[IResourceType](../../interfaces/IResourceType.md)

</td><td>

The resource type

</td></tr>
<tr><td>

[decision](./IResource.decision.md)

</td><td>

`readonly`

</td><td>

[ConcreteDecision](../../classes/ConcreteDecision.md)

</td><td>

The decision used to select candidates

</td></tr>
<tr><td>

[candidates](./IResource.candidates.md)

</td><td>

`readonly`

</td><td>

readonly [IResourceCandidate](../../interfaces/IResourceCandidate.md)[]

</td><td>

The available candidates for this resource

</td></tr>
</tbody></table>
