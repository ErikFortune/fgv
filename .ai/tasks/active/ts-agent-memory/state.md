# State — `ts-agent-memory`

## Timeline
- **Exploration** → `exploration.md` (design-space note; basic-memory lead; substrate pressure-test).
- **Platform design** → `design.md` (invariant core + optional layers; L2/L3 contracts).
- **Consumer ask** (2026-06-25) → `consumer-requirements-personaility.md` + `consumer-assessment-personaility.md`. Commissioned prioritized; promoted to `docs/WORKSTREAMS.md`.
- **Phase A — design-lock** ✅ (2026-06-25) → `design-lock.md`. Implementation-ready interface signatures + knowledge-first build plan.

## Phase A outcomes (locked)
- **JsonEditor merge-patch verdict:** NOT RFC-7386 by default, but **compose with options** — `{ nullAsDelete: true, arrayMergeBehavior: 'replace' }` (verified at `libraries/ts-json/src/packlets/editor/common.ts:57-71`). No extension of the primitive needed.
- **Signature refinements vs `design.md`:** `IMemoryStore.get(kind, entityId)` routed through the codec (+ `getById(scope, id)` for direct access); `IMemoryEnvelope.seq` added (cursor paging); `MemoryScopeKey` widened to multi-segment (`/`); `IBodyConverterRegistry` gains `has`/`getConverter`; `IWritePolicy.applyUpdate(existing, patch: Record<string, unknown>)`.
- **OQ-10/OQ-13:** collapsed — both out of this build (L3); decide at L3 commission.
- **Consumer §8 coverage:** all six criteria mapped to the planned surface (design-lock §9.2).

## Micro-decisions locked by orchestrator (from design-lock §9.1)
1. **Scope encoding:** `defaultMemoryScopeEncoding` — multi-segment, each `/`-component validated portable-filename-safe. Ships in Phase B (so Phase C MTM codec is additive).
2. **Serialization:** YAML frontmatter (`---\n…\n---\n`) via `Yaml.yamlConverter` + markdown body; ~15-line frontmatter splitter, no external dep. Phase B owns `envelopeConverter.ts`.
3. **`seq`:** global per-store-instance counter, incremented atomically inside the write-lock on each successful `put`.

## Phase plan (design-lock §8)
- **Phase B — knowledge slice** (next): packlets `types → converters → store → index → retrieve`, plus `observe` (ring-backed) and `vector` (interface seam only). Ships the `IKnowledgeSearchProvider`-shaped surface; `KnowledgeIdentityCodec` + `KnowledgeLwwPolicy`; 100% tests. Build order in design-lock §8.2.
- **Phase C — memory slice:** experience kinds, attributed edges (cycle-safe), `MemoryCapCullPolicy` (cap-cull + merge-patch), `LtmIdentityCodec`/`MtmIdentityCodec`, `LinkTraversalRetriever`.
- **Fast-follows:** vector (`InMemoryCosineIndex` + `SemanticRetriever` + embed-on-write), temporal (versioned policy + temporal retrievers), observe qualifier-resolver. L2 tools + L3 ingest = separate streams.

## Open for orchestrator (next)
- Decompose Phase B by dependency tier (avoid the single-agent big-bang that drifted on ts-prompt-assist #359): likely B0 scaffold+types+converters → B1 store+index → B2 retrieve+observe+vector-seam, each reviewed before the next.
- Note for Phase B implementer: design-lock §5.3 `MemoryCapCullPolicy.applyUpdate` snippet muddles body-vs-envelope merge target — illustrative only; pin the exact merge surface (mutable **body** fields) in implementation; code-reviewer to confirm.
