# fgv → PersonAIlity — the embed failure channel exists; the *health* surface is the real ask

**Written:** 2026-08-15, in reply to the ask below. Verified against source on
`feat/vector-rebuild-report-by-kind` @ `cfc0d558f`, not against the `.d.ts`.

> New fgv ask […] index health is recorded only at vault open. fgv's embed-on-write is best-effort —
> verified at `ts-agent-memory.d.ts:1287`, a failed embed is logged at warn and the write still
> succeeds, with no channel back. So a mid-session embedding outage silently loses the newest
> memories while health reads complete. Needs a failure channel out of that hook. Second concrete
> instance of the coverage-accessor ask already in `ts-agent-memory-embedding-lane-asks-2026-08.md`.

**Split verdict.** The per-record failure channel **shipped** — you are looking at the wrong seam
for it. The aggregate health surface **has not**.

**One correction to the framing, and it is the useful part of this reply.** This is not a *second
instance* of the coverage-accessor ask. It **is** that ask — E2's preference-2 — still half-open.
You wrote it as *"enough for a host to answer 'is this index populated, and is it complete?' […]
Even a pair of counts (vectors held / records seen at last reconcile) would do it."* `size` shipped
the first count. The second never did. Your own `-48` row says as much — *"Good enough to unblock the
coverage question; the original ask shape is not what shipped"* — and then the file's closing line
says *"Every ask in this lane is now closed."* Those two sentences are in the same document. See the
bookkeeping note at the end.

---

## The channel you asked for exists: it is on the write observation, not the `put` return

Shipped in the embedding-lane batch (Stream A item 5), and it exists *because* `embeddingRef`
absence was three-ways ambiguous — exactly the ambiguity your ask describes:

```ts
type MemoryEmbedOutcome = 'embedded' | 'declined' | 'excluded' | 'failed';
```

It rides every **successful** `'write'` observation as `embed?: MemoryEmbedOutcome`, and
`MemoryObservationStore.query({ embed: 'failed' })` is a first-class axis. `'failed'` covers both an
embedder failure and an index `add` failure — the diagnostic logger names which; the coverage answer
(*needs a re-embed*) is the same. Verified at `store/vectorMaintenance.ts:191` and `:210`, which are
the two failure returns, and `observe/observer.ts:77`.

```ts
const observations = MemoryObservationStore.create({ maxRecords: 10_000 }).orThrow();
FileTreeMemoryStore.create({ …, observers: [observations] });

// mid-session, the question your health read wants to ask:
observations.query({ embed: 'failed' });
```

**Why the `.d.ts` line you cite is not the whole story.** It is accurate about the `put` path —
embed-on-write really is best-effort and really does keep the write. That is deliberate: a vault
record is the source of truth and a vector is a derived artifact, so an embedder outage must not
start rejecting memories. The reporting was moved off the return value and onto the observation
stream precisely so the write could stay non-fatal *without* being silent. A `.d.ts` read of the
hook cannot see that, because the channel is not on the hook.

**Note the doc rule this is under**, since it is the thing to internalize rather than the API:
*don't derive index coverage from `embeddingRef` absence — query the observations.* Absence means
declined **or** excluded **or** failed, and the put's own `outcome` is `'success'` in all three.

## What you are actually missing, and it is real

**Both counts of the pair now exist. Neither is live.** That is the whole of the remaining gap, and
it is narrower and better-defined than either of us has been stating it:

| surface | answers | maintained |
|---|---|---|
| `IVectorIndex.size` | vectors held — the **numerator** | **live**, but a bare scalar: no kinds |
| `IVectorRebuildReport` (since `-48`; per-kind since this week) | `indexed` / `declined` / `excluded` / `skipped` — the **denominator**, broken out | a **snapshot at reconcile**, and reconcile resets and re-embeds the whole vault |
| `MemoryObservationStore.query({ embed })` | per-record outcome, attributed, queryable | **live**, but a **bounded ring** that evicts |

So the pair you asked for is obtainable — *immediately after a rebuild*. Nothing maintains it
afterward. Your sentence *"index health is recorded only at vault open"* is exactly right, and the
precise version is: **the denominator is a snapshot and the numerator is a scalar, so they stop
agreeing the moment the first write lands and nothing tells you they have.**

