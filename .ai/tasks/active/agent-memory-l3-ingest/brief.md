# Brief — `@fgv/ts-agent-memory`: L3 ingest orchestrator

> **STATUS: DRAFT / SPECULATIVE — not commissioned.** Platform fast-follow, consumer-gated
> (commission when PersonAIlity is ready to wire extractors into an ingestion pipeline). One of
> three agent-memory fast-follow briefs. **Largest of the three, and dependency-blocked:** its
> `contradicts`→temporal interlock requires the `agent-memory-temporal` stream shipped first.

**Surface:** `@fgv/ts-agent-memory` (new `ingest/` packlet); reads `retrieve` + `vector`; writes via `store`. **Active** library.
**Ships under the enforced coverage gate** — 100% real.

## Goal

The fgv-side ingestion target for a consumer's own extract/relate pipeline. **The host brings classify/extract/relate judgment; fgv owns the typed validation boundary, dedup, edge/cycle safety, provenance stamping, and the `contradicts`→temporal interlock.** Cognee-ECL-shaped six-stage pipeline (design §9).

## Status: green-field packlet

**Nothing L3-shaped exists in v1** — no `ingest/` packlet, no `IMemoryIngestor`, no `IMemoryClassifier`/`IFactExtractor`/`IEntityResolver`/`IRelationExtractor`, not even a stub. `src/index.ts` re-exports exactly seven packlets (`types, converters, store, index, retrieve, observe, vector`). The only "ingest" token in shipped source is the `'host-ingest'` arm of `ProvenanceSource`. L3 **composes** existing seams and adds the orchestrator + four host interfaces.

## Shipped seams L3 composes (verified)

- **Write path** (`fileTreeMemoryStore.put`): already delivers body-validate (`registry.convert` `:486`), content-hash over `{kind,body,links}` (`_contentHash:863-865`), per-kind dedup (`dedupScope` content/entity `:535-544`), policy `admit` (`:558`), seq/created/updated/contentHash stamp (`_buildRecord:722`), persist + index-patch. **It persists whatever `provenance` it's handed but never *stamps* provenance** — that stamping is L3's job.
- **Write policy** (`IWritePolicy` `writePolicy.ts:56-103`): `admit → accept|reject|cull-oldest`, `applyUpdate` (RFC-7386 merge). L3 admits through the per-kind policy; never bypasses `admit`.
- **Provenance + edges** (`envelope.ts:23-36,45-62`): `IProvenance` structured + extensible (`source`, `by?`, `model?`, `confidence?`, `derivedFrom?`, open `[key]`); `IEdge` attributed (`type`, `provenance?`, `confidence?`, `valid_at?`, `invalid_at?`). `derivedFrom` is exactly the field L3 stage-6 stamps.
- **Backlink index** (`memoryIndex.ts:203-205`): derived, patched per put/delete, keyed by `(scope,id)`.
- **Cycle safety TODAY is read-time only** (`linkTraversalRetriever.ts:92-107`, bounded BFS + `Set<string>` visited). The design specified a **write-time** cycle key via `Crc32Normalizer`/RFC-8785 `buildCycleKey` (design.md:860-862) — that does not exist. L3 must add write-time edge validation + a write-time cycle guard.
- **Retrieve + vector** (`IMemoryRetriever`, `IVectorIndex`/`InMemoryCosineIndex`, `SemanticRetriever`): L3 stages 4-5 *read* the graph (similarity candidate-gen for dedup; neighborhood for relation context) before writing.

## Design: settled vs. open (design.md §9-§10, exploration §10)

**Settled:**
- **Responsibility split** (design §9.1:774-776): host owns classification/extraction/entity-resolution judgment; **fgv owns** typed validation boundary, content-hash dedup, edge/cycle safety, provenance stamping, `contradicts`→temporal interlock.
- **Six-stage pipeline** (design §9.2:781-873): (1) Intake — host hands `IIngestItem[]`; (2) Classify — host `IMemoryClassifier`; (3) Extract — host `IFactExtractor` → `ICandidateRecord[]`; (4) Resolve/dedup — **fgv-owned**, two-layer (exact hash + similarity), optional host `IEntityResolver`; (5) Relate — host `IRelationExtractor`, **fgv owns edge validation + write + cycle guard**; (6) Load-with-provenance — **fgv-owned** (stamp `IProvenance` + `derivedFrom`, call `put`). `ICandidateRecord.envelope` = `Omit<IMemoryEnvelope, 'id'|'contentHash'|'created'|'updated'>` (design:825) — host supplies all but the four store-stamped fields.
- **Body validation boundary**: every `ICandidateRecord.body` validated against the kind's registered Converter before the store (design:829-832).
- **Attributed edges + structured provenance (not bare strings)** — "firmest Phase-A recommendation," already shipped.

