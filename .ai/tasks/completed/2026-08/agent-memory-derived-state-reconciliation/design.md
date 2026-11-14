# Design — `agent-memory-derived-state-reconciliation`

**Status: PROPOSED, 2026-08-15.** Settles brief deliverables (a)–(f). Implementation is phased
below; each phase is a feature branch off `integration/agent-memory-derived-state`.

---

## 0. The one idea

**Coverage is cheap and total; repair is expensive and targeted.** Every design decision below falls
out of that asymmetry, and where the two operations differ in shape it is because their costs differ
by three orders of magnitude.

Coverage reads **envelopes only** — no bodies, no embedder, no file reads. Repair reads bodies and
calls an embedder, because it has to.

---

## 1. (a) The shape of the two operations

**Recommendation: asymmetric. One total `coverage()`, and a `reconcile(kind, artifact)` that names
what it repairs.**

```ts
/** Cheap, total, envelope-only. No selection required — it reads no files. */
coverage(): Promise<Result<IDerivedStateCoverage>>;

/** Expensive, targeted. Names its artifact because the costs differ by ~70x. */
reconcile(kind: Kind, artifact: DerivedArtifact): Promise<Result<IReconcileReport>>;

type DerivedArtifact = 'rank' | 'record-vector' | 'fragment-vector';
```

### Why coverage takes nothing and returns everything

It is the same reasoning that produced `listEntries()` in the partial-read stream. Coverage's inputs
are an envelope walk (`this._index.entries()` — a `Map` walk, no I/O) plus one scalar read per wired
index. Narrowing it to a kind saves nothing measurable and costs the caller a call per kind, while a
health surface almost always wants the whole picture. **A cheap operation should not be made to look
expensive by decorating it with a selection**, and the corollary of `list(selection)`'s guard is that
things which genuinely cost nothing must not carry one — otherwise the guard stops meaning anything.

### Why reconcile names both its kind and its artifact

Three independent reasons, any one sufficient:

1. **The lanes are independently wirable.** `vectorIndex`/`embed` and `fragmentIndex`/
   `fragmentEmbedder` are separate create params; the docs say wire either, both, or neither. An
   unnamed repair on a fragment-only store must either no-op silently or guess.
2. **The costs are not comparable.** One vector per record vs. N — measured at 68 fragments for a
   single 56 KB record. An operation whose cost varies ~70× along a dimension it does not name is
   the accidental-expense shape `list(selection)` exists to prevent.
3. **There is nothing to call on the fragment half.** `IFragmentVectorIndex` has no `rebuild`; see
   §5.

### Alternatives considered and rejected

- **Six methods** (`rankCoverage`/`reconcileRank`/`recordVectorCoverage`/…). Rejected: a fourth
  derived artifact would add two more, and the coverage half genuinely shares one walk — six methods
  would make callers pay for it three times or make us cache.
- **A single symmetric `reconcile(kind)` repairing everything wired**, per the consumer's original
  "reconcile derived state for kind K" phrasing. Rejected on (1)–(3): it is the right *concept* and
  the wrong *signature*. The concept survives as the shared report shape and the shared invariant;
  the signature has to name the lane.
- **`coverage(kind)` for symmetry with `reconcile`.** Rejected: symmetry is not a reason, and the
  asymmetry here is load-bearing information — the signatures tell a reader which operation is safe
  to call in a health check and which is not.

---

## 2. (b) What coverage costs — and the rule that keeps it honest

**Every input to `coverage()` is an envelope field or an index-side scalar. It reads no record
bodies and calls no embedder. This is a contract, not an implementation note.**

| number | source | cost |
|---|---|---|
| records per kind | `index.entries()` → `envelope.kind` | `Map` walk |
| expected-to-be-embedded per kind | the same walk, filtered by `embedsKind(kind)` | free |
| believed-covered per kind | the same walk, `envelope.embeddingRef !== undefined` | free |
| index truth | `IVectorIndex.size` / `IFragmentVectorIndex.size` | one scalar each |

**The design rule, stated so a future change cannot quietly break it:** *if a proposed addition to
the coverage report would require reading a record body, it does not belong on this report.* The
partial-read stream made the envelope walk free; spending that dividend on a health check that reads
the vault would be an odd way to celebrate it.

