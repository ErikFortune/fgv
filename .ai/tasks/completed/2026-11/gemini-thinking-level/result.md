# Result: `gemini-thinking-level`

**Shipped:** ai-assist sends Gemini's `thinkingLevel` on the models a declared per-model table names (Gemini 4, `gemini-3.5-flash-lite`, `gemini-3.6-flash`), and `@google-gemini:pro` now resolves to `gemini-4-argon`.

Branch `gemini-thinking-level` off `origin/integration/asks` @ `5170a1d11`. Packages:
`@fgv/ts-extras` (`ai-assist`, change file `minor`, `BREAKING:` prefix) and `@fgv/testbed` (`none`).

## 1. Outcome per decision

| brief decision | outcome |
|---|---|
| 1. per-model level table, declared data | `IAiProviderDescriptor.geminiThinkingLevels` (`IGeminiThinkingLevelRule { modelPrefix, levels }`, lowest first), read by `resolveGeminiThinkingLevels` (exact-or-dash-bounded, longest prefix wins). A matching model is sent `thinkingLevel`; every other model keeps `thinkingBudget` byte-for-byte. No provider/model `if` in adapter code: the adapters call `geminiThinkingConfigWire`. Listed: `gemini-4-argon`, `gemini-4-carbon` (low/medium/high), `gemini-3.6-flash`, `gemini-3.5-flash-lite` (minimal/low/medium/high). Not listed, with reasons in the registry comment and `state.md` D2/D3: `gemini-3.8-flash`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite`, the 2.5 line. |
| 2. generic effort mapping | `'none'` → `minimal` where listed; `low`/`medium`/`high` 1:1; an unlisted effort is refused naming the allowed set. `'none'` on a level model without `minimal`: thinking-required → the existing degrade-to-`low` / `onUnsupported: 'fail'` policy, whose refusal now names the lowest level; otherwise refused "it has no thinking-off level; its lowest thinking level is '…'". |
| 3. Pro budget-0 leak (TECH_DEBT) | Closed. Listed Pro ids already degraded/refused; the remaining reachable unlisted Pro id, `gemini-3-pro-preview`, is added to `thinkingRequiredModelPrefixes`. A generic `'none'` no longer emits `thinkingBudget: 0` to any Pro id with evidence. |
| 4. caller-explicit config | `IGeminiThinkingConfig.thinkingLevel?: GeminiThinkingLevel`, validated by the new public converter `geminiThinkingLevel`; a level a declared model does not list is refused; level + budget in one block is refused (docs: 400 on Gemini 4; D6 explains refusing it on every model); a later block's level replaces an earlier budget and vice versa. A caller-built `resolvedThinking` with both is refused by the Gemini streaming adapter (the `executeClientToolTurn` entrance). |
| 5. rotate `@google-gemini:pro` → `gemini-4-argon` | Done: Argon is "Stable" (§ 2). Declared on `maxOutputTokens` (65536), `GeminiThinkingModelNames` (with `gemini-4-carbon`), capability detection (`/^gemini-4/` → chat, tools, vision, thinking), `thinkingRequiredModelPrefixes`, the level table. Structured output is the existing Gemini catch-all (`gemini-response-schema`), which Argon supports. Change file `minor`, `BREAKING:`. |
| 6. flash-lite interim | Removed from `thinkingRequiredModelPrefixes`; `'none'` is sent as `thinkingLevel: 'minimal'`. |

Also: `IGeminiThinkingConfig` moved from `model.ts` to the new `geminiThinking.ts` (still exported from
the `AiAssist` barrel) because `model.ts` was at its 2000-line `max-lines` limit. The testbed's
`rawNoneModels` / `ICanaryRawNoneRule` mechanism was deleted: its only user was the flash-lite budget-0
rule this stream retires, and it would otherwise have been uncovered dead code.

## 2. Doc citations (all fetched 2026-11-11)

`https://ai.google.dev/gemini-api/docs/thinking.md.txt` answers 301 to
`https://aistudio.google.com/docs/thinking.md.txt`; Google's `llms.txt` says "Use the Interactions API
… `generateContent` is still supported … but is considered a legacy API" and labels the generateContent
pages `?generate-content=true`. ai-assist sends `generateContent`, so the generateContent page is the
authority; where the two pages disagree it wins (D1).

