<!--
Copyright (c) 2026 Erik Fortune
SPDX-License-Identifier: MIT
-->

# @fgv/ts-agent-memory-sqlite-vec

A **persistent, `sqlite-vec`-backed [`IVectorIndex`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-agent-memory)** for [`@fgv/ts-agent-memory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-agent-memory). It is the durable counterpart to the in-package `InMemoryCosineIndex`: embeddings live in a SQLite file, so they **survive a process restart** — opening an existing vault no longer re-embeds every record.

This is a thin **Result-integration boundary** over [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) + [`sqlite-vec`](https://github.com/asg017/sqlite-vec): it converts their throwing surface into `Result<T>` and implements the `IVectorIndex` seam. It adds no opinion beyond that — see [Not in scope](#not-in-scope).

## Why

`InMemoryCosineIndex` is brute-force and in-memory, rebuilt from the store by re-embedding the whole vault on open. That is fine for small per-agent vaults; at v2 durability/scale, re-embedding on every open stops being cheap. This package closes that gap with **zero core `ts-agent-memory` change**: the store already writes to the vector index incrementally on `put`/`delete` and only re-embeds when the consumer explicitly calls `rebuild(store.asRecordSource())`. Back the store with a persistent index instead, and skip that rebuild — the vectors are already on disk.

## Install

```bash
rush add -p @fgv/ts-agent-memory-sqlite-vec   # or npm/pnpm add
```

`better-sqlite3` and `sqlite-vec` are **peer dependencies** — bring your own (matching the `@fgv/ts-extras-ollama` / `-transformers` convention). `@fgv/ts-agent-memory` and `@fgv/ts-utils` are peers too; a consumer of this package already has them.

## Quick start

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
db.close(); // you own the lifecycle — this index never closes your connection.
```

`SqliteVecVectorIndex` implements the full `IVectorIndex` contract — `add(target, vector)`, `remove(target)`, `query(vector, topK)` — with the **same semantics as `InMemoryCosineIndex`**:

- Keyed by the canonical `edgeTargetKey` (`(scope, id)`), so records that share a filename stem across scopes never collide.
- The dimension is established by the first `add` (and recovered from the table schema on reopen); a later `add`/`query` of a different dimension fails loudly.
- Similarity is **cosine** — the returned `score` is `1 − cosineDistance` (cosine similarity in `[-1, 1]`, higher = more similar), byte-for-byte the same scoring contract as the in-memory index.
- An empty vector, a dimension mismatch, or a bad table name is a `Result.fail`, never a throw.

## Persistence guarantee

Vectors written in one process are present in the next. `SqliteVecVectorIndex.create` recovers the established dimension from the existing `vec0` table, so a reopened index answers queries immediately with **no re-embedding**. That is the entire point of the package.

## Not in scope

Deliberately excluded — reach for the upstream libraries (or a different backend) directly if you need these:

- **ANN / large-N indexing.** Query is a brute-force `vec0` KNN scan — correct and durable for the same "thousands of records" regime the in-memory index targets. An approximate-nearest-neighbor structure for very large N is a different backend behind the same `IVectorIndex` seam.
- **Chunk / fragment-granular entries.** One vector per record, matching v1 `IVectorIndex`. Multiple vectors per record with in-record locators is a separate `ts-agent-memory` design (see its `N-Ask5`).
- **Connection lifecycle.** You open and close the `better-sqlite3` `Database`; this index never does. Pooling, WAL/pragma tuning, backups, and multi-process coordination are yours.
- **Embedding.** This is a vector *index*, not an embedder — the store's consumer-wired `MemoryEmbedder` produces the vectors (`@fgv/ts-extras/ai-assist` `callProviderEmbedding`, `@fgv/ts-extras-transformers`, etc.).
- **A browser sibling.** `better-sqlite3` is Node-only. A WASM-SQLite browser variant, if ever needed, is a separate package.
- **Schema migration across dimension change.** Re-embedding with a different-dimension model against an existing table fails loudly; drop the table (or use a new `tableName`) to re-index.

## Runtime requirements

- Node.js 20+ (`better-sqlite3` native binding).
- `better-sqlite3` `^12.0.0`, `sqlite-vec` `^0.1.9` (peer dependencies).

## License

MIT
