# State — ai-assist-thinking-anchoring

## Phase 1 — thinkingMode removal: DONE

- Re-ran `grep -rn '\.thinkingMode' --include=*.ts libraries/ tools/ samples/` — empty, brief confirmed.
- Broader `grep -rn 'thinkingMode'` (no dot) found only object-literal keys in
  `registry.ts` (9 descriptors) and test fixtures (25 files) — never read anywhere.
- Removed `IAiProviderDescriptor.thinkingMode` and `AiThinkingMode` type from `model.ts`.
- Removed the `thinkingMode: ...` line from all 9 `registry.ts` descriptors.
- Removed `thinkingMode: ...` fixture lines from all 25 test files that set it.
- Removed `AiThinkingMode` from `index.ts` barrel export.
- Rewrote the `ModelSpecKey` remarks block (model.ts ~493-524) — no longer references
  `thinkingMode`; explains availability is not declared on the descriptor at all, and
  that `AiModelCapability`'s `'thinking'` entry is a listing-only signal, not a call-path
  gate (ties to the out-of-scope item below).
- `rush build --to @fgv/ts-extras` passes; api-extractor auto-updated
  `etc/ts-extras.api.md` (will re-verify/re-diff once item 2 also lands, before final commit).

## Phase 2 — generic 'none': DONE

Plan (verified against emit sites in `completionClient.ts`):
- Widen `IThinkingConfig.effort` to `'none' | 'low' | 'medium' | 'high'`.
- In `thinkingOptionsResolver.ts` tier-1 mapping (`mergeThinkingConfig`):
  - OpenAI: `genericEffortToOpenAi` widened to accept `'none'` → `openAiEffort: 'none'`.
    Already special-cased in `checkTemperatureConflict` (openai: `!== 'none'` gates).
  - xAI: `genericEffortToXai` widened to accept `'none'` → `xaiEffort: 'none'`. Already
    special-cased in `checkTemperatureConflict` (xai: `!== 'none'` gates).
  - Gemini: `genericEffortToGemini` widened to accept `'none'` → returns `0`
    (`geminiThinkingBudget: 0`). `checkTemperatureConflict` never conflicts for google —
    no change needed there.
  - Anthropic: generic `'none'` must NOT set `anthropicEffort` at all (leave resolved
    unchanged) — confirmed at `completionClient.ts:517-527`, the Anthropic emit site only
    sets `body.thinking` when `resolvedThinking?.anthropicEffort !== undefined`. Leaving it
    unset both omits the wire param AND satisfies `checkTemperatureConflict`'s anthropic
    branch (`resolved.anthropicEffort !== undefined` gate), so temperature survives
    automatically — no changes needed to `checkTemperatureConflict` itself.
- Existing per-provider `'none'` test at `thinkingParamRejection.antagonist.test.ts:203`
  (OpenAI) stays as the reference pattern; adding one generic-'none' e2e test per provider
  (anthropic/openai/google/xai) asserting wire shape + temperature survives.

All implemented, watched-fail-verified (4/4 neuters, each red for its own reason only),
coverage already 100% (no closure needed). `code-reviewer` layer-1 pass run — one P2 (Gemini
'none'-on-Pro doc overclaim), fixed by adding the caveat to the effort doc comment (did NOT
add model-aware gating — that's the explicitly out-of-scope item 3). Repo-wide
`rush rebuild` clean (36/36 packages, zero warnings). `rush change --verify` clean.
`docs/FUTURE.md` entry added. `.ai/tasks/active/ai-assist-thinking-anchoring/result.md`
written.

## Phase 3 — PR: DONE

PR #667 opened, ledger flipped to shipped in the same PR. Copilot review loop: 3 rounds.
- Round 1: 2 real findings (Gemini 'none'-on-Pro doc overclaim in the resolver's own
  comment; new `{@link}` targets baking `ae-unresolved-link` warnings into api.md) — both
  fixed and pushed.
- Round 2: 🟢 approval recommended; one trivial suppressed nit (missing provider labels on
  medium/high doc-table rows) — fixed and pushed.
- Round 3: 🔵 flagged that the checked-in `libraries/ts-extras/docs/` generated docs are
  stale on this stream's API changes. Investigated: regenerating via `rushx build-docs`
  touches 287 files / ~3000 lines, almost entirely unrelated pre-existing drift (docs
  hadn't been regenerated since 2026-08-12, no CI gate requires it). Reverted the
  regeneration, dispositioned in a PR comment rather than bundling unrelated changes into
  this stream. Stopped the loop here — diminishing returns (round 3's only finding was
  out-of-scope, not a defect in the diff).

Build green, `mergeable_state: clean`. Both round-1 review threads resolved. PR is done —
waiting on human review/merge.

## Brief accuracy check

No discrepancies found anywhere. Every grep and every emit-site claim in the brief matched
exactly what the tree actually contains.
