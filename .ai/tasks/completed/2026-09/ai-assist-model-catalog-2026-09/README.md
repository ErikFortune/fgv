# ai-assist-model-catalog-2026-09 — provider-line rotation, documentation-sourced

**Shipped**: 2026-09-24 via [#692](https://github.com/ErikFortune/fgv/pull/692), from
`claude/ai-assist-model-catalog-2026-09` against `release`. **Not verified against the live
provider APIs.** The user's testbed run is the confirmation gate.

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
- **The rotation has three manual axes, not two.** A successor can change what a declared mechanism
  does, as the forced-tool rejection did here. `docs/TECH_DEBT.md` records this.

## Files

- `libraries/ts-extras/src/packlets/ai-assist/registry.ts`: aliases, `defaultModel` comments,
  `idPattern` rules, the xAI image capability entry.
- `libraries/ts-extras/src/packlets/ai-assist/model.ts`: `*ModelNames` unions.
- `libraries/ts-extras/src/packlets/ai-assist/imageGenerationClient.ts`: xAI builders send
  `quality` when the capability declares it.
- Tests in `libraries/ts-extras/src/test/unit/ai-assist/`, and pins in `samples/testbed`.
- Docs: `libraries/ts-extras/CAPABILITIES.md`, the ai-assist `README.md`, `docs/TECH_DEBT.md` (one
  new P2, one new P3, the manual-axes P3 extended), `docs/FUTURE.md` (one stale line).

## Open

- The live testbed confirmation (the user's gate).
- The P2: a non-forcing Anthropic structured-output format. This unblocks the Anthropic rotation.
- The P3: per-model accepted thinking effort, GPT Image 2.5 `xhigh`/`max`, and the xAI edits
  reference cap.
