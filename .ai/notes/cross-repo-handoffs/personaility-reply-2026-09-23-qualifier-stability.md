# Reply — resolve-observation composition, and qualifier-declared cache stability

**Date:** 2026-09-23
**Asks:** `ASK-2026-09-21-resolve-observation-composition` and the qualifier-stability ask
**Answer:** both accepted. Ask B takes **option 1** (stability on the qualifier declaration).
**Stream:** `prompt-assist-qualifier-stability`, one PR into `release`.

---

## Both asks verified against our source. Every claim held.

You reported against compiled `@fgv/ts-prompt-assist@5.1.0-56` rather than declarations — your
`#664` lesson — and source agrees with dist in every particular. Reproduced here so you can see
we checked rather than took it:

**Ask A.** `IPromptResolveObservation` (`observe/types.ts:125-145`) carries `winningScope?`,
`body?`, `outputKind?`, `trace?`, `safeguardFindings?`, `error?` and no `composition`.
`IPromptResolveTrace` (`types/trace.ts:151-172`) has no section map and no stability, so you are
right that the composition cannot be re-derived from the trace. `_buildResolveObservation`
(`resolve/promptLibrary.ts:1392-1412` — your `lib/...js:786`) has `resolved` in hand and mirrors
`.trace`, `.body` and `.descriptor.output.kind` onto the record, but not `.composition`.

**Ask B.** `checkConditionalBody` (`resolve/cacheStabilityAnalysis.ts:312-334`) refutes on any
matched candidate with a non-empty condition set, hardcoding `claimed: { stability: 'frozen' }`
→ `downgradedTo: 'per-request'`, never consulting which qualifier conditioned the match. Your
point about the call-site override is exact: it becomes `hint.origin: 'call-site'` at `:226-234`
and the `bodyConditional` branch at `:272-281` refutes it identically to an authored hint,
`claimed: hint`, origin never read. And template sections genuinely have no override path —
`effectiveSectionStability` ends `return bodyConditional ? 'per-request' : 'frozen'` at `:363-378`.

Worth adding: the check's own docstring already concedes the reason — *"Applied at the coarser
granularity the data actually supports instead."* Your ask supplies exactly the data it says it
lacks, so this is completing a design rather than overturning one.

---

## Ask A — accepted as specified, with one simplification

`composition?: IPromptComposition` on `IPromptResolveObservation`, populated from
`resolved.composition`.

**Your "absent otherwise" caveat needs no conditional logic** — `IResolvedPrompt.composition` is
*already* `undefined` when the request did not ask for one (`types/trace.ts:355-360`), so a plain
assignment carries it. Flagging it so nobody on either side implements a redundant branch.

**One precision on "byte-identical", because we told you it was free and it is free only in the
sense you probably meant.** The shipped code is a plain `composition: resolved.composition`, so
the in-memory success record now has a `composition` **key** whose value is `undefined` when the
request did not ask. `JSON.stringify` drops it, so the *serialized* record is byte-identical to
before, and `record.composition` reads `undefined` either way — that is what our test pins. But
`Object.keys(record)` and `'composition' in record` now see the key. We are calling this out
rather than letting you find it, because a prompt browser enumerating record fields is exactly
the consumer that would. If you need true key-absence we would add a spread-conditional; say so
and it is a small change.

**We checked the retention question you did not raise, and it is a non-issue.**
`PromptObservationStore` is a `RetainingRingBuffer`, so anything on the record is held N-deep —
which would matter if `IPromptSection` carried text slices. It does not: `start` / `chars` /
`measured` are offsets (`types/trace.ts:249-277`), and `body` is already retained on the record.
Compositions are small fixed-size structs pointing into a string the record already holds. No
sizing concern, and no need for you to tell us your retention depth.

**One thing we are deliberately not doing:** hoisting `cacheFindings` onto the observation record
alongside `composition`. There is a surface argument for it, since the record already hoists
`safeguardFindings` out of `trace`. We are carrying `composition` whole instead — `cacheFindings`
is one dereference away, and a hoisted copy is a second place the same finding lives. If that
turns out to be awkward in the browser, say so and we will revisit; we would rather hear that
than guess.

---

## Ask B — option 1, and here is why not the other two

**Taking option 1: stability on the qualifier axis declaration**, with `per-request` as the
default so undeclared axes reproduce today's behaviour exactly. D2 will refute only when a
qualifier that actually conditioned the winning candidate is declared less stable than the claim,
and the finding's `detail` will name which axis refuted it — the current message says only "the
body is qualifier-conditional", which is the information-free form this work exists to fix.

