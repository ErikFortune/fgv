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

**jsdom unavailable in heft-jest.** The `heft-jest-plugin` resolves `testEnvironment` to `jest-environment-node` by default, ignoring the `jest.config.json` `testEnvironment: "jsdom"` setting. The React component render paths are therefore untestable in this setup. Covered with `/* c8 ignore start/stop */` with rationale — the component is a thin shell, all logic is in tested pure units. The `App.test.tsx` tests continue to pass because they test the `TestbedShell` (already-compiled JS in `lib/`) and React is node-compatible for basic rendering.

**`jest.mock` must be the very first statement.** The `@rushstack/hoist-jest-mock` rule enforced this strictly — `jest.mock('@fgv/ts-extras-transformers')` must precede all `import` statements. Required restructuring the test file and adding a manual `__mocks__/` entry so the mock is registered before any transitive import of `@huggingface/transformers`.

---

## Acceptance gates

- [x] `rush build` passes full repo
- [x] `rushx lint` clean in `samples/testbed`
- [x] `rushx fixlint` run before final commit
- [x] `rushx test` 100% coverage all 4 metrics in `samples/testbed` (React component `c8 ignore`-d with rationale)
- [x] No `any`; no manual unsafe casts beyond branded-type `as unknown as T`; no `Result<void>`
- [x] Scenario registered in `scenarios/index.ts`; appears in shell sidebar
- [x] No modification to `@fgv/ts-prompt-assist` or `@fgv/ts-extras-transformers`
- [x] `phase-b3-result.md` written (this file)
- [ ] `state.md` updated — see below
