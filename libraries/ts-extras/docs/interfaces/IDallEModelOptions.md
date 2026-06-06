[Home](../README.md) > IDallEModelOptions

# Interface: IDallEModelOptions

Options block scoped to DALL-E family models.

**Extends:** `INamedModelFamilyConfig`

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

[provider](./IDallEModelOptions.provider.md)

</td><td>

`readonly`

</td><td>

"openai"

</td><td>

Discriminator: openai provider lineage.

</td></tr>
<tr><td>

[family](./IDallEModelOptions.family.md)

</td><td>

`readonly`

</td><td>

"dall-e"

</td><td>

Family identifier.

</td></tr>
<tr><td>

[models](./IDallEModelOptions.models.md)

</td><td>

`readonly`

</td><td>

[DallEModelNames](../type-aliases/DallEModelNames.md)[]

</td><td>

Optional model names this block applies to.

</td></tr>
<tr><td>

[config](./IDallEModelOptions.config.md)

</td><td>

`readonly`

</td><td>

[IDallEImageGenerationConfig](IDallEImageGenerationConfig.md)

</td><td>

Family-specific config.

</td></tr>
</tbody></table>
