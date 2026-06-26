# `ts-agent-memory` — completion record

**Shipped:** `@fgv/ts-agent-memory` v1 substrate (knowledge + memory) — promoted `ts-agent-memory` → `release` 2026-06-26.
**Workflow shape:** design-triage-implement on the `ts-agent-memory` integration branch.
**Consumer:** PersonAIlity (consumer #1; knowledge-first adoption behind its `IKnowledgeSearchProvider`).

## What shipped

An app-agnostic **storage + retrieval substrate** for agent memory and knowledge: a FileTree-backed markdown + YAML-frontmatter vault with a typed identity envelope, per-kind Converter-validated bodies (knowledge + experience families), attributed cycle-safe object edges, content-hash dedup, an injectable per-kind write-policy, keyed-read + metadata-query retrieval whose interface is stable against a future semantic backend, and the optional-layer seams (vector / temporal / observe / qualifier-recall) each degrading loudly when unwired.

**Small invariant core + optional present-when-wired layers.** All `Result`/Converter/FileTree, no `any`, 100% coverage throughout.

## Arc

- **Exploration** (`exploration.md`) — design-space note; `basic-memory` lead candidate; substrate pressure-test; §9 refinement (temporal demoted to optional layer); §10 unified knowledge+experience substrate + L3 ingest contract.
- **Platform design** (`design.md`) — the moderate-detail platform spec (PR #495 discoverability draft).
- **Consumer ask** (`consumer-requirements-personaility.md` + `consumer-assessment-personaility.md`) — commissioned prioritized; PersonAIlity's stream-3 had independently converged on the same vault model.
- **Phase A design-lock** (`design-lock.md`) — pinned interface signatures; resolved OQ-11 (domain-keyed identity via `IIdentityCodec`); verified `JsonEditor` is RFC-7386 with `{ nullAsDelete: true, arrayMergeBehavior: 'replace' }` (compose, no extension); knowledge-first build plan.
- **Implementation** (tiers on the integration branch): B0 types+converters (#496) · B1 store+index (#497) · B2 retrieve+observe+vector-seam (#498) · Phase C memory slice — codecs, cap-cull, dedup-scope amendment, link-traversal (#499) · cap-cull cohort follow-up — evict observations + scoped/multi-victim tests (#500).

## Key decisions (full detail in `state.md` + `design-lock.md`)

- **OQ-11 domain-keyed identity:** `entityId` is the consumer's domain key (no minted UUIDs); per-kind `IIdentityCodec` maps it ⇄ `{ scope, idStem }`. Temporal versioning is orthogonal/opt-in.
- **Per-kind `dedupScope`** (design-lock amendment): `'content'` (knowledge, cross-id collapse) vs `'entity'` (default; same-id idempotent only — fixes the distinct-entity collapse bug for episodic kinds).
- **`IWritePolicy`** injectable per kind: admission (LWW / cap-cull-oldest over the `(scope,kind)` cohort) + `mutableFields` + JSON-Merge-Patch `applyUpdate`.
- **Cap-cull** is persist-then-evict (durability-first) inside the write-lock; evict observations fire outside the lock (race-free).
- **Retrieval no-resignature guarantee:** `IMemoryQuery` carries `semantic?`/`asOf?` present-but-optional + capability flags; semantic degrades loudly until an `IVectorIndex` is wired.

## Fast-follows (deferred — see `docs/FUTURE.md`)

Not shipped in v1; seams are present:
- In-package cosine `IVectorIndex` impl + embed-on-write (the `IVectorIndex` seam + `embeddingRef` field ship; impl pending).
- Temporal versioned write path + temporal retrievers (`temporal?` envelope block + codec `isVersioned` flag present).
- L2 agent-tool surface (`IAiClientTool`); L3 ingest orchestrator (consumer owns its pipeline; this would be the fgv-side ingestion target).

## Out of scope (consumer-owned, requirements §6)

Three-tier compression pipeline, curator framework, working-memory composition, sentiment/epistemic interpretation (stored as opaque body payload), mnemonic/recall, actor/presence scoping, prompt-library integration, measurement.