**Thinking (generateContent)** — `https://aistudio.google.com/docs/thinking.md?generate-content=true`:
- "The `thinkingLevel` parameter, required for Gemini 4 and recommended for Gemini 3 models, lets you
  control reasoning behavior. Gemini 4 (`gemini-4-carbon` and `gemini-4-argon`) supports `low`,
  `medium` (default), and `high`."
- Level table, `minimal` row: "Gemini 3.8 Flash: Not supported (error) · Gemini 4 Carbon & Argon: Not
  supported (error) · Gemini 3.5 & 3.1 Flash-Lite: Supported (Default) · … Gemini 3.6 Flash: Supported";
  description "Matches the "no thinking" setting for most queries. … Note, `minimal` does not guarantee
  that thinking is off." The `low`, `medium`, `high` rows: Supported for 3.8 Flash, Gemini 4, 3.5 & 3.1
  Flash-Lite and 3.6 Flash.
- "You cannot disable thinking for Gemini 4 Carbon or Gemini 4 Argon. Gemini 3 Flash and Flash-Lite also
  do not support full thinking-off, but the `minimal` setting means the model likely will not think
  (though it still potentially can)."
- "Gemini 2.5 series models don't support `thinkingLevel`; use `thinkingBudget` instead."
- Callout: "In Gemini 4 models (`gemini-4-carbon` and `gemini-4-argon`), `thinkingBudget`
  (`thinking_budget`) is deprecated. If passed alone, it maps to the nearest `thinkingLevel`
  (`thinking_level`) and returns a warning; sending `thinkingBudget` and `thinkingLevel` together
  returns a `400` error."
- Budget table: "2.5 Pro | Dynamic thinking | `128` to `32768` | N/A: Cannot disable thinking".
- Gemini 4 limits: "a single non-streaming request (`generateContent`) returns up to `32,768` tokens".

**Thinking (Interactions)** — `https://aistudio.google.com/docs/thinking.md`, § Controlling thinking:
"| gemini-4-argon | On (medium) | low, medium, high |", "| gemini-3.5-flash-lite | On (minimal) | minimal,
low, medium, high |", "| gemini-3.1-pro-preview | On (high) | low, medium, high |",
"| gemini-3-pro-preview | On (high) | low, high |" (the evidence for adding `gemini-3-pro-preview` to the
thinking-required list), and "| gemini-2.5-pro | On | low, medium, high |" (contradicted by the
generateContent page for the wire ai-assist uses).

**Gemini 4 Argon** — `https://aistudio.google.com/docs/models/gemini-4-argon.md`:
"Gemini 4 Argon (`gemini-4-argon`) is our efficient Gemini 4 frontier reasoning model"; "Stable:
`gemini-4-argon`"; "Inputs Text, Image, Video, Audio, and PDF"; "Max output 65,536 (default synchronous)
/ up to 1,048,576 (with long decode)"; Structured outputs, Function calling, Grounding with Google
Search: supported; "Thinking: Supported (low, medium, high)"; "Latest update October 2026".

**What's new in Argon** — `https://aistudio.google.com/docs/whats-new-gemini-4-argon.md?generate-content=true`:
"Replace `thinking_budget` with `thinking_level`: `thinking_budget` still works and maps to the nearest
`thinking_level`, but it returns a warning"; "Remove deprecated parameters: Remove `temperature`,
`top_p`, `top_k`, and `candidate_count` from requests. If provided, sampling parameters are ignored."
(Q1); "Explicit caching … is not supported on Gemini 4 Argon" (ai-assist does no Gemini explicit caching).

**Models overview** — `https://aistudio.google.com/docs/models.md`: "All Gemini 4 models … Gemini 4
Carbon `gemini-4-carbon` · Gemini 4 Argon `gemini-4-argon`"; 3.1 Pro is listed as `gemini-3.1-pro-preview`.

