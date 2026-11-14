[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory-sqlite-vec](../README.md) / IIndexIdentityReport

# Type Alias: IIndexIdentityReport

> **IIndexIdentityReport** = \{ `status`: `"fresh"`; \} \| \{ `status`: `"match"`; \} \| \{ `status`: `"mismatch"`; `stored`: `string`; \} \| \{ `status`: `"absent"`; \} \| \{ `status`: `"incomplete"`; `stored?`: `string`; \} \| \{ `status`: `"unchecked"`; `stored?`: `string`; \}

What [SqliteVecVectorIndex.identity](../classes/SqliteVecVectorIndex.md#identity) and
[SqliteVecFragmentIndex.identity](../classes/SqliteVecFragmentIndex.md#identity) report about the embedding identity
stored in the database file, compared against the one the handle was opened
with.

## Remarks

- `'fresh'` — the index's `vec0` table does not exist yet. A `complete` row left
  behind by a dropped table is ignored, so a dropped-and-recreated index never
  reports `'match'` against vectors it did not write. A `rebuilding` row is not:
  it survives the drop and reads `'incomplete'` (see below), so a plain write
  stays refused until a `rebuild` completes.
- `'match'` — the stored identity equals the handle's.
- `'mismatch'` — the stored identity differs; `stored` names it. Writes and
  queries are fenced until a `rebuild` completes.
- `'absent'` — vectors exist but no identity was ever stored (a file written
  before identities existed, or written by a handle without one). Not fenced;
  `adoptIdentity()` records the handle's identity without re-embedding.
- `'incomplete'` — a `rebuild` cleared the index and has not committed, so the
  table may hold any subset of the records. Reported whether or not the table
  exists (a rebuild of a fresh index, or a table dropped after a failed
  rebuild) and whether or not the handle has an identity; fenced until a
  `rebuild` completes.
- `'unchecked'` — the handle was opened without an identity, so there is
  nothing to compare; `stored` names the stored one, if any.
