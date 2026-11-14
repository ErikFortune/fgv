[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / PromptCacheStabilityOrigin

# Type Alias: PromptCacheStabilityOrigin

> **PromptCacheStabilityOrigin** = `"authored"` \| `"call-site"` \| `"derived"`

Where a stability claim came from.

## Remarks

`'authored'` — declared on [IPromptSlot.cacheStability](../interfaces/IPromptSlot.md#property-cachestability).
`'call-site'` — declared on [IPromptResolveRequest.cacheStability](../interfaces/IPromptResolveRequest.md#property-cachestability),
which wins over an authored claim unconditionally.
`'derived'` — computed by the library itself from resolve-time evidence
(the template/preface default, and any downgrade a refutation check
applies), not declared by anyone. Refutation is an outcome, not an
origin — a refuted hint keeps its original origin and has its
`stability` lowered; only a claim that was never declared at all (the
template/preface default) carries `'derived'` as its origin. A finding
against the template default after an earlier refutation already lowered it
(the conditional-body check's competing-candidate finding) claims that
lowered level, still with origin `'derived'`.
