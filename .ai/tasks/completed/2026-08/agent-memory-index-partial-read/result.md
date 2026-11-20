# Result — `agent-memory-index-partial-read`

**Shipped:** the partial-read `IMemoryIndex` — every read returns `IIndexedMemoryEntry`
(scope + envelope, no body), `rebuild` takes projected entries, `get(target)` is new, bodies are
resolved on demand through a one-method `IMemoryRecordResolver`, and `IMemoryStore.list` now
**requires a selection that narrows**. Design accepted by the consumer (verdict **adopt**), all
seven items of its §8 recommendation landed, and §7's measurement was run rather than asserted.

Branch `feat/agent-memory-index-partial-read`, stacked on `feat/vector-rebuild-report-by-kind`.

---

## What the brief asked for, and what changed shape

The brief was **design-first**: a design doc, a decision on it, then code. That held — the design
went through four revisions, two of them correcting reasoning that was wrong, and was reviewed by
the downstream consumer before any implementation started.

**Three things ended up in scope that the brief did not name**, all of them consequences of the
design review rather than scope creep:

1. **`IMemoryStore.list` was reshaped.** (`IMemoryQuery`'s *shape* is unchanged — the API report
   diff for it is empty; what changed is that `query.filter` now runs after materialization. The
   design's §5a language said "reshapes `IMemoryStore.list` and `IMemoryQuery`" and that was
   carried here without being checked against the shipped surface.) The brief scoped the stream to
   `IMemoryIndex`. Design OQ-3 asked how to absorb the read-latency cost of materializing on
   demand; the answer accepted in review was not to absorb it but to make it **unincurrable by
   accident** — the selection is required, an empty one fails, and a caller who wants the whole
   vault says `scanEveryRecord()`. That is `safer-fetch`'s `addressGuard` / `allowAnyAddress()`
   idiom on a second surface, and it is the change most likely to break a consumer, since it can
   bite code no index census would flag.
2. **`rebuild` moved to the read side.** The consumer's review caught this: `rebuild` had been
   classified as a write because it sits beside `patch`, and it is not. Checking it against source
   made it worse than the case they made — `_initialIndex` collected **every record in the vault,
   whole, into one array** before handing it to `rebuild`, so the store's own open path held N
   whole records at peak regardless of what the index chose to retain. That peak was the
   resident-memory moment the stream existed for. It is now one record.
3. **`listEntries()` was added.** Not in the brief or the first three design drafts. It falls out
   of (1): once the index holds envelopes, the majority of whole-vault callers want exactly that
   and should not have to pay for `scanEveryRecord()`.
4. **`listScoped` — and therefore the vector seam's feed — changed cost and failure mode**, which
   the brief's "Explicitly NOT in scope" list did not anticipate. It used to read **nothing** and be
   infallible, because the index held the records; now it reads a file per record and can fail. The
   `IVectorIndex` *contract* is untouched as the brief required, but every `rebuild` now pays a
   full-vault read and can fail on an unreadable file. Forced by the projection, not optional — but
   it should have been named in the design rather than found by review. See "The one that nearly
   shipped wrong" below.
5. **`IMemoryStore` now extends `IMemoryRecordResolver`.** The migration everything documents is
   `{ index, resolver: store }`, and the consumer holds an `IMemoryStore`; with `resolveRecord` on
   the concrete class only, that line would not have compiled for them. Widening the interface is
   also itself a break for any implementer — as is the new required `listEntries()` — and both are
   now in the cross-repo note.

**One thing the brief asked for was delivered in a different form.** §7 proposed the measurement as
`src/test/perf/residentMemory.test.ts`, "excluded from the coverage gate". It shipped as
`perf/residentMemory.js`, a script run on demand under `--expose-gc`. A test that must be excluded
from the gate is a signal it does not belong in the suite: it would put a machine-dependent number
behind CI and make CI's runtime a function of N.

**Two reversals are recorded in `design.md` rather than tidied away**, because the reasoning matters
more than the conclusion:

