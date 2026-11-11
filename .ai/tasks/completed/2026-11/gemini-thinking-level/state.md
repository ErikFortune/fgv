# State: `gemini-thinking-level`

Worker-owned. The brief is frozen; questions and decisions go here.

## Progress

- [x] Read brief, FUTURE / TECH_DEBT entries, resolver, registry, adapters, testbed canary.
- [x] Fetched Google's pages 2026-11-11 (copies under the scratchpad `gemini/docs/`):
  - `https://ai.google.dev/gemini-api/docs/thinking.md.txt` → 301 → `https://aistudio.google.com/docs/thinking.md`
    (Interactions API, "Controlling thinking" table).
  - `https://aistudio.google.com/docs/thinking.md?generate-content=true` (generateContent — the wire
    ai-assist sends; level table, budget table, Gemini 4 deprecation callout).
  - `https://aistudio.google.com/docs/models/gemini-4-argon.md`, `.../docs/models.md`,
    `.../docs/whats-new-gemini-4-argon.md?generate-content=true`.
- [x] Red tests → implementation → green (result.md § 3).
- [x] Testbed rows.
- [x] Docs, change files.
- [x] Inline code-review pass, then coverage (100% both packages, no `c8 ignore` added).
- [x] Work committed (`b1ff1b03b`); first gate run (install, change, rebuild, lint green) — test run
  stopped when the orchestrator reported `integration/asks` moved to `5dcc3000f` (#774).
- [x] Merged `origin/integration/asks` (`eaaa791a1`, no rebase). One conflict in `model.ts` (imports:
  kept both) and one in `docs/FUTURE.md` (kept #774's new `gemini-embedding-2` entry, dropped the
  entry this stream closes). Gates re-run on the merged tree.
- [x] Close-out per `finalize-task`.

## Decisions (worker)

- **D1 — the level table is the generateContent page's table, not the Interactions page's.**
  ai-assist sends `generateContent`. The two pages disagree (the Interactions table lists levels for
  `gemini-2.5-pro`, while the generateContent page says "Gemini 2.5 series models don't support
  `thinkingLevel`"). Listed: `gemini-4-argon`, `gemini-4-carbon` (low/medium/high),
  `gemini-3.6-flash`, `gemini-3.5-flash-lite` (minimal/low/medium/high).
- **D2 — `gemini-3.8-flash` stays on the budget wire.** Its levels are low/medium/high, so on the
  level wire a generic `'none'` could only degrade or refuse. Budget 0 is live-verified to turn its
  thinking off (2026-11-10, no `thoughtsTokenCount`), pinned by `thinkingOffAndSampling.test.ts`.
  Moving it would trade a working off switch for a refusal. Decision 1 lets an unlisted model keep
  today's wire exactly.
- **D3 — `gemini-3.1-pro-preview` and `gemini-3.1-flash-lite` stay on the budget wire.** The
  generateContent level table has no 3.1 Pro column; `gemini-3.1-flash-lite` as a dash-bounded prefix
  would also catch `gemini-3.1-flash-lite-image` (minimal/high only) and is not an alias target.
- **D4 — Gemini 4 is thinking-required.** "You cannot disable thinking for Gemini 4 Carbon or Gemini 4
  Argon." Both go on `thinkingRequiredModelPrefixes`, so `'none'` degrades to `'low'` (their lowest
  level) or is refused under `onUnsupported: 'fail'` — the existing policy. A level model that is
  not thinking-required and lacks `minimal` refuses `'none'` naming its lowest level (no such model
  in the registry today; pinned with a test descriptor).
- **D5 — TECH_DEBT Pro leak.** Listed Pro ids already degrade/refuse. The remaining leak was an
  unlisted Pro id: `gemini-3-pro-preview` is added (Interactions table: levels "low, high", no off
  level). The refusal names the model and that it cannot run with thinking off.
- **D6 — explicit `thinkingLevel` + `thinkingBudget` in one block is refused on every model.** The
  doc names the 400 for Gemini 4; no page gives the pair a meaning on any other model, and the
  resolver carries one effort per provider. A block's level replaces an earlier budget and vice
  versa (later wins), so the resolved config never carries both.
- **D7 — explicit level on a listed model must be one of its levels** ("Not supported (error)" in
  the table). On an unlisted model the block is sent verbatim (the caller owns the wire).

## Review round 1 (independent review of `21eb1cb54`: no P1, four P2)

- **R1.1 (P2-1) — client-tool Gemini guard.** `executeClientToolTurn` now runs
  `checkCallerGeminiThinking` beside the Anthropic and OpenAI guards, keyed on `apiFormat === 'gemini'`:
  `geminiThinkingBudget: 0` on a thinking-required model, a `geminiThinkingLevel` the model's level rule
  does not list, and any level on a model that takes budgets only are a `Failure` before streaming.
  "Budgets only" is declared data, `geminiThinkingLevelRejectedModelPrefixes: ['gemini-2.5']`, from
  "Gemini 2.5 series models don't support `thinkingLevel`; use `thinkingBudget` instead" — no page
  says that of any other unlisted model, so elsewhere a level is still sent verbatim. The same
  declaration now refuses an explicit level in a `google` block (resolver and client-tool path agree).
  Resolves Q3.
- **R1.2 (P2-2)** — the level+budget refusal runs up front in that guard (a `Failure`, not an error
  event); the streaming adapter keeps `checkGeminiThinkingExclusive` as a backstop.
- **R1.3 (P2-3)** — `gemini-4-argon` records `maxOutputTokens: 32768`, the per-request non-streaming
  cap, not the page's 65,536 (streaming / default synchronous). Carbon has no `maxOutputTokens` entry.
  Resolves Q2.
- **R1.4 (P2-4)** — longer rules for the variants the generateContent table gives a different level
  set: `gemini-3.1-flash-lite-image` (minimal, high). `gemini-3.1-flash-lite` has a column ("Gemini 3.5
  & 3.1 Flash-Lite"), so it is on the level wire (`'none'` → `minimal`); "Gemini 3 Flash"
  (`gemini-3-flash-preview`) too. No variant of `gemini-3.6-flash`, `gemini-3.5-flash-lite` or Gemini 4
  is named on the fetched pages; the registry comment says a future one needs its own longer rule.
  Robotics ER 2 left off (not a completion target; its streaming sibling's level set is unstated).
  Revises D3.
- **R1.5 (P3)** — README stale `gemini-3.6-flash` line fixed; `gemini-3.6-flash` and
  `gemini-3-pro-preview` added to `GeminiThinkingModelNames` (`gemini-3.5-flash-lite` was already
  there); new `{@link}`s qualified as `AiAssist.X` — this turns the 12 "does not have an export"
  warnings into the "not supported yet by the resolver" kind every other `AiAssist.X` link in
  `etc/ts-extras.api.md` carries (319 at base); only code spans would remove them, so the warning
  count stays and the category matches the convention. `GeminiThinkingLevel` is
  `StringOneOf<typeof allGeminiThinkingLevels>` over the `as const` array the converter uses; the
  tier-1 level failure is returned with `withType` instead of re-wrapped; the test's inline
  `await import` is a top-of-file import.
- **R1.6 (P3)** — Q1 recorded in `docs/TECH_DEBT.md` as a P3; behaviour unchanged.

## Open questions

- Q3 (resolved by R1.1) — #774 added client-tool guards refusing a hand-built OpenAI-format `'none'` effort on a
  thinking-required model. The Gemini analogue (a caller-built `resolvedThinking` with
  `geminiThinkingBudget: 0` for `gemini-3.1-pro-preview`, or `geminiThinkingLevel: 'minimal'` for
  `gemini-4-argon`) still reaches the wire as a provider 400; only the level+budget pair is refused
  locally. Not in this brief's scope (the client-tool builder belonged to `model-followups`).

- Q1 (→ TECH_DEBT P3, R1.6) — Gemini 4 Argon "Remove deprecated parameters: Remove `temperature`, `top_p`, `top_k` …
  If provided, sampling parameters are ignored." ai-assist still sends a caller's temperature
  (ignored, not rejected). Out of this brief's scope; should `samplingParamsRejectedModelPrefixes`
  (or a new "ignored" list) cover it?
- Q2 (resolved by R1.3) — Argon non-streaming `generateContent` returns at most 32,768 tokens per request ("a single
  non-streaming request (`generateContent`) returns up to `32,768` tokens"); the recorded limit is
  the page's 65,536 "Max output (default synchronous)". A non-streaming call asking for more stops at
  the hop cap (long decode / continuation is not implemented).
