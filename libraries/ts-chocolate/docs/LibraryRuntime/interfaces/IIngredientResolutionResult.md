[Home](../../README.md) > [LibraryRuntime](../README.md) > IIngredientResolutionResult

# Interface: IIngredientResolutionResult

Result of attempting to resolve an ingredient reference.
Used when partial resolution is acceptable (e.g., for alternates).

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

[status](./IIngredientResolutionResult.status.md)

</td><td>

`readonly`

</td><td>

[ResolutionStatus](../../type-aliases/ResolutionStatus.md)

</td><td>

The resolution status

</td></tr>
<tr><td>

[ingredient](./IIngredientResolutionResult.ingredient.md)

</td><td>

`readonly`

</td><td>

TIngredient

</td><td>

The resolved ingredient (if status is 'resolved')

</td></tr>
<tr><td>

[error](./IIngredientResolutionResult.error.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Error message (if status is 'missing' or 'error')

</td></tr>
</tbody></table>
