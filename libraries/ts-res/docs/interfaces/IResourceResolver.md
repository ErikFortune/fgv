[Home](../README.md) > IResourceResolver

# Interface: IResourceResolver

Minimal resource resolver

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

[resourceIds](./IResourceResolver.resourceIds.md)

</td><td>

`readonly`

</td><td>

readonly [ResourceId](../type-aliases/ResourceId.md)[]

</td><td>

The resource IDs that this resolver can resolve.

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

[resolveComposedResourceValue(resource)](./IResourceResolver.resolveComposedResourceValue.md)

</td><td>



</td><td>

Resolves a resource to a composed value by merging matching candidates according to their merge methods.

</td></tr>
<tr><td>

[withContext(context)](./IResourceResolver.withContext.md)

</td><td>



</td><td>

Creates a new IResourceResolver | resource resolver with the given context.

</td></tr>
</tbody></table>
