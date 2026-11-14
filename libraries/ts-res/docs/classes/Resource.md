[Home](../README.md) > Resource

# Class: Resource

Represents a single logical resource, with a unique id and a set of possible
candidate instances.

**Implements:** [`IResource`](../interfaces/IResource.md)

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

[id](./Resource.id.md)

</td><td>

`readonly`

</td><td>

[ResourceId](../type-aliases/ResourceId.md)

</td><td>

The unique ResourceId | id of the resource.

</td></tr>
<tr><td>

[name](./Resource.name.md)

</td><td>

`readonly`

</td><td>

[ResourceName](../type-aliases/ResourceName.md)

</td><td>

The name of the resource.

</td></tr>
<tr><td>

[resourceType](./Resource.resourceType.md)

</td><td>

`readonly`

</td><td>

[ResourceType](ResourceType.md)

</td><td>

The ResourceTypes.ResourceType | type of the resource.

</td></tr>
<tr><td>

[candidates](./Resource.candidates.md)

</td><td>

`readonly`

</td><td>

readonly [ResourceCandidate](ResourceCandidate.md)[]

</td><td>

The array of Resources.ResourceCandidate | candidates for the resource.

</td></tr>
<tr><td>

[decision](./Resource.decision.md)

</td><td>

`readonly`

</td><td>

[ConcreteDecision](ConcreteDecision.md)

</td><td>

Decisions.ConcreteDecision | Decision for optimized resource resolution.

</td></tr>
<tr><td>

[resourceTypeName](./Resource.resourceTypeName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Gets the resource type name as a string.

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

[create(params)](./Resource.create.md)

</td><td>

`static`

</td><td>

Creates a new Resources.Resource | Resource object.

</td></tr>
<tr><td>

[getCandidatesForContext(context, options)](./Resource.getCandidatesForContext.md)

</td><td>



</td><td>

Gets the candidates for this resource that match the specified Context.IValidatedContextDecl | context.

</td></tr>
<tr><td>

[toChildResourceDecl(options)](./Resource.toChildResourceDecl.md)

</td><td>



</td><td>

Gets the ResourceJson.Json.IChildResourceDecl | child resource declaration for this resource.

</td></tr>
<tr><td>

[toLooseResourceDecl(options)](./Resource.toLooseResourceDecl.md)

</td><td>



</td><td>

Gets the ResourceJson.Json.ILooseResourceDecl | loose resource declaration for this resource.

</td></tr>
<tr><td>

[toCompiled(options)](./Resource.toCompiled.md)

</td><td>



</td><td>

Converts this resource to a compiled resource representation.

</td></tr>
</tbody></table>
