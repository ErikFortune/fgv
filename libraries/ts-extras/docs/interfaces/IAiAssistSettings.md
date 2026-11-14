[Home](../README.md) > IAiAssistSettings

# Interface: IAiAssistSettings

AI assist settings — which providers are enabled and their configuration.

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

[providers](./IAiAssistSettings.providers.md)

</td><td>

`readonly`

</td><td>

readonly [IAiAssistProviderConfig](IAiAssistProviderConfig.md)[]

</td><td>

Enabled providers and their configuration.

</td></tr>
<tr><td>

[defaultProvider](./IAiAssistSettings.defaultProvider.md)

</td><td>

`readonly`

</td><td>

[AiProviderId](../type-aliases/AiProviderId.md)

</td><td>

Which enabled provider is the default for the main button.

</td></tr>
<tr><td>

[proxyUrl](./IAiAssistSettings.proxyUrl.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional proxy URL for routing API requests through a backend server (e.g.

</td></tr>
<tr><td>

[proxyAllProviders](./IAiAssistSettings.proxyAllProviders.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

When true, route all providers through the proxy.

</td></tr>
</tbody></table>
