# Brief — `prompt-assist-qualifier-stability`

**Stream id:** `prompt-assist-qualifier-stability`
**Branch:** `claude/prompt-assist-qualifier-stability`, off `release` at `9eb0e5139`
**PR base:** `release` (single-phase stream, one landing — no integration branch)
**Package surface:** `@fgv/ts-prompt-assist` only (`observe`, `resolve`, `types` packlets)

---

## Mission

Two PersonAIlity asks, both about cache-stability diagnostics reaching the people who need
them, and both additive:

**A — the resolve observation record drops the composition it already has.** Add
`composition?: IPromptComposition` to `IPromptResolveObservation` and populate it from
`resolved.composition`, so an observer-backed prompt browser sees section maps and
`cacheFindings` for *every* resolve rather than only the one the caller happens to retain.

**B — D2 refutes a stability claim on any conditional body, without asking which qualifier
did the conditioning.** Give a qualifier axis a declared stability, and have the
conditional-body check refute a claim only when a qualifier that *actually conditioned the
winning candidate* is declared **less stable than the claim**.

Both asks were re-verified against our own source before this brief was written. **Every
claim in both reports held.** The verification is reproduced below so the implementing agent
does not have to redo it — but **do confirm the line references still point where this brief
says they do**, since `release` moves.

---

## Status entering

