[Home](../README.md) > IMoldEntity

# Interface: IMoldEntity

Represents a chocolate mold

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

[baseId](./IMoldEntity.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseMoldId](../type-aliases/BaseMoldId.md)

</td><td>

Base mold identifier (unique within source)

</td></tr>
<tr><td>

[manufacturer](./IMoldEntity.manufacturer.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Manufacturer of the mold

</td></tr>
<tr><td>

[productNumber](./IMoldEntity.productNumber.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Product number from the manufacturer

</td></tr>
<tr><td>

[description](./IMoldEntity.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable description of the mold shape

</td></tr>
<tr><td>

[cavities](./IMoldEntity.cavities.md)

</td><td>

`readonly`

</td><td>

[ICavities](../type-aliases/ICavities.md)

</td><td>

Cavities in the mold

</td></tr>
<tr><td>

[format](./IMoldEntity.format.md)

</td><td>

`readonly`

</td><td>

[MoldFormat](../type-aliases/MoldFormat.md)

</td><td>

Mold format/series (determines frame dimensions)

</td></tr>
<tr><td>

[tags](./IMoldEntity.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Optional tags for categorization and search

</td></tr>
<tr><td>

[related](./IMoldEntity.related.md)

</td><td>

`readonly`

</td><td>

readonly [MoldId](../type-aliases/MoldId.md)[]

</td><td>

Related molds (e.g., different sizes of the same mold)

</td></tr>
<tr><td>

[notes](./IMoldEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes about the mold

</td></tr>
<tr><td>

[urls](./IMoldEntity.urls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](ICategorizedUrl.md)[]

</td><td>

Optional categorized URLs for external resources (manufacturer page, purchase link, etc.)

</td></tr>
</tbody></table>