## 3. Red → green

- **Type-level red.** The new `geminiThinkingLevel.test.ts` (66 tests) against the base tree: 21
  TypeScript errors (`thinkingLevel` does not exist in `IGeminiThinkingConfig`, no
  `resolveGeminiThinkingLevels`, no `geminiThinkingLevel` converter, `geminiThinkingLevel` not on
  `IResolvedThinkingConfig`) — `rush build --to @fgv/ts-extras` failed.
- **Data red.** With the implementation in place and `registry.ts` reverted to the base commit, 29 of
  the new tests failed, including: flash-lite `'none'` → `minimal`; Argon levels; the `@google-gemini:pro`
  rotation; Argon `'none'+fail` refusal; `gemini-3-pro-preview` `'none'` sending budget 0 (the TECH_DEBT
  leak); an undeclared explicit level being sent; capability detection.
- **Call-site red (per TESTING_GUIDELINES § caller enumeration).** `resolveGeminiThinkingLevels` is
  threaded at two call sites. Replacing it with `undefined` in `streamingClient.ts` turned exactly the
  streaming-path test red (1 failure); in `completionClient.ts`, 21 failures. Both restored.
- **Green.** `heft test` in `ts-extras`: all suites pass, 100% on every metric; testbed: all pass, 100%.
- Updated existing pins: `registry.test.ts` (thinking-required row for Gemini, tier targets),
  `modelAlias.test.ts`, `apiClient.thinking.test.ts` (advanced `'none'` → `thinkingLevel: 'low'`),
  `thinkingOffAndSampling.test.ts` (flash-lite `'none'` → `minimal`, with or without `'fail'`).

## 4. Inline code-review pass (author-run; no subagents)

Rubric applied to the diff before coverage closure:
- No `any`; the explicit level goes through a converter (`Converters.enumeratedValue` over
  `allGeminiThinkingLevels`); no unsafe casts in source.
- Result pattern: `applyBlock` now returns `Result` and the block tiers are folded with
  `reduce`/`onSuccess`; one single `isFailure` check remains in the tier-1 switch (no stacked checks).
- Fixed in the pass: a duplicated `@param` block in `mergeThinkingConfig`'s TSDoc; `outcome()` reading a
  variable reassigned inside `onSuccess` (now takes the merged config as a parameter); a stale TSDoc
  claim that provider blocks are "not checked" (now: not checked against the `'none'` rule).
- The pre-existing `c8 ignore` on the unreachable Gemini branch in `applyBlock` is gone with the branch.
  No `c8 ignore` added.
- `max-lines` on `model.ts` (2042 > 2000) resolved by moving `IGeminiThinkingConfig` to `geminiThinking.ts`.

## 5. Gates (from `/home/user/fgv-gemini`)

