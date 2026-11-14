# Brief — `@fgv/ts-agent-memory`: L2 agent-tool surface (`IAiClientTool` memory tools)

> **STATUS: DRAFT — not commissioned, but consumer-validated.** Platform fast-follow. One of
> three agent-memory fast-follow briefs. **Independent of the other two** — depends only on the
> shipped v1 L1 substrate. **PersonAIlity's nearest-term consumer** (three `FileTreeMemoryStore`
> adoptions in; they want L2 first or in parallel with temporal, not strictly last). Consumer
> feedback (2026-07-07) is folded in below and has **locked several previously-open decisions**.

## Consumer requirements (PersonAIlity, 2026-07-07 — LOCKED)

From the nearest-term adopter (knowledge vault + durable MTM + durable LTM live, agent-facing
mnemonic-deref `recall` tool shipped). These are adoption gates, not suggestions:

1. **Scope isolation is constructor-fixed, never argument-reachable (make-or-break).** The factory
   takes a **pre-scoped store** (the actor's own memory root). **No tool argument may name or widen
   scope** — these tools face an LLM, so a steerable `scope` parameter is a cross-actor read
   primitive. This *removes* `scope` from every tool arg shape (resolves the arg→key open question
   in that direction) and makes the injected store the sole scope authority.
2. **Per-tool granularity, not just `readOnly?`.** Ship a `tools?` subset / per-tool enable set.
   PersonAIlity's v1 posture: `memory_search` + `memory_context` **on**; `memory_write` +
   `memory_delete` **off** (writes stay curation-mediated); `memory_read` likely **skipped** in
   favor of their existing mnemonic deref. A single all-or-`readOnly` flag is too coarse.
3. **Host-suppliable result handle on `memory_search` (design consideration).** Their agent-facing
   handles are **evocative mnemonic tags, not entity ids** — prompts teach agents to deref by the
   short tag shown in context. Let `memory_search` results carry a **host-suppliable handle**
   (they'd feed mnemonics) instead of / alongside raw ids, so a host's search→deref loop speaks one
   vocabulary to the agent. Design the result shape to accept a `handleFor?(record) => string`-style
   host hook rather than hard-coding raw `MemoryId` as the agent-visible key.

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

**LOCKED by consumer feedback (see Consumer requirements above):**
- **Tool-arg → domain-key mapping.** **No `scope` in any tool arg** — scope is fixed by the injected pre-scoped store (requirement 1). Tool args are `{kind, entityId}` (per-kind `EntityId`, codec-validated; the MTM composite `<conversationId>:<turnIndex>` rides `entityId`, not a flat `id`). `memory_read`/`memory_delete` therefore never take a `scope`; `memory_search`/`memory_context` never accept a scope-widening axis.
- **Factory signature.** `createMemoryTools({ store, retriever, registry, tools?, kinds? }): ReadonlyArray<IAiClientTool>` — `store` is **pre-scoped** (sole scope authority); `tools?` selects the per-tool subset (requirement 2; default = the safe read set `['memory_search','memory_context']`, NOT all five — writes opt in explicitly); `kinds?` whitelists toolable kinds (default = `registry.has`-backed enumeration). The coarse `readOnly?` flag is dropped in favor of the `tools?` subset.
- **`memory_search` result handle.** Accept a host `handleFor?(record) => string` hook; when supplied, the agent-visible key in search results is the host handle (mnemonic), not raw `MemoryId` (requirement 3).

**Tool-boundary safety — RESOLVED (via the `ai-assist-tool-annotations` precursor stream, 2026-07-07 spike):**
- **Behavior annotations ship as typed data**, not comments. `IAiClientToolConfig` gains an `annotations?: IAiToolAnnotations` field (MCP-native names: `readOnlyHint`/`destructiveHint`/`idempotentHint`/`openWorldHint`/`title`) — built in `ai-assist-tool-annotations` (commission **before** this stream). This stream populates it per tool (Component 4 below).
- **Write-outcome surfacing:** map `IWritePolicy.admit` reject → tool `Result.fail` with the reason; a dedup no-op → success with an "already present" note (discriminate `written`/`deduped`/`culled` on the success value so the agent can reason about it).
- **In-turn write gating:** `executeClientToolTurn` gains an `onBeforeToolExecute?` gate hook (also in `ai-assist-tool-annotations`), so a consumer can mediate `memory_write`/`memory_delete` (deny → synthesized denial tool-result, turn continues). This stream wires it as an example for the mutating tools.

**Still OPEN — decide at commission:**
- **Tool granularity (OQ-8).** Five is a proof set (basic-memory ships ~15). Final count depends on the consumer's agent design — ship the five, note the extension seam.

## Scope (do)

1. New `tools/` packlet: `createMemoryTools({ store, retriever, registry, tools?, kinds? })` factory (locked signature above) returning the selected `IAiClientTool`s, each authored with a `JsonSchema.object(...)` `parametersSchema` and an `execute` that mirrors the ts-extras-mcp idiom (validate/narrow → delegate to store/retriever → return `Result`, never swallow).
2. **Enforce scope isolation structurally:** the factory closes over the pre-scoped `store`; NO tool's `parametersSchema` declares a `scope` (or any scope-widening) property. Add a test that asserts no tool schema carries a scope arg — this is the adoption gate.
3. Tool-arg→domain-key mapping: `{kind, entityId}` (per-kind `EntityId`, codec-validated; MTM composite via `entityId`, never a flat `id`).
4. `memory_search` result shape accepts the host `handleFor?(record)` hook; when present the agent-visible key is the host handle (mnemonic), else raw `MemoryId`.
5. Wire write-safety: `memory_write` deserializes `body` string → the store's `put` runs `registry.convert`; surface `admit` rejections as tool `Result.fail`, dedup no-op as success-with-note. Mutating tools (`memory_write`/`memory_delete`) are **off by default** — included only when named in `tools?`.
6. **Populate behavior annotations (Component 4 — needs `ai-assist-tool-annotations` shipped).** Set `config.annotations` on each tool: `memory_search`/`memory_context`/`memory_read` → `readOnlyHint: true`; `memory_write` → `destructiveHint: false, idempotentHint: false`; `memory_delete` → `destructiveHint: true, idempotentHint: true`; `openWorldHint: false` throughout (closed store). Test the values per tool.
7. **Demonstrate the write-gate** in the testbed scenario: wire `onBeforeToolExecute` to mediate `memory_write`/`memory_delete` (e.g. deny a write pending confirmation), proving the mediated-writes path end-to-end.
8. Prove the loop in a `samples/testbed` scenario (design anchor `:985-987`, exploration Scenario A `:317-356`): the selected tools wired through `executeClientToolTurn`, agent curates the substrate end-to-end. (STOP-FLAG if it needs a live model call — build ready, principal runs keyed.)
9. **Do NOT** add new L1/store capability; do NOT touch temporal or ingest; do NOT define the annotations field or the gate hook here (they belong to `ai-assist-tool-annotations`).

## Interdependencies

- **Depends on `ai-assist-tool-annotations`** (the `IAiClientToolConfig.annotations` field + the `onBeforeToolExecute` gate hook). Commission that precursor first; scope items 6–7 consume it.
- **Independent of temporal and L3.** Otherwise depends only on shipped L1. **Recommended to commission first, or in parallel with temporal** (consumer's stated preference — L2 changes what consuming agents can *do* soonest; the agent-curates-memory loop is the most demoable of the three).
- Shares the substrate L3 will later write *automatically* — L2 is the *manual* writer of the same graph.

## Constraints / tests / sequence / proof

- No `any`; `Result<T>`; `JsonSchema.object` for every param schema (no hand-authored wire schema); `execute` returns `Result`, failures never swallowed; `__`-prefix unused. **100% coverage enforced.**
- **Tests:** **no tool schema declares a `scope` arg** (the scope-isolation adoption gate — assert structurally across the returned suite); `tools?` subset selection (default excludes `memory_write`/`memory_delete`; naming them includes them); `kinds?` whitelist; each tool's `parametersSchema.validate` accept/reject; each `execute` happy + failure (store/retriever `Result.fail` propagates, incl. loud-degrade on an unwired retrieval axis); the arg→domain-key mapping incl. MTM composite; `memory_search` `handleFor` hook (agent-visible key is the mnemonic when supplied, raw id when not); `memory_write` body-deserialize + registry-convert reject; the testbed scenario wiring (mocked). Mirror `@fgv/ts-extras-mcp` adapter tests for the tool-construction idiom.
- **Sequence:** implement → `code-reviewer` SYNCHRONOUSLY before coverage-chasing → gates @100% → `rush change --bulk --bump-type minor --target-branch origin/release` (committed) → PR onto `release`.
- **Proof:** git log; gate tails (100%); the five tool descriptors + their `JsonSchema.object` schemas; the factory signature; the testbed-scenario wiring; code-reviewer findings + dispositions; STOP-FLAG note if the scenario needs a live run.
