[Home](../README.md) > IAiProviderDescriptor

# Interface: IAiProviderDescriptor

Describes a single AI provider — single source of truth for all metadata.

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

[id](./IAiProviderDescriptor.id.md)

</td><td>

`readonly`

</td><td>

[AiProviderId](../type-aliases/AiProviderId.md)

</td><td>

Provider identifier (e.g.

</td></tr>
<tr><td>

[label](./IAiProviderDescriptor.label.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable label (e.g.

</td></tr>
<tr><td>

[buttonLabel](./IAiProviderDescriptor.buttonLabel.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Button label for action buttons (e.g.

</td></tr>
<tr><td>

[needsSecret](./IAiProviderDescriptor.needsSecret.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this provider requires an API key secret

</td></tr>
<tr><td>

[apiFormat](./IAiProviderDescriptor.apiFormat.md)

</td><td>

`readonly`

</td><td>

[AiApiFormat](../type-aliases/AiApiFormat.md)

</td><td>

Which API adapter format to use

</td></tr>
<tr><td>

[baseUrl](./IAiProviderDescriptor.baseUrl.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Base URL for the API (e.g.

</td></tr>
<tr><td>

[defaultModel](./IAiProviderDescriptor.defaultModel.md)

</td><td>

`readonly`

</td><td>

[ModelSpec](../type-aliases/ModelSpec.md)

</td><td>

Default model specification — string or context-aware map.

</td></tr>
<tr><td>

[supportedTools](./IAiProviderDescriptor.supportedTools.md)

</td><td>

`readonly`

</td><td>

readonly "web_search"[]

</td><td>

Which server-side tools this provider supports (empty = none).

</td></tr>
<tr><td>

[corsRestricted](./IAiProviderDescriptor.corsRestricted.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this provider's API enforces CORS restrictions that prevent direct browser calls.

</td></tr>
<tr><td>

[streamingCorsRestricted](./IAiProviderDescriptor.streamingCorsRestricted.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this provider's streaming completion endpoint requires a proxy
for direct browser calls.

</td></tr>
<tr><td>

[acceptsImageInput](./IAiProviderDescriptor.acceptsImageInput.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this provider's chat completions API accepts image input
(i.e.

</td></tr>
<tr><td>

[imageGeneration](./IAiProviderDescriptor.imageGeneration.md)

</td><td>

`readonly`

</td><td>

readonly [IAiImageModelCapability](IAiImageModelCapability.md)[]

</td><td>

Image-generation capabilities, scoped to model id prefixes.

</td></tr>
</tbody></table>
