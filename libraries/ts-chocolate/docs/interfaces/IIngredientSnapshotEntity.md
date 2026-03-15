[Home](../README.md) > IIngredientSnapshotEntity

# Interface: IIngredientSnapshotEntity

Optional ingredient snapshot for archival purposes.
Used when the source filling recipe might become unavailable.

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

[ingredientId](./IIngredientSnapshotEntity.ingredientId.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../type-aliases/IngredientId.md)

</td><td>

The ingredient ID

</td></tr>
<tr><td>

[originalAmount](./IIngredientSnapshotEntity.originalAmount.md)

</td><td>

`readonly`

</td><td>

[Measurement](../type-aliases/Measurement.md)

</td><td>

Original amount before scaling

</td></tr>
<tr><td>

[scaledAmount](./IIngredientSnapshotEntity.scaledAmount.md)

</td><td>

`readonly`

</td><td>

[Measurement](../type-aliases/Measurement.md)

</td><td>

Scaled amount after applying scale factor

</td></tr>
<tr><td>

[notes](./IIngredientSnapshotEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes for this ingredient

</td></tr>
</tbody></table>
