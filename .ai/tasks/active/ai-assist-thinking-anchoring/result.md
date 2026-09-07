# Result — `ai-assist-thinking-anchoring`

## Summary

**Intended.** Fix two of the three misanchored "thinking" concerns in `@fgv/ts-extras/ai-assist`:
delete `IAiProviderDescriptor.thinkingMode` (a required per-provider field that nothing reads —
the real temperature/thinking gating switches on provider **id** via
`providerDiscriminatorForId`), and add `'none'` to the generic `IThinkingConfig.effort`
vocabulary so "thinking off" has a cross-provider spelling instead of forcing callers into a
per-provider block.

**Shipped.** Both items, as scoped, in one PR:

- `IAiProviderDescriptor.thinkingMode` and the `AiThinkingMode` type deleted from `model.ts`;
  removed from all 9 `registry.ts` descriptors and all 25 test files that set it as a required
  fixture field; removed from the `index.ts` barrel export; regenerated
  `etc/ts-extras.api.md`.
- The `ModelSpecKey` doc comment (previously describing `thinkingMode` as the availability
  mechanism) rewritten to describe the actual state of the world: the descriptor declares no
  thinking-availability field at all; `AiModelCapability`'s `'thinking'` entry
  (`DEFAULT_MODEL_CAPABILITY_CONFIG`) is a listing/filtering signal only, not a call-path gate.
- `IThinkingConfig.effort` widened to `'none' | 'low' | 'medium' | 'high'`. In
  `thinkingOptionsResolver.ts`'s `mergeThinkingConfig` tier-1 mapping: OpenAI → `effort: 'none'`,
  xAI → `reasoning_effort: 'none'`, Gemini → `thinkingBudget: 0`, Anthropic → the mapping is
  skipped entirely (see below).
- Four new end-to-end tests in `thinkingParamRejection.antagonist.test.ts`, one per provider,
  each asserting both the wire shape (thinking off) and that `temperature` survives —
  mirroring the existing per-provider-block OpenAI `'none'` test at line 203 of that file, but
  reached via the generic `effort` field.
- A doc-accuracy fix to the new `IThinkingConfig.effort` remarks (found by the layer-1
  `code-reviewer` pass, see below): the `'none'` → Gemini `thinkingBudget: 0` mapping is not
  model-aware, and `IGeminiThinkingConfig.thinkingBudget`'s own existing doc comment already
  states `0` errors on Gemini's Pro-family models. The remarks now carry that caveat instead of
  asserting `'none'` is uniformly safe.
- `docs/FUTURE.md`: new entry, "Gate thinking requests on the per-model capability table",
  carrying the brief's out-of-scope reasoning (narrow-by-design listing patterns are right for a
  menu, wrong for a call gate).