Work committed first (`b1ff1b03b`), then merged with `origin/integration/asks` @ `5dcc3000f` (#774)
as `eaaa791a1` (conflicts: `model.ts` imports, kept both; `docs/FUTURE.md`, kept #774's
`gemini-embedding-2` entry and dropped the closed one). Gated on the merged tree, graded by grep
(`not met|Operations failed|error TS|Jest tests? failed|ERR_PNPM` must be 0; `grep -ci warning` only
the tracked-symlink notice):

| gate | result |
|---|---|
| `install` | exit 0, 0 hits |
| `change --verify --target-branch origin/integration/asks` | exit 0 (ts-extras, testbed change files found) |
| `rebuild` | exit 0, 0 hits, 1 warning line (tracked symlink) |
| `lint` | exit 0, 0 hits, 1 warning line (tracked symlink) |
| `test` | exit 0, `SUCCESS: 38 operations` (1 more defines no work), 0 hits, 1 warning line (tracked symlink); `ts-extras` and `testbed` at 100% coverage |

## 6. Testbed run sheet — `google-gemini-model-tiers`

Keyless (`PENDING`, expectation in parentheses) → keyed expectation:

| row | concrete | wire sent | expected |
|---|---|---|---|
| `base effort=none` | gemini-3.8-flash | `thinkingBudget: 0` | PASS (sent with thinking off) |
| `base effort=low` / `high` | gemini-3.8-flash | budget 1024 / 8192 | PASS |
| `advanced effort=none` (and `frontier`) | gemini-4-argon | `thinkingLevel: 'low'` | PASS (degraded to thinkingLevel 'low') |
| `advanced effort=low` / `high` (and `frontier`) | gemini-4-argon | `low` / `high` | PASS |
| `@google-gemini:flash-lite effort=none` | gemini-3.5-flash-lite | `thinkingLevel: 'minimal'` | PASS |
| `@google-gemini:flash-lite effort=low` / `high` | gemini-3.5-flash-lite | `low` / `high` | PASS |
| `base none+fail` | gemini-3.8-flash | budget 0 | PASS |
| `advanced none+fail` (and `frontier`) | gemini-4-argon | — | REFUSED-LOCALLY |
| `advanced none raw` (and `frontier`) | gemini-4-argon | `thinkingConfig: { thinkingLevel: 'minimal' }` via an `'other'` block | EXPECTED-REJECT (text must match `/budget\|thinking/i`) |
| `@google-gemini:flash-lite none+fail` | gemini-3.5-flash-lite | `minimal` | PASS |
| `advanced level=low` (and `frontier`) | gemini-4-argon | explicit `thinkingLevel: 'low'` | PASS |
| `@google-gemini:flash-lite level=minimal` | gemini-3.5-flash-lite | explicit `minimal` | PASS |
| `max=65536` rows | 3.8-flash, argon ×2, flash-lite | `maxOutputTokens: 65536` | PASS |

Run: `GEMINI_API_KEY=… node samples/testbed/lib/cli.js run google-gemini-model-tiers` (or the web runner).
Findings to watch: an Argon raw-minimal row that *answers* (Google started accepting `minimal`); a
`FAIL(param)` on any level row (a declared level is wrong); a non-streaming Argon `max=65536` row that
stops at 32,768 (Q2). The keyed path is dry-run against a fake Gemini in `modelTiersRequests.test.ts`.
No live call was made in this stream.

## 7. Records closed

- `docs/FUTURE.md` § "`ai-assist` — send Gemini's `thinkingLevel`, then rotate `@google-gemini:pro` to
  Gemini 4" — removed.
- `docs/TECH_DEBT.md` "[P3] Generic `effort: 'none'` maps to a Gemini value that errors on Pro-family
  models" — struck through, "Resolved by `gemini-thinking-level` (PR #TBD)".
- `model-alias-refresh` Q3 (held Argon rotation) — done; the alias comment in `registry.ts` rewritten.
- The flash-lite interim on `thinkingRequiredModelPrefixes` — removed.

## 8. Open questions

See `state.md` § Open questions: Q1 (Argon ignores `temperature`; ai-assist still sends it), Q2 (Argon
non-streaming 32,768-token hop cap vs the recorded 65,536), Q3 (a hand-built Gemini off value on a
thinking-required model is not refused on the client-tool path, unlike #774's OpenAI-format guard).

## 9. Close-out antagonist pass (self-run; no subagent could be spawned)

Checked against the artifacts: every Google quote in § 2 re-matched against the saved page copies
(the Argon what's-new quote drops the page's bold markup only); `model-alias-refresh` Q3 is the held
Argon rotation (`result.md:51` there); the FUTURE entry did list `gemini-3.8-flash` as a level model,
so keeping it on the budget wire is a real divergence and is recorded in `meta.yaml`; counts (66 new
tests, 29 data-red, 21 type errors, 1 and 21 call-site reds) are from the logs of those runs. The
PR number is unknown at close: `meta.yaml` `prs` is empty and the README, ledger entry and TECH_DEBT
line say `#TBD`, so the capability-feed line has no PR link until `prs` is filled and the feed is
regenerated. Q1–Q3 are recorded in `state.md`, this file and the ledger entry, not in
`FUTURE.md` / `TECH_DEBT.md` — left for the orchestrator to route.
