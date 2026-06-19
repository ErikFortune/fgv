# Design: Horizontal (Multi-Contributor) Prompt-Slot Composition

**Stream:** `prompt-assist-horizontal-composition`
**Phase:** Design only (no implementation)
**Author:** Senior Developer agent
**Date:** 2026-06-19

---

## Code-grounding summary (confirming / correcting the brief)

All citations are against `libraries/ts-prompt-assist/src/packlets/`.

**Confirmed — directive exists on every resolved slot.** `types/enums.ts:41` declares `SlotDirective = 'constraint' | 'hint' | 'prose'`. `types/trace.ts:38` puts `directive: SlotDirective` on `IBindingTraceEntry`. `resolve/promptLibrary.ts:1077` builds `trace.mergedBindings: ReadonlyMap<SlotName, IBindingTraceEntry>` directly from `finalMerged`. Consumer primitive #2 is fully present today.

**Confirmed — `isPartial` exists at candidate level only, not per-slot.** `converters/descriptorConverter.ts:148–155` puts `isPartial?: boolean` on `IPromptCandidateRecord`. `resolve/promptLibrary.ts:1400` checks `candidate.isPartial !== true` to decide when to stop collecting partial candidates in ts-res's priority walk. There is no per-slot `isPartial` on `IBindingTraceEntry` or on `IPromptSlot`. The brief's claim that `isPartial` is "not surfaced on the resolved output yet" is correct. The brief's further claim that it is "descriptor/candidate-level, not per-slot" is also correct — this granularity mismatch is the crux of design question 2.

**Confirmed — `describe().slots` is public.** `resolve/promptLibrary.ts:454` declares `public async describe(id: PromptId): Promise<Result<IPromptDescriptor>>`. `types/descriptor.ts:78` carries `readonly slots: ReadonlyArray<IPromptSlot>` on `IPromptDescriptor`. `types/slot.ts:14–30` shows `IPromptSlot` with `name`, `allowedDirectives`, `writableBy`, `source`, `maxLength` — but no `isPartial`. Build-time map validation against contributor slot declarations is constructable today.

**Confirmed — single-pass render.** `resolve/promptLibrary.ts:1063–1069` shows `_renderResolved` calling `template.validateAndRender(this._buildRenderContext(finalMerged))` once. `_buildRenderContext` (lines 1105–1110) builds a `Record<string, string>` from `merged` by copying each entry's `value` string directly. Slot values are not re-rendered through Mustache — they are substituted literally. A slot value containing `{{anotherSlot}}` arrives in `trace.mergedBindings` as the literal string `{{anotherSlot}}`. This is the single-pass limitation the brief flags.

**Confirmed — safeguard pass runs over slot values pre-render, not over the rendered body.** `safeguards/safeguardEngine.ts:51–109` shows `applySafeguards` iterating `descriptor.slots`, reading each entry from `merged`, applying length caps and screeners in per-slot order. It runs after `mergeBindings` + resource-binding resolution and before `validateAndRender` (promptLibrary.ts:1062–1069 shows the sequence: `applySafeguards` → `validateAndRender`). The post-render step is only `_applyAntiJailbreakPreface` (line 1070). Implication for the composer: the safety surface is the per-slot value map, and the safety boundary on the merged composite must also be at that level.

**Confirmed — RFC 8785 cycle-detection machinery is discrete and reusable.** `resolve/resourceBindingResolver.ts:62–70` shows `buildCycleKey(normalizer, chain, id)` as a standalone exported function. The cycle-detection loop in `_resolveInternal` (promptLibrary.ts:565–570) is three lines. Both are plainly extractable for horizontal topo-sort acyclicity validation.

---

## Design question 1: A vs B vs hybrid recommendation

**Recommendation: A-now (minimal liftable primitive surface) with B committed as non-optional, safety-gated, and explicitly scoped — matching the orchestrator's leaning.**

### Why the orchestrator's recommendation is correct

**The safety argument confirms B is the durable home.**
The brief's decisive safety argument is verified by the code. `applySafeguards` (safeguardEngine.ts:51) screens slot values from `merged` — with the contributor's own `IPromptDescriptor` (`descriptor.slots`, `descriptor.safeguards`). If a consumer reads `trace.mergedBindings` per contributor and merges them externally, the merged slot values pass through no safety pipeline before the composed render. The per-slot screeners would need to run again on merged values with the _composed_ descriptor — a descriptor the external consumer has no fgv support for. The safeguard boundary on the merged whole is structurally only achievable inside fgv, because only fgv can run `applySafeguards` against a first-class composed descriptor before returning a body. This is a real structural hole in pure-A, not a theoretical risk.

