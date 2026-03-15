[Home](../../README.md) > [Entities](../README.md) > ILocationEntity

# Interface: ILocationEntity

Represents a production location (e.g., storage area, workspace, shelf).

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

[baseId](./ILocationEntity.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseLocationId](../../type-aliases/BaseLocationId.md)

</td><td>

Base location identifier (unique within source)

</td></tr>
<tr><td>

[name](./ILocationEntity.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name for the location

</td></tr>
<tr><td>

[description](./ILocationEntity.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional longer description of the location

</td></tr>
<tr><td>

[notes](./ILocationEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes about the location

</td></tr>
<tr><td>

[urls](./ILocationEntity.urls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[]

</td><td>

Optional categorized URLs for external resources

</td></tr>
</tbody></table>
