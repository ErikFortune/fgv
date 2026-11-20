# Stream brief: `ts-res-typed-conditions`

**Cluster:** `ts-prompt-assist-features` (in-cluster; B+C is a deliverable for the v0.1 ts-prompt-assist publish per Erik's "lowest appropriate level" framing)
**Integration branch:** `claude/ts-prompt-assist-features` (existing; off `release`)
**Status:** ready to commission

---

## Mission

Make `@fgv/ts-res` honor qualifier-name semantics — the closed set of axis names a deployment declares — at both the **type level** (across the full Decl tree) and the **runtime level** (Converter pipeline). Replace the half-built leaf-only parameterization from closed PR #386 with the complete co-designed shape.

The principle: ts-res is the layer that owns the qualifier-name concept (registered via `QualifierCollector`); it should own the discipline that enforces it. Consumer libraries (`@fgv/ts-prompt-assist` and future siblings) should be able to opt into typed-narrow authoring AND have on-disk JSON validated against the declared set — without the cast-pressure failure mode where the type narrows in code but evaporates at the Converter boundary.

---

## Why this stream exists — decision-track input

Read these before drafting any code. They capture the option space, the evaluation, and the corrections that landed during the design discussion. All three live on integration at `.ai/tasks/active/ts-prompt-assist/`:

- `ts-res-typed-conditions-design.md` — original four-option brief (A withdraw / B cascade / C runtime teeth / D land + TECH_DEBT). Establishes the option space.
- `ts-res-typed-conditions-evaluation.md` — first evaluation (Option B recommendation) + **the load-bearing addendum** that corrected the framing: PR #386 was not actually Option B — it was leaf-only with no plumbing in the container types, so the parameterized `ConditionSetDecl<T>` had no flow path from any realistic authoring chain. **This correction is critical** — the implementing agent must thread `TQualifierNames` through the container types, not just the leaf.

Plus: closed PR #386 itself (`chore/ts-res-typed-condition-set-decl` branch) carries the latent-bug fix in `ConditionSet.getKeyFromLooseDecl` (`conditions/conditionSet.ts:200-225`) — the `Partial` widening forces correct handling of explicit-`undefined` record entries. **Carry this fix forward into Phase B-1.**

---

## Sub-phase shape

Per orchestrator + Erik discussion (2026-05-19), three sub-phases inside this single stream — each with its own sub-brief drafted at commission time, each landing as its own PR on integration:

### Phase B-1 — Decl-tree cascade (`ts-res`, type-only)

Thread `TQualifierNames extends string = string` through the full Decl chain in `libraries/ts-res/src/packlets/resource-json/json.ts`:

- `ILooseConditionDecl<T>` (already parameterized by #386 — carry forward)
- `ConditionSetDeclAsArray<T>` / `AsRecord<T>` / `ConditionSetDecl<T>` (already parameterized by #386 — carry forward)
- **New (the cascade #386 missed):** `IChildResourceCandidateDecl<T>`, `ILooseResourceCandidateDecl<T>`, `IImporterResourceCandidateDecl<T>`, `IContainerContextDecl<T>`, `IChildResourceDecl<T>`, `ILooseResourceDecl<T>`, `IResourceCollectionDecl<T>`, `IImporterResourceCollectionDecl<T>`, `IResourceTreeRootDecl<T>`

All with `extends string = string` default so existing untyped callers compile unchanged.

Carry forward from #386:
- The `ConditionSet.getKeyFromLooseDecl` adjustment (explicit-`undefined` handling) — this is a genuine correctness fix and lands with the cascade, not deferred.

**Scope guardrails:** type-level only. Converters keep their default-string signatures in this sub-phase. No behavior change at runtime.

**Acceptance:** `rush build`, `rushx lint`, `rushx test` all clean in `ts-res` and `ts-prompt-assist`; api-extractor regenerated; rush change file (minor bump, ts-res is on lockstep so this propagates).

### Phase B-2 — Converter parameterization (`ts-res`, runtime teeth)

Parameterize the Converter pipeline against a `QualifierCollector`-derived literal set so JSON loads validate qualifier names against the declared axes:

- Surface design: how does the consumer thread their `QualifierCollector<TNames>` (or its name-set) into the Converter chain? Candidate shapes:
  - Converter factory that accepts a collector / name-set and returns a parameterized Converter family.
  - Per-call validation context carrying the name-set.
  - Default behavior when no collector is supplied: today's loose-string behavior (back-compat).
- The Converter signatures change. Defaults preserve existing callers — but the parameterized path is the one consumers should opt into when they want runtime teeth.
- Affected files (at minimum, expand during design): `libraries/ts-res/src/packlets/conditions/convert/decls.ts` (where `validatedConditionDecl` already calls `context.qualifiers.validating.get(decl.qualifierName)`); cascade up through `ResourceJson` Converters.

**Existing partial teeth, per the evaluation addendum:** `validatedConditionDecl` (`conditions/convert/decls.ts` ~line 68) ALREADY validates qualifier names against the registered collector at convert time. What's missing is enforcement of the consumer's **declared literal set** (their narrowed axes vs the broader registry). Phase B-2's scope is closing that narrower gap, not building runtime validation from scratch.

**Scope guardrails:** the parameterization must be opt-in (default-string keeps existing consumers working). Breaking changes only via the Active Development surface designation for ts-res's resource-json packlet.

**Acceptance:** same as B-1 plus a test demonstrating a JSON load with a typo'd qualifier name failing at convert time under the parameterized Converter path; existing consumers compile unchanged.

### Phase B-3 — ts-prompt-assist port (`ts-prompt-assist`, consumer port)

Drop ts-prompt-assist's local sibling types (`ITypedConditionSetDecl`, `ITypedPromptCandidateRecord`, currently introduced in PR #385); reference ts-res's parameterized types directly. Update `PromptStoreFixture` / `IPromptStoreFixtureSeed<T>` to thread the new ts-res shapes through. Verify that round-trip flows (seed → Converter → typed result) preserve narrows end-to-end without cast-pressure escape hatches.

**Acceptance:** ts-prompt-assist's local sibling types are gone; the consumer-side authoring discipline uses ts-res's primitives directly; F1 from the round-2 findings is closed via ts-res ownership; `rush build`/`rushx lint`/`rushx test` clean in `ts-prompt-assist`.

---

## In-scope paths

- `libraries/ts-res/src/packlets/resource-json/` — Decl interfaces (Phase B-1).
- `libraries/ts-res/src/packlets/conditions/convert/` — Converter pipeline (Phase B-2).
- `libraries/ts-res/src/packlets/conditions/conditionSet.ts` — `getKeyFromLooseDecl` carry-forward fix from #386 (Phase B-1).
- `libraries/ts-res/etc/ts-res.api.md` — api-extractor regen (each phase).
- `libraries/ts-res/src/test/unit/` — test coverage for parameterized surface (each phase).
- `libraries/ts-prompt-assist/src/packlets/fixtures/` and the local sibling types — Phase B-3.
- `libraries/ts-prompt-assist/src/test/unit/` — test updates (Phase B-3).
- `common/changes/@fgv/ts-res/` and `common/changes/@fgv/ts-prompt-assist/` — rush change files (each phase).

## Out-of-scope paths

- `libraries/ts-res/src/packlets/qualifiers/` — `QualifierCollector` is the runtime authority for B-2's design, but its surface doesn't change here. If B-2's design surfaces a real `QualifierCollector` surface change, surface as an open question rather than proceeding.
- `tools/ts-res-cli/` and `libraries/ts-res-ui-components/` — downstream consumers of ts-res's Decl surface. Default-string back-compat means these should compile unchanged; if they don't, surface as a blocker, don't fix in scope.
- Any other ts-prompt-assist surface beyond the local-sibling-types replacement (Phase B-3).
- The `ai-assist-thinking-events` follow-on stream — sequenced after this cluster, no overlap here.

---

## Skills to load (with trigger conditions)

| Trigger | Skill |
|---|---|
| Writing or modifying Converter signatures, validate-time enforcement code | `/type-safe-validation` |
| Writing or modifying Result-returning code in the Converter pipeline | `/result-pattern` |
| Writing or modifying tests in any phase | `/result-tests` |
| Any utility-shaped code that "feels general" — before reaching for a hand-rolled helper | `/published-primitives-reflex` |

---

## Missing-input rule

If any of the following is missing or ambiguous when you start work, STOP and surface the question to the orchestrator — do NOT proceed by exploring the codebase to reconstruct intent:

- The three decision-track docs on integration (named under "Why this stream exists" above).
- The sub-phase sub-brief for the phase you've been commissioned to execute.
- A clear answer to "is the Converter parameterization shape an opt-in factory call, a per-call validation context, or some other design?" if Phase B-2 sub-brief doesn't pin this — surface as design question before implementing.

---

## Acceptance criteria (stream exit)

Per `.ai/instructions/CODING_STANDARDS.md` § Pre-PR Validation Checklist, every sub-phase PR must satisfy:

- [ ] `rush build` passes in every modified package
- [ ] `rushx lint` passes in every modified package *(NOT transitively run by build — separate gate)*
- [ ] `rushx test` passes with 100% coverage in every modified package
- [ ] `rushx fixlint` was run before the final commit
- [ ] No `any` types; all fallible operations return `Result<T>`
- [ ] api-extractor regenerated where public surface changed
- [ ] Rush change file added under `common/changes/<package>/`

Stream-level exit (after Phase B-3 lands):

- [ ] All three sub-phases merged to integration.
- [ ] ts-prompt-assist's local `ITypedConditionSetDecl` / `ITypedPromptCandidateRecord` types are gone; references go directly to ts-res's parameterized types.
- [ ] A test demonstrates the cast-pressure failure mode is closed: a JSON round-trip through the parameterized Converter preserves the narrow, and a typo'd qualifier name in a JSON load fails at convert time.
- [ ] `result.md` written summarizing the three sub-phases' outcomes; state.md migrated to `.ai/tasks/completed/<YYYY-MM>/ts-res-typed-conditions/` with a polished `README.md` per the artifact-protocol convention.
- [ ] Stream entry in `docs/WORKSTREAMS.md` flipped to ✅.

---

## Dependencies

- **Hard:** none currently in flight that block this. PRs #385 and #384 are downstream of Phase B-3 (B-3 ports #385 to drop sibling types; #384 rebases after).
- **Soft:** the substrate-prep PR (this brief + state.md) must merge before Phase B-1 commission.

---

## Resume protocol

To pick up this stream from any cold-start orchestrator session:

1. Read this brief.
2. Read `state.md` (in the same directory) — phase status + decisions log.
3. Read the three decision-track docs under `.ai/tasks/active/ts-prompt-assist/` (named under "Why this stream exists").
4. Check the cluster's in-flight PRs (`mcp__github__list_pull_requests`, base = `claude/ts-prompt-assist-features`).
5. If a sub-phase is in flight (state.md will say so), read its sub-brief at `.ai/tasks/active/ts-res-typed-conditions/phase-<B-1|B-2|B-3>-brief.md`.

---

## Branch + PR posture

- Stream substrate (this brief + state.md): substrate-prep PR `chore/ts-res-typed-conditions-stream-prep` → `claude/ts-prompt-assist-features`.
- Sub-phase work branches: `<phase-id>/ts-res-typed-conditions-<short-name>` (the cloud-agent harness will suffix; document the actual branch name in state.md per L2).
- Sub-phase PRs target `claude/ts-prompt-assist-features` (integration), NOT `release`. Cluster close (later) is the single PR that goes integration → release.
