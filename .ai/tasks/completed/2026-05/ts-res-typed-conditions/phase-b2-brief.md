# Phase B-2 sub-brief: Converter parameterization (`ts-res`, runtime teeth)

**Stream:** `ts-res-typed-conditions` (cluster: `ts-prompt-assist-features`)
**Integration branch:** `claude/ts-prompt-assist-features` (HEAD: `c688292d3` after B-1 merge)
**Workflow shape:** Erik-driven design + implementation (NOT a task-subagent commission — design choices need real-time adjudication)
**Predecessor:** B-1 (`#391`) — merged 2026-05-19; landed the type-level Decl-tree cascade.

---

## Mission

Add **runtime teeth** to `ts-res`'s Converter pipeline so that when a consumer authors `IResourceCollectionDecl<'tone' | 'language'>`, **both** sides of the pipeline honor that narrow:

- **Type flow:** Converter output preserves the consumer's `TQualifierNames` narrow rather than widening back to `string` (the cast-pressure failure mode that B-1's compile-time-only work doesn't close on its own).
- **Validate-time enforcement:** A JSON load containing `qualifierName: 'tonr'` against a `<'tone' | 'language'>`-typed convert call fails at convert time — not silently falls through with a wide `string` value the runtime then has to defend against later.

The principle is the cast-temptation diagnostic from the evaluation addendum: a type narrow that evaporates in the first Converter call trains consumers toward `as` casts. B-2 closes that gap.

---

## Why this is Erik-driven

Three real design choices need adjudication. None has a clearly-right answer; each commits ts-res to a long-term primitive shape.

- **OQ-1 — surface shape.** Three candidates below. They differ on consumer ergonomics, internal cost, and how cleanly the parameterization composes with `QualifierCollector`.
- **OQ-2 — does `QualifierCollector` change?** B-1's agent's read says no; needs empirical verification before committing. If `QualifierCollector` is the authority for "what narrow set does THIS deployment use," the collector may need an additional shape.
- **OQ-3 — cast-pressure regression test home.** Per state.md: ts-res with a synthetic consumer, or defer to ts-prompt-assist in B-3. Recommend ts-res (proves the primitive works regardless of B-3 port state).

A task-subagent commission would have to guess on all three. Erik in a Claude Code session can iterate on each.

---

## Required reading (in order)

1. **B-1's merged PR diff** — see what's already in place and what the cast-pressure regression test should prove is now insufficient:
   ```
   git show c688292d3
   ```
2. **The decision-track docs on integration** — same as B-1; the addendum's Q2 is particularly load-bearing because it sketches a candidate surface:
   - `.ai/tasks/active/ts-prompt-assist/ts-res-typed-conditions-evaluation.md` (Addendum section)
3. **The existing Converter pipeline**:
   - `libraries/ts-res/src/packlets/conditions/convert/decls.ts` — `IConditionDeclConvertContext` (line ~47), `validatedConditionDecl` (line ~58). The current convert-time validation calls `context.qualifiers.validating.get(decl.qualifierName)` — already gates on "is this name registered in the collector." B-2's job is layering the consumer's **narrow** on top of that membership check.
   - `libraries/ts-res/src/packlets/conditions/convert/conditionSetDecls.ts` — array-form and record-form `ConditionSetDecl` converters; cascades up to `ResourceJson`'s converters.
   - `libraries/ts-res/src/packlets/resource-json/convert.ts` — the resource-json Converter chain that consumes the condition Converters.
4. **`QualifierCollector`** (`libraries/ts-res/src/packlets/qualifiers/`) — confirm OQ-2's hypothesis (no surface changes required).
5. **CLAUDE.md / CODING_STANDARDS.md / `/type-safe-validation` skill** — repo-wide discipline. The B-2 work itself MUST NOT introduce manual-cast workarounds (the very anti-pattern it exists to prevent).

---

## Candidate surface shapes (OQ-1)

### Candidate A — Context-field opt-in (B-1 agent's surfaced shape)

Extend `IConditionDeclConvertContext` with an optional `qualifierNameConverter`:

```ts
export interface IConditionDeclConvertContext<TQualifierNames extends string = string> {
  readonly qualifiers: IReadOnlyQualifierCollector;
  readonly qualifierNameConverter?: Converter<TQualifierNames>;
  conditionIndex?: number;
}
```

When `qualifierNameConverter` is supplied, `validatedConditionDecl` runs the raw `qualifierName` field through it before the collector lookup. Consumer supplies `Converters.enumeratedValue(['tone', 'language'] as const)`. Default behavior (omitted) preserves today's loose-string semantics.

