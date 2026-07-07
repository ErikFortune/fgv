# Brief — `@fgv/ts-agent-memory`: L2 agent-tool surface (`IAiClientTool` memory tools)

> **STATUS: DRAFT / SPECULATIVE — not commissioned.** Platform fast-follow, consumer-gated
> (commission when PersonAIlity wants the agent to curate its own memory via tool-use). One of
> three agent-memory fast-follow briefs. **Independent of the other two** — depends only on the
> shipped v1 L1 substrate; can slot first if the tool loop is wanted before temporal/L3.

**Surface:** `@fgv/ts-agent-memory` (new `tools/` packlet) + consumes `@fgv/ts-extras` ai-assist `IAiClientTool` and `@fgv/ts-json-base` `JsonSchema`. **Active** library.
**Ships under the enforced coverage gate** — 100% real.

## Goal

Expose memory operations as a suite of `AiAssist.IAiClientTool`s so an LLM agent can read/write/search its own memory substrate through `AiAssist.executeClientToolTurn` (and, for free, through `@fgv/ts-extras-mcp` since the same `JsonSchema.object` schemas pass `JsonSchema.fromJson`). L2 is a **consumer of L1 that must not gate it** — it adds no new envelope/store capability; the design confirmed the envelope did not have to change to support it.

## Status: not shipped; seams stable

L2 is explicitly OUT of the v1 build (`design-lock.md:16`, `README.md:33`, `brief.md:20`, `state.md:23`). Everything it sits on is shipped:

- **Store API** (`packlets/store/fileTreeMemoryStore.ts:60-92`, `IMemoryStore`): `get(kind, entityId)`, `getById(scope, MemoryId)`, `list(filter?)`, `put(record)`, `delete(kind, entityId)`. Filter `{scope?, kind?, tag?, asOf?}` (`:42-54`).
- **Retrievers:** `HybridRetriever` (`hybridRetriever.ts:97,122,141`) fans one `IMemoryQuery` across all wired retrievers + score-union — natural backing for `memory_search`. `LinkTraversalRetriever` backs `memory_context` (`linkedFrom`/`hops`). `IMemoryQuery` axes all-optional (`retriever.ts:32-63`). Loud-degrade on unwired axes (`guardRetrieverCapabilities:127`) — surface as tool failures.
- **Body registry** (`bodyConverterRegistry.ts:16-45`, `IBodyConverterRegistry`): `register/registerSchema/has/getConverter/convert`. **This is the tool write-safety gate** — the store already runs `registry.convert(kind, body)` on every `put`; `has(kind)` lets the factory whitelist toolable kinds.
- **Identity codecs** (`identityCodec.ts:33-51`): `KnowledgeIdentityCodec` (single-id stem), `LtmIdentityCodec` (conversationId), `MtmIdentityCodec` (composite `<conversationId>:<turnIndex>`). The domain `EntityId` shape is **per-kind, codec-specific**.
- **`IAiClientTool` machinery** (`@fgv/ts-extras` `ai-assist/model.ts`): `IAiClientToolConfig<TParams>` (`:264-276`, `type:'client_tool'`, `name`, `description`, `parametersSchema: JsonSchema.ISchemaValidator<TParams>`); `IAiClientTool<TParams>` (`:288-297`, `execute: (args: TParams) => Promise<Result<unknown>>` — **receives already-validated typed `TParams`**). Runner `executeClientToolTurn` (`streamingClient.ts:73`).
- **Mirror idiom** — `@fgv/ts-extras-mcp` `adapter.ts:57-67,91-101` constructs an `IAiClientTool` exactly the way each `memory_*` tool should: build `config` with a `JsonSchema.object(...)` `parametersSchema`, `execute` narrows/validates args → delegates → returns the `Result` (never swallowed).

## Design: settled vs. open

**Settled (design.md §8:659-766):**
- **Five-tool proof set** — `memory_write`→`store.put`, `memory_read`→`store.get`/`getById`, `memory_search`→`HybridRetriever.retrieve`, `memory_context`→`LinkTraversalRetriever`, `memory_delete`→`store.delete`. Full descriptors at `:679-745`.
- **Param schemas authored via `JsonSchema.object(...)`** — the schema IS the validator (`schema.validate(args)` is the round-trip verify), and `JsonSchema.Static<typeof schema>` derives `TParams`. Body passed as a **serialized string**, validated by the kind's Converter via the registry (`:686`).
- **Package location** — a `tools/` packlet inside `@fgv/ts-agent-memory` (`:919-920`): the `IAiClientTool` factory set + a tool-suite factory returning the tool array for `executeClientToolTurn`.
- **MCP dual-path** — the same schemas pass `JsonSchema.fromJson` in `adaptMcpTools` (§8.3:757-759), so one authoring serves both direct and MCP exposure.

