# Brief — ai-assist model quality-tier layer + OpenAI/Anthropic alias adoption (Phase A design)

**Status:** Phase A — design only. NO code ships. Deliverable is `design.md`.
**Branch:** `claude/ai-assist-model-tiers` (off `release`).
**Surface:** `@fgv/ts-extras` → `src/packlets/ai-assist` (active surface — additive/breaking OK per `.ai/instructions/ACTIVE_DEVELOPMENT.md`).
**Depends on:** the model-alias layer already shipped (`@<provider>:<role>` sigil, `IModelAliasMap`, `resolveModelAlias`/`resolveProviderModel`, Gemini aliased). See `.ai/tasks/completed/2026-06/ai-assist-model-aliases/` for the layer's design + the Gemini precedent to mirror.

## Mission

Add a **quality-tier axis** (`base` / `advanced` / `frontier`) to the ai-assist `ModelSpec` with **cascade fallback**, and adopt the existing alias layer for **OpenAI and Anthropic** (Gemini already uses it — extend it with tier entries). Advance the stale/dead OpenAI defaults in the process (its `image: 'dall-e-3'` default is **already EOL — support ended 2026-05-12**; `gpt-4o` base is well behind the GPT-5.x line).

## Locked decisions (do NOT re-litigate — design the mechanics around these)

1. **Three tiers:** `base` (required floor) / `advanced` (optional) / `frontier` (optional).
2. **Cascade fallback:** requesting `frontier` resolves `frontier` → else `advanced` → else `base`; `advanced` → else `base`. `base` is always defined. (The existing `resolveModel` at `model.ts:527` already does a flat "undefined context → base" fallback; the tier cascade is the one new resolver behavior — a **tier-specific** multi-step fallback, distinct from the modality keys which keep their existing flat →base fallback.)
3. **Base tier = general-purpose workhorse:** OpenAI `gpt-5.4-mini`, Anthropic `claude-sonnet-5`.
4. **Per-provider tier maps** (via the alias layer — each value is an `@<provider>:<role>` alias resolving to the concrete id):

   | Provider | base | advanced | frontier |
   |---|---|---|---|
   | OpenAI | `gpt-5.4-mini` | `gpt-5.5` | `gpt-5.5-pro` |
   | Anthropic | `claude-sonnet-5` | `claude-opus-4-8` | *(unset → cascades to advanced/opus)* |
   | Gemini | `gemini-3.5-flash` | `gemini-3.1-pro-preview` | *(unset → cascades to advanced/pro)* |

5. **OpenAI image advance:** default `image` → `gpt-image-1.5` (dall-e-3 EOL). Remove the dead `dall-e-2`/`dall-e-3` image-capability entries (mirror the Gemini Imagen removal). The existing `gpt-image-` capability prefix already covers `gpt-image-1.5` — verify, don't duplicate. **Flag:** `gpt-image-1.5` may require OpenAI API org verification — the live canary must confirm it answers.
6. **OpenAI embedding:** unchanged default (`text-embedding-3-small`); alias it for uniformity.
7. **Non-tier specialized models are aliases, NOT tiers:** `@anthropic:fable` → `claude-fable-5`, `@anthropic:haiku` → `claude-haiku-4-5-20251001`, `@openai:nano` → `gpt-5.4-nano`. Reachable via `modelOverride`, never as a `base/advanced/frontier` default.
8. **Scope = all three providers in one stream:** alias-adopt OpenAI + Anthropic; extend Gemini's existing alias block with tier entries.

## Design questions to resolve in `design.md` (recommend + justify each)