**Pros:** small surface delta; threads naturally through the existing context-passing chain; default-string preserved; aligns with existing context-driven validation pattern in this packlet.

**Cons:** the parameter has to thread through every Converter that accepts the context — `conditionSetDecls.ts`, then the resource-json layer's converters. Same depth as A would need at the Converter signature level anyway, but here it's a context-field surface rather than a generic-parameter surface.

### Candidate B — Generic Converter factory

Export a sibling factory that returns a parameterized Converter family:

```ts
export function createTypedConditionDeclConverters<TQualifierNames extends string>(
  names: readonly TQualifierNames[]
): {
  conditionDecl: Converter<IConditionDecl<TQualifierNames>>;
  conditionSetDecl: Converter<ConditionSetDecl<TQualifierNames>>;
  resourceCollectionDecl: Converter<IResourceCollectionDecl<TQualifierNames>>;
  // ... etc
}
```

Default-string Converters at the existing names stay unchanged. Consumers opt into the typed family by calling the factory once at boot.

**Pros:** no signature change on existing exports — pure-additive; the factory is the clearly-marked opt-in boundary; consumer doesn't need to thread anything through their own code (just use the typed family's exports).

**Cons:** doubles the export surface; need to decide what happens when a consumer mixes typed and untyped Converters in the same chain; the literal-set is captured at factory-call time, not at convert-call time, which is fine for static narrows but limits dynamic scenarios.

### Candidate C — Generic on existing Converter exports

Make the existing Converters themselves generic:

```ts
export function conditionDecl<TQualifierNames extends string = string>(
  qualifierNameConverter?: Converter<TQualifierNames>
): Converter<IConditionDecl<TQualifierNames>> { ... }
```

Existing `conditionDecl.convert(x)` becomes `conditionDecl().convert(x)` — a usage change for all existing callers, even though semantics are preserved.

**Pros:** the parameterized shape is the canonical shape; no factory sibling; no context-field threading.

**Cons:** **breaking change** on the existing convert-call sites (parens required). Established surface; counts as breaking even with default-string. Reject unless we accept the cost — the cluster's lockstep policy makes "all consumers retouch" a real expense.

### Lean

Probably A, possibly A + a thin convenience helper for the common case. C is too breaking; B has the cleanest opt-in story but doubles the export surface for a usage pattern that's likely to be the consumer's only ts-res Converter touchpoint.

---

## In-scope paths

- `libraries/ts-res/src/packlets/conditions/convert/decls.ts` — `IConditionDeclConvertContext`, `validatedConditionDecl`.
- `libraries/ts-res/src/packlets/conditions/convert/conditionSetDecls.ts` — the array-form and record-form Converters that need to thread the parameter (or accept the typed context).
- `libraries/ts-res/src/packlets/resource-json/convert.ts` — resource-json Converters that consume the condition Converters; cascade the parameterization upward to whatever level is the consumer's typical entry point (likely `resourceCollectionDecl` or `resourceTreeRootDecl`).
- `libraries/ts-res/src/packlets/qualifiers/` — IF (and only if) OQ-2 verification surfaces a real `QualifierCollector` surface change. Default expectation: no changes here.
- `libraries/ts-res/etc/ts-res.api.md` — api-extractor regen.
- `libraries/ts-res/src/test/unit/` — tests covering both the opt-in path (typed Converter rejects typo) and the default path (string-permissive behavior preserved).
- `common/changes/@fgv/ts-res/` — rush change file (`minor` bump; opt-in opt-out depending on Candidate A vs B).

## Out-of-scope paths

- `libraries/ts-prompt-assist/` — consumer port lives in B-3. Do not touch ts-prompt-assist's local sibling types here.
- `tools/ts-res-cli/`, `libraries/ts-res-ui-components/`, other ts-res consumers — should compile unchanged under Candidate A or B. If they don't, surface as a blocker BEFORE picking a candidate (informs the shape decision).
- The cast-pressure regression test's ts-prompt-assist port — if OQ-3 lands on "test lives in ts-res with synthetic consumer," that's in scope. If it lands on "defer to B-3," that's out of scope for B-2.

---

## Acceptance criteria (B-2 exit gates)

