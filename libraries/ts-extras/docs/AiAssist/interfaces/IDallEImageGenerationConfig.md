[Home](../../README.md) > [AiAssist](../README.md) > IDallEImageGenerationConfig

# Interface: IDallEImageGenerationConfig

Provider-specific config for DALL-E models (dall-e-2, dall-e-3).

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

[size](./IDallEImageGenerationConfig.size.md)

</td><td>

`readonly`

</td><td>

"256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792"

</td><td>

Image dimensions (dall-e-2: 256x256|512x512|1024x1024; dall-e-3: 1024x1024|1792x1024|1024x1792).

</td></tr>
<tr><td>

[quality](./IDallEImageGenerationConfig.quality.md)

</td><td>

`readonly`

</td><td>

[DallE3Quality](../../type-aliases/DallE3Quality.md)

</td><td>

dall-e-3 only.

</td></tr>
<tr><td>

[style](./IDallEImageGenerationConfig.style.md)

</td><td>

`readonly`

</td><td>

"vivid" | "natural"

</td><td>

dall-e-3 only.

</td></tr>
</tbody></table>
