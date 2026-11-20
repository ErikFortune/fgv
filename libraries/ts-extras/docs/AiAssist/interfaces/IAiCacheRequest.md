[Home](../../README.md) > [AiAssist](../README.md) > IAiCacheRequest

# Interface: IAiCacheRequest

A request-level prompt-caching plan.

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

[systemBreakpoints](./IAiCacheRequest.systemBreakpoints.md)

</td><td>

`readonly`

</td><td>

readonly number[]

</td><td>

Strictly ascending UTF-16 offsets into `AiPrompt.system` (equivalently
`IProviderCompletionParams.system`), each marking the end of a cacheable prefix.

</td></tr>
<tr><td>

[cacheKey](./IAiCacheRequest.cacheKey.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Opaque cache-routing key, sent where the provider has one and by that provider's transport:
`prompt_cache_key` as a body field on OpenAI (both routes) and on xAI Responses, and an
`x-grok-conv-id` header on xAI Chat Completions.

</td></tr>
</tbody></table>
