# Stream result: `ts-res-typed-conditions`

**Status:** ✅ all three sub-phases complete
**Cluster:** `ts-prompt-assist-features` (in-cluster)
**Integration branch:** `claude/ts-prompt-assist-features`
**Duration:** 2026-05-19 (single day; substrate prep → B-1 → B-2 → B-3 all in one calendar day)
**PRs:** #390 (substrate), #391 (B-1), #394 (B-2), #395 (B-3)

---

## Mission recap

Make `@fgv/ts-res` honor qualifier-name semantics — the closed set of axis names a deployment declares — at both the **type level** (across the full Decl tree) and the **runtime level** (Converter pipeline). Replace closed PR #386's leaf-only parameterization with the complete co-designed shape, then port `@fgv/ts-prompt-assist` to consume the result, closing round-2 finding F1 by ownership at the right layer (ts-res owns the qualifier-name concept; consumers reference rather than re-implement).

---

## Outcome

Three sub-phases landed on `claude/ts-prompt-assist-features` as separate, additive PRs:

### B-1 — Decl-tree cascade (PR #391)

Type-level parameterization. 17 items in `@fgv/ts-res/src/packlets/resource-json/` and `conditions/` carry `TQualifierNames extends string = string`. The leaf types from #386 plus the full container cascade #386 missed (resource-candidate, resource, collection, tree-child-node, tree-root). Two latent fixes carried forward: `getKeyFromLooseDecl` correct handling of explicit-`undefined` record entries, and `isLooseResourceCandidateDecl` / `isLooseResourceDecl` runtime-soundness on the `id` field. No runtime-behavior change; 100% coverage; all 11 downstream consumers compile unchanged.

### B-2 — Converter parameterization (PR #394)

Runtime teeth. 16 new typed Converter siblings — 4 in `Conditions.Convert` (`typedConditionDecl`, `typedValidatedConditionDecl`, `typedConditionSetDecl`, `typedValidatedConditionSetDecl`) and 12 in `ResourceJson.Convert` (covering every consumer entry-point Converter plus every internal Converter an entry-point composes). Each takes a `qualifierNameConverter: Converter<TQualifierNames>` and returns a Converter whose result type is narrowed on `TQualifierNames`. Existing untyped exports preserved at signature and behavior level; `ObjectConverter` return type preserved on the defaults (Candidate D shape from `phase-b2-design-notes.md`). `// keep in sync with X` markers on every typed sibling to surface drift hazards explicitly. Cast-pressure regression tests in `conditions/typedConvert.test.ts` and `resource-json/typedConvert.test.ts` cover every sibling at three assertion shapes (convert-time rejection of typos, convert-time acceptance of valid names with type-level narrowing, back-compat documentation that defaults accept typos). 100% coverage; all 11 downstream consumers compile unchanged.

### B-3 — `ts-prompt-assist` consumer port (PR #395)

Consumer port. Six container types in `@fgv/ts-prompt-assist` (`IPromptCandidateRecord`, `IStoredPromptRecord`, `IPromptFileContents`, `IPromptStoreFixtureSeed`, `IPromptStoreFixtureSeedRecord`, `IFileTreePromptStoreCreateParams`) parameterized on `TQualifierNames extends string = string`. New `typedPromptFileConverter<T>(qc)` factory exported as the typed sibling of `promptFileConverter`. `FileTreePromptStore.create` and `PromptStoreFixture.build` accept an optional `qualifierNameConverter: Converter<TQualifierNames>` that routes the YAML loader through B-2's `typedConditionSetDecl(qc)`. Round-2 findings F2 (`buildSimpleDescriptor` helper) and F6 (README React-wiring section) absorbed verbatim from closed PR #385. Local sibling types `ITypedConditionSetDecl` / `ITypedPromptCandidateRecord` from #385 NOT carried forward — B-2 ships the canonical primitive. Cast-pressure regression in `b3TypedConditions.test.ts` verifies the convert-time teeth via a runtime-cast escape-hatch path, proving the Converter rejects typos that bypass the seed-type compile check. 100% coverage; full repo build clean.

---

## Cast-pressure failure mode — closed