**The build-time validation argument does NOT strongly favor B now.**
The brief's updated analysis is correct: `describe().slots` is already public. A consumer can call `describe(contributorId)` for each contributor, collect all `IPromptSlot[]` arrays, and validate their explicit `logicalSlot ← [contributor.slotX, ...]` map. The consumer's "this is the capability a consumer-side build cannot fake" claim was incorrect given the current public surface. This removes their strongest stated argument for accelerating B.

**Trailblaze-then-lift discipline is proven and applicable.**
ts-prompt-assist itself followed this pattern. The cost of lifting once a shape is proven is lower than designing and implementing a general composer before any consumer has validated the model. One real consumer iterating on a zero-domain-types external composer is more valuable design signal than the best up-front design.

### A-now non-goals (must be called out loudly in TSDoc and PR description)

- The A primitive does NOT provide safety on the merged output. The consumer must screen merged slot values against their own policy until B lands.
- The A primitive does NOT provide build-time enforcement of the logical-slot map inside fgv. The consumer builds that themselves on `describe().slots`.
- The A primitive does NOT define a composition descriptor. The consumer is responsible for the composed prompt's descriptor shape.

### B-later is non-optional

The interim safety gap is a real structural hole that fgv must close. "B later" is not "we might do this someday" — it is the phase that closes the safety guarantee. The consumer accepts the interim gap on their side. This must be in the A stream's exit artifact as an open commitment, not a vague future item.

---

## Design question 2: The primitive surface

### 2a. `IResolvedPrompt.slots` — what to expose

The current `IResolvedPrompt` (`types/trace.ts:163–172`) carries `body`, `descriptor`, and `trace`. The `trace.mergedBindings` is already exposed as `ReadonlyMap<SlotName, IBindingTraceEntry>`.

`IBindingTraceEntry` (`types/trace.ts:27–43`) already carries:
- `source: BindingTraceSource`
- `winningScope?: ScopeKey`
- `directive: SlotDirective`
- `value: string`
- `wasEnforced: boolean`

Everything the consumer needs for composition is already in `trace.mergedBindings`. The gap is discoverability and stability: `trace.mergedBindings` is semantically "what happened during resolve" — a trace surface. Consumers discovering it for composition may (correctly) worry it is an internal trace detail subject to change. Adding `IResolvedPrompt.slots` signals it is a stable, supported primitive for composer patterns.

**Recommended addition: add `IResolvedPromptSlot` and `IResolvedPrompt.slots`.**

```typescript
// types/trace.ts (additive)

/**
 * Per-slot view of a resolved prompt, purpose-typed for horizontal composition patterns.
 * A stable, supported alternative view over `trace.mergedBindings` for consumers
 * that read per-slot values for external composition.
 *
 * IMPORTANT: Consumers building an external composer using this surface bypass
 * the `applySafeguards` pipeline on the merged composite. The consumer must
 * independently screen merged slot values against their own safety policy before
 * use. This gap is closed by the first-class HorizontalComposer (phase B).
 *
 * @public
 */
export interface IResolvedPromptSlot {
  readonly name: SlotName;
  /** Resolved slot value string (post-merge, post-resource-binding, pre-render). */
  readonly value: string;
  /** Framing directive for the slot's winning binding. */
  readonly directive: SlotDirective;
  /** Source of the winning binding. */
  readonly source: BindingTraceSource;
  /** Whether the winning binding was enforced (caller substitution was ignored). */
  readonly wasEnforced: boolean;
  /** Set when `source === 'binding'` — the scope whose binding won. */
  readonly winningScope?: ScopeKey;
}

// On IResolvedPrompt (additive field):
// readonly slots: ReadonlyMap<SlotName, IResolvedPromptSlot>;
```

Populated in `_renderResolved` (promptLibrary.ts, in the `succeed<IResolvedPrompt>({...})` block at lines 1085–1092) by mapping `finalMerged` entries into `IResolvedPromptSlot` instances. This is a one-liner or small loop with no runtime cost beyond the map allocation.

