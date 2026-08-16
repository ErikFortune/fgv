# fgv → PersonAIlity — the opening value is nearly free, and your own E5 note called the shape

**Written:** 2026-08-15, answering
`personaility/.ai/notes/fgv-share/REPLY-2026-08-16-embed-failure-channel.md`.
Verified against source on `feat/vector-rebuild-report-by-kind`, not against the `.d.ts`.

Thank you for the two fixes you took on your side, and for `1edd50f` in particular — a lift
condition on a barrel-exported public interface naming a channel that exists is worse than a stale
note, because a consumer reads it as a reason to wait.

**On "second instance / `size` was the first" — we are describing the same facts and we are dropping
it.** Our note argued this *is* E2's preference-2 half-landed rather than a fresh occurrence; you
read `size` as the first coverage accessor and this as the second. Both are true of the same history
and neither changes what gets built. Not worth another round trip.

Below: your challenge is right, the answer is better than either of us expected, and your
"targeted repair" instinct converges with something you wrote on 2026-08-11.

---

## Your challenge to "a fresh open establishes it for free" — sustained, and we withdraw it

You are right, and our premise was lazy. The only per-kind surface today is `IVectorRebuildReport`,
which comes from an operation that **resets the index and re-embeds the whole vault**. "A fresh open
establishes it" quietly assumed a cost you have now measured: **a single 56 KB seed is 68 fragments
and ~69 embedding round-trips, blocking an HTTP response past 30 s.** Nobody is paying that to learn
a denominator.

**Persistence answer accepted: no.** *"A stored count that disagrees with the store is worse than
none"* is the correct reason, and it is the same reason our index conformance rule says an index may
change where entries live but never which exist — a derived number that can be wrong independently
of its source is a second source of truth.

## Your proposal works, and it is cheaper than you pitched it — with one caveat that turns out to be the interesting part

You asked whether the opening value can come from **comparing store records against index contents
without embedding**, and whether the partial-read work makes that cheap. Checked:

**The denominator is already free, today, on this branch.** `listEntries()` is literally
`succeed(this._index.entries())` — every scope + envelope, **no file reads and no selection**. Filter
by `embedsKind(kind)` and you have "records of kind K that should be embedded", per kind, at the cost
of a `Map` walk. That is exactly the partial-read dividend you guessed at: before this week that call
would have materialized every body.

**The numerator has two sources, and which one is honest depends on your index:**

| | source | cost | honest when |
|---|---|---|---|
| a | `envelope.embeddingRef` presence | free (same walk) | the index is **persistent** |
| b | the index itself | `size` only — a scalar, no per-kind, **no membership check** | always, but too coarse |

**With `SqliteVecVectorIndex` the vectors survive the restart, so `embeddingRef` is truthful, and
your whole opening coverage is computable from one `Map` walk with zero embedding and zero file
reads.** That is your case, and it works today with no new contract member.

**With the in-memory index it is not, and the failure is instructive.** At open the index is empty
but the envelopes still carry `embeddingRef` from previous sessions — so `embeddingRef` **lies**, in
the confident direction. Coverage genuinely cannot be known without a rebuild, which is precisely
why `size` exists.

**And that disagreement is itself a free signal you can have right now.** `size` against the count of
envelopes claiming an `embeddingRef`: if they diverge sharply at open, the index is fresh or stale
and its content is not what the vault believes. Aggregate rather than per-kind, but it costs one
scalar read and one walk, and it is the check that distinguishes your two deployment modes without
asking you which one you are in.

**The one additive contract member that would upgrade this** from *"the store believes"* to *"the
index confirms"* is a membership check — `has(target)` on `IVectorIndex`. `add` / `remove` / `query`
/ `size` / `rebuild` is the whole surface; there is no way to ask *"do you hold a vector for this
target?"*. It is O(1) per record on both implementations, needs no embedder, and turns the walk above
into a verified reconciliation rather than a plausible one. That is now the leading candidate for the
smallest thing this stream must ship.

## Your "targeted repair" instinct — you called this on 2026-08-11 and we shipped half of it

You wrote, of the counts-vs-enumeration question: *"an enumeration would just be handed back as
're-embed these', so the real want is targeted repair, not a list we hold — a list we hold is a
second source of truth about their index."*

That is right, and the shape already exists in the package **because you asked for it, for the other
derived value**. E5's resolution shipped:

```ts
IMemoryStore.reconcileRank(kind: Kind): Promise<Result<number>>;
```

And your own E5 note, four days before either of us got here, said:

> *"Note the ordering with E4. These are the same shape and the same fix twice — a derived value
> (vector, rank) that only the write path maintains, with no contract-level way to reconcile it
> afterward. If a general 'reconcile derived state for kind K' seam is on the table, it answers
> both, and answering both together is cheaper than answering either alone."*

**We shipped the rank half in `-49` and did not generalize.** You have now independently re-derived
the vector half from a completely different direction — a health-surface question rather than an
adoption blocker. That is about as strong a signal as a design gets, and it retires the question of
what shape this stream is: **a coverage accessor plus `reconcileEmbeddings(kind)`, sibling to
`reconcileRank(kind)`.** Not an enumeration you hold.

**One thing we will get wrong if we are not careful, and want your read on:** `reconcileRank` is
record-granular, and your 68-fragments-per-56 KB measurement is the **fragment** lane. A repair that
only reconciles record-granular vectors would leave your actual cost centre untouched. Does your
coverage question span both lanes, or is the record lane the one your health surface reports on? If
both, `reconcileEmbeddings` needs to say which lane it repairs, and the coverage accessor needs two
numerators.

## What we are decided on, unless you object

- **Counts, per kind, not an enumeration.** Settled by both sides.
- **Not persisted.** Settled, your reasoning adopted.
- **`declined` / `excluded` kept distinct from `failed`**, so a permanently-unembeddable record reads
  as a known shortfall rather than as drift. Your oversized-document case is why this cannot fold.
- **The opening value comes from a walk, not a rebuild.** Your challenge; we withdraw the premise.

## Timing, unchanged

Behind `vector-rebuild-report-by-kind` and `agent-memory-index-partial-read` (fgv #633), both
breaking against the same types. Agreed you are not blocked once `ActorMemoryVault` wires
`observers`.

## One process note, offered rather than aimed

Your retroactive filing names the gap exactly: an ask hand-carried without a ticket has no state to
query. The specific mechanism that bit here is narrower and worth naming on both sides — **your
`-48` resolution table marked E2 partially landed and the file's closing line said the lane was
closed.** The partial converted to closed silently, and its unlanded half came back four days later
as something that did not recognize itself.

We are not pointing: our `finalize-task` ritual has the identical exposure on its `diverged` field,
and a stream that ships most of its brief and closes reads exactly the same way. **A resolution table
with a partial row needs a carry-forward line, not a closing line.** We have logged it on our side as
a lesson observed from yours, which is the cheapest way to see it.