**OPEN — this brief's decisions at commission:**
- **Tool-arg → domain-key mapping (must resolve).** The design's flat `{scope, id}` schemas don't map to the shipped signatures: `delete(kind, entityId)` needs a `kind`; `get(kind, entityId)` needs the per-kind `EntityId`, and the **MTM composite `<conversationId>:<turnIndex>`** doesn't fit a single flat `id`. Decide the tool arg shape (likely `{kind, entityId}` with per-kind entityId documented, using the codec to validate) and reconcile `memory_read`'s `getById({scope, id})` vs `get({kind, entityId})` split.
- **Tool-suite factory signature (named deliverable, unspecified).** How the consumer injects its store + retriever(s) + registry into the `tools/` factory. Recommend: `createMemoryTools({ store, retriever, registry, kinds?, readOnly? }): ReadonlyArray<IAiClientTool>` — `kinds?` whitelists toolable kinds (default = `registry.has`-backed enumeration), `readOnly?` omits `memory_write`/`memory_delete`.
- **Safety at the tool boundary (under-specified).** Validation IS settled (schema `.validate` + registry `.convert`). NOT settled: whether/how a tool surfaces `IWritePolicy.admit` rejections vs. dedup no-ops to the agent, and behavior hints (`destructiveHint`/`idempotentHint`/`readOnlyHint`/`openWorldHint` exist only as inline comments today — no typed structure). Decide: (a) map `admit` reject → tool `Result.fail` with the reason; dedup no-op → success with a "already present" note; (b) whether to ship a typed behavior-hint field now or defer.
- **Tool granularity (OQ-8).** Five is a proof set (basic-memory ships ~15). Final count "depends on personaility's agent design" — ship the five, note the extension seam.

## Scope (do)

1. New `tools/` packlet: `createMemoryTools(params)` factory (signature per the open-decision above) returning the five `IAiClientTool`s, each authored with a `JsonSchema.object(...)` `parametersSchema` and an `execute` that mirrors the ts-extras-mcp idiom (validate/narrow → delegate to store/retriever → return `Result`, never swallow).
2. Resolve the tool-arg→domain-key mapping (per-kind `entityId`; MTM composite handled by routing through the codec, not a flat `id`).
3. Wire write-safety: `memory_write` deserializes `body` string → the store's `put` runs `registry.convert`; surface `admit` rejections as tool failures; `readOnly?` gate on the mutating tools.
4. Prove the loop in a `samples/testbed` scenario (design anchor `:985-987`, exploration Scenario A `:317-356`): the five tools wired through `executeClientToolTurn`, agent curates the substrate end-to-end. (STOP-FLAG if it needs a live model call — build ready, principal runs keyed.)
5. **Do NOT** add new L1/store capability; do NOT touch temporal or ingest.

## Interdependencies

- **Independent of temporal and L3.** Depends only on shipped L1. Can be commissioned first for early consumer value (the agent-curates-memory loop is the most demoable of the three).
- Shares the substrate L3 will later write *automatically* — L2 is the *manual* writer of the same graph.

## Constraints / tests / sequence / proof

- No `any`; `Result<T>`; `JsonSchema.object` for every param schema (no hand-authored wire schema); `execute` returns `Result`, failures never swallowed; `__`-prefix unused. **100% coverage enforced.**
- **Tests:** each tool's `parametersSchema.validate` accept/reject; each `execute` happy + failure (store/retriever `Result.fail` propagates, incl. loud-degrade on an unwired retrieval axis); the arg→domain-key mapping incl. MTM composite; `readOnly` omits mutating tools; `memory_write` body-deserialize + registry-convert reject; the testbed scenario wiring (mocked). Mirror `@fgv/ts-extras-mcp` adapter tests for the tool-construction idiom.
- **Sequence:** implement → `code-reviewer` SYNCHRONOUSLY before coverage-chasing → gates @100% → `rush change --bulk --bump-type minor --target-branch origin/release` (committed) → PR onto `release`.
- **Proof:** git log; gate tails (100%); the five tool descriptors + their `JsonSchema.object` schemas; the factory signature; the testbed-scenario wiring; code-reviewer findings + dispositions; STOP-FLAG note if the scenario needs a live run.
