[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / checkTaskPrompt

# Function: checkTaskPrompt()

> **checkTaskPrompt**(`params`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICheckedTaskPrompt`](../interfaces/ICheckedTaskPrompt.md)\>\>

Resolves a task prompt and checks that what will be sent is what was analyzed.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`ICheckTaskPromptParams`](../interfaces/ICheckTaskPromptParams.md) |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICheckedTaskPrompt`](../interfaces/ICheckedTaskPrompt.md)\>\>

## Remarks

Resolves with a composition, supplying the context's text as the task-context slot, then fails
unless every one of these holds:

1. **Composition is positively available.** A composition is present, carries no `unavailable`
   reason, and its sections are contiguous, gapless and cover the body exactly. An empty
   `cacheFindings` is never taken as evidence of analysis — an unavailable composition has one.
2. **The task slot is the one trailing per-request section, carrying the full context once.**
   Exactly one section is the task slot; it is the last section; its text is the context's text
   exactly; it came from this substitution (not an enforced binding, a default or anything else);
   its effective stability is `'per-request'`; and the context text occurs in the body only there.
3. **A stable prefix exists ahead of it.** The slot does not start at offset 0.
4. **No cache finding is left unhandled.** `stability-refuted`, `cache-hostile-ordering`,
   `no-cacheable-prefix` and any kind this helper does not know fail the check;
   `threshold-unknown` and `below-threshold` are classified in `threshold` instead.
5. **The breakpoint plan ends at the task slot.** `toCacheRequest` succeeds on the same
   composition and its last system breakpoint is the task slot's start.

The receipt is never placed in the body, a substitution or the request; it is released only by
[ICheckedTaskPrompt.receiptFor](../interfaces/ICheckedTaskPrompt.md#receiptfor). Checking acknowledges nothing.

**The context is trusted to be one render.** The check binds the context's *text* to the body;
that its *receipt* describes that text is the renderer's guarantee, which holds for a context
passed as it was rendered. A host that assembles a context from two renders defeats it.
[prepareTaskPrompt](prepareTaskPrompt.md) takes the context from the delivery that issued it, so on that path
nothing is assembled by the host.
