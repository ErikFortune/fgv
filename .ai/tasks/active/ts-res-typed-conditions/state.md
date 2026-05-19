# Stream state: `ts-res-typed-conditions`

**Status:** 🟢 ready to commission — substrate prep in flight
**Cluster:** `ts-prompt-assist-features` (in-cluster)
**Integration branch:** `claude/ts-prompt-assist-features`
**Last updated:** 2026-05-19 (orchestrator — B-1 merged; B-2 sub-brief drafted)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| B-1 — Decl-tree cascade (`ts-res`, type-only) | ✅ merged | PR #391 merged 2026-05-19; final list parameterized = 17 items (containers + tree child node + type guards + union alias); `getKeyFromLooseDecl` + type-guard soundness fixes bundled; api-extractor regenerated; 100% coverage; downstream consumers compile unchanged |
| B-2 — Converter parameterization (`ts-res`, runtime teeth) | ✅ complete (PR pending) | Branch `chore/ts-res-typed-conditions-b2-converter-teeth`; Candidate D shipped (sibling `typed*` exports over a shared core, existing untyped exports preserved); OQ-2 verified empirically — no `QualifierCollector` surface change; cast-pressure regression tests in `conditions/typedConvert.test.ts` and `resource-json/typedConvert.test.ts`; api-extractor unresolved-link warnings = baseline 849 (no new); all 11 downstream consumers compile unchanged; 100% coverage; result doc at `phase-b2-result.md` |
| B-3 — `ts-prompt-assist` port (consumer) | 🟢 ready | Drop local `ITypedConditionSetDecl` / `ITypedPromptCandidateRecord`; reference ts-res parameterized types directly; thread `qualifierNameConverter` into `FileTreePromptStore.create` and `PromptStoreFixture.build`; see open questions for B-3 in `phase-b2-result.md` |

---

## Decisions log (orchestrator, substrate prep)