- [ ] OQ-1 resolved with a named candidate (A / B / C / variant); rationale captured in either the B-2 PR description or appended to the stream brief.
- [ ] OQ-2 verified empirically (`QualifierCollector` surface change required: yes/no — with code evidence).
- [ ] OQ-3 resolved with the regression-test home named.
- [ ] Converter parameterization landed per chosen candidate; default-string preserves today's behavior.
- [ ] Cast-pressure regression test: a JSON load with `qualifierName: 'tonr'` against a `<'tone' | 'language'>`-typed convert call fails at convert time with an error mentioning the typo'd name. Default-string convert call on the same JSON either succeeds (today's behavior) or fails with the existing collector-membership error — pick one and document.
- [ ] `rush build` passes (full repo; downstream consumers compile unchanged — `ts-res-cli`, `ts-res-ui-components`, `ts-prompt-assist`).
- [ ] `rushx lint` passes in `@fgv/ts-res` (separate gate from build).
- [ ] `rushx test` passes with 100% coverage across all 4 metrics. **Include both the opt-in narrow path AND the default-string path** in the coverage surface.
- [ ] `rushx fixlint` was run before the final commit.
- [ ] api-extractor `etc/ts-res.api.md` regenerated; diff explicit about which signatures changed.
- [ ] Rush change file added under `common/changes/@fgv/ts-res/` (`type: minor` for Candidate A or B; `major` if Candidate C is somehow chosen).
- [ ] No `any` types; no manual casts beyond `@ts-expect-error` assertions in tests. **B-2's own implementation MUST NOT use the cast workaround it exists to prevent.**
- [ ] State.md updated: B-2 row flipped to ✅ with PR link; B-3 row updated to "🟢 ready (B-2 merged)".

---

## Phase steps (suggested order)

1. **Survey + verify OQ-2.** Read `IReadOnlyQualifierCollector` surface. Confirm B-1 agent's hypothesis ("no surface changes required"). If wrong, surface as a substrate-amend question before proceeding.
2. **Pick OQ-1 candidate.** Try A first by sketch (no commit); if the threading depth is reasonable across `conditionSetDecls.ts` + `resource-json/convert.ts`, commit to A. If A reveals real friction, evaluate B.
3. **Land the parameterization** in the chosen shape.
4. **Add the cast-pressure regression test.** Use a synthetic consumer setup (or whatever OQ-3 lands on). Verify the test fails at convert time on the typo input.
5. **Default-path coverage.** Confirm an existing default-string convert call still passes; add explicit coverage if today's tests don't cover the relevant path.
6. **Pre-PR gates.** Full local `rush build` + per-package `rushx lint` + `rushx test`; api-extractor regen; rush change file.
7. **PR.** Target `claude/ts-prompt-assist-features` (integration branch), NOT `release`. Title: `feat(ts-res): B-2 Converter parameterization — runtime teeth on qualifier-name narrows`.

---

## Stop-and-decide checkpoints (since you're driving, these are check-ins for you to consider rather than agent-stop signals)

- **Before committing to OQ-1's chosen candidate:** sketch the threading depth. If Candidate A's context-field surface would balloon beyond the natural context-passing seams, that's signal to consider B before committing.
- **If `QualifierCollector` does need a surface change:** that's a substrate question. Amend brief.md / state.md to acknowledge before the implementation PR opens.
- **If the cast-pressure regression test can't be written cleanly:** that's signal that the chosen shape didn't actually close the cast-pressure gap. Reconsider OQ-1.

---

## Branch + PR posture

- **Branch:** `chore/ts-res-typed-conditions-b2-converter-teeth` (or whatever you prefer).
- **PR target:** `claude/ts-prompt-assist-features` (integration).
- **PR title:** `feat(ts-res): B-2 Converter parameterization — runtime teeth on qualifier-name narrows`.

---

## Stream sequencing reminder

- B-2 merge unblocks B-3 (ts-prompt-assist consumer port — drops local `ITypedConditionSetDecl` / `ITypedPromptCandidateRecord`; references ts-res's parameterized types directly). B-3 is orchestrator-driven via code-monkey task subagent unless B-2 surfaces something that reshapes the consumer port.
- B-3 merge unblocks held cluster PRs #385 and #384.
- After #384 lands, cluster close prep PR + cluster → release promotion close out the cluster.

---

## Reading the B-1 result for context

`.ai/tasks/active/ts-res-typed-conditions/phase-b1-result.md` — the B-1 agent's writeup includes "Open Questions for B-2" at the bottom which sketches OQ-1's Candidate A more concretely (`qualifierNameConverter?: Converter<QualifierName>` on the existing context interface) and names the 4–6 internal files the cascade likely touches. Worth reading even if you go a different direction on OQ-1.
