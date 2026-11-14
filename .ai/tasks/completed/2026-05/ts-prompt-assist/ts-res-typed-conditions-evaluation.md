# ts-res `ConditionSetDecl` Parameterization — Owner-Lens Evaluation

**Date:** 2026-05-19
**Branch:** `chore/ts-res-typed-conditions-evaluation`
**PR under review:** #386 — parameterize `ConditionSetDecl` family on `TQualifierNames`
**Design options doc (prior brief):** `.ai/tasks/active/ts-prompt-assist/ts-res-typed-conditions-design.md` (available via `git show origin/chore/ts-res-typed-conditions-options`)
**Integration branch HEAD at evaluation:** `17bc852e`

---

## Frame

The question is whether PR #386's compile-time-only parameterization of the `ConditionSetDecl` family should land in `@fgv/ts-res` as-is, be cascaded through the full Decl chain, be given runtime enforcement, or be withdrawn — evaluated from the position of a ts-res library owner whose primary obligation is keeping ts-res's surface coherent, honest, and maintainable for its existing consumers.

The prior design brief evaluated options largely from a "what unblocks the cluster" frame. This evaluation deliberately applies a different lens: if this change were proposed by a contributor who had no knowledge of `ts-prompt-assist`, would a ts-res owner accept it?

---

## Architectural Assessment

### Q1 — Is `QualifierCollector` the right runtime authority for "what qualifier names exist"?

**Answer: Yes, it is the right authority. But it cannot express its authority as a type-level literal union, and that limitation is fundamental, not incidental.**

Evidence from the codebase:

- `QualifierCollector` at `/home/user/fgv/libraries/ts-res/src/packlets/qualifiers/qualifierCollector.ts` extends `ValidatingConvertingCollector<Qualifier, IQualifierDecl>`. It holds every qualifier in the deployment, validates them on insertion, and provides `getByNameOrToken` and `hasNameOrToken` for name-based lookup.

- The `ConditionCollector` at `/home/user/fgv/libraries/ts-res/src/packlets/conditions/conditionCollector.ts:39` holds a reference to `qualifiers: IReadOnlyQualifierCollector`. All condition validation routes through this reference — `validatedConditionDecl` at `conditions/convert/decls.ts:68` calls `context.qualifiers.validating.get(decl.qualifierName)` as the runtime enforcement point.

- This means ts-res already has runtime teeth for qualifier-name validity on the Converter path. If `decl.qualifierName` does not name a registered qualifier, `validatedConditionDecl.convert(...)` returns a `Failure`. The bite is real; it happens at the `validatedConditionSetDecl` / `ConditionSet.getKeyFromLooseDecl` boundary.

- However: `QualifierCollector` is a runtime object. Its key type is `QualifierName` (a branded `string`), not a literal string union. There is no way to derive `'tone' | 'language'` from it at compile time because TypeScript's type system cannot introspect a runtime collection's key set. The literal-union discipline PR #386 introduces is therefore **inherently a consumer-authoring-time concern**, not a library-runtime concern, regardless of where the generic parameter lives.

**The orchestrator's hypothesis ("QualifierCollector as type-AND-runtime authority") is true for the runtime half and false for the type-half.** There is no design that makes a `QualifierCollector` instance the source of a compile-time literal union. The compile-time union can only come from a literal array the consumer writes in their code (`['tone', 'language'] as const`). ts-prompt-assist's `PromptLibrary<TAxes>` already implements this correctly — the `TAxes` parameter is inferred from the create-time literal array and flows into the typed surface.

There is no better runtime authority candidate. `QualifierCollector` is correct, already enforces at the right boundary, and that fact doesn't change under any option.

---

### Q2 — What does the coherent type-and-runtime story look like if ts-res commits to the pattern?

**Answer: The type-and-runtime story can be made coherent, but its shape is not a cascade of generic parameters on Decl types. It is a parameterized Converter family.**

A sketch:

```
// Today (runtime enforcement exists, type narrowing does not at Converter level)
validatedConditionDecl:
  Converters.generic<IValidatedConditionDecl, IConditionDeclConvertContext>
  where IConditionDeclConvertContext.qualifiers is IReadOnlyQualifierCollector

// Option C coherent shape (runtime enforcement + type-level awareness together)
// The context carries a typed converter for qualifier names:
interface ITypedConditionDeclConvertContext {
  readonly qualifiers: IReadOnlyQualifierCollector;
  readonly qualifierNameConverter?: Converter<QualifierName>;
  // default: Converters.string + branded cast — existing behavior
  // typed: Converters.enumeratedValue(['tone', 'language'] as const) + branded cast
}
```

The `qualifierNameConverter` in the context is how runtime teeth get added at the validate boundary. Without it, behavior is today's behavior. With it, a typo'd qualifier name in a JSON-loaded candidate fails at validate time with a clear error naming the invalid axis.

