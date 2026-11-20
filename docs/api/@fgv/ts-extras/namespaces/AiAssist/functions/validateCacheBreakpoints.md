[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / validateCacheBreakpoints

# Function: validateCacheBreakpoints()

> **validateCacheBreakpoints**(`systemLength`, `cache`, `maxBreakpointWrites?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiCacheRequest`](../interfaces/IAiCacheRequest.md)\>

Validates an [IAiCacheRequest](../interfaces/IAiCacheRequest.md)'s `systemBreakpoints` against the length of the `system`
string they index into, and optionally against a per-model write cap.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `systemLength` | `number` |
| `cache` | [`IAiCacheRequest`](../interfaces/IAiCacheRequest.md) |
| `maxBreakpointWrites?` | `number` |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiCacheRequest`](../interfaces/IAiCacheRequest.md)\>

## Remarks

**Fails loudly, never clamps** (design.md §6.1): a non-ascending, out-of-range, or over-cap
offset returns `fail()`. A silently-clamped breakpoint is precisely the silent, non-caching
failure this stream exists to remove. `systemLength` and `maxBreakpointWrites` are themselves
validated as non-negative integers — checked before `systemBreakpoints` even, so a malformed
value (`NaN`, a negative number, a fraction) fails loudly rather than silently passing every
offset check it should have rejected (`offset >= NaN` is always `false`) or, for the cap,
passing unnoticed on an empty offset list. `maxBreakpointWrites` is left to the caller to supply —
there is no model-keyed cap table in this package yet (design.md §7's `IAiCacheCapability` is
out of this slice's scope), and design.md §5.2 establishes that a caller producing breakpoints
from the three-level `PromptCacheStability` vocabulary never emits more than two, so an
omitted cap is not a soundness gap for that caller — only a direct caller supplying more than a
provider's cap would ever need one enforced here.

Takes a length rather than [validateAiCacheRequest](validateAiCacheRequest.md)'s `system` string because a caller
building a plan from an `@fgv/ts-prompt-assist` `IPromptComposition` (`totalChars`) has the
length without holding the resolved body text itself.
