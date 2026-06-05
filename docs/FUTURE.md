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

**Status: partially shipped 2026-06-04 via PR #447 (Phase C / layer 1 — harness-supplied tools).**

Layer 1 (harness-supplied tools) shipped: `IAiClientTool`, `executeClientToolTurn`, per-provider streaming adapters (Anthropic, OpenAI Responses, Gemini), `client-tool-call-start` / `client-tool-call-done` / `client-tool-result` stream events, multi-turn `continuation.messages` round-trip. Verified live against Anthropic API on 2026-06-04.

**Remaining future work:**

**MCP tools (layer 2, longer term).** Same conceptual surface, but the tool catalog comes from one or more MCP servers the consumer connects to. Adds: MCP client transport, tool discovery, schema introspection, lifecycle management. Likely a separate consumer-facing API that lowers into the same internal client-tool plumbing.

**Dependencies**: ai-assist-client-tools cluster closed to release (in progress as of 2026-06-04).

**Reference**: 2026-05-30 conversation (Erik watching personaility's roadmap); `.ai/tasks/active/ai-assist-client-tools/`; PR #447.


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