**`slots` is a view, not the source of truth.** If the consumer needs trace-level details (e.g. `resourceBindingResolutions`), they use `trace.mergedBindings` directly. `slots` is the composition-optimized view.

### 2b. Should `isPartial` appear on `IResolvedPromptSlot`?

No. Here is why.

`isPartial` on `IPromptCandidateRecord` answers "should this candidate's body layer onto a full base?" — it is about vertical candidate composition within a single prompt's ts-res candidate walk. It describes the candidate body composition, not any property of a specific slot's resolved value. A slot value may come from a partial candidate, a full candidate, a caller substitution, or a scope binding — none of these determine whether multiple contributors' values for the same logical slot should concatenate or the last one wins.

The consumer's concatenate/overwrite merge strategy is a composer-level declaration, not a per-resolve fact derivable from `isPartial`. It should live in the composer config (at phase B: `ILogicalSlotConfig.strategy`).

### 2c. Per-slot render — is it needed for phase-1 correctness?

No, and phase 1 must not introduce it prematurely.

The single-pass limitation is confirmed: slot values are inserted literally into the body render context. A slot value containing `{{anotherSlot}}` is not rendered — it appears as the literal string. For phase-1 render-then-merge, this matters only when an author deliberately embeds cross-slot Mustache references in binding values. This is an edge case. The nominal case — slot values are plain strings or structured content resolved from resource bindings — is fully handled by the existing resolution pipeline.

The per-slot render (for topo-sort ordering) is a phase B+1 concern. Phase 1 exposes `slots` where `value` is the string that entered the render context. Phase 1 must not mark this as "finally rendered" or "render-complete" in a way that makes phase B+1's different computation semantically wrong.

**What phase 1 must not do:** add a field `isRendered: boolean` or `renderedValue: string` that bakes in "render is a post-slots step." Keep the field name `value` — it is the per-slot string available to the render context. In phase B+1, the computation of `value` for cross-referencing slots changes; the field name and the interface do not.

### 2d. How `isPartial` (descriptor-level) maps to the per-logical-slot strategy

`isPartial` at the candidate level is irrelevant to the per-logical-slot strategy. The consumer's external composer declares its own merge strategy independent of how any contributor's candidates compose vertically. At phase B, `ILogicalSlotConfig.strategy` is an explicit `'concatenate' | 'overwrite'` declaration by the composer author. It is not derived from contributor `isPartial`.

---

## Design question 3: The composer shape (at B / the lift)

This section specifies the phase-B API with enough precision to confirm the A primitive is liftable into it. It is not an implementation brief.

### 3a. Core types

```typescript
// New: types/composition.ts (additive to types/ packlet)

/**
 * One contributor to a horizontal composition. The consumer resolves each
 * contributor independently via PromptLibrary.resolve() before passing to
 * the composer. The composer does not resolve — it composes resolved outputs.
 * @public
 */
export interface IContributorSpec {
  readonly resolved: IResolvedPrompt;
  /**
   * Provenance priority for this contributor. Higher numbers take precedence
   * for 'overwrite' strategy slots. For 'concatenate' slots, contributions
   * are joined in ascending provenance order (lowest-priority first — "later
   * instructions take precedence" LLM reading convention, matching the
   * existing join order in joinBodies).
   */
  readonly provenance: number;
}

/**
 * Strategy for merging multiple contributors' values for one logical slot.
 * 'rewrite' (model-synthesis) is reserved for a future phase and must not
 * be precluded by the current design.
 * @public
 */
export type LogicalSlotStrategy = 'concatenate' | 'overwrite';

/**
 * Declaration of one logical slot in the composed prompt's slot space.
 * @public
 */
export interface ILogicalSlotConfig {
  readonly logicalSlotName: SlotName;
  /**
   * Ordered list of (contributor, slotName) pairs contributing to this
   * logical slot. The composer validates that each referenced contributor
   * exists and that the referenced slot appears on that contributor's
   * descriptor.slots (accessible via IResolvedPrompt.descriptor.slots).
   * An explicit map — not name-matching — turns every implicit dependency
   * into a checked reference.
   */
  readonly contributorSlots: ReadonlyArray<{
    readonly contributorProvenance: number;
    readonly slotName: SlotName;
  }>;
  readonly strategy: LogicalSlotStrategy;
  /** Separator for 'concatenate' strategy. Default '\n\n'. */
  readonly separator?: string;
}

/**
 * Parameters for HorizontalComposer.compose().
 * @public
 */
export interface IHorizontalComposeParams {
  readonly contributors: ReadonlyArray<IContributorSpec>;
  readonly logicalSlots: ReadonlyArray<ILogicalSlotConfig>;
  /**
   * Descriptor for the composed prompt. Required so applySafeguards has
   * a real descriptor (slot maxLength, safeguard overrides, etc.) and so
   * the composed body template can be rendered.
   */
  readonly composedDescriptor: IPromptDescriptor;
  readonly safetyPolicy?: IPromptSafetyPolicy;
}

/**
 * Per-logical-slot provenance entry: which contributor contributed to this slot.
 * @public
 */
export interface ISlotProvenanceEntry {
  readonly provenance: number;
  readonly contributorSlotName: SlotName;
  readonly value: string;
  readonly directive: SlotDirective;
}

/**
 * Result of a horizontal composition, mirroring IResolvedPrompt's shape.
 * @public
 */
export interface IComposedPrompt {
  readonly body: string;
  readonly descriptor: IPromptDescriptor;
  readonly mergedSlots: ReadonlyMap<SlotName, IResolvedPromptSlot>;
  readonly provenanceTrace: ReadonlyMap<SlotName, ReadonlyArray<ISlotProvenanceEntry>>;
  readonly safeguardFindings: ReadonlyArray<ISafeguardFinding>;
}
```

