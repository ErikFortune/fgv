# fgv → PersonAIlity: N-Ask5 Q3 (opaque fragment id) — accepted

**Date:** 2026-07-31. Checked against `release` @ `fbb08cd55`.

## Accepted, as specified

Thanks for the correction up front — rewriting it as additive against what shipped is what
made this a five-minute assessment instead of a design discussion.

We will add:

- **`fragmentId?: string`** on `IEmbeddedFragment` (upsert side) and on `IVectorQueryHit`
  (query side). Opaque bytestring: never parsed, never filtered on, no semantics, not in the
  query path. Stored as a third auxiliary column in the `vec0` table, alongside
  `+start_off` / `+end_off`.
- **`locator?` stays exactly as it is.** Not removed, not redefined. Consumers relying on it
  as an exact slice are unaffected.
- **The docstring change you called the load-bearing half — agreed, and you're right that it
  is the more important one.** `IFragmentLocator` will say the span is *advisory*: the region
  of the body a fragment was derived from, **not** a slice guaranteed to reproduce the
  fragment text. Today the doc says the index stores the offsets opaquely and never
  interprets them, which is true but leaves a reader free to assume `body.slice(start, end)`
  round-trips. Under a rewriting segmenter that is false, and the doc should say so.

Your plumbing read is correct and there is less work than you might expect: `FragmentEmbedder`
is `(record) => Result<IEmbeddedFragment[]>` and is **consumer-supplied**, so you mint the id
and it rides through the store's fragment-embed-on-write path with no new wiring on our side.

Q1 (per-fragment hits + `maxPerRecord`), Q2 (separate indexes), Q4 (whole-record re-embed)
are unaffected — `maxPerRecord` applies during selection before the topK cut and doesn't
interact with this.

## One question back — please answer before we implement

**`locator` is required on the way in, optional on the way out.** On `IVectorQueryHit` it is
`locator?`; but on `IEmbeddedFragment` — the type you hand to `addFragments` — `locator` is
**required**.

You wrote that you'll keep populating the span "where one is meaningful," which concedes it
sometimes won't be. Today, for a curated block with no honest derived-from span, you would
have to fabricate offsets — and fabricated offsets are indistinguishable from real ones to
every downstream reader. That is exactly the failure mode the advisory-span doc note is meant
to prevent, reintroduced through the input type.

**So: should `locator` become optional on `IEmbeddedFragment` when a `fragmentId` is
present?** Both fields are additive-optional, so doing it in the same change is nearly free;
retrofitting it later is not. Your answer also decides whether the doc note is sufficient or
whether the type should carry the distinction.

## One consequence you didn't flag: the persistent index needs a re-index

Purely additive at the type level — but **not additive on disk**. `SqliteVecFragmentIndex`
creates its table with `CREATE VIRTUAL TABLE IF NOT EXISTS`, which SQLite treats as a no-op
when a table of that name already exists (it does not compare schemas), and `vec0` virtual
tables don't support `ALTER TABLE ADD COLUMN`. So an existing fragment database keeps its
four columns while the widened insert names five.

We've now formalized the policy rather than leaving it implicit:

> **A change to the `vec0` schema of the persistent vector or fragment index requires
> consumers to drop the table and re-index. We do not ship in-place migrations for these
> tables.**

Justification: the vectors are always re-derivable from the records, so a re-index costs
embedding time and never data. What the policy obliges *us* to do is make it diagnosable —
detect the schema mismatch on open (the index already parses the stored `CREATE VIRTUAL
TABLE` SQL to recover the dimension; the same parse can compare the auxiliary-column set) and
fail with an actionable message naming expected-vs-found columns, rather than the opaque
`no such column: fragment_id` you'd get today at statement-prepare time.

**Practical impact on you: likely none.** The fragment index shipped 2026-07-20, and you're
re-ingesting anyway as you move to model-chosen segmentation. But if you have a persisted
fragment index you care about, plan the re-index rather than expecting a transparent upgrade.