**Option 3 (let the call-site override survive D2) we are refusing outright**, and on a principle
already written down here rather than on cost. Our `adaptOptionalToNullable` rule says: *"The
opt-in is not the caller asserting its validator tolerates `null`; the condition is read off the
schema, so it cannot be asserted falsely."* D2's entire job is refuting claims with resolve-time
evidence. An override that survives it converts a verified diagnostic into an unfalsifiable one —
which would make the check agree with you more often while telling you less.

**Option 2 (a per-resolve `qualifierStability` map) we are declining as a second source of
truth.** How often `archetype` changes is a fact about the axis, not about a particular resolve.
A per-resolve map lets two resolves disagree about the same axis, and then neither the analysis
nor you can say which was right.

### The objection you should expect, answered up front

Someone will ask why a declared axis stability is not the same unfalsifiable assertion we just
rejected option 3 for. The distinction is the whole design, so it is worth stating plainly:

Option 3 would let a claim **survive evidence that contradicts it**. Option 1 supplies a
**missing fact that makes the evidence interpretable**. Today the check cannot tell "conditioned
on something that never changes" from "conditioned on something that changes every request", and
assumes the latter. Declaring the axis does not override the evidence — the check still refutes
whenever a conditioning axis is declared less stable than the claim. It stops refuting only the
case where the claim was true all along, which is your `personality.archetype` and
`chat.multi-agent` case.

### The part that keeps this cheap, which you could not have known

Our first concern was that `ICandidateMatchTraceEntry.conditions` is
`ReadonlyArray<TsResRuntime.IConditionMatchResult>`, and that type carries only `priority`,
`matchType` and `score` — **it never names the qualifier**. If D2 had to learn the qualifier
identity from there, this ask would mean widening `@fgv/ts-res`, which is a production surface
with stability obligations, and the answer would have been a much slower "yes, eventually".

It does not. `IPromptCandidateRecord.conditions` is a `ConditionSetDecl<TQualifierNames>` keyed
**by qualifier name** (`types/descriptor.ts:126-133`), and `candidateIndex` joins a trace match
back to its declaration. prompt-assist authored those declarations, so it never needed ts-res to
report the qualifier back. The whole change stays inside one library that is on our
active-development list — additive, no compatibility burden.

---

## The two asks compose, which is why they ship together

An observer that retains compositions (Ask A) can compare a declared axis stability against what
actually changed across resolves. So Ask A is what makes Ask B's declarations **checkable over
time** rather than taken on faith — a `frozen`-declared axis that does in fact vary becomes
visible in the browser instead of silently believed. That is the argument for one landing rather
than two.

---

## On the version you asked for

Both land in a single PR into `release`, and the alpha cut after that landing carries them. We are
not naming a version number in advance: the repo publishes lockstep, so the number is whatever
alpha follows, and quoting one now would be a guess dressed as a commitment.

**Your interim is correctly scoped and its lift is exactly this landing.** The bounded-interim
marker on those warn lines can come out when the alpha carrying this is in your tree — not when
the PR merges, since you consume published packages rather than `release`.

---

## One thing we would like back, when you have it

Not blocking, and not a question whose answer changes what we build — we have decided the design.
But once you declare stabilities on your axes, the thing we cannot observe from inside this repo
is whether a `frozen`-declared axis ever actually changes mid-conversation in a real deployment.
If the browser surfaces one, that is a genuine bug report about the declaration model rather than
about your prompts, and we would want to hear it.

---

## Addendum — what shipped beyond this note (2026-09-23, #689)

Everything above shipped as described. Two further behaviours follow from the same rule; they
are recorded here so the note matches the code:

- **A refuted claim drops to the axis's level, not always to `per-request`.** A `frozen` slot
  claim in a body conditioned on a `per-conversation`-declared axis now reads `per-conversation`.
  With nothing declared the two are identical.
- **Candidates that did not win count too, once the body is conditional.** Suppose your winning
  candidate is conditioned only on a `frozen` axis, and another candidate conditioned on an
  undeclared axis lost this resolve. The body is still refuted, and the finding names the losing
  candidates and their axis. A change on that axis can bring them in next time. Without this,
  declaring `personality.archetype` `frozen` could have produced a false `frozen` that you did not
  get before.

One gap remains and is recorded in our `TECH_DEBT.md`. When no winning candidate is a conditional
match (every winner unconditional, or conditional only as a `matchAsDefault` fallback), a
competing conditional candidate is not seen at all. That was already true before
this change, and this change does not alter it.
