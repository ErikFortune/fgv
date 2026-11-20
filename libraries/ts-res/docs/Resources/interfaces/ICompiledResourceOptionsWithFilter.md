[Home](../../README.md) > [Resources](../README.md) > ICompiledResourceOptionsWithFilter

# Interface: ICompiledResourceOptionsWithFilter

Extended compiled resource options that includes context filtering capabilities.
This interface combines the standard compilation options with strongly-typed
context filtering for resource candidates.

**Extends:** [`ICompiledResourceOptions`](../../interfaces/ICompiledResourceOptions.md)

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

[filterForContext](./ICompiledResourceOptionsWithFilter.filterForContext.md)

</td><td>



</td><td>

[IValidatedContextDecl](../../type-aliases/IValidatedContextDecl.md)

</td><td>

If provided, filters resource candidates to only include those that can match the
specified validated context.

</td></tr>
<tr><td>

[includeMetadata](./ICompiledResourceOptions.includeMetadata.md)

</td><td>



</td><td>

boolean

</td><td>

Whether to include metadata in the compiled objects.

</td></tr>
</tbody></table>
