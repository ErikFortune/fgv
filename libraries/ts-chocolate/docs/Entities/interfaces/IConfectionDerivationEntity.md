[Home](../../README.md) > [Entities](../README.md) > IConfectionDerivationEntity

# Interface: IConfectionDerivationEntity

Reference to a source confection recipe+variation from which a confection recipe was derived.
Used to track lineage when a user edits a read-only confection recipe and creates
a new confection recipe in a writable collection.

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

[sourceVariationId](./IConfectionDerivationEntity.sourceVariationId.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationId](../../type-aliases/ConfectionRecipeVariationId.md)

</td><td>

Source confection recipe variation ID (format: "sourceId.confectionId@variationSpec")

</td></tr>
<tr><td>

[derivedDate](./IConfectionDerivationEntity.derivedDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date of derivation (ISO 8601 format)

</td></tr>
<tr><td>

[notes](./IConfectionDerivationEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes about the derivation

</td></tr>
</tbody></table>