### The staleness signal, which is free and was not asked for

`covered` is what the **store believes** — `embeddingRef` presence. `size` is what the **index
holds**. Both are already in the report, so the disagreement is visible without a new mechanism:

- **Persistent index** (`SqliteVecVectorIndex`): vectors survive the restart, `embeddingRef` is
  truthful, and the two agree.
- **In-memory index**: at open the index is empty while envelopes still carry `embeddingRef` from
  previous sessions. `embeddingRef` **lies, in the confident direction** — which is exactly why
  `size` exists, and why the report must carry both rather than reconciling them for the caller.

The report therefore states this in its own docstring: **`covered` is a belief and `indexSize` is a
fact, and a large divergence means the index is fresh or stale rather than that records are
missing.** Collapsing them into one "coverage %" would destroy the only signal that distinguishes
the two deployment modes.

---

## 3. (c) What "targeted" means, mechanically — and why `has()` is the load-bearing addition

`rebuild` resets the index and re-embeds every record. That is the correct operation for *"I changed
embedding model, redo everything"* and the wrong one for *"a 40-second outage this afternoon left a
few dozen records unindexed"* — which is the case that motivated the stream.

**Targeted repair, per record of the kind:**

1. Does the index hold a vector for this target? → **`has(target)`**.
2. If yes, skip. No body read, no embedder call.
3. If no, materialize the record, call the embedder, `add` the result.
4. Classify the outcome per the existing vocabulary: `embedded` / `declined` / `failed`.

**Step 1 is why `has(target)` must go on both index contracts, and it is the whole justification.**
Without it the only way to know whether a record is indexed is `envelope.embeddingRef` — which §2
just established is a *belief*, and which is wrong in precisely the situation a repair is being run
in. A repair that trusts the field it is repairing is not a repair.

```ts
// added to IVectorIndex and IFragmentVectorIndex
has(target: IEdgeTarget): Promise<Result<boolean>>;
```

`Promise<Result<…>>` rather than a bare boolean, unlike `size`: `size` is a cached count a bundled
index reads off a `Map`, while `has` on a persistent index is a query that can fail. The two are not
the same kind of accessor and should not be made to look alike.

### What repair does about a disagreement it finds

Four cases, and each has one right answer:

| index says | envelope says | action |
|---|---|---|
| has | has ref | skip — consistent |
| has | no ref | **restamp the ref**; the vector is real, the record lost its pointer (a swallowed post-commit failure) |
| no | has ref | **re-embed**; this is the stale-belief case, and the ref is a lie |
| no | no ref | embed — the ordinary gap |

Row 2 is the one that is easy to miss and cheap to fix: it needs no embedder call at all, because
`has` already proved the vector exists. It is also the case an `embeddingRef`-only repair cannot even
detect.

---

## 4. (d) One report shape, or several

**Recommendation: one coverage struct with a per-artifact member; one reconcile report, discriminated
by artifact.**

```ts
interface IDerivedStateCoverage {
  /** Records per kind. The denominator every other number is read against. */
  readonly records: ReadonlyMap<Kind, number>;
  /** Absent when no kind has a registered projector. */
  readonly rank?: ReadonlyMap<Kind, IArtifactCoverage>;
  /** Absent when the record-vector lane is not wired. */
  readonly recordVectors?: IIndexCoverage;
  /** Absent when the fragment lane is not wired. */
  readonly fragmentVectors?: IFragmentIndexCoverage;
}

interface IArtifactCoverage {
  /** Records the store would derive this artifact for — after exclusions. */
  readonly expected: number;
  /** Of those, how many the store believes are covered. */
  readonly covered: number;
}

interface IIndexCoverage {
  readonly perKind: ReadonlyMap<Kind, IArtifactCoverage>;
  /** What the index actually holds, whole-index. A FACT, against beliefs above. */
  readonly indexSize: number;
}

interface IFragmentIndexCoverage extends IIndexCoverage {
  /** Fragments held per record covered — the fragment lane's real question. */
  readonly fragments: number;
}
```

