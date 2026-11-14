[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / HorizontalComposer

# Class: HorizontalComposer

First-class horizontal (multi-contributor) prompt-slot composer.

## Remarks

Each contributor is resolved independently via `PromptLibrary.resolve`; the
composer reads the per-contributor [IResolvedPrompt.slots](../interfaces/IResolvedPrompt.md#property-slots) view and
merges contributions into a composed prompt's logical-slot space. It is the
**safety-closed** home for horizontal composition: unlike a consumer-side
external composer (which bypasses the resolver's `applySafeguards` pass), the
composer runs `applySafeguards` against a first-class composed descriptor over
the merged slot map before rendering.

Merge rules (directive-aware) per logical slot:
- Contributions are ordered by ascending provenance (declared order in
  `contributorSlots` is a stable tiebreaker among equal provenance).
- `constraint`-directive contributions are **always concatenated first and
  never dropped**, regardless of the slot's strategy.
- Non-constraint contributions then apply the declared strategy on top of the
  constraint block: `'concatenate'` joins all (ascending) with the separator;
  `'overwrite'` keeps only the highest-provenance non-constraint.

Logical-slot processing order is NOT semantically binding — independent slots
may be processed in any order. `IHorizontalComposeParams.logicalSlots`
declared order is a tiebreaker for topo-equal slots only, preserving room for
a future dependency topo-sort (phase B+1) to reorder without a breaking change.

## Methods

### compose()

> **compose**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IComposedPrompt`](../interfaces/IComposedPrompt.md)\>\>

Performs the directive-aware merge, runs the safeguard boundary over the
merged slot values (with the composed descriptor), renders the composed
body template, and returns the [IComposedPrompt](../interfaces/IComposedPrompt.md).

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IComposedPrompt`](../interfaces/IComposedPrompt.md)\>\>

The composed prompt on success; a failure if a merged value
violates a hard policy (length cap, disallowed directive, or a screener
reject) or rendering fails.

#### Remarks

When [IHorizontalComposeParams.observation](../interfaces/IHorizontalComposeParams.md#property-observation) is supplied, the merge is
timed and a `'compose'` observation record — nesting each contributor's
resolve trace and sharing the library's `seq` space — is built and awaited
through the library's observer fan-out before this returns. When it is
absent, this is the pre-existing fast path: no timing, no record, no
dispatch.

***

### create()

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`HorizontalComposer`\>

Validates the logical-slot map against the supplied contributors and
returns a ready composer. Build-time validation (synchronous, cheap):
- contributor provenance values are unique (provenance is the contributor key);
- logical-slot names are unique (a duplicate would silently overwrite an
  earlier merge / trace);
- every `logicalSlotName` is declared in `composedDescriptor.slots` (an
  undeclared logical slot would be merged and rendered but skipped by the
  `applySafeguards` / `allowedDirectives` pass — defeating the safety closure);
- every `contributorSlots` entry references a contributor that exists (by
  `contributorProvenance`);
- every referenced slot appears on that contributor's
  [IResolvedPrompt.slots](../interfaces/IResolvedPrompt.md#property-slots).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IHorizontalComposeParams`](../interfaces/IHorizontalComposeParams.md) | [IHorizontalComposeParams](../interfaces/IHorizontalComposeParams.md). |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`HorizontalComposer`\>

A HorizontalComposer on success, or a contextual failure.
