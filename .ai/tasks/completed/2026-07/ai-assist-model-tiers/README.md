# `ai-assist-model-tiers` — completion record

**Shipped:** a cross-provider **quality-tier axis** (`base`/`advanced`/`frontier`) on the ai-assist `ModelSpec` with cascade fallback + composition, alias adoption for **OpenAI and Anthropic** (Gemini already aliased → extended with tiers), and two completion-path bug fixes the live canary surfaced.
**Workflow shape:** design (Phase A + revision) → tiered implementation (B1–B5) on the `ai-assist-model-tiers` integration branch → cluster-close squash to `release`.
**Integration branch:** `claude/ai-assist-model-tiers-hmw86u`.

## What shipped

- **Quality-tier axis.** `ModelSpecKey = 'base' | 'advanced' | 'frontier' | 'image' | 'embedding'`. A completion/streaming call takes an optional `tier?: 'advanced' | 'frontier'` (omit → `base`). **Cascade** (`frontier → advanced → base`) lets a provider declare only the tiers it differentiates.
- **Composition, not competition.** Thinking and tools are orthogonal params/capabilities — they never select a model; the tier does. `thinking`/`tools` `ModelSpecKey`s were removed. Every base model is thinking-capable, so `tier + thinking` composes with zero capability checks. (Revised from the initial "modality overrides tier" scoping after the user flagged the confusion — see design.md Q3.)
- **Alias adoption.** OpenAI (`@openai:mini/flagship/pro` + `image`/`embedding` + non-tier `@openai:nano`) and Anthropic (`@anthropic:sonnet/opus` + non-tier `@anthropic:haiku/fable`) gained `aliases` blocks + tiered `defaultModel`; Gemini gained the `advanced` tier key (reusing `@google-gemini:pro`). DALL·E surface retired (EOL 2026-05-12); required `claude-sonnet-5` thinking-detection fix (`/^claude-sonnet-4/ → /^claude-sonnet-/`).
- **Two completion-path bugs fixed (surfaced by the live canary — the "100% coverage on a wire the tests never exercised" failure mode):**
  1. `callProviderCompletion`/`Stream` no longer inject a default `temperature` (0.7) — it's sent only when the caller explicitly provides one. Current-gen models (Anthropic Claude-5, OpenAI gpt-5.5) reject a default temperature and were 400ing.
  2. OpenAI `frontier` (`gpt-5.5-pro`) is Responses-API-only → dropped the frontier key so it cascades to `advanced` (`gpt-5.5`); the alias is retained for `modelOverride`/future Responses routing.

## Live verification (the gate)

Keyed canary, all three providers **LIVE-VERIFIED** across every tier (base/advanced/frontier-cascade):
- OpenAI `gpt-5.4-mini` / `gpt-5.5` / frontier→`gpt-5.5`.
- Anthropic `claude-sonnet-5` / `claude-opus-4-8` / frontier→opus.
- Gemini `gemini-3.5-flash` / `gemini-3.1-pro-preview` / frontier→pro.

## Cross-provider tier table

| slot | OpenAI | Anthropic | Gemini |
|---|---|---|---|
| base | `@openai:mini` → gpt-5.4-mini | `@anthropic:sonnet` → claude-sonnet-5 | `@google-gemini:flash` → gemini-3.5-flash |
| advanced | `@openai:flagship` → gpt-5.5 | `@anthropic:opus` → claude-opus-4-8 | `@google-gemini:pro` → gemini-3.1-pro-preview |
| frontier | *(unset → advanced)* | *(unset → advanced)* | *(unset → advanced)* |

## Slices

- **B1 (#511):** tier axis + `TIER_FALLBACK` cascade resolver + composition rewire (`thinking`/`tools` out of selection) + xAI/Gemini dead-key strip.
- **B2 (#512):** OpenAI alias adoption + tier defaults + DALL·E retirement (incl. `AiImageSize`/`AiImageQuality` narrowing).
- **B3 (#513):** Anthropic alias adoption + tier defaults + the required sonnet-5 thinking-detection broadening.
- **B4 (#514):** Gemini `advanced` tier + docs (README + LIBRARY_CAPABILITIES) + testbed tier canaries (honest STOP-FLAG, no faked live result).
- **B5 (#515):** temperature fix + OpenAI frontier cascade + canary classifier P1 tightening + `docs/FUTURE.md` fast-follow.

## Fast-follow (deferred — `docs/FUTURE.md`)

**OpenAI frontier via Responses routing** — route Responses-API-only models (`gpt-5.5-pro`) through the OpenAI Responses API inside `callProviderCompletion`, making `@openai:pro` an invokable frontier tier again.

## Artifacts

`brief.md` (Phase A) · `design.md` (scheme, cascade, composition revision, per-provider maps, capability audit, back-compat, Phase-B plan, canary plan) · this README.
