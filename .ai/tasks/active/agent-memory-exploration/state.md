# State — agent-memory-exploration

## Phase log
- [x] P0: created task dir, read brief into `brief.md`.
- [x] P1: fgv grounding read (cited in exploration §3):
  - `ts-prompt-assist` store/observe/types — structural precedent confirmed.
  - `FileTree` mutable surface confirmed (`setRawContents`, `createDirectory`).
  - `RetainingRingBuffer`, `Crc32Normalizer.computeHash`, branded-id Converters.
- [x] P2: prior-art web research (cited in exploration §2):
  - basic-memory, claude-obsidian, mem0, Zep/Graphiti, Letta/MemGPT, Cognee.
- [x] P3: breadth decision — DEEP. basic-memory is the obvious lead candidate
  (markdown+frontmatter source of truth + SQLite-derived index + observations/
  relations + 3 retrieval strategies + MCP tools w/ behavior hints). It maps 1:1
  onto fgv's FileTree + Converter + Result discipline. Prodded the graph-DB
  alternatives (Zep/Cognee) enough to confirm they are NOT the fit (heavy infra,
  LLM-extraction-coupled, opposite of "files you own").
- [x] P4: wrote `exploration.md` with all 8 sections incl. Substrate pressure-test.

## Key decisions
- L1 substrate = markdown-body + YAML-frontmatter envelope on `FileTree`;
  `links[]` in frontmatter; backlinks via a derived in-memory index (mirrors
  basic-memory's SQLite-derived index, but index is rebuildable/ephemeral).
- Retrieval behind `IMemoryRetriever`; ship recency/tag/link/structured first;
  vector recall as a flagged fast-follow once an `IVectorIndex` seam is added.
- `ts-prompt-assist` relationship: name the `FileTree typed-record store + scopes
  + qualifier select + observe` seam, do NOT pre-extract. Decide after memory's
  shape settles.
- Recommended package: `@fgv/ts-agent-memory` (floated, not decided).

## Open for orchestrator
- Vector store: build minimal in-package cosine/top-k vs. defer entirely?
- Writable-store generality: should the writable FileTree store land in
  ts-prompt-assist too (it stayed read-only at v0.1)?
- L3 ingest: own stream, own package, or never (host concern)?
