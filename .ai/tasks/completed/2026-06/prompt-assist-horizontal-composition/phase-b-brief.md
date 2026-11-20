# Phase-B brief: `HorizontalComposer`

**Stream:** `prompt-assist-horizontal-composition` (Phase B). **Branch:** sub-branches off `prompt-assist-phase-b`; PR INTO `prompt-assist-phase-b`. (Orchestrator merges `prompt-assist-phase-b` → the integration branch `prompt-assist-horizontal-composition` if it lands in time to ship A+B together; else retargets it to `release`.)
**Status:** GREENLIT. All phase-B OQs resolved (composed descriptor YAML-authored; `ILogicalSlotConfig` code-first; separator `'\n\n'` per-slot overridable). Phase A (`IResolvedPrompt.slots`) shipped and is the input.
**Spec:** implement the design's **§3 (3a–3e)** and the **"Phase B"** scope list in `.ai/tasks/active/prompt-assist-horizontal-composition/design.md`. Read §3 in full before coding — it carries the exact types and algorithm.

## Scope (M, deterministic — no live/empirical element)

- **`types/composition.ts`** — `IContributorSpec`, `ILogicalSlotStrategy`, `ILogicalSlotConfig`, `IHorizontalComposeParams`, `ISlotProvenanceEntry`, `IComposedPrompt`, exactly per design §3a.
- **`HorizontalComposer`** (new `composition/` packlet, or `resolve/horizontalComposer.ts` — follow existing packlet structure):
  - `static create(params: IHorizontalComposeParams): Result<HorizontalComposer>` — runs **build-time map validation** (§3b) at construction: every `ILogicalSlotConfig.contributorSlots` entry resolves to an existing contributor (by `contributorProvenance`) and an existing slot on that contributor's `resolved.slots`; fail with clear, contextual messages.
  - `async compose(): Promise<Result<IComposedPrompt>>` — **directive-aware merge** (§3c) → **`applySafeguards`** on the merged slot map (§3d) → Mustache render of the composed descriptor body (reuse the `MustacheTemplateCache` pattern) → `IComposedPrompt` (body + merged slots + `provenanceTrace`).
- **Directive-aware merge (§3c) — the correctness core:** per logical slot, gather contributions in **provenance-ascending** order; **`constraint` contributions concatenate first and are NEVER dropped** regardless of strategy; non-constraint contributions then apply the declared `ILogicalSlotConfig.strategy` (`concatenate` with separator / `overwrite` = highest-provenance wins) on top of the constraint block. Record per-logical-slot `ISlotProvenanceEntry[]` in `provenanceTrace`.
- **Safeguard boundary (§3d):** `applySafeguards(composedDescriptor, mergedSlotMap, safetyPolicy)` — screens merged values against the **composed** descriptor's slot declarations (maxLength, allowedDirectives) + safeguard overrides. A reject finding fails `compose`; warn/info findings surface on the trace. This is the in-fgv closure of the safety gap phase A left open.
- **`compositionConverter` — DEFER** (consumer code-authors `ILogicalSlotConfig[]` per OQ-3). Do not build the YAML converter for v0.1.

## LOAD-BEARING forward-compat guard (design §"phase-1 must not preclude")
**Do NOT make `IHorizontalComposeParams.logicalSlots` declared order semantically binding.** Process independent slots in any order; document the declared order strictly as a **"tiebreaker for topo-equal slots"**, NOT the semantic processing order. Phase B+1 (topo-sort render-merge-reinject) replaces declared-order with topo-order; if B implementation hard-codes "process in declared order" as the guarantee, B+1 becomes a breaking change. Keep the door open from the start.

## Docs
- Update the **phase-A interim-risk callout** on `IResolvedPromptSlot` / `IResolvedPrompt.slots` TSDoc: the safety gap is now **closed by `HorizontalComposer`** (point external composers at it as the safe path).
- `LIBRARY_CAPABILITIES.md`: replace the phase-A "resolved slots" note with the full `HorizontalComposer` entry (contributors + explicit logical-slot map + per-slot strategy + provenance order + directive-aware merge + the safeguard closure).

## Tests (100% coverage)
Build-time validation failures (missing contributor provenance; unknown contributor slot); directive-aware merge corner cases (a slot with constraints from ≥2 contributors + a hint → constraints concatenated provenance-ascending first, then hint per strategy; **constraint survives even under `overwrite`**); mixed-directive slots; `concatenate` (default `'\n\n'` + per-slot override) and `overwrite` (highest-provenance non-constraint wins, constraints still prepended); provenance ordering (reorder contributors → output reorders); **`applySafeguards` rejection on merged values** (over-maxLength / disallowed directive → `Result.fail`; warn surfaces on trace); `provenanceTrace` accuracy; `IComposedPrompt` shape; empty/missing contribution for a logical slot.

## Gates
`rushx build` + `rushx lint` + `rushx test` (100%) in `@fgv/ts-prompt-assist`; regenerate `etc/ts-prompt-assist.api.md` (large additive surface — confirm additive, no changed/removed exports); `rush change` (`@fgv/ts-prompt-assist`, type `none`); `rushx fixlint`; `code-reviewer` on the diff before coverage closure. PR into `prompt-assist-phase-b`. Report: the surface added, api.md delta, the merge/safeguard test evidence, and confirmation it's purely additive.

## Note (residual risk, build clean)
The design recommended lifting B *after* the consumer proves the external composer shape on phase A. We're building now on the strength of the (consumer-accepted) design — so build it to the design exactly; the consumer's first adoption is the battle-test. If you hit a genuine fork the design doesn't resolve, document it in the PR for orchestrator ratification rather than guessing.
