# State — `ai-assist-prompt-caching`

**Branch:** `claude/ai-assist-prompt-caching`

| phase | status | artifact |
|---|---|---|
| A — research | ✅ complete (2026-09-07) | `research.md` |
| B — design | ✅ complete (2026-09-08); OQs closed 2026-09-17; verified 2026-09-18 | `design.md` (+ §14) |
| triage | ⏭️ not used — questions decided directly; see `design.md` process note | — |
| C — implement | ⛔ not started; ready to scope. **Read `design.md` §14 first** | — |

## Phase B checkpoint

**Deliverable:** `design.md`. No implementation, no PR, no surface committed to.

**Brief claims re-verified against the tree — all five hold.** No falsification.
Details in `design.md` §0.

**Four additions the brief did not have** (`design.md` §0):

- **F1** — `ts-prompt-assist` already depends on `@fgv/ts-extras` and already imports
  `AiAssist` (`outputPipeline.ts:7`). The dependency direction is enforced by the
  package graph, and the cache-plan type therefore belongs in `ai-assist`.
- **F2** — the tuple needs a third axis, the **wire endpoint**. `apiFormat: 'openai'`
  splits at runtime into Chat Completions vs Responses on `hasTools`, and cache-write
  reporting exists only on the latter.
- **F3** — xAI is reached over the OpenAI-compatible path, so `research.md` §3.2's proto
  field names are not the ones the code will see. Resolves research §3.4; opens **OQ-1**.
- **F4** — `IAiStructuredOutputCapability` (model-keyed, longest-prefix-wins) and
  `IAiEmbeddingResult.usage?` are the implementation and reporting templates.

**Principal decisions:** three-slice phase C (C1 observability ∥ C2 diagnostics, then C3
emit); a closed three-level vocabulary with provenance; at most **two** breakpoints ever,
so the shared four-cap is unreachable; offsets rather than content blocks at the
`ai-assist` boundary; no `prompt_cache_options` on OpenAI; Gemini explicit `CachedContent`
out of scope with five reasons; thresholds model-keyed or caller-supplied, never constant,
with "unknown" a first-class diagnostic outcome.

**Open questions carried to triage:** OQ-1 (xAI live check — cheap, do first), OQ-2
(second research pass is not a gate), OQ-3 (`prompt_cache_key` in C1 or C3), OQ-4
(Anthropic top-level auto-cache), OQ-5 (is C1 one stream or two).

> *Superseded 2026-09-17:* all five were decided directly rather than through `/triage-cycle`
> — OQ-1 by a live `xai-cache-probe` testbed run, the rest by argument. Reasoning per question
> is in `design.md` §12. This paragraph is left as written because it records what was carried
> forward at the phase-B boundary.

## Pre-C1 verification pass — 2026-09-18

`design.md` §14. Re-verified §0 and the code-anchored claims of §§4–9 against the branch as
merged (`609dcfb2`, carrying `release` @ `dbe028ea`). **No falsification.** Line citations
drifted; a drift table is in §14 rather than in-place edits.

- **A1 — bookkeeping.** §9's *"C3 should sequence after that stream lands"* is discharged:
  `ai-assist-thinking-anchoring` shipped via #667 and needed **no** change to
  `completionClient.ts` or `streamingClient.ts`, so C3's path is unblocked and uncontended.
  The *semantic* effort/cache coupling is untouched, and `'none'` joining the generic effort
  vocabulary in the same PR is a new, provider-oblivious way to vary effort per turn.
- **A2 — new OQ-6; changes the C1 surface.** `ai-assist-thinking-events` (🟡 ready) declares
  `thinkingTokens?: number` on `IAiCompletionResponse` — a second token-accounting home beside
  C1's `usage`. Each stream's brief defers to the other, so **neither owns the relationship**
  and no gate on either side would catch it. Recommendation: `thinkingTokens` goes *inside*
  `IAiCompletionUsage`. Whichever ships first sets the shape, which argues for C1 not waiting
  and for recording the decision in C1's PR description.
- **A3 — resizes C1; OQ-5 was decided without it.** No completion path parses any usage field
  today (`grep -c usage` on `completionClient.ts` / `streamingClient.ts` returns `0`/`0`). C1
  is a wire interface + validator entry + mapper across **five** response shapes, not a field
  read on one; the natural cut is by response shape. The Anthropic path has no validator at
  all — hand-checked casts at `completionClient.ts:581-582`, a checklist **P1** shape — so C1
  should introduce `anthropicResponse` rather than deepen it. `embeddingClient.ts`'s
  `toEmbeddingUsage` is the end-to-end extraction template, which F4 recorded only in its
  reporting half.

**Open questions: OQ-6.** No implementation; no PR; no surface committed to.
