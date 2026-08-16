# fgv → PersonAIlity — the embed failure channel exists; the *health* surface is the real ask

**Written:** 2026-08-15, in reply to the ask below. Verified against source on
`feat/vector-rebuild-report-by-kind` @ `cfc0d558f`, not against the `.d.ts`.

> New fgv ask […] index health is recorded only at vault open. fgv's embed-on-write is best-effort —
> verified at `ts-agent-memory.d.ts:1287`, a failed embed is logged at warn and the write still
> succeeds, with no channel back. So a mid-session embedding outage silently loses the newest
> memories while health reads complete. Needs a failure channel out of that hook. Second concrete
> instance of the coverage-accessor ask already in `ts-agent-memory-embedding-lane-asks-2026-08.md`.

**Split verdict.** The per-record failure channel **shipped** — you are looking at the wrong seam
for it. The aggregate health surface **has not**, and your framing of it as the second instance of
the coverage-accessor pattern is right and is the more valuable half.

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

Three ways to ask about index coverage today, and none of them answers *"is this live store's index
complete right now?"*:

| surface | answers | limit |
|---|---|---|
| `IVectorIndex.size` | how many vectors are held | a **scalar** — no kinds, no denominator |
| `IVectorIndex.rebuild` → `IVectorRebuildReport` | per-kind `indexed` / `declined` / `excluded` / `skipped` | only from a **rebuild**, which resets and re-embeds the whole vault |
| `MemoryObservationStore.query({ embed })` | per-record, queryable, attributed | **bounded ring** — it evicts, so a long session cannot answer for its own history |

So your sentence *"index health is recorded only at vault open"* is precisely right about the only
surface that reports **per kind with a denominator**. The observation ring is the mid-session
channel, and it is the right shape for *"what just failed"* — but it is the wrong shape for
*"what is my coverage"*, because it is bounded and because a health surface should not have to
reconstruct an aggregate by replaying a log that may already have evicted the answer.

**That is the coverage-accessor pattern, second instance, and you named it correctly.** The first
instance was `size` itself — added because a caller could not distinguish *"the index is empty"*
from *"nothing matched"*, since `query` answers an empty index with `succeed([])`. This is the same
defect one level up: a caller cannot distinguish *"my index is complete"* from *"my index has been
quietly drifting since 03:00"*, and the surface that could tell them only runs at open.

## What we think the shape is — not yet designed, and your input is wanted before it is

Sketch, so you can push back early rather than on a PR:

- A **standing per-kind coverage accessor on the store**, maintained incrementally by the same write
  path that already computes `MemoryEmbedOutcome` — so it is exact rather than sampled, costs no
  extra work, and needs no ring. Reads like a live `IVectorRebuildReport` rather than a scalar.
- **Unbounded in the only dimension that matters** (counts per kind, not per record), so it cannot
  evict the answer the way the observation ring can.
- Almost certainly a **denominator too** — coverage is a ratio, and `indexed: 500` is unreadable
  without knowing whether the vault holds 500 or 50,000 of that kind.

**Two questions for you before we design it**, because they change the shape:

1. **Do you want it to survive a restart?** Our instinct is no — it is derived, and a fresh open
   already establishes it. But if your health surface reports across restarts, say so now: that is
   a persistence decision, not a detail.
2. **Is "which records are stale" needed, or only "how many"?** The counts are cheap and exact. An
   enumeration of the failed targets is a different structure with a retention question attached,
   and we would rather not build it speculatively.

## Timing

You are right that the timing is good. This lands naturally after the two `@fgv/ts-agent-memory`
streams currently open on #633 (`vector-rebuild-report-by-kind`, `agent-memory-index-partial-read`),
both of which touch these exact seams and both of which are **breaking**. Queuing it behind them
avoids a third breaking alpha against the same types.

**In the meantime the observation channel is a genuine workaround, not a fig leaf** — wire
`observers` and query `{ embed: 'failed' }`. It will not give you a coverage ratio, but it will stop
a mid-session outage being *silent*, which is the acute half of your ask.

## One correction to log on your side

`ts-agent-memory-embedding-lane-asks-2026-08.md` does not exist in this repo — it is yours, and we
cannot read it. If an ask references it as the authority for a pattern, we are taking that on trust.
Worth restating the pattern in the ask itself when it crosses over.
