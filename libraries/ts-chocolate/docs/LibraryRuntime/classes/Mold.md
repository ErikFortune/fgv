[Home](../../README.md) > [LibraryRuntime](../README.md) > Mold

# Class: Mold

A resolved view of a mold with computed properties.

Mold wraps a data-layer Mold and provides:
- Composite identity (MoldId) for cross-source references
- Computed properties (totalCapacity, displayName)
- Future navigation capabilities

**Implements:** [`IMold`](../../interfaces/IMold.md)

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

[id](./Mold.id.md)

</td><td>

`readonly`

</td><td>

[MoldId](../../type-aliases/MoldId.md)

</td><td>

The composite mold ID (e.g., "cw.cw-2227")

</td></tr>
<tr><td>

[collectionId](./Mold.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../../type-aliases/CollectionId.md)

</td><td>

The source ID part of the composite ID

</td></tr>
<tr><td>

[baseId](./Mold.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseMoldId](../../type-aliases/BaseMoldId.md)

</td><td>

The base mold ID within the source

</td></tr>
<tr><td>

[manufacturer](./Mold.manufacturer.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Manufacturer of the mold

</td></tr>
<tr><td>

[productNumber](./Mold.productNumber.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Product number from the manufacturer

</td></tr>
<tr><td>

[name](./Mold.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name

</td></tr>
<tr><td>

[description](./Mold.description.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Optional longer description

</td></tr>
<tr><td>

[cavities](./Mold.cavities.md)

</td><td>

`readonly`

</td><td>

[ICavities](../../type-aliases/ICavities.md)

</td><td>

Cavities definition (grid or count)

</td></tr>
<tr><td>

[cavityCount](./Mold.cavityCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of cavities in the mold

</td></tr>
<tr><td>

[cavityWeight](./Mold.cavityWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md) | undefined

</td><td>

Weight capacity per cavity in grams

</td></tr>
<tr><td>

[cavityDimensions](./Mold.cavityDimensions.md)

</td><td>

`readonly`

</td><td>

[ICavityDimensions](../../interfaces/ICavityDimensions.md) | undefined

</td><td>

Physical dimensions of each cavity

</td></tr>
<tr><td>

[format](./Mold.format.md)

</td><td>

`readonly`

</td><td>

[MoldFormat](../../type-aliases/MoldFormat.md)

</td><td>

Mold format/series

</td></tr>
<tr><td>

[tags](./Mold.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[] | undefined

</td><td>

Optional tags

</td></tr>
<tr><td>

[related](./Mold.related.md)

</td><td>

`readonly`

</td><td>

readonly [MoldId](../../type-aliases/MoldId.md)[] | undefined

</td><td>

Optional related molds (cross-catalog via composite IDs)

</td></tr>
<tr><td>

[notes](./Mold.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes

</td></tr>
<tr><td>

[urls](./Mold.urls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[] | undefined

</td><td>

Optional categorized URLs

</td></tr>
<tr><td>

[totalCapacity](./Mold.totalCapacity.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md) | undefined

</td><td>

Gets the total capacity of the mold (all cavities) in grams.

</td></tr>
<tr><td>

[displayName](./Mold.displayName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Gets a display string for this mold.

</td></tr>
<tr><td>

[entity](./Mold.entity.md)

</td><td>

`readonly`

</td><td>

[IMoldEntity](../../interfaces/IMoldEntity.md)

</td><td>

Gets the underlying mold data entity.

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

[create(context, id, mold)](./Mold.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a Mold.

</td></tr>
</tbody></table>