The cascade of generic parameters (Option B) is NOT this story. Option B adds `TQualifierNames extends string = string` to 9 Decl interfaces — these are authoring-time types used for building seeds in code, not runtime validators. A JSON-loaded condition never touches these types; it goes through `ConditionSetDecl` (the loose type) → `conditionSetDecl` converter → `validatedConditionSetDecl` converter → `ConditionSet`. The generic parameters on the Decl types have no effect on that path.

The full coherent story therefore has two independent pieces:
1. **Authoring discipline (type-level):** generic parameters on Decl types so in-code seed authoring gets typo rejection. This is what PR #386 + Option B do.
2. **Load discipline (runtime):** parameterized `IConditionDeclConvertContext` so JSON-loaded candidates are validated against the known qualifier set at convert time. This is Option C.

These are genuinely independent. Option B does not pave the way for Option C in any mechanical sense — the Converter parameterization would be the same whether or not the Decl types carry a generic.

---

### Q3 — Is the cascade-only shape (Option B without C) coherent as a stable end state?

**Answer: It is coherent as a stable end state, but only for the in-code authoring use case. It is NOT coherent as a stable end state for a library that has disk-backed stores — and ts-res does have disk-backed stores.**

The seam critique Erik raised ("parameterization stops at `ConditionSetDecl`; consumers of the type keep the loose shape") is a real structural problem if the seam is inside the library. But if the seam is at the library boundary — if the parameterized types are the types ts-res-external consumers write their seeds in, and the unparameterized types are what ts-res's internal Converters consume — then the seam is architecturally correct, not arbitrary.

PR #386's seam IS at the library boundary. `ConditionSetDecl<TQualifierNames>` is the authoring type. The Converter pipeline starts at `conditionSetDecl` (the `IConditionSetDecl` internal form), which is already unparameterized. The seam is between "type the consumer writes" and "type the Converter sees" — a clean boundary.

Option B extends this seam upward: the authoring types for candidates, resources, collections, and the tree root all carry the parameter. This is additive coherence — the authoring chain becomes consistently typed all the way to the root. The seam moves from `ConditionSetDecl` to `IResourceTreeRootDecl` — still at the library boundary, now explicitly at the entry point.

**Option B without C is coherent as a stable end state for in-code resource authoring.** It is not coherent for "a ts-prompt-assist consumer loads a YAML file with conditions — are those conditions valid?" The runtime-teeth gap remains.

However: whether that gap matters depends on whether ts-res's ts-prompt-assist consumer depends on the runtime gap being filled in ts-res or is willing to own that validation. Reading `ts-prompt-assist`'s architecture: the `ConditionCollector` path (via `ConditionSet.getKeyFromLooseDecl`) ALREADY validates qualifier names at runtime when conditions are converted. The runtime teeth exist. The issue is not that runtime teeth are missing — it is that the type annotation implies a guarantee that the validator doesn't use. That is an honesty gap in the docstring, not a safety gap in the system.

---

### Q4 — Is the `Partial` widening in PR #386 a structural improvement, neutral, or hidden cost?

**Answer: It is a structural improvement for the type system, and the reader-side adjustment is semantically equivalent. The PR body's "F14-class strict tightening" claim is accurate.**

Evidence:

Current `ConditionSetDeclAsRecord` (pre-PR): `Readonly<Record<string, string | IChildConditionDecl>>`. TypeScript's type for `Object.entries` on a `Record<K, V>` is `[string, V][]` — TS does NOT mark values as potentially undefined even when keys could be absent at runtime.

Post-PR `ConditionSetDeclAsRecord<TQualifierNames>`: `Readonly<Partial<Record<TQualifierNames, string | IChildConditionDecl>>>`. TypeScript's type for `Object.entries` on a `Partial<Record<K, V>>` is `[string, V | undefined][]` — TS now acknowledges that keys may be absent.

The reader adjustment in `getKeyFromLooseDecl` (`conditionSet.ts` lines 206-218 on the PR branch) adds an explicit `if (value === undefined) { continue; }` guard. This is the correct change — it handles the case the previous type pretended couldn't happen. At runtime, before the Partial widening, a key set to `undefined` in the record would have slipped through the `typeof value === 'string'` check and hit the `else` branch, which does `{ qualifierName, ...value }` — spreading `undefined` is a no-op in JavaScript, so it would have produced `{ qualifierName }` — a malformed `ILooseConditionDecl` missing the required `value` field. The old code had a latent bug that the Partial widening forces the type system to acknowledge and the new code correctly defends against.

The c8 ignore directive on the undefined guard is appropriate — reaching `Object.entries` on a `Partial<Record>` and getting a `[key, undefined]` entry requires explicitly setting a key to `undefined` in a JavaScript object, which is unusual enough to be defensive code.

**The `Partial` widening is a net improvement. The "F14-class strict tightening" characterization is accurate.**

---

### Q5 — What is the cost of Option C's breaking changes given ts-res's current consumers?

**Answer: Option C is additive-with-careful-defaults for internal library consumers, but adds context-threading complexity that will cascade across the importer/builder surface.**

