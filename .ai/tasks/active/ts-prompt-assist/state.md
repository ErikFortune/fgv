# Stream State: ts-prompt-assist

**Status:** 🟢 phase A signed off + merged; phase B ready to start
**Last updated:** 2026-05-15 (orchestrator — phase B brief authored)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| A — research and design | ✅ done | `design.md` merged into `claude/ts-prompt-assist-features` via [#357](https://github.com/ErikFortune/fgv/pull/357). All 6 OQs resolved with rationale; new §15 documents ts-res `import` packlet audit (deliberate divergence) and locks the Option C candidate→ts-res handoff strategy. |
| B — implementation | 🟢 ready | `brief-phase-b.md` is the binding phase B contract; assignable to implementing agent. Recommended sub-phasing per design §14: B.0 ts-extras additive extensions → B.1 types + happy-path resolve → B.2 resource bindings → B.3 FileTreePromptStore + YAML → B.4 output validation → B.5 safeguards → B.6 docs + api-extractor + change files |
| Refine — consumer-port pressure-test | ⏸ blocked on phase B publish | First-consumer port (an agent chat application) surfaces gaps; 1–2 follow-up PRs on the integration branch absorb refinements before integration→release promotion |

---

## Cluster context

**Cluster name:** `ts-prompt-assist-features`
**Integration branch:** `claude/ts-prompt-assist-features` (off `release`; created by orchestrator before phase A commission)
**Workflow shape:** design-triage-implement-refine (per Erik 2026-05-13)

---

## Decisions log (orchestrator, substrate prep)

| Decision | Rationale |
|---|---|
| Standalone package above `ts-res` | Folding into `ts-extras` would create a cycle (`ts-res` already depends on `ts-extras`). Confirmed in design-brief.md §"Why a separate package" |
| Workflow shape: design-triage-implement-refine | Conceptual model is binding but data shapes are proposed; 3+ open questions warrant a phase A signoff before implementation. Consumer-port pressure-test ("refine") absorbed via integration-branch follow-up PRs |
| Integration branch (vs direct-off-release stream) | Cluster expected to be multi-stream (library v0.1 → consumer-port refinements → possibly samples / editor UX). Long-lived branch allows v0.1 alpha + pressure-test absorption + v0.2 to ship as one cohesive merge to `release` |
| First-consumer port = an agent chat application | Pressure-test plan: 1–2 follow-up PRs on the integration branch absorb gaps surfaced by the port |
| ts-extras `mustache` packlet is in cluster scope | Erik's direction (2026-05-13): "instead of dancing around ts-extras mustache limitations, fix ts-extras and use the fixed API." Cluster will additively extend `MustacheTemplate` to support verbatim-passthrough rendering; `ts-prompt-assist` consumes the extended API. Phase A picks the specific API shape (OQ-6 candidates a/b/c) |
| Active surface registration | Added `ts-prompt-assist` to `.ai/instructions/ACTIVE_DEVELOPMENT.md` table (free hand on breaking changes during v0.x) |
| Alpha target | `5.1.0-29` or later; may accumulate to `6.0` based on API-stability evidence after pressure-test |
| Sequencing | Independent of `ai-assist-thinking-events` (queued). Streams can run in parallel; no conflicting surface |
| Future streams (queued) | `ts-prompt-assist-samples` and `ts-prompt-assist-editor-ui` — both in `docs/FUTURE.md` |

---

## Open questions

### Orchestrator-flagged for phase A (must resolve)

| ID | Question | Source |
|---|---|---|
| OQ-1 | Scope encoding flexibility — flat default vs nested directories | design-brief.md §"Open questions" |
| OQ-2 | Resource-binding substitution merge semantics — strict (replace) vs relaxed (layered) | design-brief.md §"Resource-binding semantics" |
| OQ-3 | `watch()` semantics — include in interface? optional? full event-shape definition? | design-brief.md §"Open questions" |
| OQ-4 | Three separate registries vs one unified `IPromptRegistry` with namespaced sub-registries | orchestrator review |
| OQ-5 | Output-contract growth path — is the `IJsonOutputContract<TKIND>` generic pulling its weight at v0.1? | orchestrator review |
| OQ-6 | Mustache canonical form — extend ts-extras `MustacheTemplate` for verbatim-passthrough; pick API shape (option on create / strict-passthrough mode / sibling primitive) | orchestrator review (Erik direction: extend ts-extras, don't work around it) |

### Deferred (not phase A's concern)

| ID | Question | Where it lives |
|---|---|---|
| F-1 | Samples app shape — standalone vs folded into `ai-assist-image-generator` | `docs/FUTURE.md` (post-v0.1 stream) |
| F-2 | Generic editor UX feasibility — `@fgv/ts-prompt-assist-ui` or consumer-specific | `docs/FUTURE.md` (post-v0.1 stream) |

---

## Phase A decision log (agent, 2026-05-15)

| OQ | Decision | Summary |
|---|---|---|
| OQ-1 | flat default + function override | Default rejects `/ \ \0 :` + reserved Win device names + non-portable POSIX chars; consumers supply `scopeEncoding` / `scopeDecoding` for nested-directory layouts. Rationale: simplest path that doesn't paint v0.2 into a corner; tightening defaults later is breaking. |
| OQ-2 | strict (replace) | Binding-supplied `substitutions` entirely replace parent's for inner resolve; trace records `'replace'` vs `'inherit'` mode. Rationale: clean mental model for shared fragments; relaxing later is additive. |
| OQ-3 | interface includes `watch?`; **no v0.1 adapter implements**; event shape pinned (revised 2026-05-15 per Erik review) | `IPromptStoreEvent.kind: 'descriptor-changed' \| 'descriptor-removed' \| 'bindings-changed' \| 'qualifier-axes-changed'`. No standalone InMemory store (per Erik), so no v0.1 driver for watch impl; pinning the event shape costs nothing and prevents future interface churn. First concrete hot-reload consumer drives implementation in a follow-up. |
| OQ-4 | unified `IPromptRegistry` with **three** typed sub-registries (revised 2026-05-15 per Erik review); qualifier config delegated to ts-res | `IPromptRegistry` exposes `converters` / `slotKinds` / `outputValidations`. **`qualifierEnums` sub-registry dropped** — ts-res's `LiteralQualifierType` already owns closed-value qualifier sets; duplicating in ts-prompt-assist forced two-place registration (drift bug). `PromptLibrary.create` takes a `qualifiers: IReadOnlyQualifierCollector \| IQualifierDecl[]` param directly. Per-scope `_qualifiers.yaml` replaced by ONE root-level `<root>/_qualifiers.yaml` using ts-res's `IQualifierDecl` schema (validated by ts-res's own Converter); the file is optional. `IPromptStore.getQualifierAxes` becomes `getQualifierConfig(): IQualifierDecl[] \| undefined`. |
| OQ-5 | drop the generic on `IJsonOutputContract`; minimal free-text; `outputValidations` on descriptor | Future JSON variants extend the discriminated union (`'json-array'`, `'json-stream'`) rather than parameterizing. `outputValidations` stays on `IPromptDescriptor`, not on the JSON contract, to keep growth open for future free-text validators. |
| OQ-6 | shape (a) — `escape?` option on `MustacheTemplate.create` | Additive `escape: 'html' \| 'none' \| (s) => string` on the canonical primitive in ts-extras. Default `'html'` preserves back-compat. Implementation MUST use `Mustache.Writer` instance, not `Mustache.escape` global. Double-brace rejection stays in ts-prompt-assist (consumer-discipline concern, not Mustache concern). |

## New questions surfaced (non-blocking)

| ID | Question | Where it lives |
|---|---|---|
| NQ-1 | `extractJsonText` export status from `@fgv/ts-extras/ai-assist` — currently public or internal? | design.md §8 step 1; phase B verifies / promotes |
| ~~NQ-1~~ | ~~extractJsonText~~ — **RESOLVED** (Erik 2026-05-15): export it publicly from `@fgv/ts-extras/ai-assist`. Additive; in cluster scope. | design.md §15.6 |
| ~~NQ-2~~ | ~~YAML loader~~ — **RESOLVED** by §15 audit: use `@fgv/ts-extras`'s `yaml.yamlConverter<T>(inner)`. Erik clarifies: ts-extras wraps js-yaml; not in ts-json-base because of the dep. | design.md §15.3, §15.6 |
| ~~NQ-3~~ | ~~`FileTreeItem` path~~ — **RESOLVED** (Erik): `@fgv/ts-json-base/file-tree`, symbol `FileTree.FileTreeItem`. | design.md §15.6 |
| NQ-4 | `PromptRegistry.empty()` infallible factory — keep alongside `.create()` or collapse? | design.md §4.3; default: keep both for v0.1 |
| ~~NQ-5~~ | ~~Option C locked~~ — **RESOLVED** (phase B audit 2026-05-15): `ResourceManagerBuilder.addResource()` + `getBuiltResource()` already support incremental lazy-add-after-build natively. No ts-res extension required. `addResource` does NOT reset `_built` for existing resources; `getBuiltResource` lazy-builds per-resource on first access via `_builtResources.validating.getOrAdd`. Option C is feasible directly with the current ts-res surface. | design.md §15.5 |

## Phase A re-audit: ts-res `import` packlet (2026-05-15, addendum)

Triggered by orchestrator prompt asking whether the loader reinvents ts-res's import packlet.

**Verdict:** partial overlap; **the loader does NOT reinvent ts-res import**. They target different access patterns (lookup vs build), different data shapes (descriptors + bindings + axes + candidates vs ts-res `ResourceManagerBuilder`-targeted decls), and different filename conventions (per-candidate `conditions:` blocks in YAML vs ts-res's filename-token-encoded conditions). The reuse target is the **lower-level primitives** ts-res import depends on, not the ImportManager pipeline itself.

**Recorded divergence (design.md §15):**

- `FileTreePromptStore` uses `FileTree` directly (not `PathImporter`).
- YAML parsing via `@fgv/ts-extras`'s `yaml.yamlConverter<T>` (not via `FsItemImporter`'s `fileContentConverter` seam).
- One YAML file per `(scope, id)` with descriptor + all candidates co-located; conditions inline per candidate (not filename-encoded).
- `IPromptStore.get(scope, id)` lookup-oriented (not a global `ResourceManagerBuilder`).
- No use of `ImportManager` / `CollectionImporter` (their target shape is wrong).

**Gap surfaced and pinned:** the candidate→ts-res-resolve handoff (NQ-5) was underspecified in earlier drafts. Now locked: **Option A** (per-resolve ts-res construction, cached by `(scope, id, Crc32Normalizer.computeHash(candidates))`). The `ResourceJson` candidate-decl Converters in ts-res are the reuse point for validating candidates into ts-res's shape. Phase B confirms exact public exports.

**Resolved NQ-2:** YAML loader is the existing `@fgv/ts-extras/yaml` packlet, not a new `js-yaml` direct dep. Per `/published-primitives-reflex`.

---

## Erik review checkpoint 2026-05-15

Erik reviewed the design and surfaced four points + three NQ resolutions:

| Point | Disposition |
|---|---|
| Trace integration with ts-res's step-by-step resolution logging | ts-res publishes `IResourceResolverCacheListener` (cache hit/miss/error/clear events on condition / conditionSet / decision caches) + per-condition match details on `ConditionSetResolutionResult`. ts-prompt-assist (a) accepts a `cacheListener?: IResourceResolverCacheListener` on `PromptLibrary.create`, (b) defaults to forwarding to ILogger at debug level, (c) surfaces ts-res's `IConditionMatchResult[]` per candidate in `IPromptResolveTrace.candidateMatches[]`. Editor surfaces can mirror ts-res-browser's view without ts-res additions. |
| `PromptLibrary` accepts an `ILogger` and uses it for observability | Pinned in §4.1 with the event taxonomy (debug: materialization, cache events, resource-binding entry/exit, safeguard findings, Mustache parse/render, store invocations; warn: disallowed-qualifier stripping, regex-screen matches under `'warn'`, ignored enforced overrides; error: resolve failures paired with the Result return). Default `Logging.noOpLogger`. |
| Separate `InMemoryPromptStore` vs `FileTreePromptStore + InMemoryFileTree` | Dropped standalone `InMemoryPromptStore`. Tests/dev use `FileTreePromptStore` over `InMemoryFileTree` via a `PromptStoreFixture.build(seed)` helper that serializes the seed into the in-memory tree. Cascades: OQ-3 revised (no v0.1 adapter implements watch); event shape still pinned. |
| §15.5 caching | **Option C locked.** One long-lived ResourceManager shared across all resources; lazy materialization on demand; ts-res's intrinsic caches do the heavy lifting (O(1) on warm qualifier shapes). Erik's explicit guidance: cache resources (cheap, bounded cardinality), NOT outputs (combinatorial in open qualifier space). NQ-5 revised: phase B verifies incremental add-after-build in ts-res or extends additively. Fallback strategies documented in §15.5. |

NQ-1 (extractJsonText): export publicly. NQ-3 (IFileTreeItem path): confirmed.

## Cluster-scope summary (for orchestrator)

The `ts-prompt-assist-features` cluster touches **two libraries**:

1. **`@fgv/ts-extras`** (existing, established surface) — strictly **additive** change to the `mustache` packlet: `escape?: MustacheEscapeStrategy` option on `MustacheTemplate.create` (default `'html'`, preserves back-compat). Implementation MUST use a per-instance `Mustache.Writer` rather than mutating `Mustache.escape` globally. No removed / renamed / behavior-changed exports.
2. **`@fgv/ts-prompt-assist`** (new library) — full v0.1 implementation per this design.

Phase B implementation order: ts-extras Mustache extension lands first (B.0), then ts-prompt-assist consumes it from the start (B.1 onward).

## Substrate prep checklist (orchestrator)

- [x] Add stream entry to `docs/WORKSTREAMS.md` (Active section, before `ai-assist-thinking-events`)
- [x] Add `ts-prompt-assist` to `.ai/instructions/ACTIVE_DEVELOPMENT.md` (Currently active surfaces table)
- [x] Add `ts-prompt-assist-samples` and `ts-prompt-assist-editor-ui` parking-lot entries to `docs/FUTURE.md`
- [x] Author `design-brief.md` (consumer-supplied, verbatim)
- [x] Author `brief.md` (orchestrator's phase A binding contract)
- [x] Author `state.md` (this file)
- [ ] Open substrate-prep PR → `release`
- [ ] After merge: create `claude/ts-prompt-assist-features` integration branch off post-merge `release` HEAD
- [ ] Commission phase A agent against the integration branch (kickoff prompt drafted by orchestrator)

---

## PR

Substrate-prep PR: merged (#356, 2026-05-13).
Phase A PR: https://github.com/ErikFortune/fgv/pull/357 (`claude/ts-prompt-assist-phase-a-Y8JIM` → `claude/ts-prompt-assist-features`).

---

## Resume protocol

Phase A agent: read `brief.md` (binding contract) + `design-brief.md` (binding input — conceptual model is locked, data shapes are proposals) + this `state.md` to resume.
