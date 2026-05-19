# `ts-res` typed conditions — design options brief

**Status:** open design decision; PR #386 (in-place parameterization of `ConditionSetDecl` family) currently captures the partial path. Erik flagged two critiques on review:

1. **Incomplete seam.** Parameterization stops at `ConditionSetDecl`; consumers of that type (`IChildResourceCandidateDecl`, `ILooseResourceCandidateDecl`, `IContainerContextDecl`, etc.) keep the loose shape. To a fresh `@fgv/ts-res` reader, this is an arbitrary boundary that only makes sense if you know `@fgv/ts-prompt-assist`'s scenario was the trigger.

2. **Type without teeth.** The new `TQualifierNames` parameter is purely compile-time. A typed-narrow seed authored in code gets typo-rejection at the TS layer, but:
   - A JSON load via the Converter pipeline accepts the loose shape — a typo'd condition from disk doesn't fail at validate time.
   - Even in-code, if the typed seed flows through any untyped intermediate (a generic builder, a Converter, a normalizer), the narrow `T` is lost.
   - The compile-time annotation has no enforcement at the validate-time or resolve-time boundaries that actually matter for production correctness.

This doc enumerates the paths forward so the cluster's next decision turn can pick one.

---

## Where we are right now (PR #386)

`libraries/ts-res/src/packlets/resource-json/json.ts`:

```ts
export interface ILooseConditionDecl<TQualifierNames extends string = string> {
  qualifierName: TQualifierNames;
  // ...other fields unchanged
}

export type ConditionSetDeclAsArray<TQualifierNames extends string = string> =
  ReadonlyArray<ILooseConditionDecl<TQualifierNames>>;

export type ConditionSetDeclAsRecord<TQualifierNames extends string = string> =
  Readonly<Partial<Record<TQualifierNames, string | IChildConditionDecl>>>;

export type ConditionSetDecl<TQualifierNames extends string = string> =
  | ConditionSetDeclAsArray<TQualifierNames>
  | ConditionSetDeclAsRecord<TQualifierNames>;
```

Plus a 9-line adjustment to `ConditionSet.getKeyFromLooseDecl` to handle the now-acknowledged `Object.entries` `[string, V | undefined]` element type from the `Partial` widening.

ts-prompt-assist's PR #385 (in flight, not yet ported) was meant to drop its local `ITypedConditionSetDecl` and reference `ResourceJson.Json.ConditionSetDecl<T>` directly once #386 lands.

---

## Options

### Option A — Withdraw #386

Revert ts-res to the pre-#386 state. ts-prompt-assist's PR #385 keeps its local sibling types (`ITypedConditionSetDecl`, `ITypedPromptCandidateRecord`). The typed-condition pattern lives at the ts-prompt-assist layer, not in ts-res.

**Pros**
- Smallest change. No ts-res surface delta.
- The compile-time-only typing is honest: a consumer concern, not a library guarantee. Lives at the consumer layer where its limit is most visible.
- /published-primitives-reflex doesn't strictly apply when the pattern can't be made first-class in the lower library without significant scope expansion.

**Cons**
- The same typed-conditions pattern will recur when the second ts-res consumer (e.g. ts-res-tutorial, a future ts-res-ui-components flow) wants compile-time axis-name discipline. Each consumer reinvents.
- Round-2 F1's stated win (compile-time rejection of typo'd axis names in seed authoring) survives but only at the consumer layer.

**When to pick**: if the "incomplete seam" + "no runtime teeth" critiques together make the ts-res addition feel like worse-than-not-doing-it.

---

### Option B — Cascade the parameterization (no runtime teeth)

Extend #386 to thread `TQualifierNames` through the full chain of types that reference `ConditionSetDecl`:
- `IChildResourceCandidateDecl<TQualifierNames>` — has `conditions?: ConditionSetDecl<TQualifierNames>`.
- `ILooseResourceCandidateDecl<TQualifierNames>` (extends IChildResourceCandidateDecl).
- `IImporterResourceCandidateDecl<TQualifierNames>` (extends IChildResourceCandidateDecl).
- `IContainerContextDecl<TQualifierNames>` — has `conditions?: ConditionSetDecl<TQualifierNames>`.
- `IChildResourceDecl<TQualifierNames>` — has `candidates?: ReadonlyArray<IChildResourceCandidateDecl<TQualifierNames>>`.
- `ILooseResourceDecl<TQualifierNames>` (extends IChildResourceDecl).
- `IResourceCollectionDecl<TQualifierNames>` — chains through `candidates` and `context`.
- `IImporterResourceCollectionDecl<TQualifierNames>`.
- `IResourceTreeRootDecl<TQualifierNames>` — has `context?: IContainerContextDecl<TQualifierNames>`.

All with `TQualifierNames extends string = string` defaults so existing untyped callers compile unchanged.

**Pros**
- Eliminates the arbitrary seam. A typed seed at the top of the tree threads typing all the way down.
- Still no behavior change. Pure type-level additions.

**Cons**
- ~10 interface generic-parameter additions. Each is small; the aggregate is real surface delta on api-extractor's `.api.md`.
- Still no runtime teeth — the critique that started this design discussion remains unresolved. The cascade only addresses the "seam" half.
- The narrowing only flows where consumers actively type-parameterize their authoring chain. The default-string pathway (which is most existing ts-res internal use) gets no benefit.

**When to pick**: if the seam is the dominant signal but you accept the no-runtime-teeth limit as a v0.2 problem. Documents the type-level guarantee fully; explicitly defers the runtime story.

