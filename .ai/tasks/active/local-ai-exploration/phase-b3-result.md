# B-3 Result: local-classifier-safety scenario

**Model used:** `Xenova/toxic-bert`
**Threshold map:**
```typescript
{
  toxic:         { warn: 0.5, reject: 0.8 },
  severe_toxic:  { warn: 0.3, reject: 0.6 },
  obscene:       { warn: 0.5, reject: 0.8 },
  threat:        { warn: 0.2, reject: 0.5 },
  insult:        { warn: 0.5, reject: 0.8 },
  identity_hate: { warn: 0.2, reject: 0.5 }
}
```

**Test mocking strategy:** `jest.mock('@fgv/ts-extras-transformers')` as the first statement (before all imports, per `@rushstack/hoist-jest-mock`), backed by a manual `__mocks__/@fgv/ts-extras-transformers.js` that returns `jest.fn()` stubs defaulting to `fail(...)`. `classify` is controlled per-test via `jest.mocked(transformers.classify).mockResolvedValue(...)` with canned `TextClassificationOutput` arrays (`CLEAN_OUTPUT`, `SINGLE_LABEL_TOXIC`, `WARN_ONLY_OUTPUT`, `MULTI_LABEL_TOXIC`). No model download occurs.

---

## Done-or-discard answers

### 1. Cleaner than direct `pipeline()`?

**Yes — the facade earns its keep at the screener call site.**

The screener body with the facade:
```typescript
const classifyResult = await classify(pipeline, ctx.value, { top_k: null });
if (classifyResult.isFailure()) {
  return fail(`${name}: classify failed...`);
}
return succeed(interpretClassification(classifyResult.value, ...));
```

The equivalent without the facade would require:
```typescript
const classifyResult = await captureAsyncResult(async () => {
  const r = await pipeline(ctx.value, { top_k: null });
  // toxic-bert returns TextClassificationOutput[] (batched) when top_k is set;
  // need to flatten: Array.isArray(r[0]) ? (r as TextClassificationOutput[]).flat() : r
  return Array.isArray(r[0])
    ? (r as TextClassificationOutput[]).flat()
    : (r as TextClassificationOutput);
});
```

The flatten-if-needed branch is genuinely non-obvious from the `@huggingface/transformers` types. The facade's `classify()` function hides this and returns a typed `Result<TextClassificationOutput>` — a clear, testable surface. Verdict: the `Result` wrapping + flattening normalization justifies the facade.

### 2. Does the boundary survive a real composition?

**Yes, with one observation: `top_k: null` is a required author-side contract.**

`TextClassificationOutput` (an array of `{ label: string; score: number }`) composed cleanly into `interpretClassification`'s per-label threshold loop. No type coercion was needed. The per-label score map builds naturally from `output.map(e => scores[e.label] = e.score)`.

The one subtlety: `classify` with `{ top_k: null }` returns **all** labels, but the `TextClassificationOutput` type doesn't encode this invariant — the type is the same whether you pass `top_k: 1` or `null`. The threshold-map approach silently degrades to checking fewer labels if the caller forgets `null`. This is a facade documentation gap (not a blocking issue), but the author has to know `top_k: null` is required. If the facade exposed a `classifyAll()` that enforces `top_k: null` in the signature, that would be more discoverable. Flagged as a potential B-4a follow-on.

### 3. Does Result composition with `ts-prompt-assist`'s screener seam feel natural?

**Yes — the seam is well-designed and the composition is friction-free.**

The `IScreener` contract (`screen(ctx: IScreenerContext): Promise<Result<ReadonlyArray<ISafeguardFinding>>>`) is exactly the right shape. The screener holds state (pipeline, thresholds) in its closure, gets the slot value via `ctx.value`, and returns `[]` for clean or a finding for breach. The distinction between operational failure (`Result.fail()`) and safeguard finding is correct — a model inference error should fail the screener, not produce a finding.

`IPromptSafetyPolicy.screeners` + `PromptStoreFixture.build` + `PromptLibrary.create` compose in a single `thenOnSuccess` chain from an in-memory fixture to a live library with the screener policy wired in. The only non-obvious step was using `.thenOnSuccess()` instead of `.onSuccess()` for the `async PromptLibrary.create()` call — but that's standard `AsyncResult` chaining, not a seam issue.

