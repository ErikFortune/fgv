[Home](../../README.md) > [AiAssist](../README.md) > IAiCompletionUsage

# Interface: IAiCompletionUsage

Token accounting for a completion, normalized across providers.

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

[reports](./IAiCompletionUsage.reports.md)

</td><td>

`readonly`

</td><td>

[AiCacheReportingLevel](../../type-aliases/AiCacheReportingLevel.md)

</td><td>

What this response's wire shape *can* report about caching.

</td></tr>
<tr><td>

[uncachedInputTokens](./IAiCompletionUsage.uncachedInputTokens.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Input tokens **not** served from cache.

</td></tr>
<tr><td>

[cachedInputTokens](./IAiCompletionUsage.cachedInputTokens.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Input tokens served from cache.

</td></tr>
<tr><td>

[cacheWriteTokens](./IAiCompletionUsage.cacheWriteTokens.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Input tokens written to cache.

</td></tr>
<tr><td>

[outputTokens](./IAiCompletionUsage.outputTokens.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Generated output tokens.

</td></tr>
<tr><td>

[totalInputTokens](./IAiCompletionUsage.totalInputTokens.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Total input = uncached + cached, when both are known.

</td></tr>
<tr><td>

[raw](./IAiCompletionUsage.raw.md)

</td><td>

`readonly`

</td><td>

JsonObject

</td><td>

The provider's own usage block, unnormalized, for anything this shape drops.

</td></tr>
</tbody></table>