| Decision | Rationale |
|---|---|
| In-cluster (not next-cluster) | Erik (2026-05-19): "B+C cascades into deliverables for this cluster so deferring it just creates debt." v0.1 of `@fgv/ts-prompt-assist` ships with B+C wired through; consumer-port deliverables avoid being built against a shape that gets re-done. |
| Three sub-phases (B-1 type cascade, B-2 Converter teeth, B-3 ts-prompt-assist port), not one combined PR | Erik (2026-05-19): review attention has been a real problem in this cluster; smaller scoped PRs review more cleanly. Each sub-phase is independently mergeable (B-1 is type-only; B-2 adds opt-in runtime; B-3 is consumer port). |
| Lockstep version policy applies | ts-res change → all packages bump. Each sub-phase's rush change file is `minor` (B-1 / B-2 are additive on ts-res's active-development surface; B-3 is also additive in ts-prompt-assist). |
| Decision-track docs (PRs #387, #388, #389) merged to integration | Per `.ai/conventions/workflow/doc-graduation.md`: this stream is the named downstream consumer of the option-space + evaluation docs; they graduate to integration as substrate input. |
| Closed PR #386 supersession | The leaf-only parameterization can't land as-is (no plumbing in containers); B-1 starts from the integration HEAD post-#389 merge and re-implements with full cascade. The `Partial` widening fix is carried forward into B-1 scope rather than landed separately — keeping it bundled with the cascade preserves review context. |

---

## Open questions

### To resolve at sub-brief authoring time

| ID | Question | Phase |
|---|---|---|
| OQ-1 | What's the Converter parameterization surface shape? Opt-in factory call returning a parameterized Converter family, per-call validation context carrying the name-set, or another shape? | B-2 sub-brief |
| OQ-2 | Does B-2 require any `QualifierCollector` surface changes, or does the existing collector API support the consumer-side opt-in? | B-2 sub-brief (verify before commission) |
| OQ-3 | Should the cast-pressure regression test live in `ts-res` (against a synthetic consumer) or in `ts-prompt-assist` (against the real consumer port)? | B-3 sub-brief |

### Deferred (not this stream's concern)

| ID | Question | Where it lives |
|---|---|---|
| F-1 | Should `ts-res-cli` adopt parameterized Converters once B+C lands? | Followup; opportunistic, not blocking |
| F-2 | Future stream: typed qualifier VALUES (not just names) — round-2 finding F5 in `pressure-test-findings-round-2.md` | `docs/FUTURE.md` (queued as v0.2) |

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-05-19 | Stream commissioned | Substrate-prep PR `chore/ts-res-typed-conditions-stream-prep` opened on `claude/ts-prompt-assist-features` |
| 2026-05-19 | Decision-track docs landed on integration | PR #387 (options brief), #388 (first evaluation), #389 (addendum with leaf-only correction) all merged via squash |
| 2026-05-19 | PR #386 closed | Superseded; latent-bug `Partial` widening fix carried forward into B-1 scope |
| 2026-05-19 | B-1 commissioned + completed | Branch `chore/ts-res-typed-conditions-b1-cascade`; all 9 container interfaces + leaf types parameterized; `getKeyFromLooseDecl` fix ported; api-extractor regenerated; 100% coverage; downstream consumers compile unchanged; PR opened |
| 2026-05-19 | B-1 review rounds absorbed | Round 1: cascade-incompleteness on `IResourceTreeRootDecl` (added `IResourceTreeChildNodeDecl` parameterization; root now extends child node); three api-extractor `@link` warnings replaced with backtick refs; missing `@fgv/ts-utils-jest` test import added; state.md artifact accuracy. Round 2: type-guard runtime soundness on `isLooseResourceCandidateDecl` / `isLooseResourceDecl` (`'id' in decl` → `'id' in decl && typeof decl.id === 'string'`). Round 3: PR description updated to explicitly disclose the two runtime fixes (no code change). All gates re-passed. |
| 2026-05-19 | B-1 merged | PR #391 squash-merged to integration as `c688292d3`. |
| 2026-05-19 | B-2 sub-brief drafted | `phase-b2-brief.md` enumerates three candidate surface shapes for OQ-1 (A: context-field opt-in [lean]; B: generic Converter factory; C: generics on existing exports [reject — breaking]); OQ-2 hypothesis no-surface-change (verify); OQ-3 lean ts-res-internal cast-pressure regression test. Erik-driven phase. |
| 2026-05-19 | B-2 design notes added | `phase-b2-design-notes.md` selects Candidate D — sibling `typed*` exports over a shared parameterized core, existing untyped exports preserved as thin wrappers. Non-breaking. |
| 2026-05-19 | B-2 implemented | Branch `chore/ts-res-typed-conditions-b2-converter-teeth`; 16 new typed siblings (4 in `Conditions.Convert`, 12 in `ResourceJson.Convert`); `IConditionDecl` / `IConditionSetDecl` parameterized on `TQualifierNames` (additive default); cast-pressure regression tests added; api-extractor regenerated (no new unresolved-link warnings); 100% coverage; all 11 downstream consumers compile unchanged. Result: `phase-b2-result.md`. |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | #390 | merged |
| B-1 | #391 | merged (`c688292d3`) |
| B-2 | TBD (pending push) | implementation complete on `chore/ts-res-typed-conditions-b2-converter-teeth`; result: `phase-b2-result.md` |
| B-3 | TBD (task-subagent) | ready (was blocked on B-2) |

---

## Related cluster PRs (held by this stream)

| PR | Why held |
|---|---|
| #385 (ts-prompt-assist round-2 absorb F1+F2+F6) | B-3 will drop its local `ITypedConditionSetDecl` / `ITypedPromptCandidateRecord` to reference ts-res's parameterized types directly. #385 holds until B-3 lands. |
| #384 (sample app + round-2 findings) | Rebases onto post-B-3 HEAD; lands last before cluster close. |
