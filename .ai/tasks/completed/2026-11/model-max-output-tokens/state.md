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
