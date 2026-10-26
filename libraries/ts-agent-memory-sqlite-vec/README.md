<!--
Copyright (c) 2026 Erik Fortune
SPDX-License-Identifier: MIT
-->

# @fgv/ts-agent-memory-sqlite-vec

A **persistent, `sqlite-vec`-backed [`IVectorIndex`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-agent-memory)** for [`@fgv/ts-agent-memory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-agent-memory). It is the durable counterpart to the in-package `InMemoryCosineIndex`: embeddings live in a SQLite file, so they **survive a process restart** — opening an existing vault no longer re-embeds every record.

This is a thin **Result-integration boundary** over [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) + [`sqlite-vec`](https://github.com/asg017/sqlite-vec): it converts their throwing surface into `Result<T>` and implements the `IVectorIndex` seam. It adds no opinion beyond that — see [Not in scope](#not-in-scope).

The package ships two indexes with the same durability story: `SqliteVecVectorIndex` (one vector per record — the record-granular `IVectorIndex`) and `SqliteVecFragmentIndex` (many vectors per record, each tagged with an in-record `[start, end)` locator — the fragment-granular `IFragmentVectorIndex`, the durable counterpart to `InMemoryFragmentCosineIndex`). See [Fragment-granular index](#fragment-granular-index).

## Why

`InMemoryCosineIndex` is brute-force and in-memory, rebuilt from the store by re-embedding the whole vault on open. That is fine for small per-agent vaults; at v2 durability/scale, re-embedding on every open stops being cheap. This package closes that gap with **zero core `ts-agent-memory` change**: the store already writes to the vector index incrementally on `put`/`delete` and only re-embeds when the consumer explicitly calls `rebuild(store.asRecordSource())`. Back the store with a persistent index instead, and skip that rebuild — the vectors are already on disk.

## Install

```bash
rush add -p @fgv/ts-agent-memory-sqlite-vec   # or npm/pnpm add
```

`better-sqlite3` and `sqlite-vec` are **peer dependencies** — bring your own (matching the `@fgv/ts-extras-ollama` / `-transformers` convention). `@fgv/ts-agent-memory` and `@fgv/ts-utils` are peers too; a consumer of this package already has them.

## Quick start

Two factories, differing only in **who owns the connection**. If this index is the only
thing on the file, `open` is the shorter path and needs no `better-sqlite3` import of
your own:

```ts
import { SqliteVecVectorIndex } from '@fgv/ts-agent-memory-sqlite-vec';
import { FileTreeMemoryStore } from '@fgv/ts-agent-memory';

// We open the file and hand back a disposer for the connection we created.
const handle = (await SqliteVecVectorIndex.open({ path: '/path/to/vault/vectors.db' })).orThrow();

const store = (
  await FileTreeMemoryStore.create({ root, registry, vectorIndex: handle.index, embed })
).orThrow();

// ...use the store; embeddings are written to vectors.db on every put.
handle.close(); // closes the connection THIS open() created; idempotent.
```

`SqliteVecFragmentIndex.open({ path })` is the identical shape for the fragment lane.

**Two `open` calls on one path give two independent connections, not a shared one.** To
back a record index *and* a fragment index with a single connection, own it yourself and
pass it to both `create` methods:

```ts
import Database from 'better-sqlite3';
import { SqliteVecVectorIndex } from '@fgv/ts-agent-memory-sqlite-vec';
import { FileTreeMemoryStore } from '@fgv/ts-agent-memory';

// You own the connection. A file path persists; ':memory:' is ephemeral.
const db = new Database('/path/to/vault/vectors.db');

const vectorIndex = (await SqliteVecVectorIndex.create({ database: db })).orThrow();

// Wire it into the store exactly where InMemoryCosineIndex would go. On a reopened
// vault, do NOT call rebuild() — the vectors are already in vectors.db.
const store = (
  await FileTreeMemoryStore.create({ root, registry, vectorIndex, embed })
).orThrow();

// ...use the store; embeddings are written to vectors.db on every put.
vectorIndex.release(); // drop this index's prepared statements — see below
db.close(); // you own the lifecycle — this index never closes your connection.
```

### Releasing an index over a connection you own

An index caches prepared `Statement` objects. Those hold a reference to the
connection, so if you close a connection you own while an index over it is still
reachable, its statements outlive the connection and their native destructors run
whenever GC reaches them — potentially during process teardown.

**`release()` drops those statements and marks the index unusable. It never touches
the connection**, which is why it is safe to expose on a `create()`-made index that
does not own one. `open()`'s handle calls it for you before closing; with `create()`
you own the ordering, and it is `release()` then `close()`.

A released index **fails** (or, for the synchronous counts `size` / `recordCount` /
`fragmentCount`, **throws**) rather than answering. That is deliberate: an index that
has simply never had an `add` also holds no statements, and answering `0` from a
released one would be indistinguishable from an empty one.

Note the limit honestly: `better-sqlite3` exposes no public `finalize()`, so dropping
the last reference does not finalize a statement — it makes it collectable *earlier*,
while the environment is alive, instead of surviving to teardown. That narrows the
window; it is not a proof against it.

`SqliteVecVectorIndex` implements the full `IVectorIndex` contract — `add(target, vector)`, `remove(target)`, `query(vector, topK)` — with the **same semantics as `InMemoryCosineIndex`**:

- Keyed by the canonical `edgeTargetKey` (`(scope, id)`), so records that share a filename stem across scopes never collide.
- The dimension is established by the first `add` (and recovered from the table schema on reopen); a later `add`/`query` of a different dimension fails loudly.
- Similarity is **cosine** — the returned `score` is `1 − cosineDistance` (cosine similarity in `[-1, 1]`, higher = more similar), byte-for-byte the same scoring contract as the in-memory index.
- An empty vector, a dimension mismatch, or a bad table name is a `Result.fail`, never a throw.

## Persistence guarantee

Vectors written in one process are present in the next. `SqliteVecVectorIndex.create` recovers the established dimension from the existing `vec0` table, so a reopened index answers queries immediately with **no re-embedding**. That is the entire point of the package. `SqliteVecFragmentIndex` gives the same guarantee for fragments.

## Fragment-granular index

`SqliteVecFragmentIndex` is the durable `IFragmentVectorIndex` — the "discovery" half of a search-then-read contract, where a hit's `(target, locator)` tells you which record **and** which span matched. It is the persistent counterpart to `InMemoryFragmentCosineIndex` and shares its exact semantics.

```ts
import Database from 'better-sqlite3';
import { SqliteVecFragmentIndex } from '@fgv/ts-agent-memory-sqlite-vec';
import { FileTreeMemoryStore, FragmentSemanticRetriever } from '@fgv/ts-agent-memory';

const db = new Database('/path/to/vault/fragments.db');
const fragmentIndex = (await SqliteVecFragmentIndex.create({ database: db })).orThrow();

// Wire it into the store alongside (or instead of) the record-level vectorIndex.
// The store chunks + embeds each record via the consumer-supplied fragmentEmbedder
// and maintains the fragment index on put/delete/evict.
const store = (
  await FileTreeMemoryStore.create({ root, registry, fragmentIndex, fragmentEmbedder })
).orThrow();

// Query for spans, not records:
const retriever = FragmentSemanticRetriever.create({
  backend: { fragmentIndex, embedQuery }
}).orThrow();
const hits = (await retriever.retrieve({ semantic: 'refund policy', topK: 5, maxPerRecord: 2 })).orThrow();
// each hit carries { target, locator: { start, end }, score } — read the record, slice the span.
```

- Keyed on `target_key` as a `vec0` **`PARTITION KEY`** (many rows share it), with each fragment's identity in auxiliary columns (`+start_off`, `+end_off`, `+fragment_id`) — so `addFragments` is whole-record-replace, `remove` drops every fragment of a target, and both are per-target-clean.
- `query(vector, topK, maxPerRecord?)` applies the optional per-record cap **during selection, before the `topK` cut**, so one long document cannot crowd others out.
- Same dimension-establishment, cosine scoring (`score = 1 − cosineDistance`), reopen-recovery, and loud-failure contract as the record index — byte-identical to `InMemoryFragmentCosineIndex`.

A fragment must carry **at least one** of `locator` / `fragmentId`. The `locator` span is *advisory* — the region of the body the fragment was derived from, **not** a slice guaranteed to reproduce its text — so a rewriting segmenter should omit it and supply a `fragmentId` instead. `fragmentId` is an **opaque bytestring**: stored and returned verbatim, never parsed, never filtered on. Its stability across re-embeds is the caller's business, not this index's (`addFragments` is whole-record-replace, so an updated record re-emits its whole fragment set).

Hold the record and fragment indexes in **distinct tables** (default `memory_vectors` vs `memory_fragments`, or supply `tableName`); they are fully independent and may share one database file.

## Upgrading: `vec0` schema changes require a drop-and-re-index

**There are no in-place migrations for the `vec0` tables this package writes.** When a release changes a table's shape — a new auxiliary column, a different column set — you must **drop the table and re-index**. `DROP TABLE "memory_fragments"` (or point the index at a fresh `tableName`), then re-add every fragment.

This is a property of `vec0`, not a choice: `CREATE VIRTUAL TABLE IF NOT EXISTS` is a no-op against an existing table — SQLite never compares schemas — and `vec0` has no `ALTER TABLE ADD COLUMN`. An old table therefore survives an upgrade untouched and only fails later, opaquely, when a widened statement is prepared.

`SqliteVecFragmentIndex.create` **detects this up front** and fails with a message naming the expected and found columns and stating the remedy, rather than letting `no such column: fragment_id` surface at statement-prepare time.

**The cost is embedding time, never data.** Vectors are derived artifacts — the records in your `FileTreeMemoryStore` vault remain the source of truth — so a re-index re-derives what was dropped and loses nothing.

Known instance: the release that added `IEmbeddedFragment.fragmentId` added a `+fragment_id` auxiliary column to the fragment table. A fragment database written before it must be dropped and re-indexed. (The record table used by `SqliteVecVectorIndex` is unchanged.)

## Not in scope

Deliberately excluded — reach for the upstream libraries (or a different backend) directly if you need these:

- **ANN / large-N indexing.** Query is a brute-force `vec0` KNN scan — correct and durable for the same "thousands of records" regime the in-memory index targets. An approximate-nearest-neighbor structure for very large N is a different backend behind the same `IVectorIndex` / `IFragmentVectorIndex` seam. (This applies to both indexes, including `SqliteVecFragmentIndex`, whose capped query fetches the full ranked set.)
- **Connection lifecycle beyond plain open/close.** With `create({ database })` you open and close the `better-sqlite3` `Database` and this index never does; with `open({ path })` this package opens the file and the returned handle's `close()` disposes of exactly what it opened. Either way, pooling, WAL/pragma tuning, backups, and multi-process coordination are yours.
- **Embedding.** This is a vector *index*, not an embedder — the store's consumer-wired `MemoryEmbedder` produces the vectors (`@fgv/ts-extras/ai-assist` `callProviderEmbedding`, `@fgv/ts-extras-transformers`, etc.).
- **A browser sibling.** `better-sqlite3` is Node-only. A WASM-SQLite browser variant, if ever needed, is a separate package.
- **Schema migration of any kind.** Re-embedding with a different-dimension model against an existing table fails loudly, and a package release that changes a `vec0` table's columns requires a drop-and-re-index — see [Upgrading](#upgrading-vec0-schema-changes-require-a-drop-and-re-index). Drop the table (or use a new `tableName`) to re-index; `vec0` cannot be altered in place.

## Runtime requirements

- Node.js 20+ (`better-sqlite3` native binding).
- `better-sqlite3` `^12.0.0`, `sqlite-vec` `^0.1.9` (peer dependencies).

## License

MIT
