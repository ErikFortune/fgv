[Home](../README.md) > ResourceBuilder

# Class: ResourceBuilder

Represents a builder for a single logical Resources.Resource | resource.  Collects candidates
with a common resource ID, validates them against each other and builds a Resources.Resource | resource
object once all candidates are collected.

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

[id](./ResourceBuilder.id.md)

</td><td>

`readonly`

</td><td>

[ResourceId](../type-aliases/ResourceId.md)

</td><td>

The unique ResourceId | id of the resource being built.

</td></tr>
<tr><td>

[resourceType](./ResourceBuilder.resourceType.md)

</td><td>

`readonly`

</td><td>

[ResourceType](ResourceType.md)&lt;unknown&gt; | undefined

</td><td>

Supplied or inferred ResourceTypes.ResourceType | type of the resource being built.

</td></tr>
<tr><td>

[candidates](./ResourceBuilder.candidates.md)

</td><td>

`readonly`

</td><td>

readonly [ResourceCandidate](ResourceCandidate.md)[]

</td><td>

Array of Resources.ResourceCandidate | candidates for the resource being built.

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

[create(params)](./ResourceBuilder.create.md)

</td><td>

`static`

</td><td>

Creates a new Resources.ResourceBuilder | ResourceBuilder object.

</td></tr>
<tr><td>

[getCandidatesForContext(context, options)](./ResourceBuilder.getCandidatesForContext.md)

</td><td>



</td><td>

Gets the Resources.ResourceCandidate | candidates that match a given Context.IValidatedContextDecl | context.

</td></tr>
<tr><td>

[addChildCandidate(childDecl)](./ResourceBuilder.addChildCandidate.md)

</td><td>



</td><td>

Given a ResourceJson.Json.IChildResourceCandidateDecl | child resource candidate declaration, creates and adds a

</td></tr>
<tr><td>

[addLooseCandidate(decl)](./ResourceBuilder.addLooseCandidate.md)

</td><td>



</td><td>

Given a ResourceJson.Json.ILooseResourceCandidateDecl | resource candidate declaration, creates and adds a

</td></tr>
<tr><td>

[setResourceType(resourceTypeName)](./ResourceBuilder.setResourceType.md)

</td><td>



</td><td>

Sets the resource type for the resource being built.

</td></tr>
<tr><td>

[build()](./ResourceBuilder.build.md)

</td><td>



</td><td>

Builds the Resources.Resource | resource object from this builder.

</td></tr>
</tbody></table>
