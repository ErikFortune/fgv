# Stream State: ts-prompt-assist

**Status:** 🟡 phase A merged; phase B in restart — PR #359 retired; rescoped into sub-phase commissions
**Last updated:** 2026-05-16 (orchestrator — rescope after PR #359 retire)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| A — research and design | ✅ done | `design.md` merged into `claude/ts-prompt-assist-features` via [#357](https://github.com/ErikFortune/fgv/pull/357). All 6 OQs resolved; §15 documents ts-res `import` packlet audit; §17 (added 2026-05-16) documents the validator-chain redesign + NQ-5 resolution + restart guardrails. |
| B — implementation | 🟡 restart in progress | First attempt (PR #359) retired without merge after ~35 reviewer-flagged issues. Rescoped into sub-phase commissions (B-0a through B-5) per `brief-phase-b.md`. B-0a (NQ-5 audit) done by orchestrator 2026-05-16. **B-0b complete 2026-05-16** (ts-extras additive: `MustacheTemplate.create({escape})` + `extractJsonText` public-export confirmation). **B-1a complete 2026-05-16** via [#362](https://github.com/ErikFortune/fgv/pull/362) — foundation minus ts-res integration; B-1 agent surfaced the ts-res scope deferral honestly. Orchestrator formalized B-1a / B-1b split post-merge. **B-1b commissionable** (ts-res integration via long-lived `ResourceManagerBuilder` per design §15.5 Option C + Copilot-review deferral cleanups). |
| Refine — consumer-port pressure-test | ⏸ blocked on phase B publish | First-consumer port (an agent chat application) surfaces gaps; 1–2 follow-up PRs on the integration branch absorb refinements before integration→release promotion |

---

## Phase B restart history

| Date | Event |
|---|---|
| 2026-05-15 | Phase B first attempt commissioned against `brief-phase-b.md` via [#358](https://github.com/ErikFortune/fgv/pull/358) (single-agent run; Sonnet) |
| 2026-05-15/16 | Implementation produced [PR #359](https://github.com/ErikFortune/fgv/pull/359) targeting `release` (incorrect base; brief said integration branch) |
| 2026-05-16 | PR #359 reviewed; ~35 issues flagged across structural design-level violations, family-convention violations, correctness bugs, process violations. Erik closed PR #359 "retire and regroup" |
| 2026-05-16 | Orchestrator rescope: brief amended with 10 explicit guardrails + sub-phase decomposition; design.md §17 added with validator-chain redesign + NQ-5 resolution + kind-naming decision. B-0b commissionable next. |
| 2026-05-16 | **B-0b completed.** ts-extras additive: `MustacheEscapeStrategy` type + `escape?` option on `IMustacheTemplateOptions`; per-instance `Mustache.Writer` with locally-implemented `HTML_ESCAPE` so the strategy is immune to `Mustache.escape` global mutation (notably from `experimental/formatter.ts`); 8 new tests cover all three strategies (`'html'` back-compat, `'none'` verbatim, custom function) + concurrent-template safety + `validateAndRender` integration + triple-brace always-unescaped. `extractJsonText` confirmed already `@public` and re-exported from the ai-assist packlet — no source change needed; api.md regenerated. Rush change file added. Build / lint / fixlint / test all green; 100% coverage on `mustache` packlet; code-reviewer approved (no Priority 1/2 findings). Work branch: `claude/implement-b-0b-agent-R8kzX`. |
| 2026-05-16 | **B-1 foundation landed (partial).** New `@fgv/ts-prompt-assist` package scaffolded under `libraries/ts-prompt-assist/` with `sideEffects: false`, registered in `rush.json` under `versionPolicyName: base-utils` / tag `libraries`. Full type system (branded scalars + Converters; string-union types + `allFooValues` + Converters; discriminated-union slot-binding Converter routing on `kind`; descriptor / examples / trace / store-event types). `IPromptRegistry<TResponse extends { kind: string }>` per design §17.2 (three typed sub-registries, ConverterRegistry tracks producing kind via `register(id, kind, converter)` and exposes `getKind`; OutputValidationRegistry typed against `TResponse` with `appliesTo`). `descriptorConverter` + `promptFileConverter` (rejects free-text descriptors that declare `outputValidations` and rejects unknown output kinds); `bodyTokenScanner` rejects double-brace `{{name}}` (post-parse via `tokenType === 'name'`) AND ampersand-unescape `{{&name}}` (pre-parse regex; design-vs-mustache.js gotcha — mustache.js's tokenizer collapses `{{&name}}` and `{{{name}}}` to the same `'&'` tokenType, so the rejection cannot rely on parser metadata alone; this is the "name vs &" wrinkle B-3 should surface to the orchestrator if a stricter post-parse discriminator is desired). `bindingsFileConverter` / `axesConverter` (delegates to ts-res's `Qualifiers.Convert.qualifierDecl` — does NOT shadow). `PromptStoreFixture.build` over `InMemoryFileTree` (no standalone `InMemoryPromptStore`). Read-only `FileTreePromptStore` (`get` / `list` / `getBindings` / `getQualifierConfig`; default scope encoding rejects `/ \ \0 :`, leading `.`, non-POSIX-portable chars, and reserved Windows device names — basename portion checked so `CON.txt` is also rejected; consumer-supplied encoder/decoder pair supported and threaded through `PromptStoreFixture` via `scopeDecoding?`). `MustacheTemplateCache` LRU keyed by `(promptId, Crc32Normalizer.computeHash(body))`, default cap 256 per design §6.4. `walkScopeChain` + `mergeBindings` (cross-scope merge with `enforced` lock + `winningScope` trace + `enforced-override-ignored` safeguard finding); `PromptLibrary.create` / `describe` / `resolve` end-to-end via the in-memory fixture: chain walk → binding merge → intra-record candidate selection (specificity-ascending, terminal stops) → Mustache render via `escape: 'none'` → full `IPromptResolveTrace` with `winningScope` / `scopesConsulted` / `mergedBindings` / `safeguardFindings` / `candidateMatches`. 71 tests, 100% coverage on statements/branches/functions/lines. Code-reviewer agent ran on `7de1f88a`; 2 Priority 1 findings fixed in `86927dc9`. Copilot pull-request reviewer ran twice on PR #362; mechanical findings fixed in `8a7827a0` + `cc0df79c`; substantive findings annotated inline with `// Copilot review (PR #362, deferred to B-1b)` breadcrumbs in `6403c851` + `cc0df79c`. **Deferred to B-1b** (catalogued in detail in `brief-phase-b-1b.md`): (a) full ts-res integration via the long-lived `ResourceManagerBuilder` per §15.5 Option C — the current B-1 candidate selector is a stand-alone matcher that does NOT integrate with ts-res's qualifier types, `scoreAsDefault`, priority, or the intrinsic O(1) caches; (b) ~16 Copilot deferrals spanning `SlotName` Mustache-identifier validation, `brandedString` minimal hygiene, `MustacheTemplateCache` `::` key collision risk, `ConverterRegistry.get<T>` cast surface, `promptFileConverter` double-traversal, `_slotBindingHolder` mutable-singleton pattern, `joinBodies` trim regex narrow contract, `PromptStoreFixture` eager `mapResults`, `chainWalker` sequential `getBindings`, `describe` cache invalidation, scope-encoding `COM0`/`LPT0` widening, and several intent-clarification doc notes; (c) resource-binding resolve (B-2 scope) and output validation pipeline (B-4 scope) continue to fail loudly per Guardrail #4. Work branch: `claude/implement-phase-b1-foundation-1tZfR`. PR: [#362](https://github.com/ErikFortune/fgv/pull/362). |
| 2026-05-16 | **B-1b commissioning.** Brief authored at `.ai/tasks/active/ts-prompt-assist/brief-phase-b-1b.md`. Scope: (Part 1) replace the standalone candidate selector with full ts-res integration per design §15.5 Option C — long-lived `ResourceManagerBuilder` inside `PromptLibrary`, lazy materialization via `addLooseCandidate`, `ResourceResolver` instantiation with caller qualifier context, `'matchAsDefault'` trace surfacing, `IConditionMatchResult[]` per-candidate trace. (Part 2) sixteen Copilot deferrals from PR #362, each catalogued with file:line + recommended fix path. Expected surface changes: `IPromptLibraryCreateParams` gains `qualifiers` / `qualifierTypes?` / `cacheListener?` / `logger?` / `resourceBindingDepthLimit?` per design §4.1; `Convert.slotName` tightens to Mustache-identifier; `Convert.promptId` rejects `::`; `ConverterRegistry.get<T>` gains a kind-verified overload; `PromptStoreFixture` threads `qualifiers` through to `PromptLibrary.create`. Out of scope for B-1b: resource-binding resolve (B-2), FsTree smoke test + filename-id consistency (B-3), output validation pipeline + input safeguards (B-4), docs + change file (B-5). Commissionable once PR #362 merges to the integration branch. |

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
| NQ-5 (revised) | **Option C locked** — lazy materialization into a shared long-lived ts-res `ResourceManager`. Phase B verifies incremental add-after-build (or extends ts-res additively; cluster scope). Fallbacks documented in §15.5: (ii) periodic rebuild, (iii) Option A with `TECH_DEBT.md` entry. | design.md §15.5 |

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

## Phase B rescope decision log (orchestrator, 2026-05-16)

| Decision | Rationale |
|---|---|
| **NQ-5 resolved: Option C achievable with zero ts-res changes** | Orchestrator audit confirmed ts-res's `ResourceManagerBuilder` natively supports `addLooseCandidate` / `addResource` / `addCondition` / `addConditionSet` post-construction and implements `IResourceManager` itself. Phase B holds a long-lived builder inside `PromptLibrary`; calls `addLooseCandidate` on cache miss; uses the builder directly as the `IResourceManager` for a `ResourceResolver`. Fallbacks (ii) and (iii) from design §15.5 are documented but not the target. See design §17.1. |
| **Validator-chain redesigned: discriminated-union-typed registries** | First attempt (PR #359) produced `runResult.value as T` cast in the chain runner — the original `Result<unknown>` shape forced it. Redesign per design §17.2: registries parameterized by `TResponse extends { kind: string }`; consumers extend the union with their own response shapes; each validator declares `appliesTo: TResponse['kind']`; chain runtime narrows via `value.kind` lookup; no cast anywhere. Belt (loader-side reject) + suspenders (runtime fail on kind mismatch). |
| **`kind` discriminator naming kept universally** | Multiple `kind` fields now exist across the design (`output.kind`, `SlotBinding.kind`, `IPromptStoreEvent.kind`, `ISafeguardFinding.kind`, NEW consumer response `kind`). Decision: keep `kind` everywhere per TypeScript community convention + `@fgv/*` family convention; rename specific sites only if a real conflict surfaces during implementation. JSDoc clarifies discriminator role at definition. See design §17.2.7. |
| **Sub-phase decomposition replaces single-agent run** | PR #359 demonstrated mid-run context drift is a real failure mode in a single long agent run. Restart decomposes phase B into 5–6 separate agent commissions (B-0a orchestrator audit; B-0b ts-extras additive; B-1 foundation; B-2 resource bindings; B-3 FileTreePromptStore + YAML; B-4 output validation + safeguards; B-5 docs + handoff). Each agent starts cold against `design.md` + `state.md` + `brief-phase-b.md` — no carried context across sub-phases. Orchestrator reviews each PR before next sub-phase commissions. See `brief-phase-b.md` "Phase B sub-phase decomposition". |
| **10 explicit guardrails added to brief-phase-b.md** | Made existing CODING_STANDARDS rules unmissable because PR #359 demonstrated the failure modes are real when not enforced upfront: no unsafe casts, no `unknown` without rationale, no type-shadowing, no silent unimplemented placeholders, no inline `eslint-disable`, mandatory `code-reviewer`, integration-branch PR target binding, factory pattern, index.ts barrel-only, Result chaining. Each guardrail tagged to a specific PR #359 failure where applicable. |
| **Model selection: Opus for B-0b probe and B-1 foundation; Sonnet for B-2/B-3/B-4/B-5** | B-0b is a small isolated probe of the new brief shape; Opus for the disciplinary properties. B-1 is the foundation run; Opus where it matters most. After the foundation lands clean, Sonnet against a working foundation for follow-ons. |

---

## PR

Substrate-prep PR: merged (#356, 2026-05-13).
Phase A PR: merged (#357, 2026-05-15).
Phase B brief authoring PR: merged (#358, 2026-05-15).
Phase B first attempt (retired): #359 (closed 2026-05-16, not merged).
Phase B rescope prep PR: this PR.
Phase B sub-phase PRs (incoming): B-0b → B-5.

---

## Resume protocol

Phase A agent: read `brief.md` (binding contract) + `design-brief.md` (binding input — conceptual model is locked, data shapes are proposals) + this `state.md` to resume.