- **Draft 1 recommended deleting four `@public` accessors** on the strength of an in-repo call-site
  census showing zero callers. That is not a meaningful measure in a **published utility library** —
  a `@public` method with no internal callers is the normal shape of API that exists *for*
  consumers. Corrected to projection, which preserves every capability and lifts the ceiling just
  as completely. The general form is recorded as design OQ-2 so it is not re-litigated.
- **The measurement was wrong twice before it was right**, in two ways that each print a confident
  number meaning nothing. See §7a.

## The measurement

```
N=2000 records, body=4 KiB → 7.8 MiB of body

what the index retains, same corpus:
  whole records (before):     9.0 MiB
  projected entries (after):  1.1 MiB
  reduction:                  88.3%

store open (400 entries, 1.6 MiB of body): 0.3 MiB
  as a fraction of body volume:  17.3%
```

§7 predicted in advance that if the drop were not roughly the body volume, *"the design is wrong and
this document should be revised rather than the threshold lowered."* It holds; 17.3% is inside the
`< 25%` bar §7 set. The residual 1.1 MiB is envelopes plus `Map` overhead.

**The A/B is narrower than an end-to-end before/after** and should be read as such: it compares two
retaining structures over one corpus in one process, not old code against new. §7 assumed the
harness would exist *before* the change so the before figure could be captured against the old
implementation; it did not, and this is what is measurable after the fact.

**How it was wrong first** (both now documented in `design.md` §7a and in the script's own header):

- **A shared corpus measures nothing.** Building the records once into an array and having both
  passes retain from it leaves the array holding every body, so the whole-record map costs one
  pointer per entry and the A/B reports no difference — for entirely the wrong reason.
- **`padEnd` bodies are not resident.** 2000 4-KiB `padEnd` strings measured **1.15 MiB** of the
  8.2 MiB of characters they contain, and freeing all of them released **0.04 MiB** — V8 shares the
  padding's backing store. Random hex retains and releases exactly its own size (7.92 MiB measured
  for 7.81 MiB of chars). Any future memory harness here should sanity-check that its fixture frees
  what it claims to hold before trusting a number it prints.

## Gates

