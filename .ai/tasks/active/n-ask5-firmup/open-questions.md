# N-Ask5 — Open Questions (fragment-granular semantic retrieval)

> **Purpose:** decision-support for adjudicating N-Ask5 firm-up between the fgv maintainer
> and the personaility orchestrator. Enumerates the open design forks, grouped by who owns
> the call, each with **fgv's current lean**. Not a decision record — the leans are fgv's
> starting position, to be confirmed or overridden in adjudication.
>
> **Feature:** chunk/fragment vector entries + in-result `[start,end)` locator.
> **Status:** deferred; firm when shared semantic knowledge is scheduled.
> **Canonical capture:** `docs/FUTURE.md` § N-Ask5 (PR #557) — currently carries only Q5.
> **Seam grounding:** `libraries/ts-agent-memory/src/packlets/vector/vectorIndex.ts`;
> concrete grounding from the `@fgv/ts-agent-memory-sqlite-vec` build (#558).

N-Ask5 is captured *shaped-not-firm*: a concrete additive interface proposal, but with real
design forks left open. These are the ones a firm-up conversation must resolve. **Two are
architectural and load-bearing (Q1, Q2); the rest largely follow once those settle.**

---

## The two that actually need adjudicating

- **Q1 — hit granularity:** per-fragment hits or collapse-to-record; is `topK` over fragments or records?
- **Q2 — coexistence:** does one record need a whole-record vector *and* fragment vectors at once
  (one shared retriever for both), or is fragment-only enough?

Both hinge on how personaility's knowledge-search surface consumes results — squarely the
consumer's call. Everything else follows once these two are set.

---

## At a glance

| #  | Question | Owner | fgv lean |
|----|----------|-------|----------|
| Q1 | Hit granularity & `topK` counting | **Consumer** | Per-fragment hits; `topK` over fragments |
| Q2 | Coexisting record + fragment granularity | **Consumer** | Two indexes, not a mixed-mode one |
| Q3 | Locator unit (byte / char / token) | **Consumer** | Opaque to fgv — dissolves the question |
| Q4 | Update model (whole-doc vs per-fragment) | **Consumer** | Whole-record re-embed for v1 |
| Q5 | `embeddingRef`: opaque vs fragment-aware | fgv | Opaque |
| Q6 | Store fragment-mode wiring | fgv | Inferred from the wired types |
| Q7 | Persistent-index consequence | fgv | Additive follow-on, not a fork |

---

## Load-bearing forks — Q1–Q2 (consumer's call)

### Q1 — Hit granularity and `topK` semantics  · **Consumer call · load-bearing**

When several fragments of one record land in the top results, what comes back — and what is
`topK` counting?

- **Per-fragment:** N hits, same `recordId`, different `locator`. `topK=10` may be 10 fragments
  from 2 records.
- **Collapse-to-record:** one hit per record (best fragment), `topK` over records — but you keep
  only one locator per record.

**fgv lean →** Return **per-fragment hits** (`{ recordId, locator, score }`), `topK` counted over
fragments, with the `recordId` on every hit so the consumer can group or dedup downstream. Offer
an optional `maxPerRecord` cap as a later knob so one long document can't dominate the top-K.

**Why:** the ask explicitly wants `{recordId, locator, score}` — collapsing throws away the
locator, which is the whole point. Per-fragment is the more general shape; the consumer can always
collapse, but can't recover fragments fgv didn't return. The one real risk (a single doc flooding
results) is a bounded, additive fix.

### Q2 — Coexisting record-level and fragment-level granularity  · **Consumer call · load-bearing**

Does the same record need a whole-record vector (broad recall) *and* fragment vectors (precise
locating) live at the same time? This is the ask's own line about *"one shared semantic retriever
serving both record-level memory and sub-document knowledge."*

- **Fragment-only:** knowledge is embedded purely at fragment granularity; no whole-record vector.
- **Both, one index:** a single index holds record vectors *and* fragment vectors — but they key
  differently (`target` vs `(target, locator)`), so a `vec0` table can't cleanly hold both.
- **Both, two indexes:** a coarse record index + a fragment index, merged by the retriever.

**fgv lean →** Keep `IFragmentVectorIndex` a **separate index instance**; a consumer that needs
both wires two indexes and a merge strategy. No mixed-mode single index.

**Why:** mixed keying in one table is messy and couples two contracts; separation keeps each index
swappable, matching the seam's "swap a backend" posture. **But this is genuinely the consumer's
architecture question** — the real input needed is whether fragment-only suffices for knowledge, or
they truly need simultaneous coarse+fine. If fragment-only, Q2 evaporates.

---

## Also the consumer's call — Q3–Q4

### Q3 — Locator unit: byte, character, codepoint, or token?  · **Consumer call**

The returned `[start,end)` has to line up with whatever the consumer's existing
`IKnowledgeSearchMatch` locator already uses — that alignment is the point of returning a locator
at all.

**fgv lean →** fgv treats the locator as an **opaque half-open integer pair** it round-trips and
never interprets — the index doesn't read bodies, so it needn't know the unit. That **dissolves the
question**: the consumer picks the unit; fgv just carries it.

**Why:** imposing byte-vs-char at the fgv layer would be a false constraint. Kept opaque, this stops
being a fork and becomes a documentation note.

### Q4 — Update model: whole-document or per-fragment?  · **Consumer call**

When a document is edited, how is its embedding refreshed?

- **Whole-record:** `remove(target)` drops all fragments, then `addFragments` re-adds — fragment
  identity is the *record*.
- **Per-fragment:** update individual fragments in place — fragment identity is the `locator`, which
  breaks if re-chunking shifts boundaries.

**fgv lean →** **Whole-record re-embed for v1** (remove-all-then-`addFragments`); fragment identity
is the record, not the locator. Per-fragment incremental update is a later additive concern.

**Why:** matches the ask's host-supplied chunking and keeps re-chunk boundary shifts from orphaning
stale fragments. Just needs the consumer to confirm they re-embed whole docs (not sub-document
diffs) at v1.

---

## fgv design calls — Q5–Q7 (confirm, don't debate)

### Q5 — `embeddingRef`: opaque marker or fragment-aware?  · **fgv call**

Today `embeddingRef` is an opaque per-record "this is embedded" marker. With N fragments per
record, does it stay opaque or encode fragment count / refs?

**fgv lean →** **Stays opaque.** The index owns fragment cardinality; the envelope only marks
embedded-ness.

**Why:** keeps the envelope schema stable and avoids duplicating index state onto the record. This
is the one open question already written into the FUTURE.md capture.

### Q6 — How does the store enter "fragment mode"?  · **fgv call**

The write path today does `embed(record) → one vector → index.add()`. Fragment mode does
`FragmentEmbedder(record) → N {locator,vector} → index.addFragments()`. What flips the store between
them?

- **Explicit config:** a `fragmentMode: true` flag on the store.
- **Inferred:** wiring a `FragmentEmbedder` + an `IFragmentVectorIndex` together *is* fragment mode.

**fgv lean →** **Inferred from the wired types** — no separate boolean. The `rebuild()` path gets a
fragment-embedder overload alongside the existing `MemoryEmbedder` one.

**Why:** fewer config surfaces; the types already carry the mode, so a redundant flag can only drift
out of sync with them.

### Q7 — Consequence for the just-shipped persistent index  · **fgv call**

Not a fork — a known follow-on. `SqliteVecVectorIndex` (shipped in #558) would implement
`IFragmentVectorIndex` by widening its `vec0` primary key from `target_key` to
`(target_key, locator)` — multiple rows per record.

**fgv lean →** **Additive extension** when N-Ask5 lands; the in-memory `InMemoryCosineIndex` gets the
same treatment. Flagged so it's on the radar, not as an open decision.

**Why:** the seam was designed to be swappable; adding a fragment sibling contract doesn't disturb
the record-granular one already in use.

---

## The through-line

**Q1 and Q2 are the real adjudication** — per-fragment vs per-record retrieval, and one index vs
two — and both depend on how personaility's knowledge-search surface wants to consume results.
Q3–Q4 are consumer confirmations that mostly collapse once Q1/Q2 are set; Q5–Q7 are fgv's to decide,
listed for visibility.

Once adjudicated, fold the resolved set back into `docs/FUTURE.md` § N-Ask5 (which currently carries
only Q5).
