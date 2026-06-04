# `per-provider-testbed-scenarios` — result

**Stream:** `per-provider-testbed-scenarios`
**Work branch:** `claude/magical-newton-S53ZO` (forked off integration branch `per-provider-testbed-scenarios`)
**Completed:** 2026-06-04
**Status:** implementation complete; local gates green; **live-API verification gapped** (no provider API keys in the agent environment)

---

## What shipped

Three new live-wire-verification testbed scenarios paralleling `anthropicClientTools`:

| Scenario | Path | Provider id | apiFormat | Env gate | Model alias | Thinking field |
|---|---|---|---|---|---|---|
| OpenAI | `samples/testbed/src/scenarios/openaiClientTools/index.ts` | `openai` | `openai` (Responses API) | `OPENAI_API_KEY` | `gpt-5.1` | `openAiEffort: 'low'` |
| Gemini | `samples/testbed/src/scenarios/geminiClientTools/index.ts` | `google-gemini` | `gemini` | `GEMINI_API_KEY` / `GOOGLE_API_KEY` | `gemini-2.5-flash` | `geminiThinkingBudget: 1024` |
| xAI | `samples/testbed/src/scenarios/xaiClientTools/index.ts` | `xai-grok` | `openai` (Responses API) | `XAI_API_KEY` | `grok-4.3` | `xaiEffort: 'low'` |

Each scenario: CLI-only; memory tool (`recall_memory`) client-defined + harness-executed with a `JsonSchema.object` parameters schema validated inside `execute`; `web_search` server tool requested for coexistence; gates on its API key and fails immediately with a clear diagnostic if absent; emits a PASS/FAIL summary with a per-gate breakdown matching the anthropic output shape.

**Modified:**
- `samples/testbed/src/scenarios/index.ts` — registered the three new scenarios.
- `samples/testbed/src/test/unit/__snapshots__/scenarios.test.ts.snap` — registry-id snapshot updated (was stale: it had never been updated to include `anthropic-client-tools`; now lists all 7 ids).
- `samples/testbed/config/jest.config.json` — `coveragePathIgnorePatterns` now excludes `lib/scenarios/[a-zA-Z]+ClientTools/` (live-API scenarios that cannot be unit-tested without a live key).

---

## Empirical-gate matrix (per provider)

Legend: **PASS** = verified locally; **GAPPED** = requires a live `<PROVIDER>_API_KEY` not present in the agent env (run by the user to flip to PASS); **N/A** = not applicable to this provider's wire shape; **wired** = code path present and confirmed via the library's `apiFormat` switch + build.

| Gate | OpenAI | Gemini | xAI |
|---|---|---|---|
| Live API round-trip without HTTP 4xx | GAPPED | GAPPED | GAPPED |
| Client tool invoked and executed | GAPPED (wired) | GAPPED (wired) | GAPPED (wired) |
| Continuation round-trip works | GAPPED (wired) | GAPPED (wired) | GAPPED (wired) |
| Thinking/reasoning enabled (indirect) | GAPPED (wired) | GAPPED (wired) | GAPPED (wired) |
| Server tool events emitted | GAPPED (wired; Responses API emits `tool-event`s) | **N/A** (Gemini grounding never yields `tool-event`s by design) | GAPPED (wired; Responses API emits `tool-event`s) |
| Server + client tool coexistence | GAPPED (wired) | GAPPED (wired; grounding + client tool in request) | GAPPED (wired) |
| Missing-key diagnostic path | **PASS** | **PASS** | **PASS** |

The missing-key diagnostic path was verified by running each scenario through the testbed CLI with no key set:

```
$ node bin/testbed.js --scenario openai-client-tools
testbed CLI: scenario "openai-client-tools" failed: OPENAI_API_KEY environment variable is not set. ...
$ node bin/testbed.js --scenario gemini-client-tools
testbed CLI: scenario "gemini-client-tools" failed: Neither GEMINI_API_KEY nor GOOGLE_API_KEY environment variable is set. ...
$ node bin/testbed.js --scenario xai-client-tools
testbed CLI: scenario "xai-client-tools" failed: XAI_API_KEY environment variable is not set. ...
```

### How to complete the live verification (user-side)

From `samples/testbed/` after `rushx build`:

