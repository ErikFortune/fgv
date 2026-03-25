[Home](../../README.md) > [AiAssist](../README.md) > IAiWebSearchToolConfig

# Interface: IAiWebSearchToolConfig

Configuration specific to web search tools.

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

[type](./IAiWebSearchToolConfig.type.md)

</td><td>

`readonly`

</td><td>

"web_search"

</td><td>



</td></tr>
<tr><td>

[allowedDomains](./IAiWebSearchToolConfig.allowedDomains.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Optional: restrict search to these domains.

</td></tr>
<tr><td>

[blockedDomains](./IAiWebSearchToolConfig.blockedDomains.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Optional: exclude these domains from search.

</td></tr>
<tr><td>

[maxUses](./IAiWebSearchToolConfig.maxUses.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Optional: max number of searches per request.

</td></tr>
<tr><td>

[enableImageUnderstanding](./IAiWebSearchToolConfig.enableImageUnderstanding.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Optional: enable image understanding during web search.

</td></tr>
</tbody></table>
