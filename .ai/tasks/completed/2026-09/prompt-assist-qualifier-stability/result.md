# Result — `prompt-assist-qualifier-stability`

**Shipped:** a resolve observation now carries the composition it was computed with, and a qualifier axis can declare how often it changes — so a body conditioned only on axes that never change stops being refuted as volatile, and a refutation names the axis responsible.

---

## What shipped

### Ask A — composition on the resolve observation

- `IPromptResolveObservation.composition?: IPromptComposition`, TSDoc'd to mirror
  `IResolvedPrompt.composition` ("present only when the request supplied
  `IPromptResolveRequest.composition`").
- `_buildResolveObservation` sets `composition: resolved.composition` — a plain assignment, no
  branch. `resolved.composition` is already absent when the request did not ask, so the record
  gains nothing in that case.
- Tests (`observe/observability.test.ts`): the record carries the *same object* as the resolved
  prompt (not a copy) and has no top-level `cacheFindings`; a request without `composition`
  produces a record whose serialized form contains no `composition` key; a failed resolve carries
  none even when one was requested.

**Precision on "byte-identical".** In memory, the success record now has a `composition` *key*
whose value is `undefined` when the request did not ask. `JSON.stringify` drops it, so the
serialized record is byte-identical to before, and `record.composition` reads `undefined` either
way. That is what the test pins. A consumer using `Object.keys` or `'composition' in record` would
see the key; the brief's plain-assignment decision was kept rather than adding a spread-conditional
to hide it.

### Ask B — qualifier-declared stability in D2

- `IExpectedQualifierAxis.stability?: PromptCacheStability`, default `'per-request'`; parsed by
  `descriptorConverter` (invalid values rejected). An axis declared more than once takes the least
  stable of its declarations.
- `IPromptCacheStabilityAnalysisParams` gains `candidates?` (the record's
  `IPromptCandidateRecord[]`) and `qualifiers?` (the descriptor's `IPromptQualifierMetadata`) —
  both passthroughs of data the record already holds; nothing is restated.
  `PromptLibrary._buildComposition` passes `walked.record.candidates` and `descriptor.qualifiers`.
- `checkConditionalBody` joins each winning match (`matchType === 'match'`, non-empty conditions —
  the `matchAsDefault` exclusion is unchanged) by `candidateIndex` to its
  `IPromptCandidateRecord.conditions`, reads the qualifier names from all three `ConditionSetDecl`
  forms (record sugar, record-with-details, array), and computes the body's conditioning level as
  the least stable conditioning axis.
- A slot claim (authored **or** call-site) and the template's derived `'frozen'` default are
  refuted only when that level is below the claim. The finding's `detail` names each refuting axis
  and what it was declared as — `qualifier 'tone' (declared 'per-conversation')`, or
  `qualifier 'tone' (no declared stability, so 'per-request')`.
- Template sections reach the same level through `effectiveSectionStability`, so a template section
  in a body conditioned only on `'frozen'` axes stays `'frozen'`.

**Decision taken during implementation — the downgrade target.** A refuted conditional-body claim
is lowered to the body's conditioning level, not unconditionally to `'per-request'`. A body
conditioned on a `'per-conversation'` axis can change at most once per conversation, so
`'per-conversation'` is the honest level; forcing `'per-request'` would discard exactly the fact
the declaration supplies. With nothing declared the level is `'per-request'`, so this does not move
any existing refutation. The D1 scope-binding and resource-binding refutations still downgrade to
`'per-request'`.

**Unattributable matches are `'per-request'`.** When `candidates` is not supplied, a match's index
is out of range, or its declaration names no qualifier (including a record form whose only keys
are `undefined`), the match is treated as `'per-request'` and the detail says its qualifiers are
not known to the check. This is what keeps external callers of `analyzePromptCacheStability` that
predate the new params on exactly their old behaviour.

### The compatibility contract, pinned

`cacheStabilityAnalysis.test.ts` runs the same inputs twice — once with no attribution data (the
pre-change input shape) and once attributed to an axis with no declared stability (three variants:
no metadata, an expected axis without `stability`, stability declared only on a different axis) —
and asserts the refutations are identical in `slot` / `claimed` / `downgradedTo` and equal to the
pre-change values. All 61 pre-existing `cacheStabilityAnalysis` tests and all pre-existing
integration tests pass unmodified. End-to-end (`cacheStabilityIntegration.test.ts`), through
`PromptLibrary.resolve` on a `lang`-conditioned record: undeclared → template and frozen slot both
`'per-request'`; `'frozen'`-declared → both stay `'frozen'` with no refutation (the positive case,
on a template section and a slot section); `'per-conversation'`-declared → both lowered to
`'per-conversation'` with the axis named.

---

## Decisions (for the record, so they read as choices)

### Ask B, option 1 — and why not options 2 and 3

- **Rejected — option 3, "let the call-site override survive D2".** `CAPABILITIES.md`'s
  `adaptOptionalToNullable` rule already settled this shape: *"The opt-in is not the caller
  asserting its validator tolerates `null`; the condition is read off the schema, so it cannot be
  asserted falsely."* D2 exists to refute claims with resolve-time evidence. An override that
  survives it turns a verified diagnostic into an unfalsifiable assertion. A call-site override is
  still refuted by a less-stable conditioning axis; a test pins that.
- **Rejected — option 2, a per-resolve `qualifierStability` map.** How often an axis changes is a
  fact about *the axis*, not about one resolve. A per-resolve map lets two resolves disagree about
  the same axis — a second source of truth, the defect the
  `agent-memory-index-coverage-accessor` reasoning names.
- **Why option 1 is not the same unfalsifiable assertion.** Option 3 lets a claim survive evidence
  that *contradicts* it. A declared axis supplies a **missing fact that makes the evidence
  interpretable**: without it the check cannot distinguish "conditioned on something that never
  changes" from "conditioned on something that changes every request", and assumes the latter. It
  still refutes whenever a conditioning axis is declared less stable than the claim; it stops only
  where the claim was true all along. This is stated in the `IExpectedQualifierAxis.stability`
  TSDoc so a reviewer meets the answer where the question arises.

### Ask A — `cacheFindings` not hoisted

The record already hoists `safeguardFindings` out of `trace`, so there is a surface argument for
hoisting `cacheFindings` too. Not done: `cacheFindings` is one dereference from `composition`, and
a hoisted copy is a second place the same finding lives. `composition` is carried whole; a test
pins that the record has no top-level `cacheFindings`.

### No `@fgv/ts-res` change

`ICandidateMatchTraceEntry.conditions` is `ReadonlyArray<TsResRuntime.IConditionMatchResult>`,
which carries only `priority` / `matchType` / `score` and never names its qualifier. Widening it
would have been a lockstep change on a production surface. It was unnecessary: prompt-assist
authored the condition declarations, `IPromptCandidateRecord.conditions` is keyed by qualifier
name, and `candidateIndex` is the origin index into `record.candidates` (`projectMatches` maps
ts-res's candidate back through `candidateOriginIndex`). **No file under `libraries/ts-res/` is
modified.**

---

## Found during implementation — losing candidates

Crediting only the winners' axes would have **introduced** a false `'frozen'`. Take a record whose
full base is conditioned on `lang` (declared `'frozen'`) and whose partial is conditioned on
`lang` + `tone` (undeclared). On a resolve where `tone` does not match, only the base wins. Before
this stream the body was refuted anyway — any conditional winner put it at `'per-request'`, the
floor. With winners-only crediting it would read `'frozen'`, although the next resolve with a
matching `tone` changes the body.

So once the body is conditional, `checkCompetingCandidates` folds in the axes of the candidates
that did not win, emits one finding naming them when they lower the body below the winners'
level, and lowers the body to match. It never fires when the winners are already at
`'per-request'` (an undeclared winning axis, or an unattributed match), which keeps the
undeclared case identical — a test pins that adding a competitor to an undeclared-axis body
changes no refutation.

**Still pre-existing and not addressed:** a body whose winners are *all unconditional* is not
treated as conditional, even if a losing candidate is conditioned on a volatile axis. The old
check had exactly this gap and this stream does not change it (a test pins that losing candidates
are not consulted then). Closing it would add refutations to bodies that are not refuted today,
which is a behaviour change outside this stream's contract.

## Gates

- `rushx build`: zero warnings. `rushx lint`: clean (`fixlint` run). `rushx test`: 405/405 at
  100% coverage, with no coverage directives added.
- `rush change --verify --target-branch origin/release`: clean. The change file is `minor`.
- `verify-capability-docs.mjs` and `generate-capability-feed.mjs --check`: clean.
- **Repo-wide `node common/scripts/install-run-rush.js test`:** green twice (35 operations each),
  the second run on the head that carried the competing-candidate fix.
  `rush test --from @fgv/ts-prompt-assist` (17 operations, including `@fgv/testbed`) was re-run
  green after each later D2 commit. **No downstream fixture pinned the old refutation boundary.**
  The expected casualty class did not occur: nothing outside this package asserts on D2's findings
  (`grep` for `stability-refuted` / `cacheFindings` outside `ts-prompt-assist/src` finds nothing).
- **Watched-it-fail:** neutering the competing-candidate fold-in (`competing.length >= 0` →
  early return) turns exactly the two tests that depend on it red. The first attempt at this
  neuter (`if (false as boolean)`) did not compile, and a run that collided with a concurrent
  repo-wide build failed for an unrelated reason; neither was counted as a result.
- **Layer 1, `code-reviewer`, two passes:**
  - **Pass 1:** no P1. One P2: the ledger and `state.md` were stale, resolved by this finalize.
    The pass missed the losing-candidate false `'frozen'`, which was found while writing this file.
  - **Pass 2**, on that fix: no P1, and the compatibility contract was confirmed algebraically.
    One P2: the competing-candidate finding claimed `'frozen'` while its `detail` referred to the
    winners' level. **Fixed**; it now claims the winners' level, and a test pins it.
  - Two P3s, both dispositioned: folding `matchAsDefault` winners in slightly overstates their
    risk, which is intentional and conservative; the all-unconditional-winners gap predates this
    stream (above).
- **Layer 2, Copilot:** requested on #689. Its outcome is recorded on the PR, not here.
