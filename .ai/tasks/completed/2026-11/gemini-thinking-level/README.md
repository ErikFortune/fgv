# gemini-thinking-level — send Gemini's `thinkingLevel`; rotate `@google-gemini:pro` to Gemini 4

**Shipped**: 2026-11-11, PR #775 (targets `integration/asks`, after #774).
Packages: `@fgv/ts-extras` (`ai-assist`, change file `minor`, `BREAKING:`) and `@fgv/testbed` (private,
change file `none`).

## Summary

Gemini 4 requires `thinkingLevel` and deprecates the `thinkingBudget` ai-assist sent, and Gemini 3.x
Flash-Lite cannot be turned off by a budget. The Gemini descriptor now carries a declared level table,
`geminiThinkingLevels` (read through `resolveGeminiThinkingLevels`): `gemini-4-argon` and
`gemini-4-carbon` take `low` / `medium` / `high`; `gemini-3.5-flash-lite` and `gemini-3.6-flash` also
take `minimal`. On those models a generic effort is sent as a level — `'none'` as `minimal` where
listed — and every other Gemini model keeps the budget wire unchanged. `@google-gemini:pro` (the
advanced tier and the frontier cascade) now resolves to `gemini-4-argon`.

## What a reader should know

- **`gemini-3.8-flash` (the base tier) deliberately stays on the budget wire.** Its levels have no off
  value, while budget 0 is live-verified to turn its thinking off (`state.md` D2).
- **Gemini 4 cannot turn thinking off**, so it is thinking-required: `'none'` is sent as `low`, or
  refused naming that lowest level under `onUnsupported: 'fail'`.
- **The TECH_DEBT Pro leak is closed**: `gemini-3-pro-preview` joined `thinkingRequiredModelPrefixes`;
  `gemini-3.5-flash-lite` left it (`minimal` is its off value now).
- **Explicit blocks**: `IGeminiThinkingConfig.thinkingLevel` is converter-validated and must be a level
  the model declares; level + budget in one block is refused (Gemini 4 400s on the pair).
- No live call was made. Every change is proven by request-body tests shown red first
  (`result.md` § 3); the testbed tier canary carries PENDING rows for a keyed run (`result.md` § 6).
- **Review round 1** added: a Gemini guard on `executeClientToolTurn` (budget 0 on a thinking-required
  model, an unaccepted level, or level + budget is a `Failure` before streaming); the budget-only 2.5
  line refuses an explicit level; level rules for `gemini-3.1-flash-lite`, `gemini-3.1-flash-lite-image`
  (minimal, high — a longer rule that outranks the shorter one) and `gemini-3-flash-preview`; and
  Argon's recorded output limit is 32,768, the per-request non-streaming cap.
- Open: Argon ignores `temperature` — recorded as a `docs/TECH_DEBT.md` P3, behaviour unchanged.

## Artifacts

- `brief.md`: the frozen contract
- `state.md`: decisions D1–D7, review round 1 R1.1–R1.6, open questions Q1–Q3 (Q2, Q3 resolved)
- `result.md`: outcome per decision, doc citations, red/green evidence, gates, run sheet
- `meta.yaml`
