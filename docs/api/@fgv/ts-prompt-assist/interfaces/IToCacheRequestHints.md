[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IToCacheRequestHints

# Interface: IToCacheRequestHints

Caller-supplied inputs to [toCacheRequest](../functions/toCacheRequest.md) beyond the composition itself.

## Remarks

Neither field has a home in `@fgv/ts-prompt-assist` — per design F1 the dependency direction is
one-way (`ai-assist` never learns this package exists), so a model-keyed write cap
(`AiAssist.IAiCacheCapability`, when it exists) and a cache-routing key are always the caller's
to supply, resolved against whatever provider/model the caller is about to send this request to.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-cachekey"></a> `cacheKey?` | `readonly` | `string` | Passed straight through to `AiAssist.IAiCacheRequest.cacheKey` (from `@fgv/ts-extras`). |
| <a id="property-maxbreakpointwrites"></a> `maxBreakpointWrites?` | `readonly` | `number` | Cap on the number of breakpoints to emit, when the caller knows the target model's write limit. Omitted means no cap is enforced here — validated (fail-loud, never a silent trim) by `AiAssist.validateCacheBreakpoints` (from `@fgv/ts-extras`). See that function's remarks for why an omitted cap is not a soundness gap: the three-level `PromptCacheStability` vocabulary never yields more than two breakpoints (design.md §5.2). |
