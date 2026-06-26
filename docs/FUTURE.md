# Future — fgv

Parking-lot ideas that aren't current work, aren't non-goals, but
need concrete demand or design before they can be scheduled. Items
here get promoted to `docs/WORKSTREAMS.md` when a real use case
surfaces.

---

## Entry format

```markdown
## Idea title

Description with the user's framing expanded with the design space.

**Why deferred**: why this isn't current work.

**Dependencies**: what would unblock it.

**Reference**: session / observation context.
```

---

## Horizontal composition B+1 — dependency-ordered render-merge-reinject (topo-sort)

`@fgv/ts-prompt-assist`'s `HorizontalComposer` (shipped Phase B) uses **render-then-merge**: each contributor resolves+renders independently, then the composer merges the rendered per-slot values. This loses **cross-slot placeholders** — a contributor slot value that references another logical slot (`{{otherSlot}}`) is inserted literally, not resolved.

B+1 preserves them via **topological-sort rendering**: extract each slot value's `{{…}}` references → build a slot-dependency DAG → render+merge in topo order, so each merged logical slot is available to downstream slots' renders ("render A, merge A, re-inject merged A into B"). It is the **horizontal analogue of the vertical recursive resource binding that already ships** — so the existing RFC-8785 cycle-detection machinery (`buildCycleKey` in `resolve/resourceBindingResolver.ts`, a standalone exported fn that works on slot names unmodified; the stack-frame + 3-line cycle-check templates) is **directly reusable** for the acyclicity check.

**Why deferred**: the requesting consumer (PersonAIlity) authors **no** cross-slot `{{…}}` references today (OQ-5). Phase A/B kept the forward-compat guards (declared `logicalSlots` order is a tiebreaker, NOT semantic processing order; `IResolvedPromptSlot.value` stays named `value`), so B+1 is a non-breaking additive replacement of "declared order" with "topo order" — the public `IComposedPrompt` API is unchanged.

**Dependencies**: the trigger is the **first cross-slot `{{…}}` reference the consumer authors** — they'll flag it. Size L (its own stream).

**Reference**: `.ai/tasks/completed/2026-06/prompt-assist-horizontal-composition/` (design.md §"Phase B+1", + the §"phase-1 must not preclude" guards); 2026-06 horizontal-composition design discussion.

## Generic editor UX for `@fgv/ts-prompt-assist`

The `ts-prompt-assist` library is shape-agnostic about the consumer's domain (open `surface`, `slot.kind`, `slot.source`; consumer-supplied scope hierarchy encoded into opaque `ScopeKey` strings). Editor UX for authoring prompt descriptors and scope-level binding records is **complex** — qualifier-conditioned candidate editing, slot-binding override visualization, resource-binding navigation, the `IPromptResolveTrace` "where did this value come from" view, validation against registered Converters / serializers / output validators.

The question: can the editor UX be made **generic** (shipped as `@fgv/ts-prompt-assist-ui` or similar, parameterized on consumer registries)? Or is the consumer's domain shape — closed surface enum, closed slot kinds, scope hierarchy — too inextricably tied to the UX for a generic version to be useful in practice?

Arguments for genericizing: complex UX; multiple consumers would benefit; the registries already abstract the closed-vocabulary parts.

Arguments against: every consumer's scope hierarchy is bespoke; editor screens that show "actor: user-42 → role:editor → tenant:acme → global" need consumer-specific labels and navigation; per-surface preview ("this is what the chat assistant will say") is surface-specific by definition.

**Why deferred**: only one consumer (`personaility`) so far; v0.1 hasn't shipped; the editor UX shape isn't designed yet on the consumer side either. Decide when the consumer ships its in-app editor and we can compare what's truly consumer-specific vs library-genericizable.

**Dependencies**: `ts-prompt-assist` v0.1 ships and stabilizes; consumer's in-app editor lands; second consumer surfaces (or doesn't). If a second consumer wants the same editor shape, that's strong evidence for genericizing.

**Reference**: `.ai/tasks/active/ts-prompt-assist/brief.md` (stream commission discussion).

---

## Samples app for `@fgv/ts-prompt-assist`

**Status: superseded by `samples/testbed` (2026-05-22).** Absorbed into the general-purpose `samples/testbed` sample-browser being built under the `local-ai-exploration` cluster. The testbed will demonstrate `@fgv/ts-prompt-assist` scenarios alongside scenarios for other fgv capabilities (ai-assist, ts-res, bcp-47, crypto, etc.) — one general showcase that grows scenarios over time beats two parallel demo apps. See `.ai/tasks/active/local-ai-exploration/brief.md`.

