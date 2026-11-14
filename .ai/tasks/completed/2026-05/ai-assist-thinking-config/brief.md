# Stream Brief: ai-assist-thinking-config (phase A — research and design)

**Stream ID:** ai-assist-thinking-config
**Phase:** A — research and design (no production code)
**Sequencing:** Phase A runs in parallel with `ai-assist-image-generation` phase A. Phase B (implementation) is sequenced strictly after both streams' phase B work — image-generation phase B lands first, then this stream's phase B. Decision on fresh-vs-continuing agent for this stream's phase B is held by the orchestrator until image-generation phase B lands.

---

## Context

`@fgv/ts-extras/ai-assist` always sends `temperature` (and likely other sampling params) on chat-completion requests. Reasoning/thinking models reject this — Anthropic, OpenAI o-series, Gemini 2.5 thinking variants, and xAI Grok reasoning models each have their own ways of expressing "this is a thinking model; sampling params are different or absent, and there's a reasoning-budget knob to set." Today, AiAssist 400s when callers point at a thinking model.

**This is feature work, not a bug fix.** The right fix isn't "drop temperature for thinking models" — it's a coherent `IThinkingConfig` abstraction that maps cleanly to all four providers' reasoning surfaces, decides how it interacts with sampling params, and gives callers a consistent way to opt into thinking with budget controls.

---

## Mission

Produce a design document at `.ai/tasks/active/ai-assist-thinking-config/design.md` that an implementing agent could execute against. The design must inventory all four providers' thinking/reasoning surfaces, propose `IThinkingConfig` (or whatever the right abstraction is), specify how sampling params interact, and explicitly surface tradeoffs and open questions for orchestrator/user signoff.

**Do not modify production code in this phase.** Read freely; write only `design.md` and `state.md`.

---

## Phase A deliverable: `design.md`

Required sections, in order:

### 1. Provider thinking-surface inventory

For each provider, document the thinking/reasoning API as it exists today:

- **Anthropic Messages API**: `thinking` parameter shape, `budget_tokens` semantics, model-list (Claude with extended thinking — currently Sonnet 4.x and Opus 4.x families), interaction with `max_tokens`, response shape (thinking blocks alongside text)
- **OpenAI Responses API / o-series**: `reasoning.effort` (`'low' | 'medium' | 'high'`) and `reasoning.summary` parameters, model-list (o-series variants, gpt-5 family if applicable, others), interaction with `temperature`/`top_p` (typically rejected or ignored), response shape (reasoning items)
- **Google Gemini 2.5 with thinking**: `thinking_config.thinking_budget` shape, model-list (2.5 Pro, 2.5 Flash thinking variants), interaction with sampling params, response shape (thoughts vs. answer)
- **xAI Grok reasoning models**: current shape — Grok-3-mini and beyond likely have a `reasoning_effort` param; verify against current docs; model list; interaction with sampling params

