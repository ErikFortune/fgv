[Home](../README.md) > IConfectionRecipeEntityBase

# Interface: IConfectionRecipeEntityBase

Base confection interface - all confection types share these properties.
Contains stable identity and metadata; configuration details are in variations.

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

[baseId](./IConfectionRecipeEntityBase.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseConfectionId](../type-aliases/BaseConfectionId.md)

</td><td>

Base identifier within source (no dots)

</td></tr>
<tr><td>

[confectionType](./IConfectionRecipeEntityBase.confectionType.md)

</td><td>

`readonly`

</td><td>

TType

</td><td>

Confection type (discriminator)

</td></tr>
<tr><td>

[name](./IConfectionRecipeEntityBase.name.md)

</td><td>

`readonly`

</td><td>

[ConfectionName](../type-aliases/ConfectionName.md)

</td><td>

Human-readable name

</td></tr>
<tr><td>

[description](./IConfectionRecipeEntityBase.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description

</td></tr>
<tr><td>

[tags](./IConfectionRecipeEntityBase.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Optional tags for searching/filtering

</td></tr>
<tr><td>

[urls](./IConfectionRecipeEntityBase.urls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](ICategorizedUrl.md)[]

</td><td>

Optional categorized URLs for external resources (tutorials, videos, etc.)

</td></tr>
<tr><td>

[goldenVariationSpec](./IConfectionRecipeEntityBase.goldenVariationSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

The ID of the golden (approved default) variation

</td></tr>
<tr><td>

[variations](./IConfectionRecipeEntityBase.variations.md)

</td><td>

`readonly`

</td><td>

readonly TVariation[]

</td><td>

Variations history - contains type-specific configuration details

</td></tr>
</tbody></table>