1. **`ModelSpecKey` extension.** Add `'advanced' | 'frontier'` to `ModelSpecKey` (`model.ts:461`) + `allModelSpecKeys`. Confirm this is purely additive and every existing consumer/switch is unaffected.
2. **Cascade resolver semantics.** Precise change to `resolveModel` (`model.ts:527`): a tier-fallback-order (`frontier→advanced→base`, `advanced→base`) that applies ONLY to the tier keys; modality keys (`tools`/`image`/`thinking`/`embedding`) keep flat →base. Specify how the cascade composes with the existing nested-spec recursion and the `resolveProviderModel` alias step. Cover edge cases (tier defined as a nested spec; tier value is itself an alias).
3. **Tier × modality interaction (scoping).** `resolveModel` takes a single `context: ModelSpecKey`. Tiers and modality keys are peers in one enum → a caller selects ONE. Confirm the v1 scoping decision: **combining a tier with a modality (e.g. "the frontier thinking model") is out of scope**; tiers select the text-completion default, modality keys select their modality, cascade applies only among tiers. State this explicitly and note the forward path if combination is ever needed.
4. **Per-provider `aliases` blocks + `defaultModel`.** Concrete alias maps for OpenAI and Anthropic (new `aliases` blocks + tiered `defaultModel`), and Gemini's extended block (add `advanced`/`frontier` — note `pro` already serves the `thinking` key, so it double-duties as the `advanced` tier; that's fine). Cite `model.ts`/`registry.ts` line refs. Anthropic has no embedding/image endpoints (per `LIBRARY_CAPABILITIES.md`) — text tiers only.
5. **New model-ID capability detection (necessary, not deferred).** The new default IDs (`gpt-5.5`, `gpt-5.5-pro`, `gpt-image-1.5`, `claude-sonnet-5`, `claude-opus-4-8`) must be correctly classified by the existing `idPattern` capability rules and the typed `*ModelNames` unions (`OpenAiThinkingModelNames`, etc.). Audit each new id against the current detection rules; specify the additive `idPattern`/`*ModelNames` edits needed so capabilities (thinking, image, tools) resolve correctly. (This is the *targeted* subset of the broader "retire manual axes" tech-debt — do only what these new IDs require; do not attempt the full manual-axis refactor here.)
6. **Back-compat.** A bare-string `defaultModel` and a `base`-only map must behave exactly as today (no tier requested → `base`). Confirm no existing export is removed/renamed except the intentional dead dall-e capability removal (call it out as the one break, on the active surface).
7. **Tiered implementation plan** (Phase B): suggested slicing (e.g. B1 tier axis + resolver + tests; B2 OpenAI adopt+advance; B3 Anthropic adopt; B4 Gemini extend + capability-detection + docs), each with its own gates.
8. **Live-testbed canary plan.** Per-provider: resolve `base`/`advanced`/`frontier` and confirm each concrete id answers on the live API. Call out the risk IDs: `gpt-image-1.5` (org verification), `gpt-5.5-pro` (may be access-gated), the Anthropic `claude-*-5`/`4-8` ids, and confirm the alias→concrete-id log line for each.

## Model-ID reference (verify against live APIs in the canary; current as of 2026-07)

- **OpenAI:** flagship `gpt-5.5` (`gpt-5.5-2026-04-23`), `gpt-5.5-pro`, cheaper `gpt-5.4-mini`/`gpt-5.4-nano`; image `gpt-image-1.5`/`gpt-image-1`/`gpt-image-1-mini` (**DALL·E 2/3 EOL 2026-05-12**); embeddings `text-embedding-3-small`/`-large` (still current). `gpt-5.1` was **retired** March 2026 — do not use.
- **Anthropic:** `claude-sonnet-5`, `claude-opus-4-8`, `claude-haiku-4-5-20251001`, `claude-fable-5`. Current registry base (`claude-sonnet-4-5-20250929`) is behind → advance to `claude-sonnet-5`.
- **Gemini:** already aliased (flash 3.5 / pro 3.1-preview / flash-image / embedding).

## Deliverable

`.ai/tasks/active/ai-assist-model-tiers/design.md` — scheme, resolver cascade semantics + edge cases, tier×modality scoping, per-provider alias/defaultModel maps, capability-detection edits, back-compat analysis, tiered Phase-B plan, per-provider canary plan, illustrative interface signatures. **No implementation, no registry edits.** Cite `file:path:line` for every registry/model claim.

## Conventions

`Result<T>`, no `any`, Converters for unknown→typed, additive where possible. `__`-prefix unused params (lint-mandated).

## Escalation

If any locked decision turns out to be technically unworkable (e.g. the cascade can't compose cleanly with nested specs), surface it with a recommended alternative rather than silently diverging.
