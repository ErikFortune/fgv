[Home](../README.md) > IResourceManagerCloneOptions

# Interface: IResourceManagerCloneOptions

Options for ResourceManagerBuilder clone operations.
Extends IDeclarationOptions to include support for applying edits when cloning.

**Extends:** [`IResourceDeclarationOptions`](IResourceDeclarationOptions.md)

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

[candidates](./IResourceManagerCloneOptions.candidates.md)

</td><td>

`readonly`

</td><td>

readonly [ILooseResourceCandidateDecl](ILooseResourceCandidateDecl.md)&lt;string&gt;[]

</td><td>

Optional array of loose condition declarations to be applied as edits during the clone operation.

</td></tr>
<tr><td>

[qualifiers](./IResourceManagerCloneOptions.qualifiers.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyQualifierCollector](IReadOnlyQualifierCollector.md)

</td><td>

Optional qualifier collector to use for the cloned manager.

</td></tr>
<tr><td>

[resourceTypes](./IResourceManagerCloneOptions.resourceTypes.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyResourceTypeCollector](../type-aliases/ReadOnlyResourceTypeCollector.md)

</td><td>

Optional resource type collector to use for the cloned manager.

</td></tr>
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

[showDefaults](./IResourceDeclarationOptions.showDefaults.md)

</td><td>



</td><td>

boolean

</td><td>

If `true`, properties with default values will be included in the
output.

</td></tr>
<tr><td>

[normalized](./IResourceDeclarationOptions.normalized.md)

</td><td>



</td><td>

boolean

</td><td>

If `true`, the output will be normalized using hash-based ordering for consistent structure.

</td></tr>
</tbody></table>
