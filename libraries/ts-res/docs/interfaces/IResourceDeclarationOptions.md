[Home](../README.md) > IResourceDeclarationOptions

# Interface: IResourceDeclarationOptions

Options for resource declaration operations with strongly-typed context filtering.
Extends the base IDeclarationOptions with proper type safety for context filtering.

**Extends:** [`IDeclarationOptions`](IDeclarationOptions.md)

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

[filterForContext](./IResourceDeclarationOptions.filterForContext.md)

</td><td>



</td><td>

[IValidatedContextDecl](../type-aliases/IValidatedContextDecl.md)

</td><td>

If provided, filters resource candidates to only include those that can match the
specified validated context.

</td></tr>
<tr><td>

[reduceQualifiers](./IResourceDeclarationOptions.reduceQualifiers.md)

</td><td>



</td><td>

boolean

</td><td>

If true, reduces the qualifiers of the resource candidates by removing qualifiers that are made

</td></tr>
<tr><td>

[includeMetadata](./IResourceDeclarationOptions.includeMetadata.md)

</td><td>



</td><td>

boolean

</td><td>

Whether to include metadata in compiled outputs.

</td></tr>
<tr><td>

[showDefaults](./IDeclarationOptions.showDefaults.md)

</td><td>



</td><td>

boolean

</td><td>

If `true`, properties with default values will be included in the
output.

</td></tr>
<tr><td>

[normalized](./IDeclarationOptions.normalized.md)

</td><td>



</td><td>

boolean

</td><td>

If `true`, the output will be normalized using hash-based ordering for consistent structure.

</td></tr>
</tbody></table>