**Friction log:**
- The `IScreenerContext.slot.name` field is a branded `SlotName`, so `String(ctx.slot.name)` is needed when passing to unbranded APIs. Minor, expected.
- Reject findings surface as `Result.fail()` on `lib.resolve()` — the finding itself is in the error message, not in a structured field. The trace is unavailable on failure. This is by design per the `ts-prompt-assist` contract, but means the web component can only extract the rejection message string, not a structured finding, on reject. The brief's demo use case is served; a production UI might want the structured finding on reject paths too.

---

## Runtime surprises

**`@huggingface/transformers` upstream type errors.** The package's type definitions have errors under strict TypeScript (`TS2307`, `TS2416`, `TS2304` for internal types). Fixed by adding `"skipLibCheck": true` to `samples/testbed/tsconfig.json`. No functional impact; this is a known upstream issue with the TS-native transformer types.

**jsdom IS available (initial claim was wrong — corrected in review).** An earlier draft of this result claimed `heft-jest` forced `testEnvironment: node`, making the React component untestable, and blanket-`c8 ignore`-d the whole component. That was incorrect: jsdom works (see `App.test.tsx`, which renders components via `@testing-library/react`), and `conventions.md` §4 requires scenario components to be covered. The blanket ignore + false rationale were removed; the component is now fully tested via `@testing-library/react` (mocking the browser facade), with three **narrow** `c8 ignore` directives remaining on genuinely-defensive lines (second unmount guard, `buildPromptLibrary` internal-failure branch, and the `.catch` that only fires on a synchronous throw) — each with an honest rationale.

**`jest.mock` must be the very first statement.** The `@rushstack/hoist-jest-mock` rule enforced this strictly — `jest.mock(...)` must precede all `import` statements. Both facades are mocked at the top: `@fgv/ts-extras-transformers` (Node, for the CLI path) and `@fgv/ts-web-extras-transformers` (browser, for the component + `web.initialize`).

---

## Review follow-ups (Copilot + owner review on PR #408)

The review drove three substantive changes beyond the small fixes (branded-id Converters, slot-derived body, `SlotName` propagation, docstring, registry snapshot):

1. **Web vs Node facade split (was: both paths imported the Node facade into a browser bundle).** The testbed bundles for the browser (webpack), so importing `@fgv/ts-extras-transformers` (node-native ONNX deps) into the web graph was wrong. Fix — the dual-target pattern future scenarios reuse:
   - `classifierScreener.ts` is now **facade-agnostic**: it takes `classify` as an injected `ClassifyFn` and uses type-only facade imports (erased), so it pulls no runtime facade into the web bundle.
   - The web path imports `@fgv/ts-web-extras-transformers`; the CLI path loads the Node facade via `import(/* webpackIgnore: true */ '@fgv/ts-extras-transformers')` so node-native deps never enter the browser graph.
   - **The production `webpack` build (`build:web`) was run and now compiles cleanly** — the gates that ran at first draft (`heft build` tsc + `heft test` jsdom-with-facade-mocked) never exercised the real browser bundle, so this defect was latent.

2. **Latent packaging bug fixed in `@fgv/ts-web-extras-transformers` (gap-then-fix).** Its `exports` `.` default (browser) condition pointed at `./lib/index.browser.js`, which is never emitted (the source is isomorphic; no separate browser build exists yet). The testbed is the facade's first webpack consumer, so this had been latent since B-2. Repointed to `./lib/index.js`; `patch` change file added. Fixed in the library, not worked around in the testbed.

3. **Component coverage (was: blanket `c8 ignore` + false "jsdom unavailable" rationale).** See the corrected runtime note above — component now fully tested; three narrow honest defensive ignores remain.

---

## Acceptance gates

- [x] `rush build` passes full repo
- [x] `rushx lint` clean in `samples/testbed`
- [x] `rushx fixlint` run before final commit
- [x] `rushx test` 100% coverage all 4 metrics in `samples/testbed` (72 tests; component fully tested, narrow defensive ignores only)
- [x] **`build:web` (production webpack) compiles cleanly** — browser bundle verified, Node facade correctly excluded
- [x] No `any`; no manual unsafe casts beyond branded-type `as unknown as T`; no `Result<void>`
- [x] Scenario registered in `scenarios/index.ts`; appears in shell sidebar
- [x] `@fgv/ts-prompt-assist` untouched; one corrective `patch` to `@fgv/ts-web-extras-transformers` `exports` (gap-then-fix, change file added)
- [x] `phase-b3-result.md` written (this file)
- [x] `state.md` updated (B-3 → ✅, PR #408)
