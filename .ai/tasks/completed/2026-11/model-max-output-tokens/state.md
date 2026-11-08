# State: `model-max-output-tokens`

Worker-owned. Brief is frozen; questions and decisions live here.

## Status

Implementation committed on `model-max-output-tokens` (base `integration/asks` @ `ac99bdc2`).
Gates green (below). Closed out to `.ai/tasks/completed/2026-11/model-max-output-tokens/`.

## Source research (fetched 2026-11-08)

- **Anthropic** — fetched: models overview, per-model pages for `claude-opus-5-5`, `claude-opus-5`,
  `claude-sonnet-5`, `claude-fable-5-1`, `claude-fable-5`, `claude-haiku-4-5`, and the
  context-windows page. All give "Max output: 128K tokens" except Haiku 4.5 ("64K tokens").
  No fetched page states the exact integer. Recorded as 128000 / 64000: the same docs use `k` as
  1,000 (the context-windows page shows a "200k tokens" window as
  `<budget:token_budget>200000</budget:token_budget>`). If `K` meant 1,024 the recorded value is
  3,072 low — it can truncate slightly, never cause a refusal. The 300k Batch-API figure needs the
  `output-300k-2026-03-24` beta header on the Batch API; ai-assist sends neither, so the synchronous
  limit is the one recorded.
- **OpenAI** — fetched developers.openai.com model pages for `gpt-6-luna`, `gpt-6-sol`,
  `gpt-6-astra`, `gpt-5.4-nano`: all "128,000 max output tokens".
