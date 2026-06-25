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

**code-reviewer:** run on the final diff — **Approved with advisory items; no P1.** Dispositions:
- **P2-2b (fixed):** `KnowledgeLwwPolicy._rebuild` flipped an originally-absent `embeddingRef` from `undefined`→`null` on any update, which would destabilize the store's content-hash. Changed the absent-in-merged case to restore `undefined` (RFC-7386 delete → absent), so an absent `embeddingRef` round-trips hash-stably; an explicit `null` is preserved only when present. Updated 3 tests (delete→absent, absent-stays-absent, explicit-null-preserved).
- **P2-2e (fixed):** added a boundary test for the 0-suffixed reserved Windows device variants (`COM0`/`LPT0`/`COM9`).
- **P2-2a (dispositioned):** per-instance `JsonEditor` pair (vs. the design-lock module singleton) is intentional — avoids shared mutable state across stores/tests; construction cost is negligible.
- **P2-2c (dispositioned):** `registerSchema` uses `schema.convert` via `Converters.generic`; `convert`/`validate` route through the same logic for schema validators. No change.
- **P2-2d (dispositioned):** `serializeMemoryFile` emits `seq`/`contentHash` into frontmatter — by design; `seq` assignment + hash recomputation are store-owned (B1), flagged for the store stream.
- **P2-2f (dispositioned):** `splitFrontmatter` trims the delimiter line before comparison (lenient `---` match) — conventional frontmatter behavior; the first `---` after the opener legitimately closes the block. No change.
- **P3 items (dispositioned):** `provenanceConverter`/`edgeConverter`/`temporalConverter` are intentionally `@public` (consumers embed provenance/edges in custom body converters); the two acknowledged casts were assessed justified (cycle constraint; structural restoration of already-validated data via the prescribed `as unknown as T` form).

Post-fix gates re-run green: `rushx build`/`lint`/`test` ✅, 100% coverage (99 tests), api-extractor report unchanged (no public-signature change).

## Phase B1 — store + index packlets ✅ (2026-06-25)

**Branch:** `claude/peaceful-archimedes-zntbbq` (harness-assigned; stem was `claude/ts-agent-memory-b1`). Off integration branch `ts-agent-memory` (contains B0). PR target = `ts-agent-memory`, NOT `release`.

**Scope shipped:** the `store` and `index` packlets — the first tier with real I/O (all through FileTree, never `fs`). No `retrieve`/`observe`/`vector` (B2); no LTM/MTM codecs or `MemoryCapCullPolicy` (Phase C); no versioned/temporal write path.

**Files shipped:**
- `src/packlets/store/fileTreeMemoryStore.ts` — `IMemoryStore` + `FileTreeMemoryStore` over `FileTree.IMutableFileTreeDirectoryItem`; `IMemoryStoreListFilter`; `IFileTreeMemoryStoreCreateParams`. `put` sequence: validate body via registry → compute `Crc32Normalizer` content hash over `{ kind, body, links }` → **scope-wide dedup BEFORE policy** → `IWritePolicy.admit` (accept/reject/cull-oldest) → `applyUpdate` on update → store-stamped `created`/`updated`/`seq` (global counter ++ inside the write-lock) → `serializeMemoryFile` → FileTree write → `index.patch('put')`. `get(kind, entityId)` routes through the kind's `IIdentityCodec`; `getById(scope, id)`, `list(filter)`, `delete(kind, entityId)`. `verifyFilenameId` (id↔filename + codec round-trip) on every load. Flat-layout only — `isVersioned: true` fails loudly. Per-instance async write-lock (`_enqueue`) serializes `put`/`delete`. Initial FileTree walk on `create()` rebuilds the index and resumes `seq` past the highest persisted value.
- `src/packlets/store/scopeEncoding.ts` — `defaultMemoryScopeEncoding`: multi-segment (`/`-separated), each component validated portable-filename-safe via B0's `assertPortableFilenameStem` (ships now so Phase-C MTM `conversations/<id>` scope is additive).
- `src/packlets/store/index.ts` — re-exports.
- `src/packlets/index/memoryIndex.ts` — `IMemoryIndex` + `MemoryIndex`; `IIndexedMemoryRecord` (scope+record); `MemoryIndexPatchOp`. Derived `byKind`/`byTag`/`byRecency`/`backlinks` maps; `rebuild(entries)` (store hands it the walk); incremental `patch(op, entry)` (removes prior associations first so a changed kind/tag/link set never strands a stale ref). Composite key `${scope}\0${id}` (NUL collision-proof across scopes).
- `src/packlets/index/index.ts` — re-exports.
- `src/index.ts` — added `export * from './packlets/store'` + `'./packlets/index'`.
- Tests: `src/test/unit/store/{fileTreeMemoryStore,scopeEncoding}.test.ts`, `src/test/unit/index/memoryIndex.test.ts` — in-memory FileTree only (`FileTree.inMemory([], { mutable: true })`), 150 total tests in the package, 100% coverage.

**store↔index acyclic wiring:** the store depends on the `index/` packlet (imports `IMemoryIndex`/`MemoryIndex`/`IIndexedMemoryRecord`); the `index/` packlet imports **only** `types/` and never the store. `rebuild()` consumes the store's read output (the store does the FileTree walk and hands the index a record list), so the index stays a pure in-memory derived view. Confirmed acyclic by the code-reviewer.

