[Home](../README.md) > IMoldedBonBonEntity

# Interface: IMoldedBonBonEntity

Molded bonbon confection
Uses chocolate molds for shell formation

**Extends:** [`IConfectionEntityBase`](IConfectionEntityBase.md)

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

[confectionType](./IMoldedBonBonEntity.confectionType.md)

</td><td>

`readonly`

</td><td>

"molded-bonbon"

</td><td>

Type discriminator

</td></tr>
<tr><td>

[versions](./IMoldedBonBonEntity.versions.md)

</td><td>

`readonly`

</td><td>

readonly [IMoldedBonBonVersionEntity](IMoldedBonBonVersionEntity.md)[]

</td><td>

Version history with molded bonbon specific details

</td></tr>
<tr><td>

[baseId](./IConfectionEntityBase.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseConfectionId](../type-aliases/BaseConfectionId.md)

</td><td>

Base identifier within source (no dots)

</td></tr>
<tr><td>

[name](./IConfectionEntityBase.name.md)

</td><td>

`readonly`

</td><td>

[ConfectionName](../type-aliases/ConfectionName.md)

</td><td>

Human-readable name

</td></tr>
<tr><td>

[description](./IConfectionEntityBase.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description

</td></tr>
<tr><td>

[tags](./IConfectionEntityBase.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Optional tags for searching/filtering

</td></tr>
<tr><td>

[urls](./IConfectionEntityBase.urls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](ICategorizedUrl.md)[]

</td><td>

Optional categorized URLs for external resources (tutorials, videos, etc.)

</td></tr>
<tr><td>

[goldenVersionSpec](./IConfectionEntityBase.goldenVersionSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionVersionSpec](../type-aliases/ConfectionVersionSpec.md)

</td><td>

The ID of the golden (approved default) version

</td></tr>
</tbody></table>
