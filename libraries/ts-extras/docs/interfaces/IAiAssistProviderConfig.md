[Home](../README.md) > IAiAssistProviderConfig

# Interface: IAiAssistProviderConfig

Configuration for a single AI assist provider.

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

[provider](./IAiAssistProviderConfig.provider.md)

</td><td>

`readonly`

</td><td>

[AiProviderId](../type-aliases/AiProviderId.md)

</td><td>

Which provider this configures

</td></tr>
<tr><td>

[secretName](./IAiAssistProviderConfig.secretName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

For API-based providers: the keystore secret name holding the API key

</td></tr>
<tr><td>

[model](./IAiAssistProviderConfig.model.md)

</td><td>

`readonly`

</td><td>

[ModelSpec](../type-aliases/ModelSpec.md)

</td><td>

Optional model override — string or context-aware map.

</td></tr>
<tr><td>

[tools](./IAiAssistProviderConfig.tools.md)

</td><td>

`readonly`

</td><td>

readonly [IAiToolEnablement](IAiToolEnablement.md)[]

</td><td>

Tool enablement/configuration.

</td></tr>
<tr><td>

[endpoint](./IAiAssistProviderConfig.endpoint.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional caller-supplied endpoint URL (http/https).

</td></tr>
</tbody></table>
