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

Today ai-assist supports **server-side tools only, and only `web_search`** (`AiServerToolType = 'web_search'` is a single-value union; provider toolFormat adapters switch on `case 'web_search'` only). No client-supplied tool schemas, no `tool_use` / `tool_result` round-trips, no parallel-tool-call orchestration, no MCP-style or function-calling protocols. Personaility's near-term roadmap moves into agentic territory (memory tool, harness-supplied capabilities) that needs this surface.

**Two layers, sequenced:**

1. **Harness-supplied tools (first requirement, near-term).** Consumer (e.g. personaility) defines tool schemas in their code, supplies callbacks, and ai-assist orchestrates the model's tool-call → consumer-callback → tool-result round-trip. Canonical example: a memory tool the agent calls to recall/store user-specific context. The shape: `AiClientToolConfig` (name + description + JSON Schema for params), tool-call / tool-result event types on the streaming surface, per-provider toolFormat adapters (different shape than server tools), and a round-trip loop pattern the consumer drives.

2. **MCP tools (longer term).** Same conceptual surface, but the tool catalog comes from one or more MCP servers the consumer connects to. Adds: MCP client transport, tool discovery, schema introspection, lifecycle management. Likely a separate consumer-facing API that lowers into the same internal client-tool plumbing.

**Composition with thinking-mode.** Thinking-config and tools should compose cleanly — both are options-bag fields today, riding the same call paths. The provider matrix needs verification (OpenAI Responses, Anthropic, Gemini, xAI all advertise function calling, but per-provider quirks around thinking + tools differ). Phase A research output should name the matrix.

**Phase A — design exploration in flight (2026-05-30).** `.ai/tasks/active/ai-assist-client-tools/brief.md` commissioned to senior-developer + general-purpose research pair: cross-provider API survey, fgv-native client-tool surface sketch, harness-tool vs MCP separation analysis, sizing for phase B/C. Output is a design doc Erik reviews before committing to implementation.

**Why deferred (to a sprint, not indefinite)**: client-tool support is a real piece of work — touches the streaming surface across four providers, introduces a new conversation-loop pattern, and likely needs its own `LIBRARY_CAPABILITIES.md` entry. Erik wants it in the next sprint; this entry exists to name the work and point at the design substrate while the sprint window settles.

**Dependencies**: phase A design doc landed and reviewed; sprint-window commitment.

**Reference**: 2026-05-30 conversation (Erik watching personaility's roadmap); `.ai/tasks/active/ai-assist-client-tools/`.


---

## Live-wire-shape verification testbed scenarios per provider

The `ai-assist-client-tools` cluster surfaced three consecutive bugs (PR #447 P1-1, PR #448 missing-browser-export, PR #449 thinking-config wire shape + dated-snapshot model) where unit tests passed because they mocked the response side and never validated the request body against the provider's documented contract. The codified L37 discipline (`code-reviewer` runs before 100%-coverage closure) covers the principle; the structural fix is **per-provider live testbed scenarios** that exercise the full wire shape against a real API.

**Shape (Erik 2026-06-04):** one scenario per provider, each exercising that provider's full feature surface — Anthropic (thinking + client tools + server tools, already exists as `anthropicClientTools`), OpenAI (thinking + client tools + server tools + Responses API), Gemini (thinking + client tools + server tools), xAI (thinking + client tools). ~4 scenarios total, each gated on the relevant `<PROVIDER>_API_KEY` env var, each emitting a clear PASS/FAIL summary with a request-shape breakdown.

**Companion concern (Erik 2026-06-04):** generic-version-alias library support — Anthropic publishes the bare `sonnet` alias for always-latest Sonnet; OpenAI / Gemini / xAI may or may not publish equivalent aliases. The registry's `defaultModel` per provider currently pins a specific dated snapshot that goes stale (e.g. `claude-sonnet-4-5-20250929` while Sonnet is on 4.8). Best practice per provider needs research before fgv can offer a "give me the current X" surface across all four. The two concerns interact: the per-provider testbed scenarios should themselves use generic aliases (`'sonnet'` for the Anthropic scenario, equivalents for the others once researched) so they don't bake in snapshot drift.

**Why deferred (to a sprint, not indefinite):** the ai-assist-client-tools cluster is mid-promotion; queuing this after the cluster closes keeps the cluster-close prep clean. Once the cluster lands, this should commission as a stream of its own.

**Dependencies:** ai-assist-client-tools cluster closed to release. Per-provider API key availability (Anthropic confirmed; OpenAI / Gemini / xAI need confirmation).

**Reference:** 2026-06-04 conversation; PR #447 P1-1 + PR #449 thinking-wire-shape + PR #448 browser-export demonstrate the failure mode; L37 codification (PR #445) is the principle; `samples/testbed/src/scenarios/anthropicClientTools/` is the shape template.
