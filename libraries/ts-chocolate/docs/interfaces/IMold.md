[Home](../README.md) > IMold

# Interface: IMold

A resolved runtime view of a mold with computed properties.

This interface provides runtime-layer access to mold data with:
- Composite identity (`id`, `sourceId`) for cross-source references
- Computed properties (totalCapacity, displayName)
- Future navigation capabilities

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

[id](./IMold.id.md)

</td><td>

`readonly`

</td><td>

[MoldId](../type-aliases/MoldId.md)

</td><td>

The composite mold ID (e.g., "cw.cw-2227").

</td></tr>
<tr><td>

[collectionId](./IMold.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../type-aliases/CollectionId.md)

</td><td>

The collection ID part of the composite ID.

</td></tr>
<tr><td>

[baseId](./IMold.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseMoldId](../type-aliases/BaseMoldId.md)

</td><td>

The base mold ID within the source.

</td></tr>
<tr><td>

[manufacturer](./IMold.manufacturer.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Manufacturer of the mold

</td></tr>
<tr><td>

[productNumber](./IMold.productNumber.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Product number from the manufacturer

</td></tr>
<tr><td>

[description](./IMold.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable description

</td></tr>
<tr><td>

[cavities](./IMold.cavities.md)

</td><td>

`readonly`

</td><td>

[ICavities](../type-aliases/ICavities.md)

</td><td>

Cavities definition (grid or count)

</td></tr>
<tr><td>

[cavityCount](./IMold.cavityCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of cavities in the mold

</td></tr>
<tr><td>

[cavityWeight](./IMold.cavityWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../type-aliases/Measurement.md)

</td><td>

Weight capacity per cavity in grams

</td></tr>
<tr><td>

[cavityDimensions](./IMold.cavityDimensions.md)

</td><td>

`readonly`

</td><td>

[ICavityDimensions](ICavityDimensions.md)

</td><td>

Physical dimensions of each cavity

</td></tr>
<tr><td>

[format](./IMold.format.md)

</td><td>

`readonly`

</td><td>

[MoldFormat](../type-aliases/MoldFormat.md)

</td><td>

Mold format/series

</td></tr>
<tr><td>

[tags](./IMold.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Optional tags

</td></tr>
<tr><td>

[related](./IMold.related.md)

</td><td>

`readonly`

</td><td>

readonly [MoldId](../type-aliases/MoldId.md)[]

</td><td>

Optional related molds (cross-catalog via composite IDs)

</td></tr>
<tr><td>

[notes](./IMold.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes

</td></tr>
<tr><td>

[urls](./IMold.urls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](ICategorizedUrl.md)[]

</td><td>

Optional categorized URLs

</td></tr>
<tr><td>

[totalCapacity](./IMold.totalCapacity.md)

</td><td>

`readonly`

</td><td>

[Measurement](../type-aliases/Measurement.md) | undefined

</td><td>

Gets the total capacity of the mold (all cavities) in grams.

</td></tr>
<tr><td>

[displayName](./IMold.displayName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Gets a display string for this mold (manufacturer + product number).

</td></tr>
<tr><td>

[entity](./IMold.entity.md)

</td><td>

`readonly`

</td><td>

[IMoldEntity](IMoldEntity.md)

</td><td>

Gets the underlying raw mold data.

</td></tr>
</tbody></table>
