# `@fgv/ts-extras-transformers` + `@fgv/ts-web-extras-transformers` — local transformers (HuggingFace) Result boundary

> **This file is authoritative for what ``@fgv/ts-extras-transformers`` provides and what not to hand-roll.**
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

## Decision shortcuts

- **Running a HuggingFace model locally (text classification / embeddings / summarization) with a Result boundary?** → `loadPipeline` + `classify` / `classifyAll` / `embed` / `summarize` from `@fgv/ts-extras-transformers` (Node) or `@fgv/ts-web-extras-transformers` (browser). Thin `Result`-wrapped facade over `@huggingface/transformers` — no caching/device/quantization policy (use the upstream lib directly for that). Use `classifyAll` when you need the full per-label vector (it bakes in `top_k: null`); `embed` returns the raw `Tensor` (pass `{ pooling: 'mean', normalize: true }` for a sentence vector). **In a browser bundle, keep your core facade-agnostic (inject the fn, type-only imports) and load the Node facade only via `import(/* webpackIgnore: true */ ...)` on the CLI path** — see the `samples/testbed` `local-classifier-safety` / `local-embedding-search` / `local-summarization` scenarios.
- **Summarizing text locally (cheap/fast, small model) vs. in the cloud?** → **local:** `summarize` from `@fgv/ts-extras-transformers` (e.g. `loadPipeline('summarization', 'Xenova/distilbart-cnn-6-6')`) — the cheap/fast/offline path for simple/medium inputs. **Cloud (quality on long/complex docs):** a completion via `@fgv/ts-extras/ai-assist`. The escalation policy (when to defer to the cloud) is the consumer's, not the facade's.
- **Need a text embedding (`text → vector`)?** Three paths; pick by where the weights run:
  - **In-process / local / offline (you own the model lifecycle)** — on-device RAG pre-filter, privacy-sensitive, zero per-call cost → `embed` / `loadPipeline('feature-extraction', …)` from **`@fgv/ts-extras-transformers`** (Node) or **`@fgv/ts-web-extras-transformers`** (browser). Returns a raw `Tensor` (pass `{ pooling: 'mean', normalize: true }` for a sentence vector). You manage model download / cache / device / quantization.
  - **Cross-provider cloud HTTP** — OpenAI `text-embedding-3-*`, Gemini `gemini-embedding-001`, Mistral `mistral-embed`, **or a self-hosted OpenAI-compatible / Ollama server via the `endpoint` override** → `AiAssist.callProviderEmbedding` from **`@fgv/ts-extras/ai-assist`**. Batch in, `number[][]` out, `Result`-wrapped, descriptor-driven. **This is also the Ollama answer** — point it at `http://localhost:11434/v1`; there is no separate Ollama-native embedding API (the `@fgv/ts-extras-ollama` native `embed` was cut — see OQ-1).
  - One-line mental model: **`@fgv/ts-extras-transformers` = the weights run in *your* process; `callProviderEmbedding` = the weights run on *a server you `fetch`*.** Same local-vs-distant split as completion.

---

## Recent additions

*Newest first. Populated from each stream's `summary.sourceLine` — see the split brief's phase 2.*
