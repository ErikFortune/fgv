# ai-assist-model-catalog-2026-09 — provider-line rotation, documentation-sourced

**Shipped**: 2026-09-24 via [#692](https://github.com/ErikFortune/fgv/pull/692), from
`claude/ai-assist-model-catalog-2026-09` against `release`. **Live-verified** by the user's
testbed run on 2026-09-25: the OpenAI, Gemini and xAI canaries all passed (`result.md` §6a).

## Summary

Rotated the `@fgv/ts-extras` ai-assist model catalog for OpenAI (GPT-6 line), Gemini (3.8 Flash,
3.5 Flash-Lite) and xAI (grok-4.7, grok-imagine-image-2.0). Each id was quoted from a provider
documentation page fetched on 2026-09-24, and every one is cited in `result.md` §1.

Anthropic was deliberately held. Its successors, `claude-opus-5-5` and `claude-fable-5-1`, reject
forced `tool_choice`, and ai-assist's Anthropic structured output is built on forced tool use.

## What this stream is useful for next time

- **`result.md` §5** lists every deprecation and shutdown date the docs stated. The next rotation
  inherits it.
- **`result.md` §3** records every capability table, including the ones left unchanged, with
  evidence.
- **The pattern that worked for sourcing:** `WebFetch` for reachability, then `curl` the raw page
  (or its `.md` rendering) and quote from that. A summariser rendered one image model's display
  name as if it were an id.
- **The TECH_DEBT manual-axes entry now counts three axes, not two.** It adds the per-model
  capability declarations. A successor can change what a declared mechanism does, as the
  forced-tool rejection did here.

## Added after the first live run

The first run showed that three models reject thinking `'none'`: `gpt-6-astra`, `grok-4.7` and
`gemini-3.1-pro-preview`. The fix adds `thinkingRequiredModelPrefixes` to the descriptors and an
`IThinkingConfig.onUnsupported` option. By default `'none'` is sent as `'low'`; with `'fail'` the
call is refused before anything is sent. The canary gained strict-none probes that keep the list
honest against the providers.

## Files

- `libraries/ts-extras/src/packlets/ai-assist/registry.ts`: aliases, `defaultModel` comments,
  `idPattern` rules, the xAI image capability entry.
- `libraries/ts-extras/src/packlets/ai-assist/model.ts`: `*ModelNames` unions.
- `libraries/ts-extras/src/packlets/ai-assist/imageGenerationClient.ts`: xAI builders send
  `quality` when the capability declares it.
- Tests in `libraries/ts-extras/src/test/unit/ai-assist/`, and pins in `samples/testbed`.
- `libraries/ts-extras/etc/ts-extras.api.md` (the union changes) and
  `common/changes/@fgv/ts-extras/ai-assist-model-catalog-2026-09_2026-09-24-23-00.json`.
- Docs: `libraries/ts-extras/CAPABILITIES.md`, the ai-assist `README.md`, `docs/TECH_DEBT.md` (one
  new P2, one new P3, the manual-axes P3 extended), `docs/FUTURE.md` (one stale line).

## Open

- The P2: a non-forcing Anthropic structured-output format. This unblocks the Anthropic rotation.
- The P3: GPT Image 2.5 `xhigh`/`max`, the xAI edits reference cap, the `/^gemini-3/`
  over-match, the endpoint-agnostic `'other'`-block effort check, and `gemini-2.5-pro`'s absence
  from its union. (Thinking `'none'` on models that cannot turn thinking off was fixed in this PR;
  see `result.md` §6a.)
