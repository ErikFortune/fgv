# `@fgv/ts-extras-transformers` + `@fgv/ts-web-extras-transformers` — local transformers (HuggingFace) Result boundary

> **This file is authoritative for what ``@fgv/ts-web-extras-transformers`` provides and what not to hand-roll.**
> `README.md`, where present, is getting-started material. The always-loaded index at
> [`.ai/instructions/LIBRARY_CAPABILITIES.md`](../../.ai/instructions/LIBRARY_CAPABILITIES.md)
> routes here; it never duplicates this content.


---

[libraries/ts-extras-transformers](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras-transformers)
[libraries/ts-web-extras-transformers](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras-transformers)

**A Result-integration boundary over `@huggingface/transformers` (transformers.js) for running models locally — not an opinionated ML helper.** Like the WebAuthn pair, these add exactly one thing: thin `captureAsyncResult` wrappers that convert the upstream throw-on-failure calls into `Promise<Result<T>>`, with **no opinionated orchestration** (no pipeline cache, no model-download management, no device/quantization policy). The two packages expose an **identical surface**; pick the package at the composition root — Node uses the native ONNX backend, browser uses the WASM/WebGPU backend.

| Package | Function | Return |
|---|---|---|
| both | `loadPipeline(task, model?, options?)` | `Promise<Result<AllTasks[T]>>` (the upstream pipeline instance) |
| both | `classify(classifier, text, options?)` | `Promise<Result<TextClassificationOutput>>` (upstream default / top label unless `options.top_k` set) |
| both | `classifyAll(classifier, text, options?)` | `Promise<Result<TextClassificationOutput>>` — forces `top_k: null`, so the **full per-label vector** is returned; use when you compare every label against thresholds |
| both | `embed(extractor, text, options?)` | `Promise<Result<Tensor>>` — raw upstream `Tensor`, no pooling/normalisation applied (pass `{ pooling: 'mean', normalize: true }` via `options` for a sentence vector; extract a JS array with the Tensor's `.tolist()`) |
| both | `summarize(summarizer, text, options?)` | `Promise<Result<SummarizationOutput>>` — `[{ summary_text }]`; pass `min_length`/`max_length`/`max_new_tokens` via `options`. Local cheap/fast path vs. a frontier LLM for simple/medium inputs |

`Tensor`, `TextClassificationPipeline`, `TextClassificationOutput`, `FeatureExtractionPipeline`, `SummarizationPipeline`, `SummarizationOutput`, `AllTasks`, `PipelineType` are re-exported from both packages. Get an extractor via `loadPipeline('feature-extraction', modelId)`, a classifier via `loadPipeline('text-classification', modelId)`, a summarizer via `loadPipeline('summarization', modelId)`.

**Explicitly NOT in scope:** pipeline cache / lifecycle / dispose, model registry or download management, GPU/CPU/WebGPU device-selection policy, quantization selection, embedding-store integration, classifier label allowlists, request batching, IndexedDB cache configuration. `generate` (text generation) is deferred until a concrete consumer needs it. For any of these, use `@huggingface/transformers` directly with `captureAsyncResult`.

**Consuming from a dual web/CLI bundle (load-bearing pattern):** when one module is reachable from a browser bundle, keep your reusable core **facade-agnostic** — take the facade function (`classify`/`classifyAll`/`embed`) as an injected parameter and import facade types as `import type` only (erased, so no runtime facade enters the bundle). Import the **browser** facade on the web path; load the **Node** facade on the CLI path via `import(/* webpackIgnore: true */ '@fgv/ts-extras-transformers')` so its node-native deps never reach the browser graph. Validate the browser bundle with the real bundler (`webpack`/etc.) — type-check + jsdom tests do not exercise it. The `samples/testbed` `local-classifier-safety` and `local-embedding-search` scenarios are the reference consumers.

**Upstream:** `@huggingface/transformers` `~4.2.0` (a **peer dependency** of both packages — bring your own; `skipLibCheck` is required for its type definitions).

---

---

## Recent additions

*Newest first. **Generated** — see the repo index; do not hand-edit inside the markers.*

<!-- BEGIN GENERATED: recent-additions -->

*No stream has recorded a `sourceLine` against this package yet.*

<!-- END GENERATED: recent-additions -->