**OPEN — this brief's decisions at commission:**
- **OQ-10 — host-interface granularity (the central fork).** Staged split (`IMemoryClassifier` + `IFactExtractor` + `IEntityResolver?` + `IRelationExtractor`) — *recommended*, because fgv's stage-4-6 machinery is the value-add and a single opaque `IMemoryIngestor` pushes it back onto the host — vs. one opaque `IMemoryIngestor`. Decide at commission.
- **OQ-13 — `IEntityResolver` optional (default) vs. required.** Without it, layer-2 near-dup dedup falls back to exact-hash-only. `IEntityResolver` returns `new | duplicate-of | supersede | merge-into`. Not defined anywhere in v1.
- **Similarity-dedup layer is entirely new.** V1 has exact content-hash dedup only; the vector packlet provides cosine *search* but nothing wires similarity into the write/dedup path. L3 layer-2 = vector candidate-gen + threshold (default unspecified — decide) + optional `IEntityResolver`.
- **Hash-key discrepancy to reconcile:** store content-hash is over `{kind,body,links}` (`:864`); design stage-4 exact dedup specifies `canonicalize({kind,body})` (design:836). L3 must decide whether to reuse the store's `links`-inclusive hash or compute its own `{kind,body}` key — they differ.
- **OQ-3 — home:** in-package `ingest/` packlet (recommended default); own-package split deferred.

## Scope (do) — at commission, after OQ-10/OQ-13 decided

1. New `ingest/` packlet: the four host interfaces (per the OQ-10 decision) + `ICandidateRecord` + `IIngestItem` + the fgv-owned `IMemoryIngestOrchestrator`.
2. **Stage 4 (fgv):** exact dedup (reconcile the hash key) + layer-2 similarity candidate-gen (vector) + threshold + optional `IEntityResolver` dispatch (`new|duplicate-of|supersede|merge-into`).
3. **Stage 5 (fgv):** write-time edge validation + edge write + **write-time cycle guard** (new — the design's `buildCycleKey`, not the read-time BFS).
4. **Stage 6 (fgv):** stamp `IProvenance` (`source:'host-ingest'`, `by`/`model`/`confidence` from the host) + `derivedFrom` back-link; admit through the per-kind `IWritePolicy`; `put`.
5. **`contradicts`→temporal interlock (design §6.4):** a `contradicts` edge on a temporal kind triggers the `temporal-versioned` policy (set `invalid_at`, write new version) instead of plain upsert. **⚠ HARD-BLOCKED on `agent-memory-temporal`** — the policy it calls does not exist until temporal ships. See sequencing.
6. Prove end-to-end in `samples/testbed` (mocked host stages; STOP-FLAG if a live model is needed for a realistic extractor demo).

## Interdependencies (load-bearing)

- **L3 ↔ temporal (HARD BLOCK):** the `contradicts` interlock's invalidate-don't-delete behavior requires the `temporal-versioned` write path + versioned layout — **not in v1** (three `isVersioned` fail-stops). **Sequence temporal FIRST.** A partial L3 *could* stamp `contradicts` edges (they persist as plain `links`) that a later temporal layer consumes, but the interlock proper cannot ship before temporal. If commissioned before temporal, scope item 5 is explicitly deferred and called out.
- **L3 ↔ L2:** both consume L1 and must not gate it. L3 is the *automated* writer of the same substrate L2 curates *manually* — the `memory_write` tool and L3 stage-6 both bottom out in `store.put`.
- **L3 ↔ retrieve/vector:** stages 4-5 read the graph — "extraction quality is bounded by search quality," a reason substrate + search shipped before L3.

## Recommended sequencing across the three fast-follows

**temporal → L2 → L3** (or **L2 → temporal → L3** if the tool loop is wanted first — L2 is independent). L3 is always last: it is the largest, is hard-blocked on temporal for the interlock, and reads the vector/retrieve layers. Do not commission L3 before temporal unless deliberately shipping it interlock-deferred.

## Constraints / tests / sequence / proof

- No `any`; `Result<T>`; Converters/`JsonSchema` for the validation boundary (host bodies validated against registered converters — no unchecked host data reaches the store); attributed edges + structured provenance only. **100% coverage enforced.**
- **Tests:** each host-interface contract via a mocked host; stage-4 exact + similarity dedup (incl. the `IEntityResolver` verdicts and the fall-back-to-exact when absent); stage-5 edge validation + write-time cycle guard (reject a cycle-inducing edge); stage-6 provenance/`derivedFrom` stamping + policy admission; the `contradicts` interlock (only if temporal is present — else assert it's deferred/fails-loud); testbed end-to-end.
- **Sequence:** decide OQ-10/OQ-13 → implement → `code-reviewer` SYNCHRONOUSLY before coverage-chasing → gates @100% → `rush change --bulk --bump-type minor --target-branch origin/release` (committed) → PR onto `release`.
- **Proof:** git log; gate tails (100%); the OQ-10/OQ-13 decision note; the six-stage orchestrator + four host interfaces; dedup (both layers) + cycle-guard + provenance test output; the interlock status (delivered vs. deferred-pending-temporal); code-reviewer findings + dispositions.