### 3b. Build-time map validation (synchronous, at `HorizontalComposer.create`)

When `HorizontalComposer` is constructed (or when a static `validateConfig` method is called):
1. For each `ILogicalSlotConfig.contributorSlots` entry, verify the contributor with `contributorProvenance` exists in `contributors`.
2. For each contributor slot reference, verify that `resolved.descriptor.slots` contains a slot with the referenced `slotName`. This uses `IResolvedPrompt.descriptor.slots` (already available on the resolved output — no need for an additional `describe()` call).
3. If any `logicalSlotConfig.contributorSlots` references a slot whose `allowedDirectives` excludes the contributing slot's resolved directive, fail loudly at config time.

This is synchronous and cheap — it runs against `IPromptDescriptor` objects already in memory.

### 3c. Directive-aware merge

The `constraint` directive must never be dropped, regardless of strategy. Merge rules:

- If any contributing slot for a logical slot has `directive: 'constraint'`:
  - Constraint-bearing contributions are always concatenated (regardless of declared strategy), in ascending provenance order.
  - Non-constraint contributions apply the declared strategy against the constraint-bearing base. For v0.1: if both constraint and non-constraint contributions exist, concatenate all (safe conservative). The `provenanceTrace` records per-entry directives so callers can inspect the mix.
  - Surfaced in `provenanceTrace` — no silent adjudication.
- `hint` / `prose`: declared strategy applies. For `'overwrite'`: highest provenance wins. For `'concatenate'`: all contributions joined in ascending provenance order with separator.

### 3d. Safeguard boundary

`compose()` calls `applySafeguards(composedDescriptor, mergedSlotMap, safetyPolicy)` on the merged slot map before rendering. This is the safety closure point: merged slot values are screened with the _composed_ descriptor's slot declarations (which carry `maxLength`, `allowedDirectives`, etc. appropriate to the composed entity, not to any individual contributor). This is why the composed descriptor is mandatory at phase B — `applySafeguards` needs it.

After `applySafeguards`, compose renders the composed descriptor's body template with the merged slot map via Mustache (using the same `MustacheTemplateCache` pattern as `PromptLibrary`). The rendered body plus merged slots plus provenance trace is returned as `IComposedPrompt`.

### 3e. Confirming the A primitive is liftable

The lift (phase B) consumes `IResolvedPrompt.slots` directly as the per-contributor slot value source. The `IResolvedPromptSlot` type is the input unit. `HorizontalComposer` takes `ReadonlyArray<IContributorSpec>` where each `resolved: IResolvedPrompt` provides `resolved.slots` for its contributions. The types compose cleanly: no cast, no structural incompatibility.

---

## Design question 4: Provenance modeling

**Confirmed: provenance is a per-contributor property and must not participate in candidate selection.**

The ts-res qualifier model governs which candidate body wins for each contributor. Provenance is orthogonal: it determines composition priority after each contributor has fully resolved (own qualifiers, own candidates, own substitutions). Provenance never appears in a `conditions:` block, never participates in a `QualifierContext`, and never flows into `_resolveCandidates`.