- `release` is at `9eb0e5139` (the `ai-assist-streaming-cache` landing, #688).
- `ts-prompt-assist` is on the **active-development** list with **all packlets active**
  (`.ai/instructions/ACTIVE_DEVELOPMENT.md`). Additive changes land freely; no
  compatibility shims, no deprecated aliases.
- `IPromptComposition`, `cacheFindings`, `PromptCacheStability` and
  `analyzePromptCacheStability` all shipped in `prompt-composition-metadata` (#663) and the
  prompt-cache work that followed. This stream extends that surface; it does not introduce it.

---

## Ask A — composition on the resolve observation

### Verified state

| fact | location |
|---|---|
| `IPromptResolveObservation` carries `winningScope? / body? / outputKind? / trace? / safeguardFindings? / error?` — **no `composition`** | `src/packlets/observe/types.ts:125-145` |
| `IPromptResolveTrace` carries no section map and no stability, so the composition **cannot be re-derived** from the trace | `src/packlets/types/trace.ts:151-172` |
| `_buildResolveObservation` has `resolved` in hand and mirrors `.trace`, `.body`, `.descriptor.output.kind` — but not `.composition` | `src/packlets/resolve/promptLibrary.ts:1392-1412` |
| `IResolvedPrompt.composition?` is already request-gated: *"present only when the request supplied `IPromptResolveRequest.composition`"* | `src/packlets/types/trace.ts:355-360`, opt-in at `promptLibrary.ts:234` |

### What to build

1. `composition?: IPromptComposition` on `IPromptResolveObservation`, TSDoc'd to say it is
   present only when the request asked for one — mirroring `IResolvedPrompt.composition`'s
   existing wording rather than inventing new phrasing.
2. `composition: resolved.composition` in the success branch of `_buildResolveObservation`.

### Two things that are already decided — do not re-open them

- **The consumer's "absent otherwise, so records stay byte-identical" property needs no
  conditional logic.** `resolved.composition` is *already* `undefined` when the request did
  not ask. A plain assignment gives the property for free. Do **not** write an `if`.
- **Do not hoist `cacheFindings` onto the observation record.** There is a surface argument
  for it, since the record already hoists `safeguardFindings` out of `trace`. Rejected
  deliberately: `cacheFindings` is one dereference from `composition`, and a hoisted copy is
  a second place the same finding lives. Carry `composition` whole. Record this as a decision
  in `result.md` so it reads as a choice rather than an omission.

### Sizing note, already checked — do not re-investigate

`PromptObservationStore` is a `RetainingRingBuffer`, so anything on the record is retained
N-deep. This was checked: `IPromptSection` carries **offsets** (`start`, `chars`,
`measured`), not text slices (`src/packlets/types/trace.ts:249-277`), and `body` is already
retained on the record. Compositions are small fixed-size structs pointing into a string the
record already holds. **There is no retention-sizing problem and no need to ask the consumer
about their retention depth.**

---

## Ask B — qualifier-declared stability in the D2 conditional-body check

### Verified state

| fact | location |
|---|---|
| `checkConditionalBody` refutes on **any** matched candidate with `conditions.length > 0`, hardcoding `claimed: { stability: 'frozen', origin: 'derived' }` → `downgradedTo: 'per-request'`, with no reference to *which* qualifier conditioned the match | `src/packlets/resolve/cacheStabilityAnalysis.ts:312-334` |
| The docstring concedes the reason: *"Applied at the coarser granularity the data actually supports instead"* | same file, `:296-311` |
| A **call-site override** becomes `hint.origin: 'call-site'`, and the `bodyConditional` branch refutes it identically to an authored hint (`claimed: hint`, origin never consulted) | `:226-234` and `:272-281` |
| **Template sections have no override path at all** — `effectiveSectionStability` ends `return bodyConditional ? 'per-request' : 'frozen'` | `:363-378` |
| `ICandidateMatchTraceEntry.conditions` is `ReadonlyArray<TsResRuntime.IConditionMatchResult>` | `src/packlets/types/trace.ts:114-120` |
| **`IConditionMatchResult` carries only `priority` / `matchType` / `score` — it never names the qualifier** | `@fgv/ts-res` `src/packlets/runtime/conditionSetResolutionResult.ts:36-39` |
| But prompt-assist **owns the mapping**: `IPromptCandidateRecord.conditions` is a `ConditionSetDecl<TQualifierNames>`, keyed **by qualifier name** | `src/packlets/types/descriptor.ts:126-133` |
| `IExpectedQualifierAxis { name, description?, suggestedValues? }` is prompt-assist's own axis-declaration surface | `src/packlets/types/qualifiers.ts:13-27` |
| `IPromptCacheStabilityAnalysisParams` is `@public` and currently carries no qualifier information | `src/packlets/resolve/cacheStabilityAnalysis.ts:24-43` |

### THE LOAD-BEARING FINDING: this does not require a `ts-res` change

The obvious reading of "D2 must know which qualifier conditioned the match" is that
`IConditionMatchResult` has to be widened to name its qualifier. **It does not, and you must
not widen it.** `ts-res` is a **production surface** carrying stability obligations
(`ACTIVE_DEVELOPMENT.md`) — widening a type it constructs would drag a lockstep breaking
change into an otherwise additive stream.

The join is available inside prompt-assist: `ICandidateMatchTraceEntry.candidateIndex`
indexes the descriptor's candidate array, and each `IPromptCandidateRecord.conditions` is a
declaration **keyed by qualifier name**. prompt-assist authored those declarations; it does
not need ts-res to report the qualifier back to it.

**If you find yourself editing anything under `libraries/ts-res/`, stop and surface it.**
That is a signal the approach has drifted, not a scope expansion to absorb.

### The design decision, already made — implement it, don't re-derive it

The consumer offered three options. **Take option 1: stability on the qualifier axis
declaration.** The other two are rejected on written repo principle, and the reasoning
belongs in `result.md`:

- **Rejected — "let the call-site override survive D2".** `CAPABILITIES.md`'s
  `adaptOptionalToNullable` rule already settled this shape: *"The opt-in is not the caller
  asserting its validator tolerates `null`; the condition is read off the schema, so it
  cannot be asserted falsely."* D2 exists to refute claims with resolve-time evidence. An
  override that survives it turns a verified diagnostic into an unfalsifiable assertion.
- **Rejected — a per-resolve `qualifierStability` map.** How often an axis changes is a fact
  about *the axis*, not about this resolve. A per-resolve map lets two resolves disagree
  about the same axis — a second source of truth, the same defect the
  `agent-memory-index-coverage-accessor` reasoning names.

**Pre-empt the obvious objection in the TSDoc**, because a reviewer will raise it: why is a
declared axis stability not the same unfalsifiable assertion that got option 3 rejected? The
distinction is that option 3 lets a claim survive evidence that *contradicts* it, whereas a
declared axis supplies a **missing fact that makes the evidence interpretable**. Today the
check cannot distinguish "conditioned on something that never changes" from "conditioned on
something that changes every request", and assumes the latter. Declaring the axis does not
override evidence — the check still refutes whenever a conditioning axis is declared less
stable than the claim. It stops refuting only the case where the claim was true all along.

### What to build

1. `stability?: PromptCacheStability` on `IExpectedQualifierAxis`, defaulting to
   `'per-request'` when absent.
2. An additive optional field on `IPromptCacheStabilityAnalysisParams` carrying what the
   check needs to join a match to its conditioning axes and their declared stabilities. The
   exact shape is yours — it must not require the caller to restate a fact the descriptor
   already holds.
3. `checkConditionalBody` / the `bodyConditional` branch of `resolveSlotStability` refute
   **only** when a qualifier that conditioned the winning candidate is declared **less
   stable than the claim**. Keep the existing `matchType === 'match'` filter —
   `matchAsDefault` still does not count as conditioning.
4. `effectiveSectionStability`'s template-section path gets the same treatment; a template
   section in a body conditioned solely on `frozen`-declared axes is not downgraded.
5. The finding's `detail` should name **which** axis refuted the claim and what it was
   declared as. The current message says only "the body is qualifier-conditional", which is
   exactly the information-free form this stream exists to improve.

### The behaviour-preservation requirement

**Undeclared qualifiers must keep today's behaviour exactly.** Absent declaration →
`'per-request'` → every refutation that fires today still fires. This is the compatibility
contract for existing consumers and it must be pinned by a test, not asserted.

---

## In scope

- `libraries/ts-prompt-assist/src/packlets/observe/types.ts`
- `libraries/ts-prompt-assist/src/packlets/resolve/promptLibrary.ts`
- `libraries/ts-prompt-assist/src/packlets/resolve/cacheStabilityAnalysis.ts`
- `libraries/ts-prompt-assist/src/packlets/types/qualifiers.ts`
- `libraries/ts-prompt-assist/src/test/unit/**`
- `libraries/ts-prompt-assist/etc/ts-prompt-assist.api.md`
- `libraries/ts-prompt-assist/CAPABILITIES.md`
- `common/changes/@fgv/ts-prompt-assist/*.json`
- `.ai/tasks/active/prompt-assist-qualifier-stability/**`
- `docs/WORKSTREAMS.md` — **this stream's own entry only**

## Out of scope — do not touch

- **`libraries/ts-res/**` — see the load-bearing finding above.** Editing it means the
  approach drifted.
- `toCacheRequest` and the `IAiCacheRequest` emission path in `@fgv/ts-extras` — this stream
  changes what the *diagnostics* say, not what gets emitted on the wire.
- `HorizontalComposer` and the composition-building path itself. Ask A copies an existing
  value onto a record; it does not change how compositions are produced.
- `applySafeguards` / `safeguardFindings` — adjacent in the record, unrelated here.
- Any other stream's entry in `docs/WORKSTREAMS.md`.

---

## Required reading, in order

1. This brief.
2. `src/packlets/resolve/cacheStabilityAnalysis.ts` in full — especially the D1–D5 docstrings
   at `:180-215` and `:290-311`. The existing checks explain *why* each is conservative; the
   new behaviour has to fit that reasoning, not sit beside it.
3. `src/packlets/types/trace.ts` — `IPromptComposition`, `IPromptSection`,
   `ICandidateMatchTraceEntry`, `IResolvedPrompt`.
4. `src/packlets/observe/types.ts` and `src/packlets/resolve/promptLibrary.ts:1392-1412`.
5. `src/packlets/types/qualifiers.ts` and `src/packlets/types/descriptor.ts:120-165`.
6. `.ai/instructions/CODING_STANDARDS.md` § *"Extending Core Libraries Over Working Around
   Them"* and § *"We Build General Capabilities; a Driving Consumer Shapes Priorities, Not
   Designs"* — both are directly load-bearing here.
7. `libraries/ts-prompt-assist/CAPABILITIES.md` § prompt-cache stability.
8. `.ai/notes/cross-repo-handoffs/personaility-reply-2026-09-23-qualifier-stability.md` —
   the reply sent to the consumer. **What ships must match what that note promises**, or the
   note gets corrected in this PR.

**Missing-input rule.** If any file above does not exist, or a line reference points
somewhere other than what this brief claims, **STOP and surface the gap**. Do not reconstruct
the intent from the surrounding code and proceed — a brief that has drifted from the tree is
a signal worth reporting, and `release` may have moved under this stream.

## Skills to load, with triggers

- `/result-pattern` — before writing any `Result`-returning function.
- `/result-tests` — before writing the first test.
- `/type-safe-validation` — if any converter or validator is touched (likely for the new
  declaration field, if it is parsed from JSON).
- `/published-primitives-reflex` — if you reach for anything utility-shaped.

---

## Phases

**Phase 1 — Ask A.** Field, population, tests. Small and independent; land it first so there
is a commit on the branch early. Tests must pin both that the field appears when the request
asked for a composition **and** that the record is unchanged when it did not.

**Phase 2 — Ask B, declaration surface.** `stability?` on `IExpectedQualifierAxis` plus the
analysis-params field and the match→axis join. No behaviour change yet.

**Phase 3 — Ask B, the D2 rule.** The refutation logic, the improved `detail` message, and
the template-section path.

**Phase 4 — Gates and exit.** Per the acceptance criteria below.

---

## Acceptance criteria

- [ ] `composition?` on `IPromptResolveObservation`, populated from `resolved.composition`
- [ ] A test pins that a request **without** `composition` produces a record with the field
      absent — the byte-identical property, pinned rather than asserted
- [ ] `stability?` on `IExpectedQualifierAxis`, defaulting to `'per-request'`
- [ ] D2 refutes only when a qualifier conditioning the **winning** candidate is declared
      **less stable than the claim**; `matchAsDefault` still does not condition
- [ ] **Undeclared qualifiers reproduce today's refutations exactly — pinned by a test**
- [ ] A test pins the *positive* case: a `frozen`-declared axis conditioning the body no
      longer refutes a `frozen` claim, on both a slot section and a template section
- [ ] The finding `detail` names the refuting axis and its declared stability
- [ ] **No file under `libraries/ts-res/` is modified**
- [ ] `rushx build` passes with **zero warnings** in every modified package
- [ ] `rushx lint` passes in every modified package *(not transitively run by build)*
- [ ] `rushx fixlint` run before the final commit
- [ ] `rushx test` passes with 100% coverage in every modified package
- [ ] Change file present — verify with
      `rush change --verify --target-branch origin/release`
- [ ] **`node common/scripts/install-run-rush.js test` (repo-wide) passes** — this stream
      changes *what a function classifies* without moving a signature, which a rebuild
      cannot see. See `CODING_STANDARDS.md` § *"`rush rebuild` covers a widened type. Only a
      repo-wide `rush test` covers a widened behaviour"*. A downstream fixture pinning the
      old refutation boundary is the expected casualty class.
- [ ] `node common/scripts/verify-capability-docs.mjs` and
      `node common/scripts/generate-capability-feed.mjs --check` both clean
- [ ] `CAPABILITIES.md` updated in this PR
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] `code-reviewer` run on the final diff **before** coverage closure; findings resolved or
      dispositioned in the PR description
- [ ] Copilot loop driven to diminishing returns or the 10-round cap, with the stop reason
      stated

---

## Required exit artifact

`result.md`, opening with a one-line `**Shipped:** …` statement that will become the
capability-feed `sourceLine` verbatim. It must record:

- The two rejected options for Ask B **with their reasoning**, so the decision reads as a
  choice.
- The `cacheFindings`-not-hoisted decision for Ask A.
- The ts-res non-change, and why the join was available without it.
- Whatever the repo-wide `rush test` turned up.

## Resume protocol

Keep `state.md` current as you go — a checklist of what is done, what is open, and the next
concrete step. If the session crosses a context boundary, `state.md` plus this brief must be
enough to resume cold. Do not rely on conversation history.

## Coordination boundaries

- **`/finalize-task` runs INSIDE this PR, not before it.** The `ai-assist-streaming-cache`
  stream ran it before the PR existed, and every artifact then carried claims that stopped
  being true the moment a PR was opened — which produced essentially every finding across
  four review passes on #688. Do not repeat it.
- **A PR anticipates its own merge** — write `status: shipped` / `prs: [<n>]` and the
  `✅ (shipped via #<n>)` ledger marker in the PR itself, and **archive the ledger entry into
  `docs/workstreams/2026-09.md`** rather than leaving it in `Active workstreams`. See
  `.ai/conventions/workflow/artifact-protocol.md`.
- Review-loop discipline per `CODING_STANDARDS.md` § *"Review-loop discipline"* — layer 1
  before the first push, layer 2 agent-driven with a cap. **Round count is not the stop
  signal; the most recent round's finding profile is.**

## Branch + PR posture

- Branch `claude/prompt-assist-qualifier-stability`, already created off `release` at
  `9eb0e5139`.
- **PR into `release`.** Single-phase stream, one landing, no integration branch.
- **The user publishes an alpha off the back of this landing**, so a red gate here blocks a
  release rather than just a merge. Do not open the PR until every gate above is green.