- `docs/WORKSTREAMS.md`: ledger entry flipped to shipped in this PR (see below for the PR
  number, filled in before push per the repo's "a PR anticipates its own merge" convention).
- Change file for `@fgv/ts-extras` (`type: major` — the `thinkingMode` removal is breaking for
  any external descriptor-construction site).

**Diverged.** One thing not anticipated going in: the brief's own predicted Anthropic mapping
("no thinking param emitted at all") was correct, but the *doc comment I first wrote* for
`IThinkingConfig.effort` overclaimed the Gemini side — it stated `'none'` maps to
`thinkingBudget: 0` without the Pro-family caveat that already exists, one field away, on
`IGeminiThinkingConfig.thinkingBudget`. The layer-1 `code-reviewer` pass caught this (P2). No
model-aware gating was added to fix the underlying gap — that is exactly the out-of-scope item 3
(the design-pass-required move, now in `docs/FUTURE.md`) — so the fix was scoped to correcting
the doc comment so it doesn't assert something the code doesn't (and never did) guarantee. The
same footgun already existed before this stream via an explicit
`providers: [{ provider: 'google', config: { thinkingBudget: 0 } }]` block; generic `'none'`
merely opens a second, easier door to the same pre-existing, model-oblivious behavior.

## Brief accuracy check

Both factual claims verified before touching code:

- `grep -rn '\.thinkingMode' --include=*.ts libraries/ tools/ samples/` → empty, as claimed.
- The broader (no-dot) `grep -rn 'thinkingMode'` found only object-literal keys: 9 in
  `registry.ts`, one per required-field test fixture across 25 test files — confirming the field
  was set everywhere it was required to compile, and read nowhere.
- `providerDiscriminatorForId` (`thinkingOptionsResolver.ts:53`) does switch on provider id, not
  `thinkingMode`, exactly as claimed.
- The Anthropic emit site (`completionClient.ts:517-527`) only sets `body.thinking` when
  `resolvedThinking?.anthropicEffort !== undefined`, exactly as the brief predicted — confirming
  "leave `anthropicEffort` unset for generic `'none'`" was the correct implementation, with no
  changes needed to `checkTemperatureConflict` itself (its Anthropic branch already gates on
  `anthropicEffort !== undefined`).

No discrepancies found. The brief's factual claims held exactly as stated.

## Anthropic `'none'` mapping — as implemented vs. predicted

Matched the brief's prediction exactly: `mergeThinkingConfig`'s tier-1 switch skips the
`anthropicEffort` assignment when `config.effort === 'none'`, leaving it `undefined`. This
achieves both required outcomes with no extra code: (1) the Anthropic emit site never sets
`body.thinking`/`body.output_config`, since it gates on `anthropicEffort !== undefined`; (2)
`checkTemperatureConflict`'s Anthropic branch (which fails only when `anthropicEffort` is set)
passes, so temperature is not rejected — without touching `checkTemperatureConflict` at all.

## Neuter table (watched-fail verification)

Each new regression test was watched to fail against a single, targeted one-line neuter of its
own provider's mapping in `thinkingOptionsResolver.ts`, one neuter at a time, reverted before the
next. Full suite (2795 tests) confirmed green with each neuter reverted before applying the next.

| # | Neuter | Test that went red | Other 3 new tests |
|---|---|---|---|
| 1 | Anthropic tier-1 branch: always call `genericEffortToAnthropic` (drop the `!== 'none'` guard), so `anthropicEffort` gets set even for `'none'` | `Anthropic: generic effort "none" omits the thinking param and temperature survives` — failed with `thinking mode is not compatible with temperature on provider anthropic: ...` | stayed green |
| 2 | `genericEffortToOpenAi`: map `'none'` → `'medium'` instead of passing it through | `OpenAI: generic effort "none" disables reasoning and temperature survives` | stayed green |
| 3 | `genericEffortToXai`: map `'none'` → `'medium'` instead of passing it through | `xAI: generic effort "none" disables reasoning and temperature survives` | stayed green |
| 4 | `genericEffortToGemini`: map `'none'` → `4096` instead of `0` | `Gemini: generic effort "none" maps to thinkingBudget 0 and temperature survives` | stayed green |

Each neuter produced exactly one failure — its own test, for its own reason — confirming no
cross-provider entanglement in the tier-1 mapping.

## Gates

- `rushx build` — clean in `@fgv/ts-extras`.
- `rushx lint` — clean.
- `rushx test` — 2795 passed / 0 failed, 100% statements/branches/functions/lines across every
  file in the package (no coverage-gap closure needed — the diff didn't create any new uncovered
  lines).
- `rushx fixlint` — run; no changes beyond what was already staged.
- `rush change --verify --target-branch origin/release` — clean.
- `node common/scripts/install-run-rush.js rebuild` (repo-wide) — clean, no downstream casualties
  (`grep -rn 'thinkingMode|AiThinkingMode'` across the whole repo returns nothing outside
  unrelated `OpenAiThinkingModelNames`/`XAiThinkingModelNames` symbols; `samples/testbed`'s
  `IAiProviderDescriptor` usages never set `thinkingMode`, so nothing there needed a change).
- `etc/ts-extras.api.md` regenerated by API Extractor as part of the build.

## Layer-1 review (`code-reviewer`, pre-PR)

One P2 finding, fixed (see "Diverged" above): the `IThinkingConfig.effort` doc comment
overclaimed Gemini `'none'` safety on Pro-family models without the caveat the sibling
`IGeminiThinkingConfig.thinkingBudget` doc already carries. No P1s. No other findings survived
review — no `any`/unsafe-cast/manual-type-check issues, no `Result` pattern violations, no
lingering `thinkingMode`/`AiThinkingMode` references, the rewritten `ModelSpecKey` remarks verified
accurate, and the four new tests' wire-shape assertions verified against the real
`completionClient.ts` emit-site field names.
