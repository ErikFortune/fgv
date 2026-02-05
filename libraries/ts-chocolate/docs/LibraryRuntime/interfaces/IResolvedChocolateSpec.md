[Home](../../README.md) > [LibraryRuntime](../README.md) > IResolvedChocolateSpec

# Interface: IResolvedChocolateSpec

A resolved chocolate specification with ingredient objects.
Uses same pattern as IResolvedFillingIngredient - primary + alternates.

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

[chocolate](./IResolvedChocolateSpec.chocolate.md)

</td><td>

`readonly`

</td><td>

[IChocolateIngredient](../../interfaces/IChocolateIngredient.md)

</td><td>

The preferred/primary chocolate ingredient (always chocolate category)

</td></tr>
<tr><td>

[alternates](./IResolvedChocolateSpec.alternates.md)

</td><td>

`readonly`

</td><td>

readonly [IChocolateIngredient](../../interfaces/IChocolateIngredient.md)[]

</td><td>

Alternate chocolate options (all chocolate category)

</td></tr>
<tr><td>

[entity](./IResolvedChocolateSpec.entity.md)

</td><td>

`readonly`

</td><td>

[IChocolateSpec](../../type-aliases/IChocolateSpec.md)

</td><td>

The original chocolate spec entity

</td></tr>
</tbody></table>