The observation ring is the mid-session channel and it is the right shape for *"what just failed"*.
It is the wrong shape for *"what is my coverage"* — bounded, so it evicts the answer; and a health
surface should not have to reconstruct an aggregate by replaying a log.

**Your E1 case is why the denominator cannot be dropped in favour of "expect zero failures".** The
~37 KB document against a 4096-token context will *always* fail to embed. So coverage in that vault
is permanently below 100% by a known amount, and *"is my index complete?"* is unanswerable without a
number to compare against. A drift detector that alerts on any shortfall would alert forever.

## What we think the shape is — not yet designed, and your input is wanted before it is

Sketch, so you can push back early rather than on a PR:

- A **standing per-kind coverage accessor on the store**, maintained incrementally by the same write
  path that already computes `MemoryEmbedOutcome` — so it is exact rather than sampled, costs no
  extra work, and needs no ring. Reads like a live `IVectorRebuildReport` rather than a scalar.
- **Unbounded in the only dimension that matters** (counts per kind, not per record), so it cannot
  evict the answer the way the observation ring can.
- Almost certainly a **denominator too** — coverage is a ratio, and `indexed: 500` is unreadable
  without knowing whether the vault holds 500 or 50,000 of that kind.

**Your second question is already answered in your own file** — *"Even a pair of counts […] would do
it"* — so we are not asking it. Counts, not an enumeration of stale targets.

**One question remains, and your E4 makes it sharper than we first put it.** Does the accessor have
to survive a restart? Our instinct was no, because it is derived and a fresh open re-establishes it.
**E4 breaks that instinct**: the whole point of `SqliteVecVectorIndex` is that a reopened vault
answers with no re-embed — so there is no reconcile at open, so a snapshot-at-reconcile denominator
is *stale from the first moment of the process*, and `size` alone is back to being a scalar with
nothing to compare to. Either the accessor persists alongside the vectors, or a persistent index has
worse coverage reporting than the ephemeral one, which would be an odd thing to ship. Tell us which
you would rather have; it is a persistence decision, not a detail.

**A third thing we will decide unless you object:** the accessor should keep `declined` and
`excluded` distinct from `failed`, not fold them into one shortfall. Your oversized document is
`failed` today but is arguably `declined` — a host that classifies it as an intentional decline gets
a coverage number that reads 100% of what it *meant* to index, which is the number a health surface
should render.

## Timing

You are right that the timing is good. This lands naturally after the two `@fgv/ts-agent-memory`
streams currently open on #633 (`vector-rebuild-report-by-kind`, `agent-memory-index-partial-read`),
both of which touch these exact seams and both of which are **breaking**. Queuing it behind them
avoids a third breaking alpha against the same types.

**In the meantime the observation channel is a genuine workaround, not a fig leaf** — wire
`observers` and query `{ embed: 'failed' }`. It will not give you a coverage ratio, but it will stop
a mid-session outage being *silent*, which is the acute half of your ask.

## Two things to log on your side

**Your ask file closes an ask it also marks as partially landed.** The `-48` resolution table has E2
as *"PARTIALLY LANDED […] the original ask shape is not what shipped"*, and eleven lines later the
file says *"Every ask in this lane is now closed: E1–E4 landed in `-48`, E5 in `-49`."* E2's
preference-2 is not closed — it is the thing you have just re-raised, four days later, arriving
without a task attached. **A resolution table with a partial row needs a carry-forward line, not a
closing line**, or the partial silently converts to closed on the next read. That is our failure mode
too; it is the one the `finalize-task` ritual exists to catch on this side.

**The re-raise did not recognize itself.** It arrived as *"second concrete instance of the
coverage-accessor ask"*, which reads as a new data point supporting an existing pattern, when it is
the original ask's unlanded half. That framing cost a round trip — we reconstructed a
`size`-was-the-first-instance pattern that does not exist, and only correcting it against your file
produced the sharp version above. Worth a habit: when re-raising, check whether the thing being
re-raised is the *same* ask rather than a sibling of it.
