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

## Phase B0 — scaffold + types + converters ✅ (2026-06-25)

**Branch:** `claude/ts-agent-memory-b0` (off integration branch `ts-agent-memory`); PR target = `ts-agent-memory`.

**Scope shipped:** Rush project scaffold for `libraries/ts-agent-memory` (`@fgv/ts-agent-memory`) + the `types` and `converters` packlets. No store/index/retrieve/observe/vector (later tiers). No file I/O.

**Files shipped:**
- Scaffold: `rush.json` entry; `package.json` (deps `@fgv/ts-utils`, `@fgv/ts-json-base`, `@fgv/ts-json`, `@fgv/ts-extras` via `rush add`; `sideEffects: false`); `tsconfig.json`, `config/{api-extractor,jest.config,rig}.json`, `eslint.config.js`, `LICENSE`, `README.md` (all mirrored from ts-prompt-assist); `etc/ts-agent-memory.api.md` (api-extractor report, committed).
- `src/packlets/types/`: `ids.ts` (branded `MemoryId`/`EntityId`/`Kind`/`Tag`/`MemoryScopeKey`/`LinkType` + `Convert` constants), `envelope.ts` (`IMemoryEnvelope` incl. `seq`/`temporal?`/`embeddingRef?`, `IEdge`, `ITemporalBlock`, `IProvenance`, `IMemoryRecord<TBody>`), `identityCodec.ts` (`IIdentityCodec` + `IIdentityCodecResult` + `KnowledgeIdentityCodec` + exported `assertPortableFilenameStem`), `writePolicy.ts` (`IWritePolicy`, `AdmissionDecision`, `KnowledgeLwwPolicy`), `index.ts`.
- `src/packlets/converters/`: `bodyConverterRegistry.ts` (`IBodyConverterRegistry` + `BodyConverterRegistry`), `envelopeConverter.ts` (provenance/edge/temporal/envelope converters + `splitFrontmatter`/`joinFrontmatter`/`parseMemoryFile`/`serializeMemoryFile`), `index.ts`.
- `src/index.ts`; tests under `src/test/unit/{types,converters}/` (97 tests).

**Gates:** `rushx build` ✅, `rushx lint` ✅ (0 warnings), `rushx test` ✅ 100% coverage (stmts/branch/funcs/lines), `rushx fixlint` run pre-commit, api-extractor report generated + committed (0 unresolved-link warnings). No `any`; all fallible ops return `Result`; all `unknown`→typed via Converters.

**Deviations / clarifications from design-lock (with rationale):**
1. **`KnowledgeLwwPolicy.applyUpdate` merge surface pinned (resolves the orchestrator's body-vs-envelope flag).** The design-lock §5.3 snippet read mutable fields off the record root (`existing['tags']` etc.) while those fields live on `existing.envelope`. Pinned decision: project each declared mutable field from its **canonical location** (`body` from the body; `tags`/`links`/`provenance`/`embeddingRef` from the envelope) into one record-level JSON view, run the RFC-7386 merge over that view, then rebuild. `body`/`tags`/`links`/`provenance` are required (a patch may not delete them → loud fail); `embeddingRef` is optional (a `null` patch clears it). The orchestrator's note said "mutable **body** fields" referring to the Phase-C `MemoryCapCullPolicy` (whose `mutableMemoryFields` are body-internal); knowledge LWW's design-locked field list is genuinely mixed record-level, so the projection handles both axes.
2. **Two `JsonEditor` instances** in `KnowledgeLwwPolicy` (one default-options clone editor, one merge-patch editor) so the persisted record is never mutated in place and a `null` `embeddingRef` survives the clone step before the patch applies. Merge options per design-lock §5.1: `{ nullAsDelete: true, arrayMergeBehavior: 'replace' }`, rules `[]`.
3. **`applyUpdate` does NOT stamp `updated`/`seq`.** Design-lock §5.3 snippet set `updated: Date.now()` in the policy; pinned decision leaves transaction-time metadata (`updated`/`seq`) store-owned (per §2.5 + §9.1.3) so the policy stays deterministic/pure. The store (B1) stamps them on write.
4. **`assertPortableFilenameStem` exported** from the types packlet (mirrors `ts-prompt-assist/scopeEncoding`'s POSIX-portable + reserved-Windows-device contract) so the Phase-C LTM/MTM codecs reuse the exact escaping contract.
5. **`IIdentityCodec.verifyRoundTrip` idStem-mismatch branch is `c8 ignore`d** in `KnowledgeIdentityCodec` — for an identity codec `encode(decode(stem)).idStem` always equals `stem` when both succeed, so the guard is unreachable here; it exists for the non-identity Phase-C codecs. Justified inline.
6. **`IBodyConverterRegistry.getConverter` added** (design-lock §2.6 prose mentioned it but omitted it from the code block; task scope listed it). Returns `Result<Converter<unknown>>`.
7. **`register`/`registerSchema` return `void`** (per design-lock §2.6 signature) — non-fallible mutators (Map.set semantics), not a `Result<void>` anti-pattern.

**code-reviewer:** run on the final staged diff; findings + dispositions recorded in the PR description.
