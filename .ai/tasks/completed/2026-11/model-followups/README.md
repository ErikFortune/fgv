# model-followups — sweep of the follow-ups recorded by the 2026-11 model streams

**Shipped**: 2026-11-11, PR #774 (targets `integration/asks`).
Packages: `@fgv/ts-extras` (`ai-assist`, change file `minor`), `@fgv/ts-extras-mcp` and
`@fgv/ts-res-cli` (tests only, `none`), `@fgv/testbed` (private, `none`).

## Summary

Six follow-ups left by `live-run-corrections`, `model-alias-refresh` and the tech-debt ledger:

- **`executeClientToolTurn` refuses a caller-built `'none'` effort on a thinking-required OpenAI-format
  model** (`gpt-6.1-sol`, `gpt-6-astra`, and by the same rule `grok-4.7`/`-4.6`/`-4.5`), as it already
  refused `anthropicThinkingDisabled` on Claude.
- **`gpt-6-luna` stays off `samplingParamsRejectedModelPrefixes`.** The list is effort-blind and would
  refuse `0.3` with effort `'none'`, which OpenAI supports. Two report-only canary rows ask the provider
  whether luna takes `1` beside an effort.
- **A malformed `ModelSpec` fails instead of throwing**, naming the provider and the offending key's
  path, on every call path through `resolveProviderModel`.
- **`chatOutputTokensField` declares the Chat Completions output-token field.** Groq and xAI now send
  `max_completion_tokens`, as OpenAI did; Mistral, Ollama and `openai-compat` keep `max_tokens`.
- **Flakes:** the Argon2id salt mismatch and three MCP progress-deadline tests are deterministic, the
  double-spawn CLI test has a sized timeout, the safer-fetch retry entry was already fixed by #745, and
  the egress resumed-GET entry is narrowed (no reproduction; its failure is a lost resume, not a margin).
- **Held aliases:** `@openai:image` and `@google-gemini:embedding` stay where they are; a
  `docs/FUTURE.md` entry records how to offer `gemini-embedding-2` without moving the embedding space.

## What a reader should know

- `resolveModel`, `MODEL_SPEC_BASE_KEY` and the walk moved to `ai-assist/modelSpecResolver.ts`:
  `model.ts` sat two lines under the 2000-line lint cap.
- A hand-built descriptor that relied on `id: 'openai'` for `max_completion_tokens` must now declare
  `chatOutputTokensField`.
- Review round 1 made the client-tool path refuse a temperature beside a caller-built effort, as the
  completion and streaming paths do, instead of the Responses adapter dropping it silently
  (`result.md` § 10). "Sol" in this stream means `gpt-6-sol`, not `gpt-6.1-sol`.
- No live call was made. Every change is proven by stubbed-fetch request-body tests shown red first,
  or, for the flakes, by 20 loaded runs (`result.md` § 5).
- Open: xAI's `max_completion_tokens` bounds visible output only (`result.md` § 8 Q1); the luna rows in
  the OpenAI canary (`result.md` § 2 run sheet).

## Artifacts

- `brief.md`: the frozen contract
- `state.md`: decisions D1–D5 and Q1
- `result.md`: per-item changes, evidence, red/green, records closed, gates
- `meta.yaml`