- **xAI** — fetched docs.x.ai models overview, `grok-4.7` and `grok-4.3` pages, API reference.
  No maximum stated; the API reference gives only a *default* (`max_output_tokens` "Defaults to
  128,000 when unset; set a larger value to allow longer generations"), which is not a limit.
  Recorded nothing.
- **Google Gemini** — ai.google.dev model pages 301 to `aistudio.google.com`, which does not resolve
  in this session (outside the allowed network). Recorded nothing.
- **Groq** (`console.groq.com`) and **Mistral** (`docs.mistral.ai`) — hosts do not resolve in this
  session. Recorded nothing.

## Observations outside scope (not acted on)

- Anthropic's current lineup is Sonnet 5.5 / Haiku 5.5; `@anthropic:sonnet` still names
  `claude-sonnet-5` and `@anthropic:haiku` names `claude-haiku-4-5-20251001`, whose page lists
  "Retirement: Not sooner than October 15, 2026". Alias rotation is not this brief's work.
- OpenAI's `gpt-5.4-nano` page marks its only snapshot (`gpt-5.4-nano-2026-03-17`) "Deprecated";
  the registry comment says "not deprecated as of 2026-09-24".

## Decisions

- **D1 — field name `maxOutputTokens`**, matching the entry's own field; sits after
  `structuredOutput` on the descriptor. The interface lives in `model.ts` beside its siblings
  (1886 lines, under the `max-lines` cap).
- **D2 — per-model prefixes, not family prefixes like `gpt-6-`.** Only ids a fetched page names are
  recorded, so a future `gpt-6-*` model does not inherit a number nobody checked. Anthropic's
  `claude-opus-5` / `claude-fable-5` / `claude-sonnet-5` prefixes do also match their `-5` / `-5-1`
  siblings, which are listed explicitly with the same cited value.
- **D3 — decision 5 finding: no adapter change.** Default 4096 < lowest recorded limit 64000. Added
  a test pinning `DEFAULT_ANTHROPIC_MAX_TOKENS <= every recorded Anthropic limit`; watched it go red
  (3 failures) with Haiku temporarily set to 4000, then restored.
- **D4 — no `c8 ignore` needed**; `ts-extras` is at 100% on all four metrics.

## Gates (logs under `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/mot/`)

- `install.log` — `rush install` OK.
- `ext-build.log`, `ext-lint.log`, `ext-test.log` — `ts-extras` build / lint / test exit 0, 0 error
  matches, 0 warnings in build; coverage 100/100/100/100.
- `rebuild.log` — repo-wide `rush rebuild`: `SUCCESS: 39 operations`, 0 error matches, only the
  tracked-symlink warning.
- `test.log` — repo-wide `rush test`: `SUCCESS: 38 operations`, 0 error matches, only the
  tracked-symlink warning, no NUL padding. No known flake fired; no retries.
- `rush change --verify --target-branch origin/integration/asks` — passes (ts-extras change file).
- prettier 2.8.8 `--check` on touched TS and the change file — clean.
- `verify-capability-docs` — 0 failed (router 23,929/24,000 after feed regeneration).
- Ledger gap report (finalize-task step 8): 17 directories without an entry and 5 entries without a
  directory, all pre-existing; this stream has its entry.

## Orchestrator amendments — review round 1 (brief.md unchanged)

- **A1 (amends brief decision 1) — exact-id matching, not longest prefix.** Review probes
  `claude-opus-5-6`, `claude-sonnet-5-6`, `claude-sonnet-50`, `claude-haiku-4-5-1`,
  `gpt-6-luna-mini`, `gpt-6-sol-pro`, `gpt-6-solar` all returned a recorded limit under prefix
  matching — an uncited number, and a too-high one is a refusal. Entry is now
  `IAiMaxOutputTokensCapability { modelId, maxOutputTokens }`, matched when the alias-resolved id
  equals `modelId` or equals it plus a dated-snapshot suffix (`-YYYYMMDD` / `-YYYY-MM-DD`), nothing
  else. Implemented as an internal `findModelEntry` beside `resolveCapabilityForModel`, which is
  unchanged. Exact match wins over a snapshot match. With no prefix matching there is no catch-all;
  the catch-all test is replaced by "every shipped `modelId` is a non-empty concrete id".
- **A2 — `resolveMaxOutputTokens(descriptor, modelOverride?: ModelSpec, context?: ModelSpecKey)`**,
  the same model parameters as `resolveProviderModel`, resolving through it. A consumer holding a
  `ModelSpec` and a tier gets the limit of the model the call will use; previously passing a spec
  threw (`model.startsWith is not a function`).
- **A3 (P3s)** — the Gemini exclusion comment in the test now says only "No cited limit recorded";
  the CAPABILITIES.md entry no longer says "today".

### D2 superseded

D2 above ("per-model prefixes, not family prefixes") is superseded by A1: prefixes are gone
entirely. D2's claim that the Anthropic `claude-opus-5` / `-fable-5` / `-sonnet-5` entries also
matched their `-5` / `-5-1` siblings described exactly the inheritance A1 removes.

### Round-1 implementation notes

- Registry re-keyed to one entry per cited id: 10 Anthropic (added `claude-mythos-5` and
  `claude-mythos-5-1` as separate entries, each from its own model page fetched 2026-11-08 —
  "Model ID: `claude-mythos-5`" / "`claude-mythos-5-1`", "Max output: 128K tokens"), 4 OpenAI.
  `claude-haiku-4-5` is the undated id its page names; `claude-haiku-4-5-20251001` (the alias
  target) reaches it through the snapshot rule, as does `gpt-5.4-nano-2026-03-17`.
- Red check: with the matcher temporarily reverted to a plain `startsWith`, 10 of 49 tests failed
  (the probe set); restored.
- Tests now 49: probes (the reviewer's seven plus `claude-haiku-4-5-2025100`,
  `claude-haiku-4-5-20251001-v2`, `gpt-5.4-nano-2026-03`, `gpt-6`, `gpt-5.4`), dated-snapshot
  positives for both forms, `ModelSpec` / tier / undefined-default / string-alias cases, and an
  equality test over every provider × three specs × every `ModelSpecKey` against
  `resolveMaxOutputTokens(descriptor, resolveProviderModel(...))`.

### Round-1 gates (logs under the same scratchpad directory, `2` suffix)

- `ext-build2.log`, `ext-lint2.log`, `ext-test2.log` — `ts-extras` build / lint / test exit 0, no
  warnings after the api.md update, 49 cases in the new file, coverage 100/100/100/100.
- `rebuild2.log` — repo-wide `rush rebuild`: `SUCCESS: 39 operations`, 0 error matches, only the
  tracked-symlink warning.
- `test2.log` — repo-wide `rush test`: `SUCCESS: 38 operations`, 0 error matches, only the
  tracked-symlink warning, no NUL padding, no flake fired.
- `rush change --verify --target-branch origin/integration/asks`, prettier 2.8.8 `--check`,
  `verify-capability-docs` (router 23,928/24,000) and `generate-capability-feed --check` — pass.
