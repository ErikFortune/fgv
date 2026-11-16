[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / AiCacheReportingLevel

# Type Alias: AiCacheReportingLevel

> **AiCacheReportingLevel** = `"reads"` \| `"reads-and-writes"`

What a provider's wire shape is able to report about prompt-cache usage,
given that a usage block was present on the response at all.

## Remarks

`'reads'` — cache reads are reported; cache writes cannot be (either the API
has no write concept, or the field structurally does not exist on this route).
`'reads-and-writes'` — both reads and writes are reported.

There is deliberately no `'none'` member: "no usage was reported at all" is
already expressed by [AiAssist.IAiCompletionResponse.usage](../interfaces/IAiCompletionResponse.md#property-usage) itself
being absent, and a third value here would be a second, reachable-only-via-
bug way to say the same thing — check `usage === undefined`, not a `reports`
value, to detect that case.

See [AiAssist.IAiCompletionUsage.reports](../interfaces/IAiCompletionUsage.md#property-reports) for why this is required
rather than optional.