The original problem (cluster's round-2 finding F1) was that a consumer narrowing axis names in TypeScript code (e.g. `ConditionSetDecl<'tone' | 'language'>`) lost the narrow at the Converter boundary — JSON parsing produced an untyped record, and a typo'd axis name slipped through to runtime where it silently fell through to the base candidate at resolve time.

The stream closed this end-to-end:

1. **Type level (B-1):** `TQualifierNames` flows through every Decl container, so authoring code that constructs a Decl tree gets compile-time discipline.
2. **Converter level (B-2):** opt-in typed Converter siblings narrow the JSON-load result type AND reject typo'd names at convert time via `Converters.enumeratedValue`.
3. **Consumer level (B-3):** `@fgv/ts-prompt-assist` threads the typed Converter through `FileTreePromptStore.create` and `PromptStoreFixture.build`, so YAML round-trips through real adapter code preserve the narrow.

Verified by three test files exercising the same synthetic-consumer pattern (`const validNames = ['tone', 'language'] as const; const qc = Converters.enumeratedValue<ValidName>(validNames)`):

- `libraries/ts-res/src/test/unit/conditions/typedConvert.test.ts` — 4 typed Converter siblings.
- `libraries/ts-res/src/test/unit/resource-json/typedConvert.test.ts` — 12 typed Converter siblings.
- `libraries/ts-prompt-assist/src/test/unit/b3TypedConditions.test.ts` — full consumer-path regression including the runtime-cast escape-hatch (`as unknown as IPromptCandidateRecord<ValidName>`) that proves the teeth are tighter than the seed-type compile check.

---

## Surface preservation outcomes

| Library | Removed exports | Renamed exports | Behavior change on existing exports |
|---|---|---|---|
| `@fgv/ts-res` (B-1) | 0 | 0 | 0 (type-only) |
| `@fgv/ts-res` (B-2) | 0 | 0 | 0 (additive siblings) |
| `@fgv/ts-prompt-assist` (B-3) | 0 | 0 | 0 (additive parameters with `default = string`) |

The lockstep-version policy means a single breaking change anywhere bumps every package's alpha version. The stream's discipline of preserving existing signatures end-to-end was load-bearing for this — the cluster's other concurrent streams could rebase cleanly across each sub-phase merge.

---

## Decisions log (consolidated)

| Decision | Rationale |
|---|---|
| Three sub-phases inside one stream (B-1 / B-2 / B-3), not one combined PR | Erik (2026-05-19): smaller scoped PRs review more cleanly; each sub-phase independently mergeable (B-1 type-only; B-2 adds opt-in runtime; B-3 consumer port). |
| In-cluster (not next-cluster) | Erik (2026-05-19): "B+C cascades into deliverables for this cluster so deferring it just creates debt." |
| B-2 surface shape: typed sibling exports over a shared core, defaults preserved | Candidate D from `phase-b2-design-notes.md` — preserves `ObjectConverter` return type on defaults; opt-in via separate `typed*` symbol. |
| B-3 narrow scope: bindings/qualifiers loaders not threaded with `qualifierNameConverter` | `_bindings.yaml` carries slot-name keys (not qualifier-names); `_qualifiers.yaml` is the AUTHORITY defining the axis set. Threading the downstream Converter into either inverts dependency direction or is a no-op. Cast-pressure regression passes without it. |
| Drop #385's local sibling types (`ITypedConditionSetDecl`, `ITypedPromptCandidateRecord`) | B-2 ships the canonical primitive at the ts-res layer. Carrying #385's local types forward would duplicate the shape ts-res now publishes. |
| Carry forward #385's F2 (`buildSimpleDescriptor`) and F6 (README React-wiring) verbatim | Independent of B-3's typed-conditions story; both are pure-additive ergonomics that compose cleanly with the new surface. |
| `IPromptStore` interface NOT parameterized on `TQualifierNames` | Convert-time teeth carry the runtime narrow; threading the parameter through the interface would expand the parameterization surface significantly into the resolve packlet without proportional value. Deferred as a FUTURE consideration (see open questions). |

---

## Lessons captured

1. **Cascade completeness matters.** B-1 review caught `IResourceTreeRootDecl.resources` / `children` not being parameterized; the brief lesson "trace every place a Decl flows" applied at every layer. B-3 picked this up by tracing every spot a Decl flows through the store/fixture path before parameterizing the seed types — the narrow doesn't evaporate mid-pipeline.

2. **Typed/untyped pair drift hazards demand explicit markers.** B-2's first review surfaced this; the resolution (a `// keep in sync with X` marker above every typed sibling, plus a drift-hazard paragraph in the typed block preamble) is now a documented pattern in the repo's review checklist. B-3 inherits the same idiom via the shared `_buildPromptFileContentsConverter` core.

3. **API-extractor regen as a first-class gate.** Both B-1 and B-2 had warnings on `@link` cross-package refs; both rounds standardized on backtick-quoted type names for new JSDoc. B-3's regen surfaced an `@public` placement issue (an inserted interface above the class doc block stripped the release tag) — caught by the warning gate, fixed in one commit.

4. **The "no manual casts beyond `@ts-expect-error`" rule pushes for cleaner internal-shape design.** B-3's first cut had `params as IFileTreePromptStoreCreateParams<string>` in the static `create` to widen a parameterized public input down to the constructor's expected shape. Refactoring to an internal `IInternalStoreParams` interface that carries the pre-built `promptYamlConverter` eliminated the cast entirely and arguably produced a cleaner separation between public surface and internal wiring.

5. **Result-doc protocol load-bearing for cluster cohesion.** All three phases produced `phase-bN-result.md` artifacts with the same section structure (typed exports, surprises, open questions, acceptance gates). B-3's open-questions section threaded directly into this stream-level result, which in turn threads into the cluster-close prep. Each artifact is self-contained but composes with the next.

---

## Open questions for cluster close

1. **`IPromptStore` parameterization on `TQualifierNames`.** Threading through the interface would tighten the type-level narrow at `store.get()` call sites but expand the parameterization surface through the resolve packlet. Suggest deferring as FUTURE — convert-time teeth already carry the safety. (Documented in `phase-b3-result.md` §Open questions.)

2. **`tools/ts-res-cli` adoption** (state.md F-1). Opportunistic followup chore to thread typed Converters through the CLI's bundle/import path. Not blocking; queue as tech-debt.

3. **Round-2 finding F5 (typed qualifier VALUES, not just names).** The README's new fourth list-item (per F6) explicitly forward-references this. Cluster close is the right time to confirm v0.2 scoping.

---

## Held PRs unblocked

- **#385 (round-2 absorb)** — superseded by this stream's consolidation of F1 ownership at ts-res. F2 + F6 carried forward verbatim into B-3 (PR #395); F1's local sibling types replaced by ts-res's parameterized primitives at the source. PR #385 can be closed without merge.
- **#384 (sample app + round-2 findings)** — rebases onto post-B-3 HEAD. Lands as the last cluster-close prep step.

---

## Acceptance — stream-level exit

- [x] All three sub-phases merged or merge-pending on integration (B-1 ✅ merged `c688292d`; B-2 ✅ merged `f32ba55f`; B-3 ✅ merge-pending PR #395).
- [x] ts-prompt-assist's local `ITypedConditionSetDecl` / `ITypedPromptCandidateRecord` types are NOT in the implementation; references go directly to ts-res's parameterized types.
- [x] Test demonstrates the cast-pressure failure mode is closed at three layers (B-1 type, B-2 Converter, B-3 consumer); a JSON round-trip through the parameterized Converter preserves the narrow; a typo'd qualifier name fails at convert time.
- [x] `result.md` written (this file) summarizing all three sub-phases' outcomes.
- [x] `state.md` reflects final state.
- [x] Stream entry in `docs/WORKSTREAMS.md` flipped to ✅ with consolidated outcome notes.
- [ ] state.md + per-phase result.md migrated to `.ai/tasks/completed/2026-05/ts-res-typed-conditions/` with polished README.md per artifact-protocol convention. *(Owner: orchestrator, post-merge.)*

---

## Phase-result cross-references

- `phase-b1-result.md` — full type list, fix-up rounds, Copilot-review absorptions.
- `phase-b2-result.md` — typed export catalog, factoring observation on default-export return-type narrowing risk, OQ-2 empirical resolution.
- `phase-b3-result.md` — consumer-pattern shape, F2/F6 absorption notes, cast-pressure regression test design, bindings/qualifiers widening decision, file-by-file change summary.
