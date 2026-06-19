# Design brief: horizontal (multi-contributor) prompt-slot composition

**Stream:** `prompt-assist-horizontal-composition`. Integration branch off `release`. Commissioned 2026-06-07 (Erik).
**This task:** a **design pass only** (senior-developer). Produce `.ai/tasks/active/prompt-assist-horizontal-composition/design.md` — a decision-grade design of horizontal multi-contributor prompt composition for `@fgv/ts-prompt-assist`, with an A-vs-B recommendation, the primitive surface, the safety/lift boundary, and a phased plan. No implementation.
**Origin:** request from the PersonAIlity orchestrator (a downstream ts-prompt-assist consumer).

## The request (from the consumer)

ts-prompt-assist provides **vertical** composition: a slot's value resolves from an inner resource, recursively (shipped, tested — depth cap, RFC-8785 cycle detection, rolled-up inner trace). The consumer needs **horizontal** composition: one prompt assembled from **N independently-authored, independently-owned contributor descriptors** sharing a logical slot space, where multiple contributors may contribute to the same logical slot, ordered by a **per-contributor provenance priority**. This generalizes the message-role model (system / developer / user) — a broad, recurring pattern.

Mechanism (full, from the consumer):
- **Contributors** — N peer descriptors, each independently resolvable (own qualifiers → own candidates; own substitutions fill own slots).
- **Shared logical slot space via an explicit map** — `logicalSlot ← [contributorA.slotX, contributorB.slotX, …]`. Explicit, **not** name-matching (name-matching couples independent authors onto a shared vocabulary — an implicit-dependency failure mode; an explicit map + build-time validation turns every implicit dependency into a checked reference).
- **Provenance is a per-contributor property, not a qualifier axis** — contributions to one logical slot merge in provenance order; provenance never participates in candidate selection.
- **Directive-aware merge** — each contribution carries a directive (`constraint` / `hint` / `prose`). A `constraint` composes deterministically and is never dropped or adjudicated away; `hint`/`prose` may blend (future: model-synthesized).
- **Strategies** map onto the existing partial/complete vocabulary: `concatenate = partial`, `overwrite = complete`. A future `rewrite = model-synthesis` strategy is out of scope now but must not be precluded.
- **Timing: render-then-merge** — each contributor resolves+substitutes first (→ rendered per-slot values); then the horizontal merge combines rendered per-slot values across contributors. (Consumer rejected merge-then-render: its only extra power is sub-slot provenance that whole-phrase contributions don't exercise; messier cache key; incompatible with future model-synthesis; render-then-merge is `isPartial` lifted vertical→horizontal.)

The consumer asks for either **(A)** the primitives to build the composer on top of ts-prompt-assist, or **(B)** a first-class implementation in fgv.

## Code-grounded analysis (verified on `release` — start here, confirm/extend)

Read `libraries/ts-prompt-assist/src/packlets/{resolve,types,converters}/` — esp. `resolve/promptLibrary.ts` (`resolve`, `describe`, `_renderResolved`, the safeguard application), `types/trace.ts` (`IPromptResolveTrace`, `IBindingTraceEntry`, `IResolvedPrompt`), `types/slot.ts` + `types/descriptor.ts` (`IPromptSlot`, `IPromptDescriptor.slots`), `converters/descriptorConverter.ts` (`isPartial`), `resolve/bindingMerger.ts`, and the safeguard pipeline. **More of Option A already exists than the consumer assumed:**

- **`directive` (`'constraint' | 'hint' | 'prose'`)** — exists (`types/enums.ts:41`), already on every resolved slot (`IBindingTraceEntry.directive`, `trace.ts:38`). Consumer primitive #2 is present today.
- **`isPartial`** — exists as an optional boolean on the descriptor/candidate (`descriptorConverter.ts:152/174`). Consumer primitive #3 (partial/complete) is real, just **not surfaced on the resolved output** yet. NOTE: it is **descriptor/candidate-level, not per-slot** — the consumer's model wants per-logical-slot strategy; reconcile the granularity.
- **Slot declarations are already public** — `PromptLibrary.describe(id)` (public) returns `IPromptDescriptor` whose `.slots: IPromptSlot[]` carry name + directive. So **the build-time map validation the consumer flagged as "the one capability a consumer-side build can't fake" is buildable on `describe().slots` today** — this removes their strongest stated argument for B.
- **Per-slot resolved values** — `trace.mergedBindings: ReadonlyMap<SlotName, IBindingTraceEntry>` carries each slot's resolved `value` + `directive`. The render is a **single pass over the body template** with slot values as substitution context (`_renderResolved` → `template.validateAndRender(_buildRenderContext(finalMerged))`); slot values are inserted literally and **NOT themselves re-rendered**. So for *leaf* slot content, `mergedBindings[slot].value` is the final rendered per-slot string. **Gap:** if a contributor slot value itself contains `{{…}}`, it is not rendered (single-pass limitation) — relevant to render-then-merge correctness.

So the **real Option-A gap is small**: a clean, supported public **`IResolvedPrompt.slots`** view (promote value + directive + isPartial out of `trace.mergedBindings`), plus possibly a **per-slot render**.

### The decisive argument for B (which the consumer under-weighted): safety-pipeline integrity
`resolve` runs the **safeguard pass** (screeners, length cap, anti-jailbreak preface) over the **resolved whole**. If a consumer reads per-slot values and merges N contributors **externally**, the composed prompt **never passes through that pass as a unit** — and the core property ("all constraints apply, none negotiable") *is* a safety property. A horizontal composer that bypasses safeguards on its output is structurally unsafe. This says the **durable home is fgv** far more than build-time validation does.

### Orchestrator's leaning recommendation (evaluate, agree or refute)
**Trailblaze-then-lift (A-now → B-later), with the lift treated as non-optional and safety-gated** — matching the repo's own proven pattern (ts-prompt-assist itself was trailblazed-then-lifted):
- **A now:** expose the minimal *liftable* set — the public `slots` view (value + directive + isPartial) and, if needed, per-slot render. Consumer builds the generic composer (zero domain types). `describe().slots` already unblocks map validation. **Interim risk to call out loudly:** pure-A bypasses the safeguard pass on the merged whole — the consumer must re-screen the merged result until the lift.
- **B later:** lift the composer into fgv once the shape is proven; *that* is where safety closes (the first-class composer re-runs the merged output through the safeguard pipeline) and where build-time validation of the explicit logical-slot map against contributor slot declarations gets a durable home.

## Forward-looking roadmap item — dependency-ordered render-merge-reinject (Erik, 2026-06-07)
Render-then-merge loses cross-slot placeholders (a slot value referencing another logical slot). Erik's idea to preserve them: render in **dependency order** — render all layers' contributions to slot A, horizontally merge A, then re-inject merged A into B's render (so B's `{{A}}` resolves to the merged A). This is **topological-sort rendering**: extract each slot value's `{{…}}` references → build a slot-dependency DAG → render+merge in topo order. It requires **acyclicity validation** — and is the *horizontal analogue of the vertical recursion that already ships*, so the existing **RFC-8785 cycle-detection machinery is directly reusable**. Treat as **phase-2 / roadmap** (likely too big for phase 1), but design phase-1 so it does not preclude this (e.g. don't bake in "render is wholly independent per contributor" so deep that topo-ordering can't be added).

