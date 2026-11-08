# State: `model-max-output-tokens`

Worker-owned. Brief is frozen; questions and decisions live here.

## Status

In progress on `model-max-output-tokens` (base `integration/asks` @ `ac99bdc2`).

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
