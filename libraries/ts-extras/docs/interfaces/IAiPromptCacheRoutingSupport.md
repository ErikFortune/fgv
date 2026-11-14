[Home](../README.md) > IAiPromptCacheRoutingSupport

# Interface: IAiPromptCacheRoutingSupport

How a provider carries an AiAssist.IAiCacheRequest.cacheKey on the wire.

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

[chatCompletionsHeader](./IAiPromptCacheRoutingSupport.chatCompletionsHeader.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Header name to carry the key on Chat Completions, or `undefined` when the provider takes it
as a `prompt_cache_key` body field there (OpenAI).

</td></tr>
</tbody></table>
