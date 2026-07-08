# `ai-assist-model-aliases` — completion record

**Shipped:** canonical model-alias layer for the ai-assist provider registry + Gemini 2.5→3.x migration + Imagen removal + a Gemini client-tool `thoughtSignature` continuation fix.
**Workflow shape:** design (Phase A) → tiered implementation on the `ai-assist-model-aliases` integration branch → cluster-close squash to `release`.
**Branch:** `ai-assist-model-aliases` (integration); promotion PR #508.
**Forcing function:** Google is retiring every Gemini model the registry pinned (2.5 line + Imagen, Oct 2026) — alias the registry off dated snapshots so a future line-bump is a one-line map edit, not a consumer break.

## What shipped

A generic, fgv-owned **canonical model-alias layer** (`@<provider>:<role>` sigil — e.g. `@google-gemini:flash`) that resolves, in one central place, to the current concrete provider model. Applied to Gemini now; other providers adopt incrementally (additive). Raw model IDs still work unchanged (back-compat preserved).

- **Tier 1 (#505):** generic alias core — `MODEL_ALIAS_SIGIL`, `IModelAliasMap`, `resolveModelAlias` / `resolveProviderModel`, resolved at the completion / image / embedding / tool chokepoints (downstream of `ModelSpecKey`, upstream of the `idPattern` capability rules).
- **Tier 2 (#506):** Gemini descriptor migration — `aliases` block; `defaultModel` switched to aliases (incl. `thinking: '@google-gemini:pro'`); Imagen capability removed; `Gemini*ModelNames` bumped to 3.x; `/^gemini-3/` idPattern added.
- **Tier 3 (#507):** testbed canary (`gemini-client-tools` pinned to `@google-gemini:flash` with resolved-id logging) + the `crossProviderEmbeddingSearch` alias-resolution-before-capability-lookup fix + docs (LIBRARY_CAPABILITIES alias scheme, packlet README, two stale `gemini-imagen` references swept) + a TECH_DEBT P3 for residual manual axes.
- **Gemini `thoughtSignature` fix (folded in):** with thinking enabled, Gemini stamps a part-level `thoughtSignature` on each `functionCall` part and requires it echoed back on the continuation's model turn. The Gemini path never captured/replayed it, so thinking-enabled client-tool continuations 400'd. Now captured during stream accumulation (`IAccumulatedGeminiFunctionCall.thoughtSignature`) and replayed by `buildGeminiContinuation` as a sibling of `functionCall` when present. Pre-existing latent gap surfaced by the live canary — not an alias regression. See `gemini-thought-signature-fix.md`.

## Live verification (the gate)

Both replacements are `-preview`-adjacent IDs, so a live run is what proves they're real. Run against live Gemini (orchestrator gate, creds-required):

- `gemini-client-tools` → `resolved @google-gemini:flash -> gemini-3.5-flash`; first turn + continuation turn both accepted; model answered. **PASS** (after the thoughtSignature fix).
- `cross-provider-embedding-search` → `@google-gemini:embedding -> gemini-embedding-001`, 3072-d, taskType asymmetry honored, ranking sane. **PASS.**

`@google-gemini:pro` and `@google-gemini:flash-image` are mechanism-verified (identical resolution path) but not exercised by a live scenario.

## Locked decisions (design.md §9)

- **Thinking alias = Pro** (`@google-gemini:pro` → `gemini-3.1-pro-preview`), not flash-lite.
- **Imagen removed now** (not aliased to a successor) — converge image generation on the Gemini image-out path.
- **Aliases live on the descriptor** (`IAiProviderDescriptor.aliases`), resolved centrally.

## Fast-follows (deferred)

- OpenAI alias adoption (`@openai:reasoning -> gpt-5.1`) — additive, when a consumer needs it.
- Retire the residual manual axes (idPattern regex + `*ModelNames` constants) so a line-bump is purely a map edit — TECH_DEBT P3.

## Artifacts

`brief.md` (Phase A) · `design.md` (scheme, resolution model, back-compat, Gemini map, maintenance/testbed story, tiered plan, locked decisions) · `state.md` · `gemini-thought-signature-fix.md` (bug-fix brief) · this README.