## Design questions the doc must answer
1. **A vs B vs hybrid** — recommend, with reasoning that weighs safety, generality (message-role model), build-time validation (now known buildable on `describe()`), and the repo's trailblaze-then-lift discipline.
2. **The primitive surface** — the exact `IResolvedPrompt.slots` shape; whether per-slot render is needed for phase-1 correctness; how `isPartial` (descriptor-level) maps to the per-logical-slot strategy the model wants (add per-slot strategy? derive?).
3. **The composer shape** (if B / at lift) — contributors + explicit logical-slot map + per-slot strategy + provenance order + directive-aware merge + build-time map validation; the safeguard-pass boundary on the merged output.
4. **Provenance modeling** — confirm it stays out of candidate selection (a per-contributor property), preserving the ts-res qualifier model. The consumer has this right; verify nothing in the design leaks provenance into qualifier matching.
5. **Roadmap placement** of dependency-ordered render-merge-reinject + reuse of the existing cycle-detection machinery; what phase-1 must avoid precluding.
6. **Phased plan** (S/M/L per phase), aligned to how this repo runs streams.

## Deliverable
`design.md` answering the above, decision-grade, citing ts-prompt-assist files/lines. Plus a short `README.md` if useful. Design-only — no `rushx build/test` (no code). PR into `prompt-assist-horizontal-composition` (or commit + report). Report: the A/B/hybrid recommendation, the primitive surface, the safety/lift boundary, the roadmap placement of the topo-ordered extension, and any genuinely open questions for the orchestrator/consumer.
