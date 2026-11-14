# Stream brief — `ts-agent-memory`

**Status:** commissioned 2026-06-25 (prioritized). Phase A (design-lock) in flight.
**Workflow:** design-triage-implement on integration branch `ts-agent-memory` (off `release`).
**Consumer:** PersonAIlity (consumer #1) — `consumer-requirements-personaility.md` + `consumer-assessment-personaility.md` are the grounding contract.
**Substrate (this dir):** `brief.md` (this), `exploration.md`, `design.md`, `design-lock.md` (Phase-A output), `consumer-*.md`, `state.md`.

## Mission

Ship `@fgv/ts-agent-memory` — the app-agnostic **storage + retrieval substrate** for agent memory and knowledge that PersonAIlity commissioned: a FileTree-backed markdown+frontmatter vault with a typed identity envelope, per-kind Converter-validated bodies (knowledge + experience families), attributed object edges (confidence / provenance / opt-in validity, cycle-safe), content-hash dedup, an injectable per-kind write-policy, keyed-read + metadata-query retrieval whose interface is stable against a future semantic backend, and the optional-layer seams (vector / temporal / observe / qualifier-recall) each degrading loudly when unwired. **Full substrate commissioned; adoption is knowledge-first.**

## Locked decisions (orchestrator + principal, 2026-06-25)

- **OQ-11 — domain-keyed identity (LOCKED).** `entityId` is consumer-supplied and **is** the domain key; the package never mints identity. A per-kind injectable **`IIdentityCodec`** maps domain key ⇄ `{ scope, idStem }` — deterministic, reversible, owns filename-safe escaping. Non-temporal kinds: `id === idStem`, one file per entity (`verifyFilenameId` checks round-trip). Temporal is **orthogonal / opt-in** — adds a version axis under the same `entityId`, never changes it. The codec also **localizes the flat-vs-versioned layout dispatch** (containing the mixed-layout cost in one place). Mappings:
  - Knowledge → scope `knowledge`, idStem `<docId>`.
  - LTM → scope `conversations`, idStem `<conversationId>`.
  - MTM → scope `conversations/<conversationId>`, idStem `turn-<turnIndex>`, entityId `<conversationId>:<turnIndex>`.
- **Write policy = injectable `IWritePolicy` per kind:** admission (`cap-cull-oldest` for memory, `last-write-wins` for knowledge) + `mutableFields` declaration + `applyUpdate` via **JSON Merge Patch** over the mutable fields. Content-hash dedup runs **before** policy.
- **Merge-patch composes `@fgv/ts-json` `JsonEditor`** (RFC-7386). Phase A **must verify** JsonEditor's semantics against source (esp. `null` = delete); if it diverges, **extend the primitive — do not hand-roll**.
- **Scope:** the L2 agent-tool surface and the L3 ingest orchestrator (both in `design.md`) are **OUT of this build** — the consumer owns those layers (requirements §6).

## Package surface (new)

`libraries/ts-agent-memory` (`@fgv/ts-agent-memory`). Composes:
- `@fgv/ts-json-base` — `FileTree` (storage).
- `@fgv/ts-utils` — `Crc32Normalizer` (content hash), `RetainingRingBuffer` (bounded/cap-cull), conversion/validation, `Brand` (ids).
- `@fgv/ts-json` — `JsonEditor` (merge-patch).
- `@fgv/ts-extras` — `callProviderEmbedding` (vector fast-follow ONLY).
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — add the capability entry.

## Out-of-scope

- **Consumer-owned (requirements §6):** three-tier compression pipeline, curator framework, working-memory composition, sentiment/epistemic *interpretation* (stored as opaque body payload), mnemonic/recall, actor/presence scoping, prompt-library integration, measurement.
- **This build:** L2 agent-tool surface, L3 ingest orchestrator, external ANN vector index.

## Phases

- **Phase A — design-lock (now, no code).** Produce `design-lock.md`: finalize `IIdentityCodec` / `IWritePolicy` / `IMemoryStore` / `IMemoryRetriever` / envelope+edge interface signatures against the consumer requirements; record the JsonEditor merge-patch verification result + compose-or-extend decision; collapse OQ-10/OQ-13; lay out the **knowledge-first implementation plan** (packlet build order; what's in the knowledge slice vs. memory slice vs. fast-follows).
- **Phase B — knowledge-first slice (implement).** Package scaffold + `types` / `converters` / `store` (FileTree, write + content-hash dedup) / `index` / non-vector retrievers + `IWritePolicy` (LWW) + `IIdentityCodec` (knowledge), 100% tests. This is the `IKnowledgeSearchProvider`-shaped surface the consumer adopts first.
- **Phase C — memory slice (implement).** Experience kind families, attributed edges (cycle-safe), cap-cull + merge-patch write policies, MTM/LTM identity codecs.
- **Fast-follows (post-v1):** vector (`IVectorIndex` + in-package cosine + embed-on-write), temporal (envelope extension + versioned policy + temporal retrievers), observe packlet.

## Acceptance criteria (consumer §8 + repo gates)

- Both kind families registerable from one FileTree vault; bodies Converter-validated; **no `any`**.
- Keyed read + metadata query (`Result`-returning); **retrieval interface stable against a future semantic backend (no resignature)**.
- Attributed-edge write (cycle-safe) + content-hash dedup on write.
- Pluggable per-kind write policy accepting admission + mutable-field + merge-patch.
- All public surface returns `Result`, validates via Converters, does I/O through `FileTree`.
- OQ-11 resolved with a **documented domain-keyed-identity mapping**.
- `rushx build` + `rushx lint` + `rushx test` (100% coverage) green; `rushx fixlint` pre-commit; `code-reviewer` pass; api-extractor report generated.

## Conventions (fgv cold-start preload)

`Result<T>` everywhere (no `Result<void>`); no `any`; Converters/Validators (no manual `typeof`/`in`/cast); `FileTree` (no `fs`); branded ids; factory `create()` for fallible construction; **extend-don't-work-around**; no sibling re-exports; `mapResults` for arrays; `.thenOnSuccess`/`.thenOnFailure` for async chains; `JsonSchema`-derives-T where a schema + validator are both needed.

## Resume protocol

Read `brief.md` + `state.md` + `design.md` + `design-lock.md` + `consumer-requirements-personaility.md`.
