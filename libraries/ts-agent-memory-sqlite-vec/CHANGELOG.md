# Change Log - @fgv/ts-agent-memory-sqlite-vec

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Minor changes

- Initial release: durable vector indexes for `@fgv/ts-agent-memory`, backed by SQLite `vec0` (`better-sqlite3` + `sqlite-vec`), so a reopened vault answers queries without re-embedding. Node only.
- `SqliteVecVectorIndex` (one vector per record) and `SqliteVecFragmentIndex` (many per record) implement `IVectorIndex` and `IFragmentVectorIndex`.
- Both store an embedding identity in the index file, and `identity()` reports whether the stored vectors came from the model in use.

