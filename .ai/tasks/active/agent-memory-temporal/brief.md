# Brief — `@fgv/ts-agent-memory`: temporal versioned write path + temporal retrievers

> **STATUS: DRAFT / SPECULATIVE — not commissioned.** Platform fast-follow, consumer-gated
> (commission when PersonAIlity's episodic pipeline needs point-in-time recall). One of three
> agent-memory fast-follow briefs (see `agent-memory-l2-tools`, `agent-memory-l3-ingest`).
> **This is the keystone of the three** — L3's `contradicts`→invalidate interlock hard-depends
> on the versioned write path this stream builds.

**Surface:** `@fgv/ts-agent-memory` (**active** — new library, no external consumers; additive/breaking OK).
**Ships under the enforced coverage gate** — 100% real.

## Why this is real work, not plumbing

Every temporal seam is **already present and typed** in v1, but the enforcement is **stubbed to fail loudly**. Nothing about serialization needs to change — the converters already round-trip `temporal?`, `valid_at`, `invalid_at` (`packlets/converters/envelopeConverter.ts:74-77,84-89,109`). What's missing is the write/read *logic*:

- **Three fail-stops** in the store on a versioned codec: `fileTreeMemoryStore.ts:304-305` (`get`), `:493-494` (`put`), `:780-782` (`delete`) — all `if (addr.isVersioned) return fail('versioned/temporal layout not yet supported')`.
- **Every retriever declares `supportsTemporalQuery: false`** (`recencyRetriever`/`tag`/`structuredFilter` via `NON_SEMANTIC_CAPABILITIES` `retriever.ts:104-108`; `linkTraversalRetriever.ts:22`; `semanticRetriever.ts:81`). No retriever answers `asOf`.
- **All three shipped codecs hardcode `isVersioned: false`** (`identityCodec.ts:73,127,204`). No codec emits `true`.
- **No `temporal-versioned` `IWritePolicy` exists** (`writePolicy.ts` ships only `KnowledgeLwwPolicy` + `MemoryCapCullPolicy`).

## Shipped seams to build on (verified)

- **Envelope:** `ITemporalBlock` fully defined — `packlets/types/envelope.ts:64-75` (`valid_at?: number`, `invalid_at?: number | null` where `null` = still valid). `IMemoryEnvelope.temporal?` `:114-116`. `IEdge.valid_at?/invalid_at?` `:53-61`. `entityId` already distinguished from `id` (`:86` "Equals id for non-temporal kinds").
- **Codec:** `IIdentityCodecResult.isVersioned` `identityCodec.ts:14-25` (docstring: "versioned layout: multiple files per entity vs flat: one file per entity"). `IIdentityCodec` owns "flat-vs-versioned layout dispatch" (`:32-33`).
- **Query:** `IMemoryQuery.asOf?` `retriever.ts:53-58`. Capability `supportsTemporalQuery` `retriever.ts:16-23`. Loud-degrade centralized in `guardRetrieverCapabilities` `retriever.ts:127-143` (`asOf` + `!supportsTemporalQuery` → `fail`). `HybridRetriever` already **strips `asOf` from sub-queries for non-temporal children** (`hybridRetriever.ts:171-172`) — the exact dispatch point where a temporal child lights up the composite.
- **List filter:** `IMemoryStoreListFilter.asOf?` present but no-op (`fileTreeMemoryStore.ts:49-53`; `list` never reads it `:327-343`).
- **Write path insert point:** `_putLocked` `fileTreeMemoryStore.ts:491-504` — the `if (addr.isVersioned)` fail-stop is where the versioned branch inserts. `_buildRecord` (`:722-762`) stamps `created/updated/seq/contentHash` and passes `temporal?` through untouched via `{ ...incoming.envelope }` (`:733`); `_mutableFieldAccessors` (`:241-250`) has **no `temporal` entry** — an `invalid_at` update path extends this map.
- **Persistence layout today:** flat single-file `<scope>/<idStem>.md` (`_writeFile:978-981`, `MEMORY_FILE_EXTENSION:36`); `_readRecord`/`_verifyLoaded` (`:884,:906-911`) enforce `envelope.id === filename stem` — the `id == filename == single current value` assumption the design says temporal must break. `delete` physically removes the file (`:776`).

## Design: settled vs. open (from `.ai/tasks/completed/2026-06/ts-agent-memory/`)

**Settled (design.md §6):**
- **Bi-temporal, transaction-time free / valid-time opt-in** (exploration §9.4:634-636). `created/updated/seq` always present; only `temporal?` (world-truth valid-time) is the opt-in axis.
- **Write model = invalidate-don't-delete / versioned** (design §3.6 policy table:361): set `invalid_at` on current, write a new version; never `deleteFile`.
- **Initial retriever set** (design §6.3:583-585): `AsOfRetriever` (version valid at `asOf` ms), `CurrentValidRetriever` (`invalid_at` null/absent), `HistoryRetriever` (all versions ascending by `valid_at`). All degrade loudly for non-temporal kinds.

**OPEN — must be resolved at commission (this brief's first decisions):**
- **OQ-11 — versioned identity/layout model is NOT locked** (design §6.2:574-577, §12:1124-1136). Two candidates:
  - *Recommended default:* subtree-per-entity — `<scope>/entities/<entityId>/<entityId>-v<seq>.md`; current version = latest with `invalid_at` null/absent.
  - *Pivot:* keep flat layout + a sidecar version-index file (`<entityId>.index.json`).
  - **Non-negotiable:** do NOT bake `id == filename == single current value` as a global assumption.
  - **→ Decide this FIRST.** It drives the codec, the store read/write/delete branches, and the `_verifyLoaded` relaxation.
- **OQ-9 — temporal query depth** (design §12:1099-1107). Ship point-in-time (`asOf`) + current-valid + history. **Defer** full bi-temporal reasoning (state-transition timelines, "what did the agent believe about X between A and B", LongMemEval-class) — additive later; the capture is already in the envelope.

## Scope (do)

1. **Resolve OQ-11** (layout) — recommend subtree-per-entity unless a concrete reason favors the sidecar index; document the choice at the top of the stream's design note.
2. **Temporal `IIdentityCodec`** returning `isVersioned: true` + the chosen versioned path layout (encode/decode/verifyRoundTrip for `<entityId>-v<seq>` stems).
3. **`temporal-versioned` `IWritePolicy`** implementing invalidate-don't-delete: `admit` accepts; on a superseding write, set `invalid_at` on the current version and write the new version. Declare `mutableFields`/`dedupScope` consistent with the versioned semantics. (No existing policy to extend — this is a new sibling in `writePolicy.ts`.)
4. **Store branches** — replace the three `if (addr.isVersioned) return fail(...)` fail-stops (`:304,:493,:780`) with real versioned read (resolve current or `asOf` version), write (new version + invalidate prior), and delete (invalidate-don't-delete, or hard-delete-all-versions — decide + document). Relax the `id === stem` verify (`:911`) for versioned kinds. Wire `IMemoryStoreListFilter.asOf` (`:53`) to select the version valid at that instant. Extend `_mutableFieldAccessors` if `invalid_at` rides the update path.
5. **Retrievers** — `AsOfRetriever` / `CurrentValidRetriever` / `HistoryRetriever` declaring `supportsTemporalQuery: true`. The loud-degrade guard (`retriever.ts:134`) and Hybrid `asOf` projection (`hybridRetriever.ts:171`) already accommodate a temporal child — verify they light up the composite.
6. **Do NOT** touch the non-temporal path (Knowledge/LTM/MTM stay `isVersioned: false`, flat) beyond what the shared code requires; do NOT build the `contradicts` interlock here (that's L3 — see below).

## Interdependencies

- **L3 depends on THIS.** L3's `contradicts`→temporal-invalidate interlock (design §6.4) *calls* the `temporal-versioned` policy built in scope item 3. L3 cannot deliver that interlock until this ships. Sequence temporal **before** L3.
- **Independent of L2.** L2 (agent-tool surface) does not need temporal.

## Constraints / tests / sequence / proof

- No `any`; `Result<T>` for fallible ops; Converters/guards for validation; `__`-prefix unused params. Additive on the new library; **100% coverage enforced.**
- **Tests:** versioned codec round-trip (`<entityId>-v<seq>` ⇄ address); `temporal-versioned` policy invalidate-don't-delete (write v2 → v1 gets `invalid_at`, both persist); store versioned put/get/delete + `list({asOf})` + `get` current-vs-asOf resolution; each temporal retriever (`asOf`/current/history) incl. the loud-degrade on a non-temporal kind and the Hybrid composite lighting up; regression: all non-temporal (flat) paths unchanged.
- **Sequence:** implement → `code-reviewer` SYNCHRONOUSLY on the diff **before** coverage-chasing → `rushx fixlint`/`lint`/`build`/`test` @100% → `rush change --bulk --bump-type minor --target-branch origin/release` (committed) → PR onto `release`.
- **Proof:** git log; gate tails (100%); the layout-decision note (OQ-11); versioned round-trip + invalidate-don't-delete test output; the three retrievers passing incl. loud-degrade; confirmation flat-path regression-free; code-reviewer findings + dispositions.
