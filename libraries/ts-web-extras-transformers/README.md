# @fgv/ts-web-extras-transformers

Result-integration boundary over [`@huggingface/transformers`](https://huggingface.co/docs/transformers.js/en/index)
for browser consumers. The companion package
[`@fgv/ts-extras-transformers`](../ts-extras-transformers) provides the same surface for
Node consumers.

**Status:** provisional — done-or-discard gate at B-3 exit of the `local-ai-exploration` cluster.

---

## What this is

A thin facade that wraps `@huggingface/transformers` calls in `Result<T>` from `@fgv/ts-utils`,
mirroring the discipline established by
[`@fgv/ts-web-extras-webauthn`](../ts-web-extras-webauthn): one-line `captureAsyncResult` wrappers
around upstream primitives with **no opinionated orchestration** above the boundary.

The upstream `@huggingface/transformers` library handles the browser-specific runtime
(ONNX web backend, WebGPU acceleration, IndexedDB model caching) automatically. The facade
surface is intentionally identical to `@fgv/ts-extras-transformers`. The package split follows
the fgv `ts-extras` / `ts-web-extras` discipline: separate entry points preserve tree-shaking
and allow divergence at B-4a if browser-specific options surface (e.g. WebGPU device hints,
IndexedDB cache path configuration).

## Explicitly NOT in scope

These items were considered and explicitly deferred — use `@huggingface/transformers` directly
(with `captureAsyncResult` for your own Result wrapping) for any of them:

- Pipeline cache / lifecycle management
- Model registry or download management
- GPU/CPU/WebGPU device selection policy
- Quantization selection
- Embedding-store integration
- Classifier label allowlists
- Request batching
- Pipeline dispose semantics
- IndexedDB cache configuration

## Two primitives. Nothing else.

| Function | Return | Wraps |
|---|---|---|
| `loadPipeline(task, model?, options?)` | `Promise<Result<AllTasks[T]>>` | `pipeline()` |
| `classify(pipeline, text, options?)` | `Promise<Result<TextClassificationOutput>>` | `TextClassificationPipeline` call |

**Deferred (not in scope at B-2):**

| Function | Rationale |
|---|---|
| `embed(pipeline, text, options?)` | No concrete B-3 consumer use case; feature-extraction returns `Tensor`, not `Float32Array` — normalisation adds opinions the boundary should not take. Add at B-4a if B-3 surfaces an embedding scenario. |
| `generate(pipeline, text, options?)` | No concrete B-3 consumer use case; text-generation output shape is more complex (single/batch/chat variants). Defer until a scenario exercises it. |

---

## Usage

```typescript
import { loadPipeline, classify } from '@fgv/ts-web-extras-transformers';

// Load a sentiment-analysis model (wraps @huggingface/transformers pipeline()).
// The upstream library automatically uses the ONNX web backend and WebGPU when available.
// Lifecycle management (caching, disposal, device selection) is your responsibility.
const classifierResult = await loadPipeline(
  'text-classification',
  'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
);
if (classifierResult.isFailure()) {
  // Model load failed (network error, ONNX init failure, WebGPU unavailability, etc.)
  console.error(classifierResult.message);
  return;
}

const classifier = classifierResult.value;

// Classify a single text input.
const result = await classify(classifier, 'I love transformers!');
if (result.isSuccess()) {
  // [{ label: 'POSITIVE', score: 0.9998 }]
  console.log(result.value);
}

// Pass upstream options through verbatim:
const allLabels = await classify(classifier, 'I love transformers!', { top_k: null });
```

---

## Runtime requirements

- **Browser:** Chrome 113+, Safari 16.4+, Firefox 118+ (WebGPU acceleration requires Chrome 113+;
  WASM fallback works in all modern browsers)
- **`@huggingface/transformers`:** ^4.2.0 (peer dependency; bring your own)
- **`@fgv/ts-utils`:** workspace:* (peer dependency)

Model weights are fetched from the HuggingFace Hub on first use and cached in IndexedDB
automatically by the upstream library. The upstream library manages the download lifecycle;
this facade does not.

---

## Notes on `skipLibCheck`

This package sets `skipLibCheck: true` in its `tsconfig.json`. The `@huggingface/transformers`
v4.x type definitions contain internal type errors in transitive dependencies
(`@huggingface/tokenizers` path aliases, `Float16Array` missing from ES2018 lib,
`MgpstrProcessor` method signature mismatch). These are upstream issues — not errors in this
package's own code. `skipLibCheck` silences them without affecting type safety at this package's
own boundary.

---

## License

MIT — same as the parent fgv monorepo. `@huggingface/transformers` is Apache-2.0.