| gate | state |
|---|---|
| Design reviewed and accepted before implementation | ✅ [personaility#591](https://github.com/ErikFortune/personaility/issues/591#issuecomment-5300958489) — verdict **adopt** |
| Measured before/after on a vault-scale fixture | ✅ above; form deviates from §7's proposal, stated |
| `rushx build` / `lint` / `test`, 100% coverage | ✅ 100% statements/branches/functions/lines, zero warnings |
| Repo-wide `rush rebuild` | ✅ — and it earned its place again, see below |
| Change file per touched package; `rush change --verify` | ✅ `@fgv/ts-agent-memory`, `"minor"` |
| Tests prove the **write** paths still behave | ✅ dedup, admission cohort, temporal versioned put/delete all covered |
| `LIBRARY_CAPABILITIES.md` updated in the same PR | ✅ the "instrumentation seam, not a resident-memory fix" sentence the brief quoted is replaced |
| `code-reviewer` on the final diff before first push | ✅ no P1s, four P2s, all resolved |
| Cross-repo note before the alpha goes out | ✅ `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-15-index-partial-read-shipped.md` |
| `rushx fixlint` before the final commit | ✅ — `rush prettier` runs on every commit here, and `rushx lint` is clean |
| Copilot review loop | ❌ **not run** — no PR of this stream's own has been opened yet; it is squashed onto the integration branch. This gate is outstanding and belongs to whoever opens or updates that PR. |

**One artifact is outside every gate**, stated rather than fixed: `rushx lint` runs `eslint src
--ext .ts`, so `perf/residentMemory.js` is linted by nothing (its `eslint-disable` comment is inert)
and covered by nothing. The script producing this stream's headline numbers is the one file with no
gate on it.

The heap-measurement lesson is recorded outside this stream, in
`.ai/instructions/TESTING_GUIDELINES.md` § "Measurement Harnesses" — named here because a lesson
that lives only in a closed stream's artifacts is not recorded at all.

**Repo-wide rebuild caught `samples/testbed` for the third consecutive stream** — this time a source
file (`scenarios/memoryToolsGate/index.ts`) rather than a test double. Neither library's own suite
can see it. The standing lesson holds: a shared-contract change needs the repo-wide build, not the
per-package one.

## The one that nearly shipped wrong

The layer-1 reviewer's P2 on `listScoped` was fixed by making it **drop-tolerant**, and the
antagonist pass caught that the fix was worse than the finding.

A dropped record lands in none of `records` / `excluded` (the listing) or `indexed` / `declined` /
`skipped` (the rebuild report), so a caller computing coverage undercounts **in the direction of
looking healthier**. That is verbatim the failure `vectorRecordSource`'s own docstring says its tally
exists to prevent — reintroduced one layer down, in the same package, in the same week the
predecessor stream shipped specifically to close it.

Reverted to fail-loud. The motivating race is real and unresolved: `listScoped` holds no write lock,
so a concurrent `put` whose cap-cull physically evicts a record between the snapshot and the read
will fail it. **A loud failure is recoverable and a silent undercount is not**, so failing is the
right interim answer; the right final answer is to make the loss *countable*, which needs a contract
change and is filed in `docs/FUTURE.md` rather than improvised here.

The general form is worth keeping: **a robustness fix that converts a failure into a silence is not
a robustness fix** unless something downstream can still count what was lost.

## The carried-forward item, dispositioned

The brief asked this stream to either commission an independent `code-reviewer` pass over #582's
diff (which had only a self-review) or record why it declined.

**Declined, with reason.** #582 added the `index?: IMemoryIndex` injection point. This stream
rewrote that seam's entire read surface and re-derived what the store does with an injected index —
including every write-path read (content-hash dedup, admission cohort, temporal version history),
which is where a #582 defect would have lived. A retroactive pass over #582's diff would be
reviewing code that no longer exists in that shape. The independent pass that *was* commissioned
covers the superseding surface.

## Reviewer findings (layer 1)

No P1s. Four P2s, all fixed:

- **`listScoped` failed loudly on a vanished record.** It is not write-locked — it snapshots
  envelopes then reads N files, so an ordinary concurrent `put` that cap-culls an eviction can
  remove one in between, and failing there would fail a live `IVectorIndex.rebuild` over a routine
  write. Now drop-tolerant. `_resolveRequired` keeps fail-loud for the write-locked callers, and its
  docstring names the precondition plus the temporal-eviction invariant that keeps `get()`'s
  versioned path safe — **if eviction is ever added to the temporal path, that caller must move**.
- **Stale `get()` TSDoc** claiming versioned reads are served from the index without re-reading. They
  select over envelopes and then read exactly one file.
- **§7's measurement had not been run** — the stream's central claim was unmeasured. Fixed above.
- **`design.md` still said "DRAFT, awaiting review. No implementation has started."** A stale status
  line is read as input by the next stream; this is the exact failure `CODING_STANDARDS.md` § "Docs
  ship with the code" names.

Three P3s applied: `LIBRARY_CAPABILITIES.md` still said `list(filter)`; a `'tagged' as never` cast
that should have been `as unknown as Tag`; and `MemoryIndex.get()` had no direct unit test.

## Left for later

- **`IFragmentVectorIndex` rebuild still has no coverage report** — recorded in `docs/FUTURE.md` by
  the predecessor stream, untouched here.
- **Body caching policy.** The brief put it explicitly out of scope, and it stays there: bodies are
  fetched on demand with no cache. Whether to add one, and with what eviction, is a follow-on
  question that should be driven by a measured consumer workload rather than by symmetry.
- **Persisting the index** remains out of scope; the FileTree is still the source of truth and the
  index is still rebuilt on `create()`.