```bash
OPENAI_API_KEY=<key> node bin/testbed.js --scenario openai-client-tools
GEMINI_API_KEY=<key> node bin/testbed.js --scenario gemini-client-tools
XAI_API_KEY=<key>    node bin/testbed.js --scenario xai-client-tools
```

Each should print `... scenario: PASS` with the per-gate breakdown. Per the FUTURE entry's rationale, the live run is the empirical safety net that may surface wire-shape bugs of the PR #448 / #449 class that unit tests cannot catch; if a run fails with an HTTP 4xx or a continuation rejection, file the wire-shape bug as a finding against `@fgv/ts-extras/ai-assist` (the testbed is the detector, not the fix site — library fixes are out of this stream's scope per the brief).

---

## Local gates (agent-verified)

| Gate | Result |
|---|---|
| `rushx build` (`@fgv/testbed`) | **PASS** |
| `rushx lint` (`@fgv/testbed`) | **PASS** (no warnings) |
| `rushx test` (`@fgv/testbed`, 100% coverage) | **PASS** (143 tests; global 100% after live-API-scenario exclusion) |
| `rushx fixlint` run before final commit | **done** |
| `code-reviewer` agent on final diff (pre-coverage-closure per L37) | **done** (see below) |

---

## `code-reviewer` pass

Run on the cumulative diff before any coverage closure (coverage was satisfied by exclusion, not by forcing tests — so there was no imperative-test / `c8 ignore` class to pre-empt).

**Recommendation: Approved — no blocking P1 issues.**

- **P1 (CRITICAL):** none. No `any`, no manual type checks with unsafe casts, no double casts; Result pattern used correctly (sync `executeClientToolTurn` result checked before destructure; `nextTurn` promise awaited + checked); `execute(args: unknown)` validated via `memoryToolSchema.validate` per the `IAiClientTool` contract.
- **P2 (MAJOR):** none requiring change. The reviewer confirmed-correct: `'xai-grok'` descriptor id (registry L229), `gpt-5.1` satisfies the `gpt-5.*` thinking capability, `grok-4.3` receives `reasoning.effort` (adapter suppresses only the bare `grok-4` id, `openaiResponses.ts:330`), the Gemini `tool-event` N/A divergence is correct and documented at every layer (JSDoc, inline, logging, summary), the snapshot order matches the `scenarios` array, and the coverage-exclusion regex is correct and minimal.
- **P3 (ADVISORY):** `MEMORY_STORE` / `memoryTool` / `USER_QUESTION` / `SYSTEM_PROMPT` are duplicated across the four scenarios — **intentional** (template-mirrored; brief says resist over-abstraction; a shared helper would fall under the same coverage exclusion anyway). The Gemini `SYSTEM_PROMPT` divergence ("Google Search" vs "`web_search` tool") is the correct adaptation. `gpt-5.1` may need occasional maintenance on model deprecation — expected for live CLI scenarios.

**Disposition:** No code changes required. The one PR-description callout the reviewer flagged — that the `[a-zA-Z]+ClientTools/` exclusion also covers the pre-existing `anthropicClientTools/` (previously coverage-collected at ~46%) — is intentional and already documented here and in `state.md` (decision 5).

---

## Decisions / notes

- **Self-contained scenarios over a shared runner.** Each scenario mirrors the anthropic template inline rather than extracting a shared runner. Per the brief ("resist over-abstracting tool-format-specifics across providers since each provider's continuation shape is genuinely different") and CODING_STANDARDS ("three similar lines is better than a premature abstraction"). The genuine per-provider differences (descriptor id, env gate, model alias, thinking field, Gemini's tool-event N/A) are small config/summary deltas; a shared runner would have to branch on all of them and would also fall under the same coverage exclusion, yielding no test-surface benefit.
- **No library changes.** All three providers were already wired through `executeClientToolTurn`'s `apiFormat` switch (`anthropic` / `openai` / `gemini`); xAI's `apiFormat: 'openai'` routes it through the OpenAI Responses path. No `@fgv/ts-extras/ai-assist` modification was needed or made.
- **Coverage-exclusion scope note** — see `state.md` decision 5. `config/jest.config.json` was outside the brief's declared surface but the change is confined to the testbed project and is the honest way to satisfy "match testbed coverage convention / do not force 100%" while leaving `rushx test` actually green.
