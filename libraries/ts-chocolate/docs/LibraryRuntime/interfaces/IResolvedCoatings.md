[Home](../../README.md) > [LibraryRuntime](../README.md) > IResolvedCoatings

# Interface: IResolvedCoatings

Resolved coatings specification for rolled truffles.
Coatings are ingredient-based (e.g., cocoa powder, chopped nuts).

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

[options](./IResolvedCoatings.options.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedCoatingOption](../../interfaces/IResolvedCoatingOption.md)[]

</td><td>

All available coating ingredient options

</td></tr>
<tr><td>

[preferred](./IResolvedCoatings.preferred.md)

</td><td>

`readonly`

</td><td>

[IResolvedCoatingOption](../../interfaces/IResolvedCoatingOption.md)

</td><td>

The preferred/default coating (resolved ingredient)

</td></tr>
<tr><td>

[entity](./IResolvedCoatings.entity.md)

</td><td>

`readonly`

</td><td>

[ICoatingsEntity](../../type-aliases/ICoatingsEntity.md)

</td><td>

The original coatings spec

</td></tr>
</tbody></table>
