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

## Embedding-failure policy decision (+ rationale) — REVISED to best-effort (PR #502 CodeRabbit round)

**Initial choice (superseded):** fail the `put` loudly on an embedding/index failure.

**Final model — "best-effort derived index"** (owner decision during the PR #502 CodeRabbit loop):
the durable FileTree record store is **authoritative**; the vector index is a **derived, rebuildable**
view (`InMemoryCosineIndex.rebuild`). Therefore vector maintenance is **best-effort**:

- A failed `embed` / `add` / `remove` — whether a returned `fail` OR a thrown/rejected hook — is
  **logged at `warn`** via the injected logger and the **record operation still succeeds**. Only
  genuine record-store failures (body/codec/policy, persist, file eviction) fail a `put`; only the
  authoritative file+index delete failing fails a `delete`.
- **`put`:** embed + `add` run immediately before the single `_persist`, so the index-returned
  `embeddingRef` lands in one durable write on success (a post-persist stamp would need a second write
  whose failure path is effectively untestable). On embed/add failure the record is persisted
  **without** an embedding (`embeddingRef` undefined) and a warn is logged.
- **`delete` / cap-cull eviction:** the record file + index entry are removed first (authoritative);
  vector pruning is best-effort afterward, so a committed delete **never** returns `Failure` because a
  derived index could not be pruned (fixes the post-commit-delete edge CodeRabbit raised).
- The redundant eager `remove(oldId)` before `add` on a content change was **dropped** —
  `IVectorIndex.add` has documented replace semantics.
- Residual: a persist failure *after* a successful `add` (near-unreachable on the in-memory/git
  FileTree backends) can orphan a vector; it is dropped at hydration (SemanticRetriever skips unknown
  ids) and cleared by the next `rebuild`.

Helpers: `_tryVectorOp` (normalizes reject→`fail`, logs at warn), `_removeVectorBestEffort`,
`_removeEvictedVectors`, and the shared `_warnSwallowed` (renamed from `_warnObserverIssue`, now also
used for vector warnings).

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

Layer-1 `code-reviewer` pass on the final diff. **No P1s.** Three P2s, three P3s.

**P1 — none.** Clear of `any`, unsafe casts, `Result<void>`, cross-boundary throws, security issues.

**P2 (all resolved):**
1. *Unsafe cast `r.body as string` in the test embedder* (`embedOnWrite.test.ts`). **Fixed** —
   the `recordEmbed` test helper now validates the body via `Converters.string.convert(r.body)`
   (modelling the idiom a real `MemoryEmbedder` over `IMemoryRecord<unknown>` should use) instead of
   casting.
2. *`seeded()` and the zero-magnitude tests discarded `Result`s from `add()`* (`inMemoryCosineIndex.test.ts`).
   **Fixed** — all setup `add`/`remove` calls are now `(await …).orThrow()`.
3. *`rebuild` left the index in a partial state on failure* (`inMemoryCosineIndex.ts`). **Fixed** —
   added a `_reset()` rollback on every failure path (list/embed/add), so a failed rebuild leaves a
   clean empty index. Documented the contract in TSDoc and added two tests asserting `size === 0`
   after a mid-rebuild embed failure (seeded beforehand so the rollback is observable) and after an
   add failure.

**P3:**
1. *`query` dimension comparison reads `_dimension` (`number | undefined`) without TS narrowing.*
   **Dispositioned (kept).** The `_vectors.size === 0` guard guarantees `_dimension` is defined when
   the comparison runs (a dimension is always set on the first `add`). An explicit narrow would
   introduce an unreachable `undefined` branch requiring a `c8 ignore` directive — net negative
   against the no-unwarranted-directives discipline. The guard ordering is load-bearing and commented.
2. *`hits.length > topK ? slice : hits` micro-branch.* **Dispositioned (kept).** Intentional — avoids
   a redundant full-array copy when `hits.length <= topK`. Both arms are covered.
3. *e2e test builds a `MemoryIndex` manually.* **Resolved** — added a comment explaining the
   intentional store/retriever decoupling (the store's derived index is private; the retriever takes a
   separate `IMemoryIndex`), keyed on the shared `vectorIndex` instance.

Post-fix gates: `heft build` (+ api-extractor, no surface drift) clean; `heft lint` clean; `heft test`
**314 tests, 100% coverage**.

### CodeRabbit (PR #502) — rounds + dispositions

- **Clone vector on `add`** (Major) → fixed (`Float32Array.from`) + defensive-copy test.
- **`rebuild` reset-before-list** (Major) → fixed (`_reset()` first) + seeded rollback test.
- **Retriever normalizes rejecting backend** (Major) → fixed (`_callBackend` try/catch) + 2 rejection tests.
- **Store async-hook rejection guard** (Major) → CodeRabbit self-marked "✅ Addressed" (the put/delete
  paths were already `thenOnSuccess`-guarded); the best-effort refactor now also `try/catch`es every
  vector hook in `_tryVectorOp`.
- **Vector-before-persist (put) + committed-delete-fails-on-cleanup (delete/evict)** (Major, heavy
  lift) → resolved by the **best-effort derived-index** redesign above (owner decision).
- **Seed the list-failure test** (Minor) → done.
- **Docstring Coverage 16.67% pre-merge warning** → dispositioned: this is CodeRabbit's 80% default
  counting private helpers + test arrow-fns; the repo's gate is `rushx lint` + api-extractor (public
  TSDoc), both green. Adding docstrings to every private one-liner/test fn would be the over-commenting
  the repo's CODING_STANDARDS discourage. Not actioned.
- **ESLint / markdownlint tool-run failures** (CodeRabbit infra: "install failed", "wrapper config not
  available") → not our code; repo's own `rushx lint` passes.

Final gates after the best-effort redesign: `heft build` + api-extractor (no surface drift), `heft
lint` clean, `heft test` **317 tests, 100% coverage**.
