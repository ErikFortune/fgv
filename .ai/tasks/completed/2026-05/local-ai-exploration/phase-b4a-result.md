# B-4a Result: ship the transformers facade

**Branch:** `claude/local-ai-exploration-b4a` → PR to `local-ai-exploration`
**Outcome:** facade shipped; OQ-4 answered (boundary survives a second model type).

## What shipped

| Deliverable | Where | Notes |
|---|---|---|
| `embed` primitive | both facades | `embed(extractor, text, options?) → Promise<Result<Tensor>>`. Thin wrapper; no pooling/normalisation imposed (passed through via `options`). 100% coverage. |
| `classifyAll()` | both facades | Forces `top_k: null` so the full per-label vector is type-evident. Delegates to `classify`. Closes the B-3 "silent author-side contract" gap. |
| `local-embedding-search` scenario | `samples/testbed` | `Xenova/all-MiniLM-L6-v2` sentence embeddings → cosine-similarity ranking over a fixed corpus. The OQ-4 second-model-type proof. |
| B-3 scenario switched to `classifyAll()` | `samples/testbed` | screener drops the explicit `{ top_k: null }`. |
| `LIBRARY_CAPABILITIES.md` entries | `.ai/instructions/` | facade pair section + decision shortcut + cross-runtime row. |
| Change files | `common/changes/@fgv/*` | `minor` for both facades; `none` for testbed. api-extractor reports regenerated for both facades. |

## OQ-4 — does the boundary survive a second model type?

**Yes.** The embedding scenario exercises a fundamentally different output shape (a `Tensor` vector, vs the classifier's label-score array) and the facade boundary held:

- `loadPipeline` is already generic over `PipelineType`, so `loadPipeline('feature-extraction', model)` needed no facade change.
- `embed` returned the upstream `Tensor` cleanly as `Result<Tensor>` with no cast at the facade level.
- The one friction point is downstream of the facade, in the consumer: `Tensor.tolist()` is typed `any[]` upstream, so the scenario's `embedAdapter` needs a single bounded `as number[][]` cast to extract the sentence vector (shape `[1, D]` from `pooling: 'mean'`). This is a consumer-side extraction detail, documented with the shape rationale + a narrow defensive `c8 ignore` on the structurally-impossible empty case — not a facade defect. A future `embedVector()` convenience that returns `Result<number[]>` could absorb this, but it's out of the minimal-surface scope for now (note for a possible follow-on if a second embedding consumer appears).

## Dual-target pattern reuse (the B-3 lesson held)

The embedding scenario followed the canonical pattern with no rediscovery cost:
- Facade-agnostic core: `similarity.ts` (pure, no facade dep) + `embedAdapter.ts` (injected `EmbedFn`, type-only facade imports).
- Web path imports the browser facade; CLI path loads the Node facade via `import(/* webpackIgnore: true */ '@fgv/ts-extras-transformers')`.
- **`build:web` verified**: production webpack bundle compiles; the Node facade is excluded from the static graph (only the `webpackIgnore` import literal remains).

This confirms the pattern is teachable/repeatable — the second scenario cost far less than the first because the pattern was written down in the B-4a brief.

## Judgment calls

- **`embed` options type:** `FeatureExtractionPipelineOptions` is not exported from `@huggingface/transformers`' top level. Used `Parameters<FeatureExtractionPipeline['_call']>[1]` to surface the correct upstream options type without importing a non-exported symbol.
- **`embed` return:** raw `Tensor` (no reshaping) — matches the "thin boundary, no opinionated orchestration" discipline.
- **`classifyAll` naming in the B-3 screener:** the injected option is still named `classify` (typed `ClassifyFn`); it now receives `classifyAll`. Documented rather than renamed (cosmetic; avoids churn).

## Gates

- [x] `rushx build` / `heft build` clean — both facades + testbed
- [x] `rushx lint` clean — all modified packages
- [x] `rushx test` 100% coverage all 4 metrics — facades 23 tests each; testbed 111 tests
- [x] **`build:web` (production webpack) compiles cleanly**; Node facade excluded from the browser bundle
- [x] `rush build` (full repo) — final gate before PR
- [x] No `any`; fallible ops return `Result<T>`; no `Result<void>`; one documented bounded cast in the embed adapter (consumer-side Tensor extraction)
- [x] Embedding scenario registered; snapshot updated to both ids
- [x] Change files for all modified published packages; api reports regenerated
- [x] `LIBRARY_CAPABILITIES.md` entries added

## Remaining for cluster close (not B-4a)

- Promote `local-ai-exploration` → `release` (cluster-close PR cluster).
- Possible follow-on (not scheduled): `embedVector()` convenience returning `Result<number[]>` if a second embedding consumer appears.

## Review (PR #409)

Three rounds of Copilot + Erik review, all addressed on-branch (gates re-run green each round):
- **Result chaining (Erik):** `embedText`, `searchCorpus`, and `handleSearch` refactored from imperative `isFailure()` checks to `withErrorFormat`/`thenOnSuccess`/`onSuccess`/`onFailure` chains.
- **Doc accuracy (Copilot):** corrected the cosine-range claim (cosine ∈ [−1, 1]; L2 normalization doesn't force [0, 1]) and the sibling element-range claim in the adapter; fixed a stale "sequentially" comment (concurrent `Promise.all`); updated the classifier header-doc example to `classifyAll`.
- **Coverage annotations (Copilot):** reworded two `c8 ignore` rationales to be definitive (the `?? 'none'` fallback; the `.catch` that is unreachable because `loadPipeline` returns `Result.fail` rather than rejecting).
- **Test mock (Copilot):** `makeMockTensor.tolist()` typed `number[][]` to reflect the real pooled shape.
