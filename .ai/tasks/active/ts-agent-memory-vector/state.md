# ts-agent-memory-vector — semantic-recall fast-follow

## Branch / base

- **Base branch:** `ts-agent-memory` (PR #501 promoting the v1 substrate to `release` is still
  OPEN/unmerged at stream start, so per the brief we branch off — and PR back into —
  `ts-agent-memory`, whose tip `95bc909d` already contains the full B0–C + cap-cull substrate).
- **Actual branch:** `claude/ts-agent-memory-vector-4z2z2t` (harness-suffixed stem
  `claude/ts-agent-memory-vector`).

## What shipped

Made semantic recall operational end-to-end:

1. **`vector/inMemoryCosineIndex.ts`** — `InMemoryCosineIndex` implements `IVectorIndex` as a
   brute-force in-memory cosine over `Map<MemoryId, Float32Array>`. `create()`; `add`/`remove`/`query`;
   `rebuild(source, embed)`. Single index dimension established by the first `add`; mismatched
   dimensions fail loudly; zero-magnitude vectors score `0` (never `NaN`); idempotent `remove`;
   `topK<=0` / empty-index queries short-circuit to `[]`. No external dependency.
2. **`store/fileTreeMemoryStore.ts`** — additive `vectorIndex?` + `embed?` create params; embed-on-write
   hook on `put` (embed → invalidate-stale-on-contentHash-change → add → stamp `embeddingRef` →
   persist); vector removal on `delete` and cap-cull eviction. Zero-overhead and byte-identical when
   unwired.
3. **`retrieve/semanticRetriever.ts`** — already operational via the B2 backend seam; only the
   `QueryEmbedder` boundary type changed (see deviation 1). `HybridRetriever` composes the now-real
   semantic child unchanged.
4. **Tests** — `inMemoryCosineIndex.test.ts` (cosine ordering, dimension invariant, degenerate
   vectors, rebuild + its failure modes); `store/embedOnWrite.test.ts` (embeddingRef + index entry,
   re-embed on contentHash change, dedup-no-op skips re-embed, remove on delete + cap-cull evict,
   embedding/add/remove failures fail the op loudly, unwired byte-identical, semantic recall e2e with a
   deterministic keyword-count embedder — no network). Seam tests updated to `Float32Array`.
   **314 tests, 100% coverage** (statements/branches/functions/lines).

## Embedding-failure policy decision (+ rationale)

**Fail the `put` loudly; persist nothing.** The embed step runs BEFORE the file is persisted, so an
embedding (or vector-index) failure rejects the put with no file written and no index entry — the
store never ends up with a record on disk whose vector is silently missing from the index (the
"silently corrupt the index" failure mode the brief warns against). This also orders the risk
correctly: the most-likely-to-fail operation (embed — a network call / model inference) happens
first, before any disk mutation; the least-likely (in-memory FileTree persist) happens last. The only
residual window — persist failing *after* a vector `add` — leaves a harmless stale vector entry that
is dropped at hydration time (SemanticRetriever re-resolves hits against the record index and skips
unknown ids) and cleared by the next `rebuild`. Documented inline on `_admitWrite` / `_embedOnWrite`.

## Deviations from design-lock / brief

1. **`IVectorIndex` / `QueryEmbedder` boundary: `ReadonlyArray<number>` → `Float32Array`.** The merged
   B2 seam shipped `ReadonlyArray<number>`, but design.md §5.1 specifies `Float32Array` and the
   stream's non-negotiable convention is "vectors are `Float32Array` at the index boundary (`number[]`
   only at JSON-wire edges)". Corrected the seam to `Float32Array` (justified for an unpublished,
   active-development library per ACTIVE_DEVELOPMENT — "break compatibility and fix consumers rather
   than accumulating cruft"). The two existing seam tests were updated to match.
2. **`rebuild(source, embed)` takes an `IMemoryRecordSource`, not the concrete store.** The brief
   phrases it `rebuild(store, embed)`. A direct `vector → store` import would be a packlet cycle (the
   store already imports `vector` for `IVectorIndex`). Resolved by defining a minimal
   `IMemoryRecordSource { list(): … }` in the vector packlet, which `FileTreeMemoryStore` satisfies
   structurally — so a consumer still calls `index.rebuild(store, embed)` with the store directly, no
   cycle, no extra wiring.
3. **Vector removal gated on BOTH `vectorIndex` AND `embed` being wired** (symmetric with the
   embed-on-write gate). The vector lifecycle is wholly on or wholly off, so a `remove` never fires
   for a record that could never have been embedded.

## Out of scope (unchanged from brief)

Sidecar vector persistence (noted as a future nicety in the `InMemoryCosineIndex` TSDoc); temporal
write path / retrievers; L2 tools; L3 ingest; external ANN; any `callProviderEmbedding` call from the
core (the embedder is consumer-injected — core stays embedder-agnostic, no `ai-assist` import).

## Gates

- `heft build` (incl. api-extractor) — clean; `etc/ts-agent-memory.api.md` regenerated + committed.
- `heft lint` — clean (0 errors, 0 warnings) after `fixlint`.
- `heft test` — 314 tests, 100% coverage.

## code-reviewer findings + dispositions

_(filled in below after the layer-1 pass)_