**Gates:** `rushx build` ✅, `rushx lint` ✅ (0 warnings), `rushx test` ✅ 100% coverage (stmts/branch/funcs/lines), `rushx fixlint` run pre-commit, api-extractor report regenerated + committed. No `any`; all fallible ops return `Result` (no `Result<void>`); all I/O via FileTree.

**Deviations / clarifications from design-lock (with rationale):**
1. **String-body-only write path (B1 limitation, loud).** `serializeMemoryFile` (B0) takes `body: string`, and the on-disk format is YAML frontmatter + markdown body. The store therefore requires `record.body` to be a string and fails loudly otherwise (`"only string (markdown) bodies are supported"`). Knowledge bodies are markdown strings, so this is faithful to the format; structured (typed→string) body serialization is a fast-follow when a non-string-body kind ships.
2. **Injectable `clock?: () => number` added to `IFileTreeMemoryStoreCreateParams`** (defaults `Date.now`). Not in design-lock §4.4; additive, optional, for deterministic `created`/`updated` in tests. Mirrors the repo's deterministic-test-override pattern.
3. **Update path projects the incoming record's mutable fields into a merge-patch, then runs `policy.applyUpdate`.** `put` takes a full record; on an existing-entity write the store builds the patch from the incoming record's declared `mutableFields` (record-level vocabulary `body`/`tags`/`links`/`provenance`/`embeddingRef`, each read from its canonical location) and calls `applyUpdate`. The persisted body is the incoming `body` string (LWW replaces it). Phase-C policies with body-internal mutable fields will extend the store's `_mutableFieldAccessors` map.
4. **`seq` increments only on an actual write** (first-write or update), not on a dedup no-op — a no-op performs no write and returns the existing record verbatim.
5. **`rebuild(entries)` takes the record list rather than a store-reader callback.** Design-lock §8.1 says "index.rebuild() consumes the store's read API"; the chosen shape keeps the index free of any store import (the store walks the FileTree and passes the records), which is the cleaner way to satisfy the acyclic constraint.

**Design-fidelity note for Phase C / orchestrator (faithful-but-surprising):** `contentHash` covers `{ kind, body, links }` per design-lock §2.5 (NOT `tags`/`provenance`). Combined with scope-wide dedup, two consequences follow that a consumer should know: (a) a **tags-only** re-put of an entity collapses to a dedup no-op (tags are never updated unless body or links also change); (b) **two different entities with identical `{kind, body, links}` in the same scope collapse** — the second `put` returns the first's record and the second file is never written. Both are exactly what the locked hash domain + scope-wide-dedup spec dictate (tested explicitly). Flagging in case Phase C wants the hash domain widened (would be a design-lock amendment, not a silent change).

**Additive B0 exports needed:** none. B0's public surface (`assertPortableFilenameStem`, `serializeMemoryFile`/`parseMemoryFile`, `envelopeConverter`, `KnowledgeIdentityCodec`, `KnowledgeLwwPolicy`, the `Convert` constants, the envelope/record/policy interfaces) was sufficient. No B0 file modified.

**code-reviewer:** run on the final diff — **no P1; Requires-Changes on one P2 (doc/code mismatch).** Dispositions:
- **P2-1 (fixed):** `MemoryIndex._keyOf` — the composite key separator was a raw NUL byte while the source read as a space in some tools (and a raw NUL makes the file grep as binary). Replaced with an explicit `\0` escape sequence and expanded the doc comment to justify NUL as collision-proof (excluded from both scope segments and `MemoryId` by the portable-filename contract). Behavior unchanged (already NUL); now visible/intentional in source.
- **P2-2 (fixed):** `_writeFile` returned `Result<string>` (the raw content the caller already had). Changed to `Result<true>` — honest type; callers discard it anyway.
- **P2-4 (fixed):** the dedup comment said "an identical body … is a no-op"; corrected to "identical `{ kind, body, links }` triple", with a note that tags/provenance are excluded from the hash (the tags-only-no-op consequence above).
- **P3-8 (fixed):** removed the dead `segments.length === 0` arm in `defaultMemoryScopeEncoding` (`''.split('/')` yields `['']`, never `[]`; the `some(empty)` check covers the empty-scope case). Added a clarifying comment.
- **P2-3 / P2-5 (dispositioned — deferred):** the sync `Result<T>` chaining from the `async put` is sound only because the FileTree in-memory/`FsTree` read API is synchronous today. When a genuinely-async adapter (e.g. HTTP-backed) is wired, `_readRecord`/`_writeResolved`/`_evict` move to `AsyncResult` via `thenOnSuccess`. Logged as a fast-follow; not a B1 blocker (the `IMemoryStore` public surface is already `Promise<Result<…>>`, so the migration is internal).
- **P3-6 / P3-7 / P3-10 (dispositioned):** `MemoryIndex.create()` infallible-but-`Result` — kept for family-convention consistency. `_mutableFieldAccessors` static-class-field vs module const — kept co-located with its sole consumer. Test `as string` cast on a branded `MemoryId` for output extraction — standard test carve-out.

Post-fix gates re-run green: `rushx build`/`lint`/`test` ✅, 100% coverage (150 tests), api-extractor report regenerated (new public surface: `FileTreeMemoryStore`/`IMemoryStore`/`IMemoryStoreListFilter`/`IFileTreeMemoryStoreCreateParams`/`defaultMemoryScopeEncoding`/`MemoryIndex`/`IMemoryIndex`/`IIndexedMemoryRecord`/`MemoryIndexPatchOp`).