---

### Option C — Add runtime teeth via Converter parameterization

Thread the qualifier-name-validation discipline through ts-res's actual validation pipeline:

- `Conditions.Convert.qualifierName` — currently a `Converter<QualifierName>` that validates branded-string shape but not literal-set membership. Parameterize on a Converter family that validates against a literal set (e.g. `Converters.enumeratedValue(['tone', 'language'] as const)` style).
- `Conditions.Convert.conditionSetDecl` / `validatedConditionSetDecl` — accept a `qualifierNameConverter` parameter in their context that drives the per-condition qualifierName validation.
- Cascade up: `ResourceJson` candidate / resource / collection Converters thread the qualifier-name Converter through.
- `QualifierCollector.create` — when consumer supplies a typed-narrow `qualifiers: ['tone'] as const`, the collector emits a literal-set Converter that callers can thread through subsequent Converter chains.

This is genuinely new design surface, not a type-cascade. The validation pipeline learns to enforce the literal set at validate time.

**Pros**
- Real teeth. A typo in a JSON-loaded condition fails at validate time, not silent-fallthrough at resolve time. Same surface protects in-code authoring AND on-disk authoring.
- Eliminates the seam by construction — the typing AND validation are co-located in the same Converter family.

**Cons**
- **Probably breaking.** The Converter signatures change. Existing ts-res consumers (ts-res-cli, ts-res-tutorial, any external library) need to either re-wire or accept a no-op default for the qualifierNameConverter parameter.
- New ts-res PR scope, materially larger than #386. Likely a sub-phase-shaped commission, not a single drive-by PR.
- The defaulting story has to be careful: when `qualifierNameConverter` is omitted, what's the behavior? Today's behavior (loose `string` qualifier names) keeps existing consumers working but undermines the "real teeth" claim for callers who forget to thread the Converter.

**When to pick**: if the no-runtime-teeth critique is the dominant signal and the cluster is willing to defer cluster-close in favor of the structural fix.

---

### Option D — Land #386 + TECH_DEBT for runtime teeth

Land #386 as-is (or after the Option B cascade) with explicit docstring acknowledging the compile-time-only nature of the typing, plus a TECH_DEBT entry capturing the runtime-teeth gap as known v0.2 work.

**Pros**
- Ships the consumer-facing ergonomic win now (ts-prompt-assist's PR #385 + sample app finalize as planned).
- Honest about the limitation rather than hiding it.
- Defers the larger design problem (Option C) to a moment when ts-res has more consumers driving the requirement.

**Cons**
- The "this is a real critique" feeling on PR #386 doesn't fully resolve until v0.2 work happens. The seam concern (Option B) can still be partially addressed by cascading; the runtime-teeth concern (Option C) sits open.
- A TECH_DEBT entry without a triggering consumer easily ages. The "v0.2 may revisit" framing has soft commitment.

**When to pick**: if cluster close is more important than completeness on this dimension, and you trust the TECH_DEBT process to surface the gap when a real consumer needs it.

---

## Comparison matrix

| | Seam resolved | Runtime teeth | Cluster-close cost | Scope |
|---|---|---|---|---|
| A — Withdraw | N/A (no ts-res change) | N/A | Zero | Revert |
| B — Cascade types | ✓ | ✗ | Small | Type-only |
| C — Converter parameterization | ✓ | ✓ | Material (sub-phase scope) | Real surface change, possibly breaking |
| D — #386 + TECH_DEBT | Partial (still arbitrary stop unless paired with B) | ✗ (deferred) | Smallest | Type-only + doc |

---

## Lean (orchestrator's read; final call is Erik's)

If the immediate need is cluster close, **D (or B+D)** preserves the ergonomic win while honestly capturing the limit. If the seam critique is sharp enough that landing #386 feels worse than rolling back, **A** is honest. **C** is the right answer eventually — but probably not now, because the second ts-res consumer that would benefit doesn't exist yet, and committing to the breaking Converter signature change deserves more design rigor than the cluster's remaining hours.

The kick-the-tires step Erik mentioned will inform: if the seam reads as "documented incomplete that we'll fix later" → D works. If it reads as "structurally wrong" → A. If it reads as "obviously needs runtime teeth before this is worth shipping" → C (and accept the cluster-close delay).

---

## What this means for adjacent in-flight work

- **PR #385** (ts-prompt-assist F1/F2/F6 absorb): currently uses local sibling types. Under A, that's the permanent shape. Under B/D, ports to reference ts-res's parameterized types (small port). Under C, gets the runtime-validation Converter wire-through (larger port).
- **PR #384** (sample app integration + round-2 findings): rebases onto post-port #385. Doesn't care which path; just consumes whatever shape #385 ends up with.
- **Cluster close** (integration → release promotion): blocked by whichever path resolves. A and D are smallest paths to close; B is small additional time; C blocks for sub-phase commission.

## Pointers for the next session

- PR #386 implementation: `libraries/ts-res/src/packlets/resource-json/json.ts` (~50 LOC of parameterization).
- Existing reader adjustment: `libraries/ts-res/src/packlets/conditions/conditionSet.ts` lines 200-225 (`getKeyFromLooseDecl`).
- ts-prompt-assist consumer: `libraries/ts-prompt-assist/src/packlets/types/descriptor.ts` (the local sibling types waiting to be replaced).
- Round-2 finding F1: `.ai/tasks/active/ts-prompt-assist/pressure-test-findings-round-2.md` (the consumer-side trigger for this whole thread).
