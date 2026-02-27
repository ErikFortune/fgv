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

AiProviderId

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

string

</td><td>

Optional model override (provider has a default)

</td></tr>
</tbody></table>
