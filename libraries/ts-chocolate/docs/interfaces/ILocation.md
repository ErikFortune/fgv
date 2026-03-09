[Home](../README.md) > ILocation

# Interface: ILocation

Materialized location with parsed composite ID.

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

[id](./ILocation.id.md)

</td><td>

`readonly`

</td><td>

[LocationId](../type-aliases/LocationId.md)

</td><td>

Composite location ID (collectionId.baseId)

</td></tr>
<tr><td>

[collectionId](./ILocation.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../type-aliases/CollectionId.md)

</td><td>

Collection this location belongs to

</td></tr>
<tr><td>

[baseId](./ILocation.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseLocationId](../type-aliases/BaseLocationId.md)

</td><td>

Base identifier within collection

</td></tr>
<tr><td>

[name](./ILocation.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name

</td></tr>
<tr><td>

[description](./ILocation.description.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Optional longer description

</td></tr>
<tr><td>

[displayName](./ILocation.displayName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Display name (returns name)

</td></tr>
<tr><td>

[notes](./ILocation.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes

</td></tr>
<tr><td>

[urls](./ILocation.urls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](ICategorizedUrl.md)[] | undefined

</td><td>

Optional categorized URLs

</td></tr>
<tr><td>

[entity](./ILocation.entity.md)

</td><td>

`readonly`

</td><td>

[ILocationEntity](ILocationEntity.md)

</td><td>

The underlying entity

</td></tr>
</tbody></table>
