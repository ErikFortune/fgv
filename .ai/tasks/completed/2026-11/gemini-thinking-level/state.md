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

## Open questions

- Q3 — #774 added client-tool guards refusing a hand-built OpenAI-format `'none'` effort on a
  thinking-required model. The Gemini analogue (a caller-built `resolvedThinking` with
  `geminiThinkingBudget: 0` for `gemini-3.1-pro-preview`, or `geminiThinkingLevel: 'minimal'` for
  `gemini-4-argon`) still reaches the wire as a provider 400; only the level+budget pair is refused
  locally. Not in this brief's scope (the client-tool builder belonged to `model-followups`).

- Q1 — Gemini 4 Argon "Remove deprecated parameters: Remove `temperature`, `top_p`, `top_k` …
  If provided, sampling parameters are ignored." ai-assist still sends a caller's temperature
  (ignored, not rejected). Out of this brief's scope; should `samplingParamsRejectedModelPrefixes`
  (or a new "ignored" list) cover it?
- Q2 — Argon non-streaming `generateContent` returns at most 32,768 tokens per request ("a single
  non-streaming request (`generateContent`) returns up to `32,768` tokens"); the recorded limit is
  the page's 65,536 "Max output (default synchronous)". A non-streaming call asking for more stops at
  the hop cap (long decode / continuation is not implemented).
