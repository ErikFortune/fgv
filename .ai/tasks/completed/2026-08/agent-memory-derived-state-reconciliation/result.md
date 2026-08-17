# Result — `agent-memory-derived-state-reconciliation`

**Shipped:** every artifact the store derives from its records now has **a coverage query and a
targeted repair**, in one consistent shape — `IMemoryStore.coverage()` and
`IMemoryStore.reconcile(kind, artifact)` — plus the contract members that make a targeted repair
possible at all: `has(target)` on both index seams, and `recordCount` / `fragmentCount` / `rebuild`
on `IFragmentVectorIndex`, which had none of them.

Three phased feature branches off `integration/agent-memory-derived-state`, plus a cross-cutting
review-fix commit. Breaking on `IVectorIndex`, `IFragmentVectorIndex` and `IMemoryStore`.

---

## The matrix the brief was written against, closed

| derived artifact | coverage — before → after | repair — before → after |
|---|---|---|
| `rank` | none → per-kind on `coverage()` | `reconcileRank(kind)` → `reconcile(kind, 'rank')`, behaviour unchanged |
| record vectors | `size`, a scalar → per-kind, with a denominator | destructive `rebuild` → targeted `reconcile` |
| fragment vectors | none → aggregate on `coverage()` | **nothing on the contract** → `rebuild` + targeted `reconcile` |

No two rows agreed on anything before. That was the argument for a stream rather than three
patches, and it held up: the fragment lane's missing `rebuild` was **E4 unfixed on that lane**, which
`docs/FUTURE.md` had filed under a title describing a symptom (*"rebuild has no coverage report"*)
rather than the defect.

## What the design got right, and the four places building it changed the answer

The design's one idea — **coverage is cheap and total, repair is expensive and targeted** — survived
intact, and every asymmetry in the shipped surface traces to it. Four refinements came out of the
implementation rather than the design:

1. **`recordCount` / `fragmentCount`, not `size`.** A one-to-many index makes `size` two-ways
   readable, and a reader arriving from `IVectorIndex.size` (which counts vectors) takes the wrong
   one silently. The in-memory implementation already used the explicit names; promoting them cost
   one extra member and cannot be misread.
2. **Fragment coverage is aggregate-only, for a structural reason the design had not seen.** The
   record lane has a per-record envelope marker (`embeddingRef`) so its numerator falls out of the
   same free walk as the denominator. **The fragment lane has no envelope marker at all** — so a
   per-kind numerator would cost one `has` call per record, which coverage is contractually not
   allowed to spend. The per-kind denominator is still on `records`; a caller needing the numerator
   runs `reconcile`, which is already paying.
3. **`has` earns its place on a sharper argument than the design gave it.** The design said it
   upgrades the numerator from *"the store believes"* to *"the index confirms"*. Building the repair
   showed the stronger version: it makes a state **detectable that is otherwise invisible** — index
   holds the vector, envelope lost its reference. That record is indistinguishable from a
   never-embedded one from the envelope alone, and repairing it needs a restamp and **no embedder
   call**.
4. **The lane guard must check the embedder, not just the index.** An index wired without an
   embedder is a legal store — queries work, writes simply do not embed. The first implementation
   reported a cheerful success with every record in `failed`. A wiring mistake should say it is one.

## Deviations from the brief

- **`docs/FUTURE.md`'s `IFragmentVectorIndex` entry is resolved, not re-scoped.** The brief allowed
  either. Its title was also corrected: it described the missing *report* when the missing thing was
  the *operation*.
- **Two package-internal extractions the brief did not anticipate** — `storeCoverage.ts` and
  `storeReconcile.ts` — because inlining either took `fileTreeMemoryStore.ts` past the 2000-line
  `max-lines` cap. That is a warning, and a warning is a CI failure. Same reason
  `vectorRecordSource.ts` exists.
- **The review fixes landed on the integration branch directly** rather than a phase branch. They
  span all three phases plus the partial-read base, so no phase owns them.

## The deep review, which is the most important thing this stream records

A `/code-review` pass at high effort over the whole diff returned six findings. **Two predate this
stream, and both are the serious ones.**