For each: cite docs by URL. Note any provider where "thinking model" overlaps with "regular model" (e.g. Anthropic's extended thinking is opt-in on otherwise-normal models) vs. where the model itself is reasoning-only (e.g. OpenAI o-series).

### 2. Current implementation gap analysis

Inventory what's currently wired in `@fgv/ts-extras/ai-assist`:

- Search `chatRequestBuilders.ts`, `apiClient.ts`, `streamingClient.ts`, all four `streamingAdapters/*.ts` files, `model.ts`, `registry.ts` for `temperature`, `top_p`, `top_k`, `max_tokens`, `reasoning`, `thinking`
- Document where temperature is sent unconditionally, where it's already optional, where defaults live
- Document any existing reasoning/thinking handling (likely none, but confirm)
- Identify which provider adapters are most affected by gaps (likely all four to varying degrees)

### 3. `IThinkingConfig` (or alternative) recommendation

Inventory at least three approaches, with tradeoffs:

- **A — Common abstraction, registry-driven translation**: single `IThinkingConfig` shape with cross-provider semantics (e.g. `enabled: boolean`, `budget: 'low' | 'medium' | 'high' | { tokens: number }`), each adapter translates to provider-specific wire form. Provider-specific knobs surface via an escape hatch (or are rejected).
- **B — Discriminated union per provider**: caller picks `{ provider: 'anthropic', budgetTokens: N }` vs. `{ provider: 'openai', effort: 'high' }` etc. Type-level fidelity, no translation needed; cost is caller-side awareness of all four shapes.
- **C — Capability-driven optional**: `IThinkingConfig` is provider-agnostic at the high level (`enabled`, `effortHint`); registry-per-model declares whether a model is thinking-capable; sampling params auto-suppress for thinking models; provider-specific knobs are opt-in.
- Possibly others your inventory surfaces.

Recommend one. Defend the choice. Note migration impact on existing callers.

### 4. Sampling-param interaction policy

Decide and document:

- When a thinking model is selected, what happens to `temperature`, `top_p`, `top_k`, frequency/presence penalties? Drop them, error, ignore silently?
- Do we make these caller-overridable for the providers that *do* accept some sampling on thinking models, or enforce strict suppression?
- Do we keep `temperature` as a top-level field on the request type and conditionally include it, or restructure the type so sampling params live in a sub-object that's only valid for non-thinking models?
- How does this interact with existing callers who pass `temperature` and now select a thinking model — clear error, silent drop, or rejected at type level?

### 5. Model-capability signaling

Propose how the registry expresses "this model supports thinking" and "this is a thinking-only model":

- Existing pattern uses `modelPrefix` + capability flags. Extend with `supportsThinking: boolean`? `thinkingMode: 'optional' | 'required' | 'unsupported'`? Both?
- How do callers discover thinking-capable models programmatically (UI selector etc.)?
- How does the default-model selector account for thinking — should `defaultModel.thinking` exist as a sibling to `defaultModel.base` and `defaultModel.image`?

### 6. Streaming integration

Thinking models commonly stream thinking blocks alongside text. Specify:

- How thinking content surfaces in the streaming API (separate event type? interleaved content?)
- How the four providers differ in their streaming representation of thinking
- Whether/how thinking blocks are exposed to the caller (visible by default? opt-in via config? always present in the result?)
- Backward compatibility — existing streaming callers should not break if they're not asking for thinking

### 7. Non-streaming response shape

For non-streaming completions:
- How does the response surface the thinking/reasoning content? (Separate field, omitted by default, etc.)
- Token accounting — thinking tokens count against budget; should the response report them separately from output tokens?

### 8. Migration impact

List externally-visible changes the recommended design implies:
- Renamed types, dropped fields, new required fields, changed semantics
- For each: blast radius (`ts-app-shell` consumer, tools in-repo, personaility external), suggested migration path
- **Lockstep version policy reminder**: a breaking change here ships in the same alpha as everything else. Weigh against staying additive where the cleaner shape doesn't justify forced consumer migration.

### 9. Open questions for signoff

Anything you couldn't resolve from research alone — capability questions, design tradeoffs without an obvious right answer, anywhere you want orchestrator/user input before phase B is commissioned. Be honest; signoff is real and substantive.

---

## Package surface (read-only for phase A)

Phase A reads but does not modify:
- `libraries/ts-extras/src/packlets/ai-assist/` — all files, especially the chat-completion path and streaming adapters
- `libraries/ts-app-shell/src/packlets/ai-assist/` — to understand consumer-side wiring (informs migration impact)
- `.ai/instructions/LIBRARY_CAPABILITIES.md` § ai-assist (current external framing)

Phase A writes only:
- `.ai/tasks/active/ai-assist-thinking-config/design.md` (new)
- `.ai/tasks/active/ai-assist-thinking-config/state.md` (update at checkpoints)

Phase B (separately commissioned) will modify the ai-assist packlet itself, registry entries, types, tests, streaming adapters, and `LIBRARY_CAPABILITIES.md`.

---

## Required reading (priority order)

1. `libraries/ts-extras/src/packlets/ai-assist/chatRequestBuilders.ts` — request body construction per provider, where temperature lives
2. `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/` — all four adapter files (anthropic, openaiChat, openaiResponses, gemini), plus `common.ts` and `proxy.ts`
3. `libraries/ts-extras/src/packlets/ai-assist/model.ts` — type definitions for chat completion params, message types
4. `libraries/ts-extras/src/packlets/ai-assist/registry.ts` — provider/model registry, current capability flags
5. `libraries/ts-extras/src/packlets/ai-assist/apiClient.ts` — chat-completion entry points
6. `libraries/ts-extras/src/packlets/ai-assist/streamingClient.ts` — streaming entry point
7. `docs/WORKSTREAMS.md` preamble — repo shape, lockstep version policy, stability-via-consumption framing
8. `.ai/instructions/ACTIVE_DEVELOPMENT.md` — `ai-assist` is on the active-surface list
9. `.ai/instructions/LIBRARY_CAPABILITIES.md` § ai-assist — current external framing
10. `libraries/ts-app-shell/src/packlets/ai-assist/` — consumer-side wiring (skim, don't exhaustively read)

---

## Skills to load

- `/published-primitives-reflex` — load before recommending any new utility-shaped helper. Check `@fgv/*` first.
- `/result-pattern` — load before proposing function signatures returning `Result<T>`.
- `/type-safe-validation` — load before proposing validator/converter shapes for thinking-config validation.

---

## Web access

You should web-search and web-fetch provider docs as needed. Don't trust training data for thinking/reasoning API specifics — these surfaces are the most actively-evolving part of the LLM API space. Cite URLs in section 1.

Today's date is 2026-05-11. Focus on **current** docs:
- Anthropic Messages API: extended thinking, budget_tokens, model availability
- OpenAI Responses API + o-series: reasoning.effort, reasoning.summary, model availability (gpt-5 family, o-series successors)
- Google Gemini 2.5: thinking_config, thinking_budget, model availability
- xAI Grok: reasoning_effort, model availability (Grok 3, Grok 3 mini, Grok 4 if applicable)

---

## Missing-input rule

If a required-reading file is missing, has a shape that conflicts with this brief, or if your research surfaces a structural mismatch you can't resolve (e.g. a provider has restructured their reasoning API since this brief was written), **STOP and report**. Do not improvise.

---

## Phase A acceptance criteria

- [ ] `design.md` exists at the specified path with all nine sections populated
- [ ] All four providers' thinking surfaces inventoried with current-doc citations
- [ ] `IThinkingConfig` (or alternative) recommendation defends one of the three (or proposed) approaches with explicit tradeoff analysis
- [ ] Sampling-param interaction policy is explicit, not implied
- [ ] Streaming and non-streaming response shapes both addressed
- [ ] Migration impact section names every breaking change with blast-radius notes
- [ ] Open-questions section is substantive

---

## Phase A exit artifact (state.md)

At completion, `state.md` should record:
- Phases completed (A done; B awaiting signoff)
- `design.md` path
- Recommendation summary in one paragraph (so the orchestrator can present cleanly to the user)
- Any research dead-ends, surprising findings, or provider-API surprises worth flagging
- Anything you decided to **exclude** from the design and why (so signoff can revisit)

---

## Branch + PR posture

- **Base branch:** `claude/ai-assist-features` (the integration branch — NOT `release` directly)
- **Work branch:** `claude/ai-assist-thinking-config-design`
- **PR target:** `claude/ai-assist-features` (not `release`)
- Single PR containing: `design.md`, updated `state.md`
- No production-code changes
- Phase B (separately commissioned post-signoff) branches off the integration branch with `design.md` already merged in

The integration branch groups all ai-assist feature work — both streams' design and implementation phases — into one cohesive merge to `release` at the end of the cluster.

---

## Resume protocol

If the session ends mid-phase: read `brief.md` (this file) and `state.md` to resume. `design.md` is your terminal output for phase A.

---

## Out of scope for both phases

- The `ai-assist-image-generation` stream (parallel phase A; sequenced separately for phase B)
- Any package outside `ts-extras/ai-assist` and `ts-app-shell/ai-assist`
- Sudoku packages (`ts-sudoku-lib`, `ts-sudoku-ui`) — vestigial
- Image-generation reasoning (image-gen models don't have a thinking surface in scope here)
- Function-calling / tool-use evolution (out of scope unless thinking and tool-use materially interact and the design must surface that interaction)
