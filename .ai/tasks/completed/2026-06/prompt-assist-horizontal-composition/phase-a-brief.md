# Phase-A brief: `IResolvedPrompt.slots` primitive

**Stream:** `prompt-assist-horizontal-composition` (Phase A — the resolution-boundary primitive). Sub-branch off this integration branch; PR INTO it.
**Status:** GREENLIT — consumer accepted A-Now/B-Committed and acknowledged OQ-1 (interim safety gap; they self-screen merged outputs until Phase B). Phase A is independent of the phase-B OQs.
**Spec:** implement exactly the design's **§2a "`IResolvedPrompt.slots` — what to expose"** in `.ai/tasks/active/prompt-assist-horizontal-composition/design.md`. Read §2a and §2b before coding.

## Scope (pure additive, ~S)

1. **Add `IResolvedPromptSlot`** to `libraries/ts-prompt-assist/src/packlets/types/trace.ts` exactly per design §2a (line ~87): `name`, `value`, `directive`, `source`, `wasEnforced`, `winningScope?`. (These are the same fields as `IBindingTraceEntry` plus `name` — it's the supported, stable projection of what's already in `trace.mergedBindings`.)
2. **Add `readonly slots: ReadonlyMap<SlotName, IResolvedPromptSlot>`** to `IResolvedPrompt`.
3. **Populate it in `_renderResolved`** (`resolve/promptLibrary.ts`, the `succeed<IResolvedPrompt>({...})` block at ~1085–1092) by mapping `finalMerged` entries → `IResolvedPromptSlot`. Small loop / map allocation, no other runtime cost. The `value` for a `kind: 'resource'` slot is already the rendered inner-prompt body (resource-binding rewrites are folded into `finalMerged` before this point) — so no special-casing.
4. **`isPartial` does NOT go on the slot** (design §2b) — it's candidate-level vertical-composition state, not the horizontal per-slot merge strategy. Do not add it here.
5. **No per-slot render** — phase 1 keeps the single-pass model; cross-slot `{{…}}` resolution is phase B+1, explicitly out of scope (consumer confirmed they don't author cross-slot refs today).

## TSDoc — the load-bearing interim-safety callout

On both `IResolvedPromptSlot` and the `IResolvedPrompt.slots` field, state clearly: these per-slot values are the **resolved, single-pass-rendered** content (the exact strings that would be substituted into the body), exposed for **composition** patterns. **A consumer that reads `slots` and assembles a prompt *externally* bypasses the `applySafeguards` pass that `resolve` runs over the resolved whole — such a consumer must self-screen the composed output.** (The in-fgv `HorizontalComposer` of phase B is what closes this; reference it as the durable path.)

## Tests (100% coverage)

- `slots` is populated for every declared slot, keyed by `SlotName`, with `value`/`directive`/`source`/`wasEnforced`/`winningScope` matching the corresponding `trace.mergedBindings` entry (they're the same data, projected).
- A `kind: 'resource'` slot's `slots[s].value` equals the rendered inner-prompt body (not a placeholder).
- An empty/`source: 'empty'` slot surfaces with `directive: 'prose'` per the existing trace semantics.
- A `wasEnforced` slot reflects `true`.

## Docs

- `LIBRARY_CAPABILITIES.md` ts-prompt-assist entry: add the "resolved slots, not concatenated" answer — point consumers at `IResolvedPrompt.slots` (`value` + `directive` per slot) for structured/horizontal composition, with the self-screen caveat.

## Gates

`rushx build` + `rushx lint` + `rushx test` (100% coverage) in `@fgv/ts-prompt-assist`; regenerate `etc/ts-prompt-assist.api.md` (this IS a public-surface addition — confirm the api report updates additively); `rush change` file (`@fgv/ts-prompt-assist`, type `none`); `rushx fixlint`; `code-reviewer` on the diff before coverage closure. PR into `prompt-assist-horizontal-composition`. Report: the added surface, the api.md delta, and confirmation it's purely additive (no changed/removed exports).