ts-res consumers in the monorepo:
- `@fgv/ts-res-ui-components` — `libraries/ts-res-ui-components/package.json`
- `@fgv/ts-prompt-assist` — exists on integration branch, not yet released
- `tools/ts-res-tutorial`
- `tools/ts-res-browser`
- `tools/ts-res-cli`
- `tools/ts-res-ui-playground`
- `tools/ts-res-browser-cli`

The Converter parameterization in Option C would change the signature of `validatedConditionDecl`'s convert context (`IConditionDeclConvertContext`). The key question is whether the default is backward-compatible:

- If `qualifierNameConverter` is optional and defaults to `Converters.string` + branded cast (existing behavior), the change is purely additive for all existing callers.
- Callers who want runtime teeth pass in `Converters.enumeratedValue([...] as const)`.
- The cascade stops at the Converter context, not at the Decl types — the 9 consuming Decl interfaces don't need generic parameters just because the Converter context has a new optional field.

**The breaking concern is overstated in the prior design brief.** Option C with careful defaulting is additive, not breaking, for the Converter callers. The friction is in ts-res's own internal Converter chain: `validatedConditionSetDecl` calls `validatedConditionDecl` indirectly via `ConditionCollector.validating.getOrAdd()` — threading a new optional context field through that chain requires touching several internal sites, but none of the changes would be breaking at the API surface level.

The honest cost estimate: Option C requires 4-6 ts-res internal files touched, 2-3 new types on the public surface (the extended context interface, possibly a factory helper for building typed context), and tests for the new behavior. It is a medium-complexity PR, not a sub-phase-sized commission.

The assessment that Option C "probably breaks" existing consumers is wrong if defaults are handled correctly. The assessment that it "deserves more design rigor than the cluster's remaining hours" may be right on other grounds (readiness, not breaking).

---

### Q6 — Are ts-prompt-assist's local sibling types the correct layer for consumer-side authoring discipline?

**Answer: Partially. The seed-level typed authoring discipline lives correctly at the consumer layer. The `ConditionSetDecl<TQualifierNames>` parameterization in ts-res is justified independently of ts-prompt-assist's scenario.**

Evidence from the integration branch:

`ts-prompt-assist`'s `IPromptCandidateRecord` (in `libraries/ts-prompt-assist/src/packlets/types/descriptor.ts:119`) already references `ResourceJson.Json.ConditionSetDecl` — the un-parameterized form. The library's own `TAxes` parameter (`PromptLibrary<TResponse, TAxes>`) flows through a different channel: the resolve-request's qualifier context (`IQualifierContext`), not the condition declarations in candidate records.

