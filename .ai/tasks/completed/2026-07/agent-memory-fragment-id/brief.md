# Stream brief — `agent-memory-fragment-id`

## Motivation

The consumer (PersonAIlity) is moving knowledge ingestion to **model-chosen segmentation**, where
the model may *rewrite* a span into a curated block rather than only choosing boundaries. Two
consequences follow:

1. A fragment is not necessarily a substring of the record body.
2. Fragmentation is no longer re-derivable from the body.

They therefore need a **durable fragment identity** that survives independently of the span.

## Scope

### 1. `@fgv/ts-agent-memory` — `src/packlets/vector/vectorIndex.ts`

- Add `fragmentId?: string` to `IEmbeddedFragment` (upsert side) and `IVectorQueryHit` (query side).
  Opaque bytestring: never parsed, never filtered on, no semantics, not in the query path.
- Make `locator` **optional** on `IEmbeddedFragment` (it is already optional on `IVectorQueryHit`).
- Enforce **"at least one of `locator` / `fragmentId`"** in a **converter, not the type**. The
  conditional-required union (`{locator; fragmentId?} | {locator?; fragmentId}`) was explicitly
  rejected by the consumer: it costs at every construction site and buys nothing at the read site,
  where the field is `IFragmentLocator | undefined` either way. A fragment must stay identifiable.

### 2. Documentation (the load-bearing half)

- `IFragmentLocator`: the span is **advisory** — the region of the body a fragment was *derived
  from*, NOT a slice guaranteed to reproduce the fragment text.
- Strike the false claim on `IFragmentVectorIndex` that it reuses `IVectorQueryHit` "(whose
  `locator` is always populated here)".
- Rewrite `IVectorQueryHit.locator`'s docstring, which currently invites presence-branching.
  Required wording constraints:
  - State that **no *single* field discriminates** fragment hits from record hits. Do NOT write a
    flat "neither field is a discriminant" — under the at-least-one invariant the *pair* does
    discriminate, and a reader who works out the disjunction and finds the docs denying it trusts
    the docs less, not more.
  - Do NOT document the disjunction as a supported discriminator — it couples callers to an
    invariant enforced at a different boundary and fails silently if that invariant is relaxed.
  - DO state the robust rule: fragment-ness is determined by **which index produced the hit**.
  - Note that `locator` absence now carries **two** meanings (record-granular hit, or a fragment
    with no honest span) — precisely why presence-branching is unsafe.

### 3. `InMemoryFragmentCosineIndex` — carry `fragmentId` through add/query.

### 4. `@fgv/ts-agent-memory-sqlite-vec` — `SqliteVecFragmentIndex`

- Third auxiliary column `+fragment_id text` alongside `+start_off` / `+end_off`.
- **Schema-migration detection (required).** `CREATE VIRTUAL TABLE IF NOT EXISTS` is a no-op against
  an existing table and `vec0` has no `ALTER TABLE ADD COLUMN`, so an existing 4-column fragment DB
  meets a 5-column INSERT and fails today with an opaque `no such column: fragment_id` at
  statement-prepare time. Reuse the existing `CREATE VIRTUAL TABLE` SQL parse (already used to
  recover the dimension) to compare the auxiliary-column set and fail with an actionable message
  naming expected-vs-found columns and stating a drop-and-re-index is required.
- Preserve safe-integer validation on write and coercion on read; handle an absent locator without
  corrupting that handling.

### 5. Policy documentation

The **drop-and-re-index rule** for `vec0` schema changes goes into
`.ai/instructions/LIBRARY_CAPABILITIES.md` (the `@fgv/ts-agent-memory-sqlite-vec` entry) **and** the
package README — "the consumer who meets it is by definition upgrading and not reading this
conversation."

## Explicitly NOT in scope

- No `exact`/`verbatim` flag on the locator. **Considered and declined** by the consumer (see
  `result.md`).
- Fragment-id stability across re-embeds is the **consumer's** responsibility. Our guarantee is "we
  never parse it", not "we keep it stable".
- No new explicit fragment-vs-record discriminant field on `IVectorQueryHit`.
- `fileTreeMemoryStore.ts` create-params and the `index` packlet — owned by the concurrent
  `agent-memory-index-injection-seam` stream. `FragmentEmbedder` is consumer-supplied and returns
  `IEmbeddedFragment[]`, so the id flows without store changes.
- `docs/WORKSTREAMS.md` / `docs/STATUS.md` — orchestrator-owned.

## Gates

- `rushx build` / `lint` / `test` at 100% coverage in both packages
- `rushx fixlint` before the final commit; no `any`; `Result<T>` for fallible ops
- Scenario tests before coverage-chasing; `code-reviewer` before coverage closure
- `code-reviewer` on the final diff
- Rush change files for both packages; both `etc/*.api.md` regenerated
- A test proving byte-identical behaviour when `fragmentId` is absent
- A test proving the sqlite schema-mismatch path fails with the actionable message
