[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / toCacheRequest

# Function: toCacheRequest()

> **toCacheRequest**(`composition`, `hints?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiCacheRequest`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\>

Builds an `AiAssist.IAiCacheRequest` (from `@fgv/ts-extras`) — a prompt-caching plan for
`ai-assist`'s completion adapters — from a resolved composition's per-section effective
stability.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `composition` | [`IPromptComposition`](../interfaces/IPromptComposition.md) | A composition from a resolve requested with `{ composition: {...} }`. `IPromptSection.effectiveStability` must be present on its sections — always true for a composition this package produced; a hand-built one lacking it is treated as `'per-request'` per R-a (the default), never upgraded. |
| `hints?` | [`IToCacheRequestHints`](../interfaces/IToCacheRequestHints.md) | Optional cap and cache-routing key; see [IToCacheRequestHints](../interfaces/IToCacheRequestHints.md). |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiCacheRequest`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\>

## Remarks

**Dependency direction (design F1).** This function lives here, not in `ai-assist`, because the
cache-plan *type* (`AiAssist.IAiCacheRequest`) belongs in `ai-assist` — it is made of `number`
and `string`, and is usable by a caller with no `ts-prompt-assist` dependency at all — while
deriving *this* plan from a resolve's stability annotations is exactly the analysis
`ts-prompt-assist` already owns (`computeCacheStabilityAnalysis`, design.md §9). `ai-assist`
cannot depend the other way; the package graph makes that a build failure, not a discipline
problem (see design.md §0 F1).

**Fails when `composition.unavailable` is set** — there is no section map to derive breakpoints
from, and returning an empty-but-valid plan would silently mask that the composition itself
failed to segment, rather than say so. A composition with zero sections but no `unavailable`
reason (a genuinely empty resolved body) is not an error: it yields a plan with no
`systemBreakpoints`, the same request body a caller omitting `cache` entirely would send.

**Offsets are into `composition`'s own body**, i.e. `AiPrompt.system` / `IChatRequest.system`
when the caller sends the whole resolved body as the system prompt (design.md §6.1) — the same
currency `IPromptSection.start` already reports.