This is structurally enforced by the design: `IContributorSpec.provenance` is a field at the composer layer, which operates on already-resolved `IResolvedPrompt` objects. `PromptLibrary.resolve` accepts `IPromptResolveRequest` — there is no path through which a composer-layer `provenance` value can reach `RuntimeResolver.create` or `_resolveCandidates`. The qualifier infrastructure has no knowledge of the composer.

**The A-primitive surface exposes nothing related to provenance.** `IResolvedPromptSlot` carries no provenance field — provenance is purely a composer-layer concept. The `source: BindingTraceSource` field on `IResolvedPromptSlot` is intra-prompt binding provenance (which binding won for this slot within this contributor's resolve), not inter-contributor provenance. The naming is not ambiguous in context.

---

## Design question 5: Roadmap placement of dependency-ordered render-merge-reinject

**Topo-sort rendering is phase B+1 (roadmap). Phase 1 and phase B must not preclude it.**

### What the topo extension requires

The dependency-ordered render-merge-reinject as described by Erik (2026-06-07) works as follows:

1. After each contributor resolves, scan each contributor's slot values for `{{...}}` Mustache references to other logical slot names.
2. Build a logical-slot dependency DAG: logical slot A depends on logical slot B if any contributor's value for slot A contains `{{B}}`.
3. Validate DAG acyclicity. The existing cycle-detection machinery in `resourceBindingResolver.ts:62` is directly reusable:
   - `buildCycleKey(normalizer, chain, id)` generalizes to `buildSlotCycleKey(normalizer, slotName)` with minimal change.
   - The stack-frame pattern (`IResourceBindingStackFrame = { key: string; id: PromptId }`) becomes `ISlotDependencyFrame = { key: string; slotName: SlotName }`.
   - The three-line cycle check at promptLibrary.ts:565–570 is a direct template.
4. Merge and render in topological order: for each logical slot in topo order, horizontally merge contributor values for that slot, inject the merged result into the running render context, then proceed to dependent slots.

The existing Mustache body scanner (`converters/bodyTokenScanner.ts`) scans candidate bodies for `{{...}}` tokens. A parallel slot-value scanner for step 1 could reuse the same token extraction logic.

### What phase 1 must avoid precluding

1. **Do not mark `IResolvedPromptSlot.value` as "final rendered."** Keep the field name `value` (not `renderedValue`, not `substitutedValue`). In phase B+1, the computation of `value` for cross-referencing slots may change — the field semantics stay "the string available in the render context for this slot," which is accurate regardless of how it is computed.

2. **Do not make `IHorizontalComposeParams.logicalSlots` order-binding for semantic correctness.** The declared order must remain a tiebreaker for independent slots, not the processing order. Phase B+1 replaces sequential-in-declared-order merge with topo-sort. If the phase B implementation hard-codes "process slots in the order they appear in `logicalSlots`" and documents this as the semantic guarantee, phase B+1 cannot change the order without a breaking change. Document the declared order as "tiebreaker for topo-equal slots" from the start.

3. **Expose the token scanner as a utility.** If `bodyTokenScanner.ts` is currently internal (package-private), plan to export a slot-value variant in phase B or B+1. Phase B+1 needs this for the DAG build. Making it reachable without a public-surface change is a phase B design note, not a phase A concern.

4. **Do not bake in "render is a post-merge step that ignores inter-slot deps."** The phase B composer's internal loop structure should be:
   ```
   for each logical slot in declared order:
     merge contributor values
     write to mergedSlots
   applySafeguards(mergedSlots)
   render(composedDescriptor.body, mergedSlots)
   ```
   Phase B+1 replaces "declared order" with "topo order" — the rest of the structure does not change. The public API (`IComposedPrompt`) is unchanged.

### Reuse confirmation

`buildCycleKey` (resourceBindingResolver.ts:62) is already exported from the packlet (it is `@internal` but module-accessible). The `Normalizer` instance at the library level is reusable for slot cycle key generation. The acyclicity check is three lines of inline code that can be copied to the slot-dependency validator without any shared state. The reuse is direct and low-risk.

---

## Design question 6: Phased plan

### Phase A — The liftable primitive surface (S)

**Goal:** expose per-slot resolved values as a first-class, stable public surface. Unblock the consumer's external composer.

**Scope (additive, no breaking changes):**
- Add `IResolvedPromptSlot` interface to `types/trace.ts`. Fields: `name`, `value`, `directive`, `source`, `wasEnforced`, `winningScope?`. TSDoc: explicit interim-risk callout (safety gap, consumer must self-screen).
- Add `readonly slots: ReadonlyMap<SlotName, IResolvedPromptSlot>` to `IResolvedPrompt` (types/trace.ts). Populated in `_renderResolved` at promptLibrary.ts:1085–1092 by mapping `finalMerged` entries. One additional map allocation per resolve — negligible.
- Verify `IResolvedPromptSlot` and updated `IResolvedPrompt` are exported from `packlets/types/index.ts` and `src/index.ts`.
- No change to `describe()`, `trace.mergedBindings`, or any existing type. Pure addition.
- Tests: assert `resolved.slots` is populated with correct `value`, `directive`, `source`, `wasEnforced` per slot in existing test fixtures. 100% coverage on the new path.
- LIBRARY_CAPABILITIES.md: add note — "`IResolvedPrompt.slots` — per-slot resolved view for consumer-side horizontal composition. See `HorizontalComposer` (phase B, non-optional) for the safety-closed first-class version."

**Interim risk callout (load-bearing — must appear in three places):**
1. On `IResolvedPromptSlot` TSDoc.
2. In `IResolvedPrompt.slots` field TSDoc.
3. In the phase-A PR description and exit artifact.

**Complexity:** S (small). 1 new interface, 1 new field, 2–5 lines of production code in `_renderResolved`, coverage for the new field. Stream shape: single implementation pass.

### Phase B — The first-class horizontal composer (M)

**Goal:** lift the consumer's proven external composer into fgv with full safety closure, build-time map validation, and directive-aware merge.

**Scope:**
- New `composition/` packlet (or `resolve/horizontalComposer.ts` — follow existing packlet structure):
  - Types: `IContributorSpec`, `ILogicalSlotStrategy`, `ILogicalSlotConfig`, `IHorizontalComposeParams`, `ISlotProvenanceEntry`, `IComposedPrompt` (defined in 3a above, in `types/composition.ts`).
  - `HorizontalComposer` class:
    - `static create(params: IHorizontalComposeParams): Result<HorizontalComposer>` — validates the logical-slot map at construction time.
    - `async compose(): Promise<Result<IComposedPrompt>>` — directive-aware merge, `applySafeguards`, Mustache render.
  - Build-time map validation (3b above).
  - Directive-aware merge (3c above) with provenance trace.
  - `applySafeguards` call on merged slot map.
  - Mustache render of composed descriptor body template.
- `types/composition.ts` (new file in `types/` packlet).
- `converters/compositionConverter.ts` (optional for v0.1 of composer — defer if consumer is code-authoring `ILogicalSlotConfig[]`; confirm at phase-B brief).
- Tests at 100% coverage per repo requirement. Key test axes: build-time validation failures (missing contributor, unknown slot), directive-aware merge corner cases (constraint forcing, mixed-directive slots), `applySafeguards` rejection on merged values, provenance trace accuracy.
- LIBRARY_CAPABILITIES.md: replace the phase-A note with `HorizontalComposer` full entry.
- Remove/update the interim-risk callout on `IResolvedPromptSlot` TSDoc to note that the safety gap is now closed by `HorizontalComposer`.

**Complexity:** M (moderate). The composition and merge logic is O(N contributors × M logical slots) and straightforward. The tricky parts: directive-aware merge corner cases (constraint forcing rules), safety-boundary wiring (`applySafeguards` with a composed descriptor rather than a contributed descriptor), and provenance trace design. Stream shape: design-triage-implement (the present document is the design; the implementer brief follows from section 3).

**Dependency:** Phase B requires a proven external composer shape from the consumer. The lift brief should be commissioned after the consumer has iterated on the phase-A primitive.

### Phase B+1 — Topo-sort render-merge-reinject (L)

**Goal:** handle cross-slot Mustache references in slot values (`{{A}}` embedded in slot B's binding value).

**Scope:**
- Slot-value `{{...}}` reference extractor (reuse/extend `bodyTokenScanner.ts`).
- Logical-slot DAG builder: from `ILogicalSlotConfig[]` + per-contributor slot values.
- Acyclicity validator using the RFC 8785 cycle-detection pattern (`buildCycleKey` analog for slot names).
- Topo-sort ordering of logical slots (Kahn's algorithm or DFS-based, both O(V+E) where V = logical slots, E = dependencies — negligible for realistic slot counts).
- Modified `HorizontalComposer` internal loop: process slots in topo order with running render context (inject merged value of slot A before processing slot B which references `{{A}}`).
- No change to `IComposedPrompt`, `IHorizontalComposeParams`, or `ILogicalSlotConfig` API surfaces (implementation-only delta within `compose()`).

**Complexity:** L (large). The DAG build + topo-sort + cycle-detection are non-trivial even with reusable primitives. The interaction with the safeguard pipeline (do screeners run on per-slot values before or after cross-slot injection?) requires careful design. Commission as a separate stream.

**Condition for commissioning:** at least one consumer use case confirmed where a contributor slot value deliberately contains `{{...}}` references to other logical slots. See OQ-5.

---

## Open questions for the orchestrator / consumer

**OQ-1 (consumer must decide before phase A exits): interim safety posture.**
The phase-A PR and exit artifact include an explicit interim-risk callout. The consumer must acknowledge they will screen merged slot values against their own policy before using any externally composed result. This is a consumer-side acceptance, not an fgv architectural question — but it must be on record before the primitive is relied on.

**OQ-2 (for phase B brief): composed descriptor authorship.**
The lift requires a `composedDescriptor: IPromptDescriptor` describing the composition as a unit (logical slots, output contract, safeguard overrides). Who authors it?
- (a) Consumer authors a prompt YAML in the library; `describe(composedId)` retrieves it. Full authoring control.
- (b) `HorizontalComposer.create` synthesizes a minimal descriptor from `ILogicalSlotConfig[]`. Ergonomic for simple cases; limited control.
- (c) Both — consumer may supply a pre-authored descriptor or let the composer synthesize a default.

Option (c) is recommended but requires a design decision on what the synthesized default looks like. Validate with the consumer at phase-B brief time.

**OQ-3 (for phase B brief): strategy configuration — code vs YAML.**
Is `ILogicalSlotConfig[]` declared in code or in a YAML manifest? A YAML manifest is consistent with the library's file-based authoring model but requires a converter and a store extension. Code-authored `ILogicalSlotConfig[]` is simpler and faster to validate. Recommend starting with code-authored; add YAML support additively if the consumer needs it.

**OQ-4 (confirm before phase A ships): separator for `'concatenate'` strategy.**
The design defaults to `'\n\n'` (matching `IPromptJoinPolicy.separator`). Confirm with the consumer this default is right, or whether separator must be explicit (no default) at every logical slot config declaration.

**OQ-5 (for phase B+1 commission decision): does the consumer's use case embed `{{...}}` in slot values?**
Phase B+1 topo-sort rendering is only needed if authors deliberately embed cross-slot Mustache references in binding values. Confirm whether this pattern appears in the consumer's authoring model before commissioning the phase B+1 stream. If it does not occur, B+1 may be deferred indefinitely.

---

## Summary table

| Question | Decision |
|---|---|
| A vs B vs hybrid | A-now (minimal liftable primitive) with B committed as non-optional safety closure. Orchestrator's leaning confirmed. |
| Primitive surface | `IResolvedPromptSlot` + `IResolvedPrompt.slots` (additive); no `isPartial` on slot; no per-slot render in phase 1 |
| Strategy mapping | Strategy lives in composer config (`ILogicalSlotConfig.strategy`), not derived from contributor `isPartial` |
| Composer shape (at B) | `HorizontalComposer` with explicit `ILogicalSlotConfig[]`, directive-aware merge (constraint-forcing), `applySafeguards` on merged values, Mustache render of composed descriptor |
| Provenance | Per-contributor property only; no coupling to qualifier selection; structurally isolated at composer layer |
| Topo-sort roadmap | Phase B+1; `buildCycleKey` and stack-frame pattern directly reusable; phase A must not bake in "slots are independent" |
| Phase A size | S — 1 interface, 1 field, 2–5 lines prod code |
| Phase B size | M — new packlet, directive-aware merge, safety closure, provenance trace |
| Phase B+1 size | L — DAG build, topo-sort, cycle-detect, modified internal loop |
| Safety gap | Explicit interim risk in phase A TSDoc + PR; closed at phase B by `applySafeguards` on merged slot map with composed descriptor |