---

## `integrations/` top-level directory for Result-integration boundary packages

The `crypto-batch-2-webauthn` stream shipped two packages (`@fgv/ts-extras-webauthn`, `@fgv/ts-web-extras-webauthn`) whose entire mission is to wrap a well-maintained upstream library (`@simplewebauthn/*`) and adapt its throw-based API into the fgv `Result<T>` model. The package boundary is the whole product; no fgv-specific abstraction sits on top. This is structurally distinct from the libraries under `libraries/` that publish original utility primitives.

The question: does the pattern deserve its own top-level directory (e.g. `integrations/`), or is `libraries/` plus the naming convention `ts-extras-X` / `ts-web-extras-X` sufficient signal? Today the packages live in `libraries/` for consistency, but as the pattern recurs (likely candidates: future LLM provider wrappers, future credential-protocol wrappers) the structural distinction may earn its own home.

**Why deferred**: only one batch of packages so far (`-webauthn`); not enough recurrence to justify a directory rename. Decide when the second or third such package lands and the pattern is clearly distinct from "library that publishes original utilities."

**Dependencies**: at least one more Result-integration-boundary package landing; or a concrete consumer-side ergonomics complaint about discoverability of these packages.

**Reference**: `.ai/tasks/completed/2026-05/crypto-batch-2-webauthn/` (OQ-1 + followups section); cluster-close PR.

---

## Client-defined tools for `@fgv/ts-extras/ai-assist` (function calling + MCP)

**Status: partially shipped 2026-06-04 via PR #447 (Phase C / layer 1 — harness-supplied tools).**

Layer 1 (harness-supplied tools) shipped: `IAiClientTool`, `executeClientToolTurn`, per-provider streaming adapters (Anthropic, OpenAI Responses, Gemini), `client-tool-call-start` / `client-tool-call-done` / `client-tool-result` stream events, multi-turn `continuation.messages` round-trip. Verified live against Anthropic API on 2026-06-04.

**Remaining future work:**

**MCP tools (layer 2).** **Slice 1 shipped 2026-06-06 via the `ts-extras-mcp` stream** — the new `@fgv/ts-extras-mcp` (Node) package wraps `@modelcontextprotocol/sdk`, discovers a server's tools, and adapts each into an `AiAssist.IAiClientTool` (`adaptMcpTools`) that drops directly into `executeClientToolTurn`. Graceful degradation: tools whose `inputSchema` is outside the `JsonSchema.fromJson` subset are excluded, surfaced on `skipped`, and NOISY-warned with the raw schema. Compatibility probe: the `samples/testbed` `mcp-probe` scenario. See `.ai/tasks/active/ts-extras-mcp/`.

**Dependencies**: ai-assist-client-tools cluster closed to release (done 2026-06-04).