Every count is resolved by `Kind`, per the rule already on `IVectorRebuildReport`'s docstring, which
this stream does not get to re-open. `indexSize` and `fragments` are the two deliberate scalars and
each states its reason: the first is whole-index by nature (that is what makes it a cross-check), the
second because fragments-per-record is a fan-out, not a coverage ratio.

**The reconcile report reuses `IVectorRebuildReport`'s vocabulary rather than inventing a second
one** — `indexed` / `declined` / `failed`, per kind — plus `restamped` for §3's row 2 and `skipped`
for records already present. A reader who has learned one report has learned both.

---

## 5. (e) `reconcileRank`, and the fragment lane's E4

**`reconcileRank(kind): Promise<Result<number>>` is removed**, superseded by
`reconcile(kind, 'rank')`. `@fgv/ts-agent-memory` is pre-1.0 with an explicit no-shim posture
(`ACTIVE_DEVELOPMENT.md`), and leaving it as the one method that does not match would be worse than
the break: it would teach the wrong shape to every subsequent reader. **Its careful implementation is
kept in full** — the raw-body round trip, `_verifyLoaded`, the write-lock — and becomes
`reconcile`'s rank branch. Nothing about the rank repair's *behaviour* changes.

**`IFragmentVectorIndex` gains `has`, `size` and `rebuild`**, closing E4 on that lane. `rebuild`
takes the same `(source, embed, options?)` shape and returns the same `DetailedResult<report, report>`
as its record-lane sibling, because the two are deliberately kept observably identical.
`SqliteVecFragmentIndex` gains real implementations of all three — it currently has none of them, so
a persistent fragment index cannot be backfilled by any route.

This resolves `docs/FUTURE.md`'s `IFragmentVectorIndex` entry rather than deferring it again.

---

## 6. (f) Absent vs. zero

**A lane that is not wired reports `undefined`, never `0`.** The optional members in §4 carry this,
and it is the same lesson as `embeddingRef`'s three-way ambiguity and `IVectorRebuildReport`'s
`excluded?`: *"this source does not report"* and *"this source reports nothing"* are different facts,
and folding them makes a health surface render a confident zero for a feature the deployment never
turned on.

Concretely: a store with no `fragmentIndex` has `fragmentVectors: undefined`. A store with a wired
fragment index holding nothing has `fragmentVectors: { perKind: <empty>, indexSize: 0, fragments: 0 }`.
The first is not a problem; the second is.

---

## 7. Phasing

Each phase is a feature branch off `integration/agent-memory-derived-state`, gated independently.

| phase | contents | breaking |
|---|---|---|
| **1** | `has()` on both index contracts + both in-memory + both sqlite impls; `size`/`rebuild` on `IFragmentVectorIndex` + `SqliteVecFragmentIndex` (E4) | yes, both index contracts |
| **2** | `coverage()` on `IMemoryStore` + the report types | additive |
| **3** | `reconcile(kind, artifact)`; `reconcileRank` removed and folded in | yes, `IMemoryStore` |

Phase 1 first because it is the only phase whose absence blocks the others: `coverage` wants
`IFragmentVectorIndex.size`, and `reconcile` cannot be targeted without `has`.

## 8. Open questions

**OQ-1 — does `reconcile` need a progress callback?** A fragment-lane reconcile over a large kind is
the 30-second operation the consumer measured. `pullModel` in `@fgv/ts-extras-ollama` established
the repo's shape for this (`onProgress?`). **Recommendation: not in this stream.** It is additive
later, it has no effect on the contracts being broken here, and adding it speculatively would mean
designing a progress event vocabulary with no caller to check it against. Recorded so it is not
re-derived.

**OQ-2 — should `coverage()` cross-reference the observation store** to split the `expected − covered`
shortfall into declined vs. failed? **Recommendation: no.** Coverage must work with no observers
wired, and `reconcile` already produces that split *by re-running the embedder*, which is the only
way to learn it authoritatively. Coverage says how big the gap is; reconcile says what it was.

**OQ-3 — sequencing against the driving consumer.** Their measured cost centre is the fragment lane,
which phase 1 addresses first regardless. No sequencing question actually remains — recorded because
the previous revision of this stream had one.