The seed-authoring scenario (where ts-prompt-assist's consumer writes a literal record `{ tone: { qualifiers: ['formal'] } }` in code and wants `tone` typo-checked) is a pure authoring-time concern. Whether `ConditionSetDecl` carries `TQualifierNames` or ts-prompt-assist defines a local `ITypedConditionSetDecl<TAxes>` is a question of where the type lives, not a question of which layer is "responsible."

The `/published-primitives-reflex` discipline says: if the primitive's home library (ts-res) has the type, the parameterization should live there. `ConditionSetDecl` is ts-res's type. Parameterizing it in ts-res and having ts-prompt-assist reference it is consistent with that discipline — it does not add ts-prompt-assist-domain concepts to ts-res.

The specific shape `TQualifierNames extends string = string` is not a ts-prompt-assist-domain concept. It is a generic constraint appropriate for any consumer of `ConditionSetDecl` that wants axis-name discipline. The orthogonality is real: `ConditionSetDecl<TQualifierNames>` is useful for ts-res-tutorial, for ts-res-ui-components' seed-authoring surfaces, for any future consumer. ts-prompt-assist is merely the first consumer to pressure-test for it.

**However**, the "seed-shape is a ts-prompt-assist-domain concept" argument has partial validity for the FULL cascade (Option B). The `IResourceTreeRootDecl<TQualifierNames>`, `IResourceCollectionDecl<TQualifierNames>`, etc. — these are ts-res's entry-point types for building trees programmatically. Parameterizing them is useful for ts-res-internal consumers (like ts-res-tutorial if it builds trees in code), not just ts-prompt-assist. The ts-prompt-assist scenario validates the utility; it doesn't uniquely own it.

**Summary for Q6:** ts-prompt-assist's local types would be the correct permanent shape ONLY if ts-res were willing to say "axis-name discipline is a consumer concern, not a library concern." Given that `ConditionSetDecl` already lives in ts-res and is the natural home for its type parameter, the published-primitives-reflex favors ts-res owning the parameterization. The question is not whether the pattern belongs at the library vs the consumer — it's whether the parameterization is sufficiently motivated by more than one consumer to justify the surface delta.

---

## Recommendation: Option B (cascade, no runtime teeth) with honest docstrings

**Recommendation:** Land the cascade of `TQualifierNames extends string = string` through the full Decl chain (Option B), with two documentation additions: an explicit docstring note on each parameterized type that `TQualifierNames` is a compile-time-only constraint enforced at the authoring boundary, and a note that runtime enforcement of qualifier name validity already exists independently via `validatedConditionDecl`'s `qualifiers.validating.get()` call.

**Do not file a TECH_DEBT entry for Option C.** The runtime teeth already exist. They are in `validatedConditionDecl` at `conditions/convert/decls.ts:68`. The missing piece is not runtime enforcement — it is runtime enforcement _of the literal set_ (is `'tone'` a registered qualifier name vs is it a valid string). That is a future concern, not a current gap in safety.

**Reasoning:**

1. **The seam critique is real and fixable at low cost.** Option B's cascade adds generic parameters with defaults to 9 existing interfaces. Each addition is a one-line change to the interface definition + update to the api-extractor `.api.md`. The defaults (`string`) keep all existing callers compiling unchanged. The cascade eliminates the arbitrary stop-point and makes ts-res's Decl surface internally consistent.

2. **The Partial widening (#386's core improvement) should land regardless.** This is a genuine type-system correctness improvement independent of the TQualifierNames parameterization. It should not be held hostage to the broader design debate.

3. **The "runtime teeth" critique is partially a framing error.** The critique (from L25, from Erik's review) is valid as a "don't let 'typed shape' imply 'validated shape'" discipline lesson. It is not valid as a "this PR adds no enforcement" claim — runtime enforcement of qualifier-name existence already works. What the PR does NOT add is enforcement of the literal set. That distinction matters: the library already rejects `qualifierName: 'txne'` if 'txne' isn't a registered qualifier. It does not reject `qualifierName: 'tone'` if 'tone' IS registered but the consumer wanted to typo-check against only their chosen axes. That residual gap is a tool for future Option C work, not a safety hole.

4. **Option A (withdraw) undershoots.** The pattern benefits any ts-res consumer authoring seeds in code. The `/published-primitives-reflex` discipline says: if ts-res owns `ConditionSetDecl`, ts-res should own its type parameters. Leaving it at the consumer layer creates the duplication-contagion the discipline exists to prevent.

5. **Option C is not the right work for this cluster.** The Converter context parameterization is additive (Q5 shows it's not actually breaking), but it is a new surface design for ts-res that deserves its own commission with consumer-driven motivation. Currently one consumer exists. That consumer's motivation is the literal-set check — a consumer-authoring concern — and the consumer already has the type-level check via `TAxes`. The value proposition for Option C is marginal until a second consumer with disk-backed seeds surfaces the runtime-enforcement gap as a concrete bug.

6. **Option D (land #386 + TECH_DEBT) is worse than Option B.** D has the same incompleteness problem as the current PR: the seam stops at `ConditionSetDecl`. B fixes the seam with minimal additional effort. If the cascade is going to happen eventually (which it should under Option B reasoning), do it now while the context is live rather than paying a future agent a re-derivation cost.

---

## Execution Path

### Step 1: Close PR #387 (design options brief)

The design-options brief is superseded by this evaluation doc. Close #387 with a comment: "superseded by ts-res-typed-conditions-evaluation.md; see PR [this PR]."

### Step 2: Expand PR #386 to Option B (cascade)

Thread `TQualifierNames extends string = string` through all 9 remaining Decl interfaces in `libraries/ts-res/src/packlets/resource-json/json.ts`:

- `IChildResourceCandidateDecl<TQualifierNames>` — `conditions?: ConditionSetDecl<TQualifierNames>`
- `ILooseResourceCandidateDecl<TQualifierNames>` (extends IChildResourceCandidateDecl<TQualifierNames>)
- `IImporterResourceCandidateDecl<TQualifierNames>` (extends IChildResourceCandidateDecl<TQualifierNames>)
- `IContainerContextDecl<TQualifierNames>` — `conditions?: ConditionSetDecl<TQualifierNames>`
- `IChildResourceDecl<TQualifierNames>` — `candidates?: ReadonlyArray<IChildResourceCandidateDecl<TQualifierNames>>`
- `ILooseResourceDecl<TQualifierNames>` (extends IChildResourceDecl<TQualifierNames>)
- `IResourceCollectionDecl<TQualifierNames>` — conditions, candidates, resources, collections
- `IImporterResourceCollectionDecl<TQualifierNames>` — same fields
- `IResourceTreeRootDecl<TQualifierNames>` — context and resource entries

Add TSDoc `@remarks` to `ILooseConditionDecl<TQualifierNames>` and `ConditionSetDecl<TQualifierNames>` (the two highest-visibility types): explicitly state that `TQualifierNames` is a compile-time authoring constraint, that existing runtime enforcement of qualifier-name validity is independent and operates via `validatedConditionDecl`, and that the two mechanisms are complementary. Something like:

```
@remarks
`TQualifierNames` is a compile-time-only constraint. It narrows the
`qualifierName` field to a consumer-supplied literal union at authoring
time, enabling typo detection in code. Runtime enforcement of qualifier-
name existence is independent: `validatedConditionDecl` validates against
the registered `IReadOnlyQualifierCollector` at convert time, rejecting
any qualifier name not in the collector. The two mechanisms are
complementary: compile-time catches typos against the consumer's known
axis set; runtime catches names not registered in the deployment.
```

Regenerate api-extractor `.api.md`. Run `rush build --to @fgv/ts-res` + `rushx lint` + `rushx test` in ts-res.

### Step 3: Verify PR #385 (ts-prompt-assist F1+F2+F6)

PR #385 currently uses local sibling types. With Option B landed, it can reference `ResourceJson.Json.ConditionSetDecl<TAxes>` from ts-res directly for the `IPromptCandidateRecord.conditions` field parameterization. This is additive to #385 — the local types can simply be removed. Check whether `IPromptCandidateRecord` needs to carry `TAxes` or whether it remains unparameterized (the latter is likely correct — conditions in candidate records are authored per-descriptor, but `IPromptCandidateRecord` itself is a store record type, not a typed seed type; the authoring discipline applies at the seed-fixture level).

Verify: does PR #385 need to thread `TAxes` into `IPromptCandidateRecord.conditions`? If ts-prompt-assist's seed-fixture type (`IPromptStoreFixtureSeedRecord`) is where the authoring discipline matters, then `ConditionSetDecl<TAxes>` belongs there, not on the runtime store record. This should not require a design decision — reading the fixture types will confirm.

### Step 4: Rebase PR #384 (sample app + round-2 findings)

Rebase #384 onto post-port #385 once #385 is settled. No structural changes expected in the sample app from the Option B cascade — the sample app uses either the unparameterized or the explicitly typed form, both of which compile under Option B with defaults.

### Step 5: Cluster close

File rush change files for ts-res (the Option B cascade is a non-breaking additive change; use `patch` unless the api-extractor diff triggers a `minor` classification). File change file for ts-prompt-assist if #385 modifies exports. Promote integration branch to release.

---

## FUTURE / TECH_DEBT Disposition

Do NOT file a TECH_DEBT entry for Option C based on this evaluation. The existing runtime enforcement via `validatedConditionDecl` is sufficient for current consumers. If a future consumer surfaces a concrete need for literal-set enforcement at load time (i.e., a disk-backed store should reject conditions with axis names not in the declared `qualifiers` list), that is the moment to commission the Converter context parameterization. File in FUTURE.md at that point with the framing from Q2 above.

---

## Counter-Arguments Considered

### Counter-argument 1: The orchestrator's preliminary read ("withdraw + FUTURE entry")

**The preliminary hypothesis:** cascading (Option B) adds nine generic parameters to public Decl types whose only contract is "TS-only when you opt in" — permanent surface area whose justification depends on a future runtime model that may not land.

**Response:** The hypothesis overweights the "future runtime model" framing. The Decl types with generic parameters are useful independently of any runtime story. They make ts-res's Decl surface self-consistent: if `ConditionSetDecl` takes `TQualifierNames`, then a type that has a field `conditions: ConditionSetDecl` SHOULD also take `TQualifierNames` — that is basic type-system coherence, not speculation about future enforcement. The "permanent surface area" cost is nine `extends string = string` defaults, each backward-compatible. That is genuinely small. The orchestrator's preliminary read weights the no-runtime-teeth critique as a reason to withdraw; this evaluation finds the runtime teeth already exist for the relevant enforcement and the docstring fix is the right response to the honesty gap.

**The preliminary read also undershoots by recommending Option A.** If the published-primitives-reflex says "don't reinvent at the consumer layer what the library already owns," withdrawing #386 forces ts-prompt-assist to maintain `ITypedConditionSetDecl` — a local reimplementation of a parameterized form of a type that lives in ts-res. That is the contagion the reflex exists to prevent.

### Counter-argument 2: "The seam is honest — document it, don't cascade"

**The argument:** Option D (land #386 + docstring) is cheaper than Option B and honest about the limitation. The incomplete seam can be documented rather than fixed.

**Response:** A documented incomplete seam is still an incomplete seam. Future contributors will encounter `IChildResourceCandidateDecl` with `conditions: ConditionSetDecl` (unparameterized) and wonder why the parent type is parameterized but the consumer is not. Documentation fixes the "why" question but not the "is this a bug" question. Option B costs an afternoon of mechanical work; the payoff is a Decl surface that reads coherently without needing inline explanation.

### Counter-argument 3: "Option C would be better and Option B paves it wrong"

**The argument:** Option B + C is the complete picture. Landing B without C commits to a type shape that Option C will need to extend. Better to wait for C.

**Response:** Option B and Option C address different concerns that are genuinely independent (Q2 establishes this). Option C's Converter context parameterization does not require or depend on Option B's Decl parameterization. Landing Option B does not pave Option C wrong — the Converter chain's context types are separate from the Decl authoring types. The risk of "committing to the wrong shape" is low because the shapes are orthogonal.

---

## Summary Table

| | Seam coherent | Runtime teeth | Honesty gap | Backward compat | Cluster cost |
|---|---|---|---|---|---|
| **A — Withdraw** | N/A | N/A | N/A | ✓ | Revert #386; local types in #385 |
| **B — Cascade [RECOMMENDED]** | ✓ | Existing (already present) | Fixable with docstring | ✓ (all defaults) | Expand #386; one afternoon |
| **C — Converter parameterization** | ✓ | ✓ (extended) | None | ✓ (with defaults) | New commission; 3-5 days |
| **D — #386 + TECH_DEBT** | Partial (arbitrary stop) | Existing | Fixable with docstring | ✓ | Smallest |

---

## Addendum: Stress-test against the cast-temptation critique

**Date:** 2026-05-19
**Evaluating:** Erik's critique that B-without-C creates cast pressure, undermining the type-safe-validation discipline

---

### Q1 — Does the cast-temptation critique hold up?

**Answer: Yes, with one critical precision: the cast pressure exists at the Converter OUTPUT seam, not in the consumer authoring flow. But the precision changes the severity assessment.**

Walk the consumer-flow scenario in actual code:

**Author side** (compile-time): a consumer writes
```typescript
const myCandidates: ResourceJson.Json.IChildResourceCandidateDecl = {
  json: { ... },
  conditions: { tone: 'formal' }  // typed as ConditionSetDecl = ConditionSetDecl<string>
};
```

Under PR #386, `conditions` is typed as `ConditionSetDecl` (= `ConditionSetDecl<string>`, the unparameterized form) on `IChildResourceCandidateDecl` — line 208 of the PR diff: `readonly conditions?: ConditionSetDecl;`. The parameterized forms `ConditionSetDecl<TQualifierNames>` only exist on `ILooseConditionDecl`, `ConditionSetDeclAsArray`, `ConditionSetDeclAsRecord`, and `ConditionSetDecl` itself. None of the container types that hold conditions are parameterized. So the narrow type is structurally impossible to thread through `IChildResourceCandidateDecl` regardless.

**Converter side** (critical point): `ResourceJson.Convert.conditionSetDecl` is typed at `convert.ts:87` as:
```typescript
export const conditionSetDecl: Converter<Normalized.ConditionSetDecl>
```
where `Normalized.ConditionSetDecl` (`normalized.ts:31`) is:
```typescript
export type ConditionSetDecl = ReadonlyArray<ILooseConditionDecl>;
```
which is `ReadonlyArray<ILooseConditionDecl<string>>` — the default, fully widened form.

**The Converter cannot be parameterized** because `Converter<T>` takes a single `T` — there is no `Converter<T<TNames>>` without a separate generic factory. A consumer holding `ConditionSetDecl<'tone'>` who runs any value through `ResourceJson.Convert.conditionSetDecl` receives `Result<Normalized.ConditionSetDecl>` = `Result<ReadonlyArray<ILooseConditionDecl<string>>>`. The narrow type is gone.

**What does the consumer do to re-narrow?** The only options are:
1. Cast: `result.value as ReadonlyArray<ILooseConditionDecl<'tone'>>` — an unsafe cast, the anti-pattern the skill forbids
2. Accept the wider type — the narrow constraint is a dead letter; they authored with narrow types that provide no downstream value
3. Build a bespoke generic Converter — correct but absent from the library surface

**Is the cast the ONLY option?** At the library's current API: yes, for any consumer who needs to preserve the narrow type through a Converter call. There is no generic overload on `conditionSetDecl` that preserves `TNames`. The type evaporates at the Converter boundary.

**Is the cast pressure real?** Only if consumers actually need narrow types AFTER the Converter. If the narrow type is only useful at authoring time (writing seeds), and the Converter output feeds directly into ts-res's runtime (which doesn't care about the narrowing), then the type evaporation is benign — the narrow type served its purpose (typo-rejection during authoring) and isn't needed afterward.

**Code citation:** `libraries/ts-res/src/packlets/resource-json/convert.ts:87` — `conditionSetDecl: Converter<Normalized.ConditionSetDecl>` — this is the specific line where the narrow type evaporates.

---

### Q2 — Is the failure mode actually as bad as Erik frames it?

**Answer: Less bad than framed, but not zero — and the real problem is different from the cast scenario Erik described.**

Erik's framing focuses on the round-trip: consumer holds `IResourceCollectionDecl<'tone'>`, runs JSON through `ResourceCollection.Convert.collectionDecl.convert(...)`, gets back a wider type, needs to re-narrow, inserts a cast.

**But this round-trip is not the actual consumer pattern.** Reading `ts-prompt-assist`'s actual usage:

1. `IPromptCandidateRecord.conditions` (`descriptor.ts:119`) is typed as `ResourceJson.Json.ConditionSetDecl` — **already unparameterized**. The narrow type is not threaded into the runtime record type at all.

2. The fixture seed at `readmeSmoke.test.ts:72` writes `conditions: { tone: 'formal' }`. This is typed by structural compatibility against `ConditionSetDecl<string>` — the narrow `'tone'` is not preserved by the type system, it's just a string literal that happens to satisfy `string`.

3. The authoring discipline question (F1 from round-2 findings) was specifically about a typed `IPromptStoreFixtureSeedRecord` where a consumer could get compile-time rejection of `{ txne: 'formal' }`. But `IPromptStoreFixtureSeedRecord.candidates` (`promptStoreFixture.ts:45`) is `ReadonlyArray<IPromptCandidateRecord>` — unparameterized. The narrow type cannot flow into this chain.

**The actual failure mode: the typed authoring surface doesn't connect to the consumer's actual authoring type.** The narrow `ConditionSetDecl<'tone'>` is a type that exists in the library (after PR #386) but has no connection to `IPromptCandidateRecord.conditions` or `IPromptStoreFixtureSeedRecord.candidates`. The feature exists in ts-res but ts-prompt-assist can't use it without parameterizing its own record types — which requires Option B's cascade OR ts-prompt-assist's own local typed wrappers.

**Quantification of round-trip frequency**: Zero in the current codebase. No consumer currently holds a narrow `ConditionSetDecl<TNames>` and feeds it through a Converter expecting to get `ConditionSetDecl<TNames>` back. The Converter output in this system feeds into ts-res's runtime (opaque to narrow types), not back to typed authoring surfaces.

**Erik's cast-temptation scenario is therefore a future risk, not a present one.** But it IS a real design smell: B-only adds a type parameter whose value (typo rejection) can only be realized if the consumer authors seeds against the parameterized Decl type chain — which, in PR #386, stops at `ConditionSetDecl` and does not continue into `IChildResourceCandidateDecl`. The feature is half-implemented: the type exists, but the container types that make it useful don't thread it.

---

### Q3 — Is there a B-only variation that defangs the critique?

**Answer: Yes. The B-variation described in the prior evaluation — cascade `TQualifierNames` through all container Decl types — is exactly the defang. But it does not require runtime-literal-set enforcement (Option C's expensive half). It only requires the type-passthrough on container interfaces (Option C's cheap half).**

The prior evaluation's Option B recommendation was precisely this: cascade the parameter through `IChildResourceCandidateDecl`, `IResourceCollectionDecl`, `IResourceTreeRootDecl`, etc. This is purely additive (all defaults preserve backward compatibility). The concrete change: `IChildResourceCandidateDecl` at `json.ts:199` in the PR branch becomes:
```typescript
export interface IChildResourceCandidateDecl<TQualifierNames extends string = string> {
  readonly conditions?: ConditionSetDecl<TQualifierNames>;
  // ...
}
```

With this cascade, a consumer can write:
```typescript
const typed: IChildResourceCandidateDecl<'tone'> = {
  conditions: { txne: 'formal' }  // TS error — 'txne' not assignable to 'tone'
};
```

The cast-temptation scenario evaporates on the authoring side: there is no need to re-narrow after a cast because the narrow type never needed to survive a Converter call — it was useful only during authoring and the author-time type is preserved end-to-end in the Decl chain.

**The "type-passthrough on Converters" framing is a red herring.** Converters take `unknown` and return typed values. They cannot preserve a narrow caller-side `TNames` parameter because they don't receive one. The right answer is not parameterized Converters (which is Option C's runtime enforcement half) — it is parameterized Decl interfaces (which is B). Once the container Decls are parameterized, the authoring-time check is complete, and the Converter output (which always returns the unparameterized `Normalized.ConditionSetDecl`) feeds correctly into ts-res's runtime, which validates against the registered qualifier set regardless.

**This is the B-variation that defangs the critique.** It is exactly what the prior evaluation recommended. The critique does not reveal a flaw in Option B — it reveals that PR #386 is an incomplete implementation of Option B.

---

### Q4 — Does the prior recommendation survive?

**Answer: B is wounded — not because the critique is decisive, but because the prior evaluation didn't notice that PR #386 itself fails to deliver Option B.**

**Pick: B is wounded.**

The prior recommendation was Option B (cascade through the full Decl chain). That recommendation is correct in principle. The wound is this: PR #386 is not Option B. It is Option D with the seam stopping at `ConditionSetDecl`. The prior evaluation called for Option B but didn't verify that #386 already implements it. It does not.

Specific code-cited evidence:

- `libraries/ts-res/src/packlets/resource-json/json.ts` (PR #386 diff, line 208): `readonly conditions?: ConditionSetDecl;` — the `conditions` field on `IChildResourceCandidateDecl` is typed WITHOUT `TQualifierNames`. The parameterization stops here.
- `libraries/ts-res/src/packlets/resource-json/json.ts` (PR #386 diff, line 347+): `IResourceCollectionDecl`, `IResourceTreeRootDecl` — both have no type parameter. The cascade recommended in Option B is absent from the actual PR.

The cast-temptation critique is partially correct: with PR #386 as-is (parameterization stops at `ConditionSetDecl`), a consumer of `IChildResourceCandidateDecl` cannot express `conditions: ConditionSetDecl<'tone'>` as a typed field — the container type doesn't carry the parameter. The narrow type is useful only in the isolated `ConditionSetDecl` literal, not in any realistic authoring chain. The feature adds surface area without delivering the authoring-time benefit.

However, the critique's framing — that B-without-C creates cast pressure by pairing typed author surface with Converter widening — is weaker than it appears. The cast pressure exists ONLY if consumers try to round-trip narrow types through Converters. In the actual usage pattern, Converter output feeds ts-res's runtime (which is type-agnostic to the narrow). No one is round-tripping. The cast pressure is a hypothetical failure mode, not a demonstrated one.

The wound is therefore: the prior recommendation was right (B is the correct option) but the implementation it approved (PR #386) is not B. The correct disposition is to expand #386 to actually implement B, not to treat the critique as decisive against B.

---

### Q5 — Does the answer to Q4 change the disposition of in-flight work?

**Answer: Yes — #386 should be expanded to complete the cascade before landing. #385 can stay as-is for now. #384 is unaffected.**

**#386 (ts-res ConditionSetDecl parameterization):**
Should NOT land as-is. It is a partial Option B that leaves `IChildResourceCandidateDecl`, `ILooseResourceCandidateDecl`, `IImporterResourceCandidateDecl`, `IContainerContextDecl`, `IChildResourceDecl`, `ILooseResourceDecl`, `IResourceCollectionDecl`, `IImporterResourceCollectionDecl`, and `IResourceTreeRootDecl` without the `TQualifierNames` parameter. The `Partial` widening improvement (the solid half of #386) should be preserved. The cascade additions are ~10 one-line interface changes plus api-extractor regeneration.

Revised disposition: expand #386 to complete the Option B cascade, then land. The Partial widening fix is not held back — it goes in with the cascade.

**#385 (ts-prompt-assist F1/F2/F6):**
Current shape: `IPromptCandidateRecord.conditions: ResourceJson.Json.ConditionSetDecl` (unparameterized). This is correct for the runtime store record type. The typed authoring benefit (F1's typo-rejection) should apply to `IPromptStoreFixtureSeedRecord`, not to `IPromptCandidateRecord`. Once #386 completes the cascade, ts-prompt-assist can parameterize `IPromptStoreFixtureSeedRecord.candidates` (or its inner `IPromptCandidateRecord` for the fixture context) on `TAxes` using `IChildResourceCandidateDecl<TAxes>` — but this is additive and can be a follow-on in #385 or a subsequent small PR. No architectural change required; just thread `TAxes` into the fixture seed type where authoring discipline matters.

The local `ITypedConditionSetDecl` in #385 (if it still exists) can be dropped once #386's cascade lands.

**#384 (sample app):**
Unaffected. Rebase onto post-#385 as before.

**#387 (design options brief PR):**
Superseded by both the prior evaluation and this addendum. Close.

**#388 (if it exists — cluster-close prep):**
Cannot proceed until #386 is expanded. Block until #386 is confirmed complete.

---

### Revised Final Recommendation

**Option B, properly implemented, survives the critique.**

The cast-temptation critique is a real signal about a real design defect — but the defect is in PR #386's incomplete cascade, not in Option B as a design strategy. The correct response to the critique is not to downgrade to Option D or withdraw to Option A — it is to complete the cascade that Option B requires.

The specific defect: `IChildResourceCandidateDecl.conditions` in PR #386 is typed as `ConditionSetDecl` (unparameterized), not `ConditionSetDecl<TQualifierNames>`. This means a consumer authoring a typed seed cannot express `IChildResourceCandidateDecl<'tone'>` — the container type doesn't accept the parameter. The parameterized `ConditionSetDecl<'tone'>` type exists but is unreachable from any realistic authoring chain. That is the concrete expression of Erik's critique: the type-level feature is present at the leaf but absent from the container, making it unusable in practice.

Completing the cascade fixes this without any Converter changes, without runtime enforcement complexity, and without breaking existing callers. The Converter output remains `Normalized.ConditionSetDecl` (unparameterized `string`) throughout — this is correct, because Converters produce values for ts-res's runtime, not for typed authoring surfaces. The narrow `TQualifierNames` is a compile-time authoring constraint whose value is fully delivered by the parameterized Decl chain, not by the Converters.

**The prior recommendation was right. The implementation it approved was wrong. The right fix is to complete the cascade, not to change the recommendation.**

**PR disposition summary:**
- #386: expand to complete the cascade (Option B), then land
- #385: stays current shape; add `TAxes` threading into fixture seed type as a follow-on
- #384: rebase after #385 settles
- #387: close as superseded
- #388: unblock after #386 expansion confirmed