**Reference**: 2026-05-30 conversation (Erik watching personaility's roadmap); `.ai/tasks/active/ai-assist-client-tools/`; PR #447; `.ai/tasks/active/ts-extras-mcp/`.

---

## `@fgv/ts-extras-mcp` slice-2 follow-ups

Deferred from the `ts-extras-mcp` slice-1 stream (2026-06-06). Each is additive on the new package's surface.

- **Browser sibling `@fgv/ts-web-extras-mcp`.** Slice 1 is Node-only (stdio transport spawns a subprocess; HTTP transport is fine in-browser modulo CORS). A browser package would expose `createHttpTransport` + the session/adapter surface backed by the SDK's browser-compatible transports.
- **MCP resources / prompts / sampling.** Slice 1 covers tool discovery + invocation only. MCP servers also expose resources, prompt templates, and sampling callbacks.
- **OAuth / managed auth.** Slice 1 supports static headers only (`createHttpTransport({ headers })`). The SDK has an auth provider abstraction for OAuth flows.
- **Multimodal tool-result passthrough.** `callMcpTool` projects non-text content blocks to a `[<type> block]` summary; image/audio/resource passthrough into the ai-assist round-trip is out of scope.
- **Cross-server tool-name namespacing.** Connecting multiple servers can collide tool names; duplicates already fail loudly in `executeClientToolTurn`, but a namespacing/prefixing scheme would let multiple servers coexist.
- **Transport-injection testability seam.** The package exposes only the `createStdioTransport` / `createHttpTransport` factories, so an external consumer cannot inject an in-memory transport to drive the session/adapter in-process against a fake MCP server in their own tests (they'd stand up a real stdio/http server). The package's own e2e test reaches the internal `McpTransport` directly; a public seam (e.g. an exported `createTransportFromSdk` or accepting a pre-built SDK transport) would let consumers do the same. Surfaced by the #471 verification; not a production defect.

**Headline follow-on lever — additively widen `JsonSchema.fromJson`'s supported subset** (in `@fgv/ts-json-base`). The single biggest real-world risk is schema-subset mismatch: real MCP servers advertise `$ref`/`$defs`, `oneOf`, `pattern`, union `type` arrays, etc. that `fromJson` rejects, so those tools land in `adaptMcpTools`' `skipped` set. `$ref`/`$defs` resolution and `pattern` passthrough are the highest-value additions. This is a separate small `ts-json-base` stream, commissioned based on what the `mcp-probe` scenario surfaces against real servers — NOT done in the `ts-extras-mcp` stream.

**Reference**: `.ai/tasks/active/ts-extras-mcp/brief.md` + `design.md`.


---

## Live-wire-shape verification testbed scenarios per provider

**Status: shipped 2026-06-05 via the `per-provider-testbed-scenarios` cluster** (parent PR #453 + sub-stream PRs #454, #457, #458). Three new scenarios (`openaiClientTools`, `geminiClientTools`, `xaiClientTools`) in `samples/testbed/` parallel the existing `anthropicClientTools` scenario; all four PASS on live API as of cluster close. Empirical loop ran four times during the cluster; each round surfaced a real wire-shape bug that 100%-coverage unit tests missed and that the live runs caught. See `.ai/tasks/completed/2026-06/per-provider-testbed-scenarios/README.md` for the full arc.

**Remaining future scope (carried forward):**

### Generic-version-alias library surface (companion concern)

`<provider>:<family>-<major>-<minor>`-style canonical aliases resolving to the current dated snapshot via a registry-maintained mapping. The exact alias syntax should match the underlying SDK / API conventions per provider (e.g. Anthropic accepts `'claude-sonnet-4-6'` directly per the latest SDK; OpenAI / Gemini / xAI use different conventions). Provider-specific subaliases stay. The registry's `defaultModel` per provider currently pins a specific dated snapshot that goes stale (e.g. `gpt-4o` is not reasoning-capable but is the OpenAI default, so the new OpenAI testbed scenario had to explicitly pin `gpt-5.1`). Roughly 1-2 days of implementation work.

**Dependencies:** per-provider SDK convention research.

**Reference:** `.ai/tasks/completed/2026-06/per-provider-testbed-scenarios/` (scenario model pins are the proximate use case).

### Gemini-side drift instrumentation

The closeout sub-stream (PR #458) shipped warn-on-unrecognized-event drift instrumentation on the Anthropic and OpenAI Responses adapters but **deferred Gemini** because Gemini's `generateContent` streaming response is JSON-chunk-shaped, not named SSE events — the allowlist-by-event-name concept doesn't translate. The structural alternative is to dispatch on chunk sub-structure (`candidates[i].content.parts[j]` shape; top-level chunk keys; `finishReason` enum values) and warn on unknown sub-shapes. More nuanced than the allowlist; needs design before commissioning.

**Why deferred:** Gemini's wire is richer in structure; naive "warn on every unhandled JSON key" would be noisy. The four-round empirical loop never surfaced a Gemini drift-class bug, so the urgency is lower. Commission proactively if symmetric self-diagnosing posture is wanted across all three adapters, OR reactively when a Gemini API evolution surfaces a real gap.

**Reference:** `.ai/tasks/completed/2026-06/ai-assist-responses-reasoning-events/findings/inbox/2026-06-05-gemini-drift-instrument-deferred.md`.

### Library default `max_output_tokens` for reasoning models

OpenAI Responses + reasoning models can silently truncate when the consumer doesn't set `max_output_tokens` and the model's reasoning + tool-use steps consume the default output budget before emitting visible text. The cluster's empirical loop surfaced this as the leading hypothesis on round 3 (ruled out via `incompleteReason` capture in round 4). Real root cause was the `item_id ↔ call_id` adapter bug, not budget exhaustion, but the usability gap is real: naive consumers calling with `reasoning.effort: 'low'` on a simple question can still hit budget exhaustion under realistic prompts.

**Proposed fix:** the OpenAI Responses adapter applies a sane default `max_output_tokens` for reasoning models when the consumer doesn't supply one. Consumer can override via the existing `otherParams` mechanism.

**Why deferred:** usability call, not a bug. The current behavior (consumer must supply `max_output_tokens` for reasoning workloads OR set `incompleteReason: 'max_output_tokens'` is the diagnostic) is correct but easy to miss.

### Provider-side request validation (fail-fast on impossible combinations)

Gemini's API forbids combining built-in grounding (`web_search`) with function calling in the same request — surfaces as HTTP 400 with `INVALID_ARGUMENT`. The cluster's per-provider-testbed-scenarios round 2 hit this; the resolution was a scenario-side fix (drop `web_search` from the Gemini scenario), but a library-side improvement could fail-fast at request-build time with a clearer error pointing to the mutual-exclusion constraint.

Could generalize to a per-provider "incompatible request shapes" registry that callers benefit from without provider-API-spec familiarity.

**Why deferred:** the current behavior (provider HTTP-400s with its own message) isn't silent corruption; the quality-of-life improvement is real but bounded.

### Caller-visible thinking-content stream events (`ai-assist-thinking-events`)

Current ai-assist adapters discard thinking / reasoning content by design — only the final answer + tool-call events surface to the consumer. The provider-drift instrumentation in PR #458 explicitly classifies reasoning events as "intentionally silent" rather than "unrecognized." Surfacing them is a separate scope decision (consumer-facing API change; raises questions about per-provider differences in reasoning event shape).

**Dependencies:** Phase A-style design on the caller-facing event API; agreement on which providers' reasoning content should surface.

**Reference:** 2026-06-04 conversation; PR #447 P1-1 + PR #449 thinking-wire-shape + PR #448 browser-export demonstrate the failure mode; L37 codification (PR #445) is the principle; `samples/testbed/src/scenarios/anthropicClientTools/` is the shape template.

---

## Prompt observability for `@fgv/ts-prompt-assist`

**Status: shipped 2026-06-05 via the `ts-prompt-assist-observability` cluster** (Phase A #455 + Phase B triage commit + Phase C #456). Two new pieces of surface:

- **`@fgv/ts-utils` (collections):** `RetainingRingBuffer<T>` — a generic bounded most-recent-N ring with monotonic-`seq` cursor paging, predicate filtering, and `lastSeq` stable across `clear()`. A *pure* substrate (caller mints `seq`/`timestamp`).
- **`@fgv/ts-prompt-assist`:** new `observe` packlet — `IPromptObserver` (async `observe` + `fireAndForget?`), `IPromptObservationRecord` (`phase`-discriminated union: resolve vs output, cross-linked via `linkedResolveSeq`), `IPromptObservationQuery`, `PromptObservationStore` (implements the observer, composes the ring, schema-aware `query`). `PromptLibrary` gains additive `IPromptLibraryCreateParams.observers?` and fans out at the three public boundaries (`resolve` / `resolveJsonOutput` / `resolveFreeTextOutput`).

See `.ai/tasks/completed/2026-06/ts-prompt-assist-observability/README.md` for the full arc.

**Remaining future scope (carried forward):**

### `MultiPromptObserver` standalone class

Phase B OQ-7 deferred to v0.2: the library itself is the fan-out point today (it holds the `observers` array and runs `_observe`). Add a standalone `MultiPromptObserver` only if a consumer surfaces a need to compose observers *outside* the library (e.g., a tenant-aware fan-out that wraps multiple sub-observers before injection). File the use case as a finding when it appears.

### Partial-trace threading on failure resolve records

Phase B OQ-4 deferred: `IPromptResolveTrace` is constructed only on the success path inside `_renderResolved`. A failed `resolve()` returns a `Result.fail` with just a message. So `IPromptResolveObservation` on `outcome: 'failure'` carries `error` only — no partial trace. Surfacing partial trace would require `PromptLibrary` internals work (threading partial-trace state out of every early-return in `_resolveOnce`). Defer until consumer demand actually surfaces.

### ts-res-driven qualifier matching for `PromptObservationStore.query`

**Status: injection point landed 2026-06-05 via PR #460; default-implementation swap deferred (priority uncertain).**

PR #460 factored qualifier-match into an injectable `IQualifierResolver` dependency on `PromptObservationStore`. The default `defaultStringEqualityQualifierResolver` does naive string equality on supplied (defined) axes — narrower semantics than `PromptLibrary.resolve` itself, which goes through ts-res's full qualifier-type matching (BCP47 language-tag similarity, priority ordering, custom type rules). A record produced under `lang=fr-CA` will NOT be returned by a query asking for `lang=fr` against the default resolver, even though ts-res would have considered them a match.

Erik's framing (2026-06-05): "consider using ts-res instead of hardcoding custom (and incompatible) qualifier match logic." Verified: `PromptLibrary._resolveCandidates` does use ts-res fully (via `Runtime.ValidatingSimpleContextQualifierProvider` + `Runtime.ResourceResolver.resolveDecision`), so the store's narrow default IS a real divergence from how matches were produced.

**Future work:** implement a `TsResQualifierResolver` (or similar) that wraps ts-res's match path — probably via `ValidatingSimpleContextQualifierProvider` + the relevant matching primitives — so consumers can inject it for similarity-aware queries. Since the injection point is already in place, this is a pure implementation-of-interface change with no API surface churn on the store.

**Why deferred:** priority uncertain. The default's narrow semantics are documented (`IPromptObservationQuery.qualifiers` TSDoc explicitly cites the divergence and the injection point). Commission when a consumer surfaces a real need for similarity-aware observability queries, OR proactively if the broader posture warrants it.

**Reference:** PR #460 review thread on `promptObservationStore.ts:195`; the `_resolveCandidates` path in `promptLibrary.ts` is the reference for what a ts-res-equivalent resolver needs to do.

---

## Browser-bundle canary for tree-shaking / node-barrel correctness

**Status: parking lot — priority uncertain. Added 2026-06-06 alongside the removal of `apps/ts-utils-browser-test`.**

`apps/ts-utils-browser-test` was a Vite app that imported `@fgv/ts-utils` in a browser-bundle context — a lightweight smoke test that the library contained no accidental `node:`-only barrel deps (`node:crypto`, `node:fs`). It was removed (on `main` via PR #464, and on `release` via the same surgical deletion) because its test half never ran in CI, it pointed at a pure-computation library with no node-only barrel leaks of its own, and it generated recurring Vite Dependabot noise disproportionate to its coverage value.

**What was lost:** a CI browser-bundle (Vite) smoke test of `@fgv/ts-utils` — the narrowest possible target, since `ts-utils` has no `node:*` imports.

**Recommendation if revived — target `@fgv/ts-extras` and `@fgv/ts-web-extras` instead.** That is where a browser-bundle canary earns its keep:

- `@fgv/ts-extras` contains `NodeCryptoProvider` (`node:crypto`), filesystem helpers (`node:fs`), and other Node-only code; a misplaced barrel export would explode a browser bundle at runtime.
- `@fgv/ts-web-extras` is the browser complement, and its correctness depends on `ts-extras` not bleeding Node-only code into the shared surface.

A future canary should build a minimal Vite/webpack bundle importing the browser-safe entry points of `@fgv/ts-extras` + `@fgv/ts-web-extras`, assert it bundles without `node:*` polyfill errors, **actually run in CI** (do not add it otherwise), and live in a package excluded from the publishable version policy so it generates no change-file noise.

---

## `@fgv/ts-web-extras-ollama` — browser Ollama sibling (O-5)

**Status: parking lot — filed at the `ollama-native` O-4 close (2026-06-06). Not commissioned.**

`@fgv/ts-extras-ollama` shipped Node-only at v0.1 (PRs #472–#475; promoted via #477). The browser path is the natural shape of a future sibling, mirroring `@fgv/ts-web-extras-transformers` to `@fgv/ts-extras-transformers`:

- Wrap `import ollama from 'ollama/browser'` (the `ollama` lib's browser entry) instead of the Node entry.
- The sidecar must set `OLLAMA_ORIGINS` to allow the browser origin — direct `browser → localhost:11434` is CORS-blocked by default. This is a deployment prerequisite the package can document but not remove.
- Identical surface to the Node package (the primitives are pure HTTP/data; the `fetch`-injection seam already exists on `createOllamaClient`), so most of the boundary is reusable.

**Why deferred:** no browser consumer yet, and the CORS/`OLLAMA_ORIGINS` story makes the browser path a deliberate opt-in rather than a default. Commission when a browser consumer surfaces.

## Native Ollama `embed` — RESOLVED → CUT (do not build)

**Status: resolved 2026-06-07. Native `embed` is CUT, not held.**

The cross-provider `ai-assist-embeddings` primitive shipped (`AiAssist.callProviderEmbedding`) and owns Ollama embeddings via `/v1/embeddings` — point the `ollama` descriptor at `http://localhost:11434/v1` and pass the embedding model via `modelOverride`. Native `/api/embed` adds only marginal diagnostics (`total_duration` / `prompt_eval_count`), not worth a parallel path, so `@fgv/ts-extras-ollama` intentionally does NOT ship `embed`. Revisit additively only if a concrete consumer demonstrates a hard need for the native-only diagnostics. See `.ai/tasks/completed/2026-06/ai-assist-embeddings/` and the `@fgv/ts-extras-ollama` entry in `LIBRARY_CAPABILITIES.md`.

---

## Transparent batch-chunking for `callProviderEmbedding`

`callProviderEmbedding` fails fast when `input` exceeds the capability's `maxBatchSize` (e.g. OpenAI's 2048) rather than auto-chunking — fine for v0.1, since the failure is explicit and a caller can chunk themselves. Future additive nicety: have the dispatcher transparently split an over-limit batch into `maxBatchSize`-sized sub-requests (sequential or bounded-concurrent) and reassemble `vectors[]` in input order. Adds chunking + reassembly + partial-failure semantics; defer until a RAG consumer actually hits the limit and wants it handled in-library.

**Reference:** `ai-assist-embeddings` design §14 amendment #3.

---

## Structured memory for agents (platform capability)

> **SHIPPED 2026-06-26** — `@fgv/ts-agent-memory` v1 substrate (knowledge + memory)
> promoted to `release`. Completion record:
> `.ai/tasks/completed/2026-06/ts-agent-memory/`. Original design context retained below.
>
> **Fast-follow streams (deferred; seams already present):** (1) in-package cosine
> `IVectorIndex` impl + embed-on-write; (2) temporal versioned write path + temporal
> retrievers (`temporal?` envelope block + codec `isVersioned` flag already ship);
> (3) L2 agent-tool surface (`IAiClientTool`); (4) L3 ingest orchestrator (the fgv-side
> ingestion target for the consumer's own pipeline). Commission each when a consumer needs it.

A structured-memory substrate for agents — an Obsidian-like graph (files + links +
derived index) as the foundation for **both knowledge and distilled experience** —
with optional layered capabilities (semantic/vector recall, temporal reasoning,
observation/audit, qualifier-conditional recall) and a host-driven L3 extract/relate
ingest pipeline. Anticipatory (no concrete consumer ask yet; one expected from
personaility) but pursued as **platform**, not consumer-feature, work — the design
is being fleshed to moderate detail now rather than waiting for a narrow scenario.

Architecture (settled across the 2026-06-25 exploration + refinement passes):
- **Small invariant core + optional present-when-wired layers.** Core = envelope
  identity + typed per-kind (consumer-`Converter`) body + attributed edges + FileTree
  store + transaction-time metadata. Layers = vector, temporal, observe,
  qualifier-recall — each degrading loudly when not wired.
- **~80–90% composition** over existing fgv primitives (`FileTree`, the
  `ts-prompt-assist` store/observe spine, `RetainingRingBuffer`, `Crc32Normalizer`,
  `callProviderEmbedding`, ai-assist client-tools). The one genuine new-infra item is
  a minimal in-package cosine/top-k vector index (large-N is out ⇒ no external ANN).
- **One substrate for knowledge + experience**, unified by a cross-kind provenance
  link graph; divergences absorbed by per-kind write policy, retriever selection,
  scope subtrees, and the optional temporal layer.
- **L3 ingest** = host brings classify/extract/relate judgment; fgv owns the typed
  validation boundary + content-hash/similarity dedup + edge write/cycle safety +
  provenance stamping + the `contradicts`→temporal-invalidate interlock.

**Three load-bearing v1 commitments** (cheap now, expensive to retrofit): extensible
envelope; per-kind-pluggable write policy; attributed (object) edges + structured
provenance — NOT bare-string links.

**Phase-A seeds to resolve first:** edge/entity identity model (entity-id vs.
version); episodic-capable-by-construction (yes/no); host-interface granularity
(staged split vs. single `IMemoryIngestor`). Plus the hedged OQ register (vector
depth, ts-prompt-assist shared-core extraction, temporal query depth, scope model).

**Why FUTURE, not yet a stream:** stream-commission is a platform-investment
prioritization call — explicitly NOT gated on a consumer ask (Erik's
platform-over-features direction, 2026-06-25). Promote to `docs/WORKSTREAMS.md` when
prioritized; the fleshed design lets it start cold.

**Reference:** `.ai/tasks/completed/2026-06/ts-agent-memory/` — `README.md`, `exploration.md`
(design-space note + §9 refinement + §10 unified-substrate / L3 contract) and
`design.md` (moderate-detail platform design). Floated package name
`@fgv/ts-agent-memory`.
