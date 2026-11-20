[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / analyzePromptCacheStability

# Function: analyzePromptCacheStability()

> **analyzePromptCacheStability**(`params`): readonly [`IPromptCacheFinding`](../interfaces/IPromptCacheFinding.md)[]

Runs the prompt-cache stability diagnostics (design.md §9, checks D1–D5)
over a resolve's already-computed composition and trace.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IPromptCacheStabilityAnalysisParams`](../interfaces/IPromptCacheStabilityAnalysisParams.md) |

## Returns

readonly [`IPromptCacheFinding`](../interfaces/IPromptCacheFinding.md)[]

## Remarks

Purely computational — no provider is consulted and nothing is emitted.
Findings report problems only; a wholly cacheable, well-ordered,
above-threshold prefix yields an empty array.
