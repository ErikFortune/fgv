# `per-provider-testbed-scenarios` — stream brief

**Status:** ready to commission
**Workflow shape:** `stream` on its own integration branch (`per-provider-testbed-scenarios` → `release` as one cluster-close squash)
**FUTURE.md source:** "Live-wire-shape verification testbed scenarios per provider" entry (added 2026-06-04 via PR #450)

## Mission

Add live-wire-verification testbed scenarios for OpenAI (Responses API), Gemini, and xAI, paralleling the existing `anthropicClientTools` scenario. Each scenario exercises that provider's full feature surface (thinking + client tools + server tools where supported) against the live API and emits a per-gate PASS/FAIL summary.

These scenarios are **the empirical safety net** L37 names: unit tests catch emitter-level correctness but cannot catch wire-shape mismatches with each provider's actual contract. The `anthropicClientTools` scenario surfaced two such bugs during its first live run (PRs #448 and #449); the same class of bug almost certainly exists on the other three providers and is currently undetected.

## In scope

Three new scenarios under `samples/testbed/src/scenarios/`:

- `openaiClientTools/` — OpenAI Responses API + thinking (`reasoning.effort`) + client tool (`recall_memory` shape, paralleling Anthropic) + `web_search` server tool
- `geminiClientTools/` — Gemini + thinking (`thinkingBudget`) + client tool via `functionCall` parts + any server tools Gemini supports today (verify against `LIBRARY_CAPABILITIES.md` `ai-assist` entry)
- `xaiClientTools/` — xAI grok + thinking (`reasoning_effort`) + client tool via Responses API format + any server tools xAI supports today

Each scenario:
- Lives in `samples/testbed/src/scenarios/<providerName>ClientTools/index.ts`
- Registered in `samples/testbed/src/scenarios/index.ts`
- CLI-only (uses the `ICliScenarioImpl` interface)
- Gates on `<PROVIDER>_API_KEY` env var; fails immediately with a clear diagnostic if absent
- Emits a PASS/FAIL summary with a per-gate breakdown matching the `anthropicClientTools` output shape
- Uses the **version-pinned model alias** for the provider (not a dated snapshot, not `'latest'`). Research the alias syntax per provider via the published SDK conventions — that's a phase-A task within this stream.

Shared helpers (if extracted): a common scenario-result-formatter is fine; resist over-abstracting tool-format-specifics across providers since each provider's continuation shape is genuinely different.

## Out of scope

- Cross-provider generic-version-alias library surface (separate FUTURE.md entry; this stream USES the SDK-native syntax for each provider but does NOT add a library abstraction).
- MCP tools (Layer 2; separate package).
- `runToolUseConversation` higher-level helper.
- ANY changes to `@fgv/ts-extras/ai-assist` library surface. If the stream surfaces a library bug, file as a follow-up finding in `findings/inbox/` and continue with the testbed; do not bundle library fixes into this stream.
- Modifying the existing `anthropicClientTools` scenario.

## Package surface

| Path | May modify |
|------|------------|
| `samples/testbed/src/scenarios/openaiClientTools/` | ✅ create |
| `samples/testbed/src/scenarios/geminiClientTools/` | ✅ create |
| `samples/testbed/src/scenarios/xaiClientTools/` | ✅ create |
| `samples/testbed/src/scenarios/index.ts` | ✅ register the three new scenarios |
| `samples/testbed/src/scenarios/anthropicClientTools/` | ⚠️ read-only (template reference) |
| `libraries/ts-extras/**` | ❌ do not modify |
| `libraries/ts-json-base/**` | ❌ do not modify |

## Per-provider gate matrix

Each scenario must report PASS/FAIL on these gates (adapt to provider's actual feature surface):

| Gate | Anthropic (already) | OpenAI | Gemini | xAI |
|---|---|---|---|---|
| Live API round-trip without HTTP 4xx | ✅ | ✅ | ✅ | ✅ |
| Client tool invoked and executed | ✅ | ✅ | ✅ | ✅ |
| Continuation round-trip works | ✅ | ✅ | ✅ | ✅ |
| Thinking content present in stream | ✅ (signature verified) | ✅ (reasoning content) | ✅ (thinking parts) | ✅ (reasoning_content) |
| Server tool events emitted | ✅ (web_search) | ✅ (web_search) | TBD — verify | TBD — verify |
| Server + client tool coexistence | ✅ | ✅ | TBD | TBD |

Where "TBD — verify" appears, the agent reads the relevant provider descriptor (`getProviderDescriptor('<id>').supportedTools`) and matches the scenario to what's actually supported. If a gate isn't supported, document it in the scenario header rather than implementing it.

## Required reading

1. `samples/testbed/src/scenarios/anthropicClientTools/index.ts` — the template. Internalize the structure (memory store, schema-as-SoT, system prompt, scenario context wiring, PASS/FAIL emit).
2. `.ai/instructions/LIBRARY_CAPABILITIES.md` — `@fgv/ts-extras/ai-assist` entry (esp. the `executeClientToolTurn`, `IAiClientTool`, `IAiProviderDescriptor`, `IThinkingConfig` surface).
3. `.ai/tasks/completed/2026-06/ai-assist-client-tools/result.md` — what shipped and the architectural decisions locked.
4. `docs/FUTURE.md` — the "Live-wire-shape verification testbed scenarios per provider" entry (the FUTURE entry naming this work).
5. `libraries/ts-extras/src/packlets/ai-assist/registry.ts` — the per-provider descriptors. Confirms what tools each provider declares support for.
6. `@fgv/ts-extras` `ai-assist` packlet — read enough of the streaming adapters (`openaiResponses.ts`, `gemini.ts`, the xAI path) to understand each provider's tool-call wire shape. Do NOT modify; reference only.

## Skills to load

- `/published-primitives-reflex` — before writing any utility-shaped code.
- `/result-pattern` — all fallible operations return `Result<T>`.
- `/result-tests` — all matchers from `@fgv/ts-utils-jest`.
- `/type-safe-validation` — the memory tool's `parametersSchema` uses `JsonSchema.object`; no manual type checks.

## Phases (interleaved, per provider)

For each of OpenAI / Gemini / xAI, in this order:

1. **Read surface** — provider descriptor, streaming adapter wire shape (5-10 min reading), model-alias research (find the version-pinned alias the SDK accepts).
2. **Draft scenario** — clone `anthropicClientTools` structure, adapt:
   - Memory tool config + schema (identical to Anthropic; reuse pattern)
   - System prompt adapted to provider conventions if needed
   - Provider descriptor wiring
   - Thinking config translation (`anthropicEffort` → `openAiEffort` / `geminiThinkingBudget` / `xaiEffort`)
   - Model alias pinned to current version
3. **Register in index** — add to `samples/testbed/src/scenarios/index.ts`.
4. **Local verification** — `rushx build` + `rushx test` clean in `samples/testbed`.
5. **Live API verification** — IF the relevant `<PROVIDER>_API_KEY` is in the agent's environment, run the scenario and verify all gates PASS. IF the key is absent, document the verification gap in the stream's `result.md` for the user to run; do NOT mock or stub the live call to claim PASS.
6. **Checkpoint** — write to `state.md`, move to next provider.

After all three: write `result.md` with the empirical-gate matrix outcome per provider.

## Acceptance criteria

- [ ] Three new scenarios created and registered.
- [ ] `rushx build` PASS in `samples/testbed`.
- [ ] `rushx lint` PASS in `samples/testbed` (no warnings — treated as errors on CI).
- [ ] `rushx test` PASS in `samples/testbed` (match testbed coverage convention; do NOT force 100% if the existing testbed scenarios don't require it).
- [ ] `rushx fixlint` run before final commit.
- [ ] `code-reviewer` agent run on the final diff BEFORE chasing 100% measured coverage (per L37, see `.ai/instructions/TESTING_GUIDELINES.md` § "Coverage Gap Resolution"); findings resolved or dispositioned.
- [ ] Per-provider scenario PASSES locally (live API) OR the verification gap is documented in `result.md` for user-side completion.
- [ ] **Artifact migration in the final cluster-close PR** (integration → release): `.ai/tasks/active/per-provider-testbed-scenarios/` → `.ai/tasks/completed/2026-06/per-provider-testbed-scenarios/` with polished `README.md`. (Per the orchestrator-gate fix codified in PR #452, the migration ships in the close-out PR — not a follow-up. This is non-negotiable.)

## Exit artifact shape

Standard stream completion docs in the active substrate:
- `state.md` — phase-by-phase progress, decisions made, follow-up findings.
- `result.md` — empirical-gate matrix per provider (which gates PASSED, which were verification-gapped pending user-side live run), files changed, any library follow-up findings filed in `findings/inbox/`.
- `README.md` (in completed/) — the polished archive entry per L5 codification.

## Branching

This stream uses **integration-branch posture** (per L36):

- **Integration branch:** `per-provider-testbed-scenarios` (already created off `release`; this brief is committed there).
- **Agent's work branch:** fork off the integration branch — `chore/per-provider-testbed-scenarios-impl` (or whatever name fits the agent's sub-PR strategy).
- **PR target:** the integration branch (not `release`). The agent may open one PR for all three scenarios, or sub-PRs per provider — either fits.
- **Cluster-close PR:** the orchestrator opens this when the integration branch is ready, bundling the artifact migration. Squash-merges to `release` as one feature commit.

## Resume protocol

If the session is interrupted mid-stream: read `state.md` to determine which provider's scenario is in progress, what phase, what was the last decision. Resume at the next phase boundary.
