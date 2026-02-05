[Home](../../../README.md) > [Entities](../../README.md) > [Confections](../README.md) > IConfectionEntityBase

# Interface: IConfectionEntityBase

Base confection interface - all confection types share these properties.
Contains stable identity and metadata; configuration details are in versions.

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

[baseId](./IConfectionEntityBase.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseConfectionId](../../../type-aliases/BaseConfectionId.md)

</td><td>

Base identifier within source (no dots)

</td></tr>
<tr><td>

[confectionType](./IConfectionEntityBase.confectionType.md)

</td><td>

`readonly`

</td><td>

[ConfectionType](../../../type-aliases/ConfectionType.md)

</td><td>

Confection type (discriminator)

</td></tr>
<tr><td>

[name](./IConfectionEntityBase.name.md)

</td><td>

`readonly`

</td><td>

[ConfectionName](../../../type-aliases/ConfectionName.md)

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

readonly [ICategorizedUrl](../../../interfaces/ICategorizedUrl.md)[]

</td><td>

Optional categorized URLs for external resources (tutorials, videos, etc.)

</td></tr>
<tr><td>

[goldenVersionSpec](./IConfectionEntityBase.goldenVersionSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../../../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

The ID of the golden (approved default) version

</td></tr>
<tr><td>

[versions](./IConfectionEntityBase.versions.md)

</td><td>

`readonly`

</td><td>

readonly [AnyConfectionVersionEntity](../../../type-aliases/AnyConfectionVersionEntity.md)[]

</td><td>

Version history - contains type-specific configuration details

</td></tr>
</tbody></table>
