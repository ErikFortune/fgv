# agent-memory-derived-state-reconciliation — every derived artifact gets a coverage query and a targeted repair

**Status**: 🔵 in flight as of 2026-08-15 — code complete and gated on
`integration/agent-memory-derived-state`, awaiting the squash onto
`feat/vector-rebuild-report-by-kind` and merge to `release`. **Breaking** on
`IVectorIndex`, `IFragmentVectorIndex` and `IMemoryStore`, all pre-1.0.

> **Amended 2026-08-15** after an antagonist pass over this file and the rest of the
> ritual's output. Five claims here were wrong or misattributed and are corrected inline
> with pointers to [Appendix A](#appendix-a--corrections-and-notes-2026-08-15), which
> quotes each original verbatim. The appendix also closes with what was checked and found
> sound.

## Summary

`FileTreeMemoryStore` derives three artifacts from its records — `rank`, record vectors, fragment
vectors — and answered *"is this consistent?"* and *"how do I fix it?"* differently, or not at all,
for each. Written out, it was one missing abstraction showing as holes in a pattern:

| derived artifact | coverage — before | repair — before |
|---|---|---|
| `rank` | **none** | `reconcileRank(kind)` — targeted, non-destructive |
| record vectors | `size` — a **scalar**: no kinds, no denominator | `rebuild` — **destructive**: resets and re-embeds the whole vault |
| fragment vectors | **none** | **not on the contract at all** |

No two rows agreed on anything. `rank` had the repair shape we wanted and no coverage; record
vectors had a coverage number that could not answer the question and a repair that destroyed the
thing it was meant to fix; fragment vectors had neither, which was **E4 — the defect fixed for the
record lane in `-48` — still open on that lane**, and worse there, because `SqliteVecFragmentIndex`
had no `rebuild` to promote.

After: `IMemoryStore.coverage()` and `IMemoryStore.reconcile(kind, artifact)`, one shape across all
three.

## The one idea everything falls out of

**Coverage is cheap and total; repair is expensive and targeted.** Every asymmetry in the shipped
surface traces to it.

```ts
coverage(): Promise<Result<IDerivedStateCoverage>>;                       // takes nothing
reconcile(kind: Kind, artifact: DerivedArtifact): Promise<Result<ReconcileReport>>;  // names both
```

`coverage()` takes no selection because its inputs are a `Map` walk plus one count per wired index.
The walk is genuinely free; the counts are not quite — on a durable backend `size` runs a prepared
`COUNT`, which is I/O that can fail, and is why the return is a `Result` ([A.3](#a3--coverage-was-described-as-touching-the-filesystem-not-at-all)).
Bounded I/O is still not a reason for a selection guard: `IMemoryStore.list`'s exists because an
unnarrowed list reads the *vault*, and decorating an operation that costs one query per index with
the same guard would make that guard mean less.

`reconcile` names its kind **and** its artifact because the lanes are independently wirable, their
units are incommensurable (one vector per record vs. N), and their costs differ by orders of
magnitude — a measured case put 68 fragments behind a single 56 KB record.

## Two things the report refuses to collapse

**`covered` is a belief; `indexSize` is a fact.** `covered` counts envelopes carrying an
`embeddingRef` **among the kinds actually expected to carry one**
([A.4](#a4--covered-could-exceed-expected-on-a-narrowed-embedkinds)); `indexSize` counts vectors. With a persistent index they agree. With an in-memory
index at open they do not — the envelopes still claim references from previous sessions while the
index holds nothing, so **`covered` lies, in the confident direction**. Collapsing them into one
coverage percentage would destroy the only free signal distinguishing the two deployment modes, so
the type does not offer one.

**Absent is never zero.** Each artifact member is optional; `undefined` means *this artifact is not
derived here at all*. `fragmentVectors: undefined` is a store with no fragment index and is fine;
`{ indexRecordCount: 0 }` is a wired index holding nothing and probably is not. Same defect as
`embeddingRef`'s three-way ambiguity, one level up.

## `has(target)`, and why it is the load-bearing addition

The design justified it as upgrading the numerator from *"the store believes"* to *"the index
confirms"*. Building the repair produced the stronger argument:

**It makes a state detectable that is otherwise invisible.** The index holds the vector, the envelope
lost its `embeddingRef` — a failure swallowed after the vector was committed. From the envelope that
record is indistinguishable from a never-embedded one. Repairing it needs a restamp and **no embedder
call at all**, which is only knowable by asking the index.

That is also what makes `reconcile` targeted rather than a rebuild: a record already held costs one
membership query and no embedding. A test counts embedder calls to pin it — two records, one vector
dropped, exactly one call.

## Files changed

| file | what |
|---|---|
| `packlets/vector/vectorIndex.ts` | `has` on both contracts; `recordCount`/`fragmentCount`/`rebuild` + `IFragmentVectorRebuildReport` on the fragment contract |
| `packlets/vector/rebuildHelpers.ts` | **new**, package-internal — `invokeHook`/`tally` shared once both indexes needed them |
| `packlets/vector/inMemory*.ts` | `has`; the fragment `rebuild` rewritten to the reported shape |
| `packlets/store/coverage.ts` | **new** — the coverage report types |
| `packlets/store/storeCoverage.ts` | **new**, package-internal — the envelope-only walk |
| `packlets/store/reconcile.ts` | **new** — `DerivedArtifact` + the artifact-discriminated report |
| `packlets/store/storeReconcile.ts` | **new**, package-internal — the vector repair branches |
| `packlets/store/memoryStore.ts` | `coverage()`; `reconcileRank` → `reconcile(kind, artifact)` |
| `packlets/store/fileTreeMemoryStore.ts` | dispatcher, rank branch, `_restampOne` generalized to `_rewriteEnvelope`, versioned read fixed |
| `packlets/store/vectorMaintenance.ts` | index/embedder accessors; `reembedRecord`/`reembedFragments` repair entry points |
| `packlets/retrieve/retriever.ts` + 3 retrievers | **`materializePage`** — see the review section |
| `ts-agent-memory-sqlite-vec/.../sqliteVec*.ts` | `has` on both; a real fragment `rebuild`; helpers extracted |
| `.ai/instructions/CODING_STANDARDS.md` | `rush rebuild` promoted to an acceptance-criteria checkbox |
| `docs/FUTURE.md` / `docs/TECH_DEBT.md` | fragment-lane entry resolved ([A.2](#a2--the-fragment-entrys-title-correction-was-not-this-streams)); the two deferred open questions filed; testbed entry's remedy decided; the `max-lines` entry re-measured |

## The deep review, which is the most important thing here

A `/code-review` pass at high effort over the whole diff returned six findings. **Two predate this
stream, and both are the serious ones.**

**`query.filter` was being silently ignored by five retrievers.** The predecessor stream moved the
predicate out of `indexedRecordMatchesQuery` — correctly, since it takes a whole record and the
pre-filter is handed an envelope — and re-applied it in `resolveQuery`. But five retrievers call that
pre-filter **directly** and materialized on their own. They stopped applying the predicate and
returned records that used to be excluded.

**Nothing failed. Every test passed. Coverage was 100% throughout** — because the lines were covered
and the behaviour was not. That surface had had a `code-reviewer` pass *and* an independent
antagonist pass two days earlier; neither caught it. **A coverage tool cannot see a predicate that is
never called.**

Fixed with `materializePage` as the single route, carrying the ordering rule the five sites were
open-coding wrong: no filter → order and page over envelopes, read only the page; with a filter →
read the survivors, filter, **then** page. Their `materializeEntries` / `limitEntries` imports are
gone so the old shape is not reachable by habit.

**`get()` on a temporal kind read N files while its docstring promised one** — and that docstring had
been written in this same stack as the fix for a *different* stale claim. One wrong assertion
replaced by another. It now selects over envelopes and materializes the winner, which is what
widening `selectCurrentVersion` to `IEnvelopeCarrier` was for.

The other four were this stream's own: a lane guard that checked the index but not the embedder (so a
legal half-wired store got a cheerful success with every record in `failed`); `coverage()` reading
index counts outside any capture, so on SQLite it *rejected* rather than failing; the repair path
synthesizing `edgeTargetKey` while discarding what `add` returned; and `has()` landing between
`remove`'s `{@inheritDoc}` and `remove` in the fragment index.

## Decisions made during execution

**`recordCount` / `fragmentCount`, not the designed `size`.** A one-to-many index makes `size`
two-ways readable, and a reader arriving from `IVectorIndex.size` — which counts vectors — takes the
wrong one silently.

**Fragment coverage is aggregate-only, for a structural reason the design missed.** The record lane
has a per-record envelope marker so its numerator falls out of the same free walk as the denominator.
The fragment lane has **no envelope marker at all**, so a per-kind numerator would cost one index
query per record — which coverage is contractually not allowed to spend. The per-kind denominator is
still on `records`; a caller needing the numerator runs `reconcile`, which is already paying.

**The restamp synthesizes the scoped key**, because no contract member returns the reference an
existing vector was minted with, and re-deriving one would cost the embedder call that branch exists
to avoid. Correct for both shipped indexes; a third-party index that mints something else diverges.
Stated at the call site and filed in `docs/FUTURE.md` with three options, undecided because no
consumer has a non-key reference and choosing under that condition would be guessing.

**`reconcileRank` removed rather than kept as an alias.** Pre-1.0, no-shim posture, and leaving one
method that did not match would teach the wrong shape. Its implementation is kept in full — the
raw-body round trip and `_verifyLoaded` checks are careful work and none of the behaviour changes.

## The `samples/testbed` recurrence is resolved, not recorded a fourth time

Fourth consecutive stream on this contract family. The documented remedy was applied instead:
**`rush rebuild` is now an acceptance-criteria checkbox** for any shared-contract change. The choice
between the two candidate remedies is settled by evidence — of the four casualties, three were test
doubles but one was a *source* file, so the shared-double remedy covers half the observed cases and
the checkbox covers all of them. The shared double is downgraded to P3.

**Ten hand-rolled index doubles across six test files** were widened by hand here rather than
replaced with a shared one ([A.1](#a1--the-double-count-was-five-it-is-ten)): that is a chore, and
mixing a six-file test refactor into a breaking contract diff would make it materially harder to
review.

## Outstanding at close

- **`LIBRARY_CAPABILITIES.md` is drafted, not committed** — the ritual does not auto-commit it.
- **No cross-repo note yet.**
- **External review ran as CodeRabbit rather than Copilot**, on `#633` covering all three stacked streams. Rounds 1–2 are addressed (see A.7); the pass over `materializePage`, the SQLite native boundary, and the coverage invariant had not yet run at close.

---

## Appendix A — corrections and notes (2026-08-15)

Findings from the antagonist pass that step 6 of the finalize ritual commissions. Each quotes what
this file originally said, then states what is true and how it was checked.

### A.1 — the double count was "five"; it is ten

> Five hand-rolled index doubles were widened by hand here rather than replaced with a shared one:
> that is a chore, and mixing a five-file test refactor into a breaking contract diff would make it
> materially harder to review.

**Ten doubles across six files.** Counted by intersecting the files declaring a double
(`grep -rl 'implements IVectorIndex\|implements IFragmentVectorIndex\|: IVectorIndex = {\|: IFragmentVectorIndex = {'`)
with `git diff --name-only origin/release...`: `retrievers.test.ts` (three — `FakeVectorIndex` plus
two object literals), `orchestrator.test.ts` (two — `ghostIndex`, `failingIndex`),
`fragmentSemanticRetriever.test.ts` (two — `FakeFragmentIndex`, `rejectingIndex`),
`vectorIndex.test.ts` (`StubVectorIndex`), `embedOnWrite.test.ts` (`SpyVectorIndex`),
`fragmentEmbedOnWrite.test.ts` (`SpyFragmentIndex`). `result.md` carries the same wrong number and is
left as authored. The undercount **strengthens** the argument it appears in rather than weakening it:
a ten-double chore is more clearly worth keeping out of a breaking contract diff than a five-double
one.

### A.2 — the fragment entry's title correction was not this stream's

> `docs/FUTURE.md` / `docs/TECH_DEBT.md` | fragment-lane entry resolved and its title corrected

The title correction landed in commit `e16db5d61`, in the **predecessor** stream. This stream
resolved the entry; it did not retitle it. Worse, at the time the antagonist pass ran, the entry was
marked resolved in four places in the ritual's output and **had not actually been edited** —
`git diff` on `docs/FUTURE.md` showed +30/−0 with the fragment entry untouched. That is now genuinely
done (`grep -c 'unfixed on the fragment lane' docs/FUTURE.md` → 0), and the credit is corrected here.

### A.3 — `coverage` was described as touching the filesystem "not at all"

> `coverage()` takes no selection because its inputs are a `Map` walk plus one count per wired index —
> genuinely free.

The envelope walk is free. The **index counts are not**: `SqliteVecVectorIndex.size` executes a
prepared `COUNT` and throws on a closed connection, so on a durable backend `coverage()` does bounded
I/O and can fail. The same overclaim appeared verbatim in `IMemoryStore.coverage`'s TSDoc
(*"touches the filesystem **not at all**"*) and in `storeCoverage.ts`'s summary; both were corrected
in the code, which is where it mattered — a caller reading that docstring would not have expected a
failure it must handle. The `Result` return and the `captureResult` around the counts were always
right; only the prose was wrong.

### A.4 — `covered` could exceed `expected` on a narrowed `embedKinds`

`IArtifactCoverage.covered` is documented as *"of those"* — a subset of `expected`. It was counted
outside the exclusion branch, so a record embedded under a wide `embedKinds` and then left in place
after the set narrowed reported `expected: 0, covered: 1`, making `expected - covered` negative for
anyone sizing the gap. Fixed by counting inside the branch, with a regression test
(`a residual embeddingRef on a now-excluded kind never pushes covered above expected`) that was
**negatively verified** — hoisting the increment back out turns exactly that test red. The residue is
not swallowed: its vector still counts toward `indexSize`, which is the belief-vs-fact channel that
exists for precisely this.

### A.5 — note: `design.md` describes a surface that is not what shipped, and is left uncorrected

`design.md` names `IFragmentVectorIndex.size` in four places (lines 81, 206, 236, 241) and shows a
fragment coverage shape carrying `perKind` (line 225). Neither shipped: the member is
`recordCount` / `fragmentCount`, and fragment coverage is aggregate-only. **Both divergences were
deliberate and are explained under "Decisions made during execution" above.** Per the finalize
ritual, `design.md` is not edited — a signed-off design that implementation improved on is the most
useful thing such a document records, and rewriting it to match the code would erase the evidence
that the improvement happened. A reader arriving at `design.md` should treat this README and the
shipped `.api.md` as authoritative for the surface.

### A.6 — note: `result.md`'s gate table says "three files"; there are four

`result.md`'s gates table records the change-file gate as *"✅ three files"*. This stream authored
**four**: `derived-state-phase1` for both `@fgv/ts-agent-memory` **and**
`@fgv/ts-agent-memory-sqlite-vec` (phase 1 broke both index contracts, so both packages need one),
plus `derived-state-phase2` and `derived-state-phase3` on `ts-agent-memory` alone. The branch carries
seven change files in total; the other three belong to the two predecessor streams stacked beneath.
The gate itself passed — `rush change --verify --target-branch origin/release` is green — so only the
count was wrong. `result.md` is left as authored.

### A.7 — note: an external review after this record was written found three more real bugs

The section above calls the `/code-review` pass *"the most important thing here"*. That was true when
written and is now incomplete: a CodeRabbit pass over the whole delta on `#633`, run after this record
was finalized, returned five findings of which **three were real bugs this stream shipped** and one
was a real contract divergence. None of them is a correction to a claim in this file — they are
defects the file's own review section did not know about. Recorded here because a closure record
asserting a review was thorough, with no note that a later review disagreed, is the same defect this
appendix exists to catch.

**The `embeddingRef` null sentinel (three call sites).** The field is `string | null | undefined` and
`null` is the *documented* "not embedded" sentinel, so both obvious presence checks are wrong in
opposite directions. `storeCoverage` used `!== undefined` and counted a `null` as covered — inflating
health in the confident direction, which is the one direction the "belief vs fact" section above
argues a coverage surface must not be wrong in. `storeReconcile` used `=== undefined` and read a
`null` as a real reference, skipping the restamp. `declineEmbedding` had the same bug and spent an
index round trip the comment directly beside it claims it avoids. **The third site is one the
external review missed and the verification pass found**, which is the argument for verifying
findings rather than applying them. Collapsed onto an exported `embeddingRefOf(envelope)`.

Worth stating plainly: this is **the same failure mode as the `query.filter` regression** described
above, in code this stream had just edited, missed by the same review that caught the other one.
The sentinel is a *value*, not a branch — so it is invisible to the coverage gate, exactly as
`TESTING_GUIDELINES.md` § "100% coverage cannot see a predicate that is never called" says. The
lesson generalized correctly; the application of it did not reach one file over.

**Consumer hooks unwrapped on the repair path.** `reembedRecord` / `reembedFragments` called all four
consumer-supplied hooks bare, so a hook that *throws* rather than fails escaped as a rejected promise
out of `IMemoryStore.reconcile` — a Result-contract break at a public boundary, forty lines from the
write path that had always captured the identical calls through `_tryVectorOp`.

**`MemoryListSelection` was not mutually exclusive.** `{ scanEveryRecord: true, kind }` type-checked
(TypeScript's excess-property check on a union admits any property declared by *any* member), and
`list` took the scan branch and silently discarded the narrowing — a whole-vault read wearing a
narrowed call's clothes, on the predecessor stream's headline surface. Fixed with `never` markers,
pinned by a `@ts-expect-error` that becomes the build failure if they are removed.

Every fix is pinned by a test **watched failing** against the reverted code first. Two process facts
worth carrying forward: CodeRabbit **does not auto-review PRs whose base is not the default branch**,
so every push to a `release`-targeted PR needs an explicit request; and pushing while a review is in
flight aborts it and consumes the rate-limit slot.

### Checked and unchanged

Verified against the artifacts and found sound: the shipped-surface table in the Summary; the
`has(target)` argument and the embedder-call-counting test that pins it; the `reconcileRank` removal
rationale; the `samples/testbed` remedy choice and its three-doubles-one-source evidence; the
`query.filter` regression account, including that coverage was 100% before and after (the five
per-retriever regression tests were added in response to this same pass and each was negatively
verified); the "Outstanding at close" list, all three items of which are still outstanding; and the
`prs` / `openPrs` split in `meta.yaml` — this stream has authored no PR of its own, and #633 is the
open PR it will ride.