**`query.filter` was being silently ignored by five retrievers.** The `agent-memory-index-partial-read`
stream moved the predicate out of `indexedRecordMatchesQuery` — correctly, since it takes a whole
record and the pre-filter is handed an envelope — and re-applied it in `resolveQuery`. But
`SemanticRetriever`, `LinkTraversalRetriever`, `CurrentValidRetriever`, `AsOfRetriever` and
`HistoryRetriever` call that pre-filter **directly** and materialized on their own. They stopped
applying the predicate and returned records that used to be excluded.

**Nothing failed. Every test passed. Coverage was 100% throughout** — because the lines were covered
and the behaviour was not. That is the failure mode `TESTING_GUIDELINES.md` already documents from
the `ai-assist-client-tools` stream, recurring on a surface that had a `code-reviewer` pass *and* an
independent antagonist pass two days earlier. Neither caught it. **Coverage cannot see a predicate
that is never called.**

Fixed by extracting `materializePage` as the single route, carrying the ordering rule the five sites
were open-coding wrong: no filter → order and page over envelopes, read only the page; with a filter
→ read the survivors, filter, **then** page. Paging first returns fewer than `limit` for no reason a
caller can see. Their `materializeEntries` / `limitEntries` imports are gone, so the old shape is not
reachable by habit.

**`get()` on a temporal kind read N files while its docstring promised one** — and that docstring was
written *in this stack, as the fix for a different stale claim*. One wrong assertion replaced by
another. `_readVersionedCurrent` now selects over envelopes and materializes the winner, which is
what widening `selectCurrentVersion` to `IEnvelopeCarrier` was for.

Four in this stream's own code: the half-wired lane guard (above); `coverage()` reading the index
counts outside any capture, so on SQLite it *rejected* rather than failing; the repair path
synthesizing `edgeTargetKey` while discarding what `add` returned; and `has()` landing between
`remove`'s `{@inheritDoc}` and `remove` in the fragment index — the same slip fixed in the record
index and missed here.

## Gates

| gate | state |
|---|---|
| Design settles brief deliverables (a)–(f) before implementation | ✅ |
| `rushx build` / `lint` / `test`, 100% coverage, **both packages** | ✅ zero warnings |
| Repo-wide `rush rebuild` | ✅ — and it caught `samples/testbed` for the **fourth** consecutive stream |
| Change files both packages; `rush change --verify` | ✅ three files |
| `LIBRARY_CAPABILITIES.md` updated in the same PR | ⬜ drafted at close, not yet committed |
| `docs/FUTURE.md`'s fragment entry resolved or re-scoped | ✅ resolved |
| `code-reviewer` on the final diff before first push | ✅ superseded by a `/code-review` high-effort pass over the whole diff — six findings, all fixed |
| Cross-repo note before the alpha goes out | ⬜ outstanding |
| Copilot review loop | ❌ **not run**, on this or the two streams beneath it |

## The `samples/testbed` recurrence is resolved rather than recorded

Fourth consecutive stream on this contract family. Rather than a fourth firing, the documented
remedy was applied: **`rush rebuild` is now an acceptance-criteria checkbox** in
`CODING_STANDARDS.md` for any shared-contract change. The choice between the two candidate remedies
is now settled by evidence — of the four casualties, three were test doubles but one was a *source*
file, so the shared-double remedy covers half the observed cases and the checkbox covers all of them.
The shared double is downgraded to P3 rather than dropped.

Five hand-rolled index doubles were widened by hand in this stream rather than replaced with a
shared one. That is a chore, not part of a breaking contract change — mixing a five-file test
refactor into this diff would have made it materially harder to review. Stated rather than skipped.

## Left for later

- **A restamped `embeddingRef` synthesizes the scoped key** rather than recovering the reference the
  index minted, because no contract member returns it. Correct for both shipped indexes; a
  third-party index that mints something else diverges. Filed in `docs/FUTURE.md` with three options
  and the trigger, undecided because no consumer has a non-key reference and picking under that
  condition would be guessing.
- **No progress callback on `reconcile`** (design OQ-1). Additive later; designing a progress
  vocabulary with no caller to check it against would be speculative.
- **`coverage()` does not cross-reference the observation store** to split the shortfall into
  declined vs failed (design OQ-2). It must work with no observers wired, and `reconcile` learns that
  split authoritatively by re-running the embedder.
- **Automatic repair, scheduling, and coverage persistence** were out of scope in the brief and stay
  out.
