# Local / on-device small-model support in `@fgv/*` — incorporation analysis

Status: research note for orchestrator decision
Date: 2026-05-22
Author: research agent (one-shot)

---

## 1. Frame

`@fgv/ts-extras/ai-assist` is currently a **distant-LLM client**: stateless per-request HTTP calls to OpenAI / Anthropic / Gemini / xAI for chat completions, image generation, and JSON-shaped structured output. Its surface (`IAiProviderDescriptor`, `IProviderCompletionParams`, `AiPrompt`, `callProviderCompletion`, `callProviderImageGeneration`, `generateJsonCompletion<T>`) assumes every call carries an `apiKey` + `baseUrl` + `model` triple and dispatches to a known cloud provider format (`AiApiFormat`).

The decision in front of the repo owner is whether — and where — to place support for the *other half* of how production AI software is actually structured in 2026: small models running **locally** (in-process, on-device, or in a same-host sidecar). These small models do classification, embedding, NER, OCR, transcription, content moderation, and increasingly small structured-output generation — typically as **pre-filters or post-processors around** the meatier cloud-LLM calls, not as substitutes for them.

The candidate placements are: (1) extend ai-assist directly or add a new sibling package (`@fgv/ts-ai-local` or similar); (2) ship a thin Result-shaped boundary over one of the established runtimes, mirroring the `@fgv/ts-extras-webauthn` + `@fgv/ts-web-extras-webauthn` pattern; (3) leave it to applications. The right answer turns on whether local-model work has the **shape cohesion** that justifies a primitive, and whether fgv-internal consumers (notably `ts-prompt-assist` and `ts-res`) actually gain leverage from a standardized boundary.

This document surveys the runtime landscape, compares it to fgv's existing cloud surface, evaluates the three options against the repo's documented disciplines, and recommends a path.

---

## 2. Landscape: what local small models actually do in 2026

Production usage clusters into a handful of recurring shapes — none of which look like "replace the cloud LLM call" and most of which sit *next to* a cloud call as cheap, fast, privacy-preserving auxiliaries:

- **Embedding generation.** The single most common local use case. `EmbeddingGemma` (308M params, optimized by Google specifically for on-device retrieval/classification/clustering) and `nomic-embed-v2` / `BGE-M3` self-hosted are the 2026 defaults. Embeddings feed: semantic search, RAG retrieval pre-filtering before a cloud LLM call, deduplication, "find similar prompt / similar document," and zero-shot classification via cosine similarity to label embeddings. The output shape is trivial: `Float32Array` of fixed dimension.
- **Text classification.** Sentiment, intent routing (which downstream model / agent does this query go to), content category, language detection, safety/moderation pre-screening *before* the prompt hits a paid cloud LLM. Output shape: a label + score, or a vector of labels + scores.
- **NER / entity extraction.** Structured extraction of typed spans from text. Often used as a cheap pre-step to populate slots that the cloud LLM would otherwise have to extract itself.
- **Speech-to-text.** Whisper variants (whisper.cpp, distil-whisper, faster-whisper) run on-device for transcription before downstream processing.
- **Small structured-output generation.** Phi-3.5-mini, Gemma-2B, Llama-3.2-1B/3B class. Used for tasks where a 2-billion-parameter model is genuinely sufficient and the latency / cost / privacy of a cloud call isn't justified. Output: structured JSON via grammar-constrained generation.
- **Image / OCR / object detection.** ONNX-format CV models for screenshots, document OCR, accessibility tooling.

The architectural pattern that recurs: **local model = pre-filter or post-processor around the cloud LLM call**. The cloud LLM is the expensive scarce resource; local models exist to reduce traffic to it (only call the cloud LLM when the local classifier says "yes, this needs the big model"), to enrich its input (extract entities, retrieve embedded context), or to validate its output (safety screen the response). That's a *very different mental model* from ai-assist's "one provider, one model, one completion" framing.

---

## 3. JavaScript/TypeScript runtimes available in 2026

| Runtime | Browser | Node | API shape | Streaming | Model-load lifecycle | License | Maintenance |
|---|---|---|---|---|---|---|---|
| **`@huggingface/transformers` v4** | yes (WebGPU) | yes (incl. Bun, Deno; WebGPU runtime in C++) | `await pipeline('task', 'model-id', opts)` returns a callable pipeline object; throws on failure | yes for generative tasks | download-from-HF-Hub + on-disk cache (Node) / IndexedDB (browser); one-time load, many-time inference | Apache-2.0 | active, official HF (v4 released early 2026) |
| **`onnxruntime-web` / `onnxruntime-node`** | yes (WebGPU/WASM) | yes | low-level `InferenceSession.create(...)` + `session.run(feeds)`; you bring your own tokenizer + post-processing | n/a (low-level) | manual load of `.onnx` file; you manage caching | MIT | active, Microsoft |
| **`node-llama-cpp`** | no | yes (Node only, native binding to llama.cpp) | high-level `getLlama()` → `model.tokenize` / `LlamaChatSession` / `LlamaEmbeddingContext`; throws on failure; supports JSON-schema-constrained output | yes | local GGUF file load; one model object, many sessions | MIT | active, v3.18.x in 2026 |
| **WebLLM (mlc-ai/web-llm)** | yes (WebGPU only) | partial (Node WebGPU) | **OpenAI-compatible API** (`engine.chat.completions.create(...)`); throws on failure | yes; JSON mode; planned function-calling | model weights fetched once + cached in browser; engine instance is heavy | Apache-2.0 | active, 17.9k stars, WebGPU 84% browser coverage as of early 2026 |
| **Ollama-js (`ollama`)** | no (HTTP client only) | yes (anywhere fetch works) | HTTP client to local sidecar at `127.0.0.1:11434`; thin REST wrapper | yes (async iterator) | sidecar (`ollama serve`) manages its own model lifecycle; the JS library is stateless | MIT | active, official |
| **LM Studio / llamafile** | n/a (HTTP) | n/a | OpenAI-compatible HTTP endpoint | yes | sidecar-managed | varies | active |

Two observations matter for fgv's decision:

- **`@huggingface/transformers` v4 is the natural center of gravity** for "in-process local models" across browser and Node: broadest model-architecture coverage (~200), Apache-2.0, browser+Node+Bun+Deno parity, official ONNX backend. If fgv adopts an in-process runtime, this is the wrap target.
- **The sidecar-via-HTTP option (Ollama, LM Studio, llamafile, WebLLM-with-OpenAI-API) shares ai-assist's wire shape almost exactly.** An Ollama instance at `http://127.0.0.1:11434` *is* an OpenAI-compatible endpoint. ai-assist's `IAiProviderDescriptor` can already describe it; you set `apiKey: 'unused'` and `baseUrl: 'http://localhost:11434/v1'`. **The cloud-shaped surface already trivially supports the sidecar pattern.** Nothing new is needed for that part of the local-models story.

That second observation is load-bearing for the recommendation below.

---

## 4. API-shape comparison vs fgv's cloud-LLM surface

The ai-assist surface assumes a **stateless request shape**: every call carries `descriptor + apiKey + model + prompt`. Models are looked up by name string per call. There is no concept of a long-lived "loaded model" object. The provider is a wire-format dispatcher, not a session.

Local in-process runtimes (`@huggingface/transformers`, `node-llama-cpp`, WebLLM's engine) all have a **stateful pipeline shape**: you *load once* (slow, possibly multi-second model download + initialization, possibly WebGPU compilation), then *infer many times* against the loaded object. Wrapping this in ai-assist's stateless shape would require either:

- A hidden process-global pipeline cache keyed by model id (introduces global state, surprising lifecycle, GC concerns for hundreds of megabytes of WebGPU buffers), or
- A new shape that exposes the loaded pipeline as a first-class object that the caller holds onto.

The mismatch is real and structural. The in-process runtime API is **not naturally a `callProviderCompletion`-shaped thing** — it's a *factory + bound-method* pair (`const classifier = await pipeline('text-classification', 'distilbert-...'); const label = await classifier(text)`).

Where the shapes *do* line up cleanly:

- **The sidecar-via-HTTP local path.** Ollama / LM Studio / llamafile / WebLLM-with-OpenAI-compat-API all speak the same wire as cloud providers. ai-assist's existing surface handles this with zero changes; what's missing is at most a documented `IAiProviderDescriptor` template for "OpenAI-compatible local sidecar."
- **The `generateJsonCompletion<T>` and `ts-prompt-assist` `resolveJsonOutput<K>` pipelines.** These consume a string and validate to typed output; they're agnostic to whether the string came from cloud or local. If a local pipeline emits text, the same downstream Converter/validator chain handles it.
- **Embedding endpoints.** ai-assist today has no embedding API at all. Adding one is additive on both axes (cloud providers also offer embedding endpoints — OpenAI `text-embedding-3-large`, Cohere `embed-v3`, Voyage `voyage-3` — that ai-assist doesn't currently expose).

The cleanest decomposition: **embeddings and classification are not cohesive with `callProviderCompletion`**. They're a different shape (`(input: string) => Float32Array`, `(input: string) => Array<{label, score}>`) regardless of whether the model is local or cloud. Folding them into ai-assist by adding `callProviderEmbedding` is plausible but stretches the package's "chat-with-distant-LLM" cohesion. Folding *local-in-process pipelines* into ai-assist on top of that breaks it.

---

## 5. Three options assessed

### Option 1 — Direct incorporation (extend ai-assist or new sibling `@fgv/ts-ai-local`)

**Sub-option 1a: extend ai-assist.** Add `callProviderEmbedding`, perhaps `callProviderClassification`, perhaps an in-process pipeline registry. **Rejected on cohesion grounds.** ai-assist's identity is "distant-LLM HTTP client." Adding stateful pipeline lifecycle, WebGPU buffer management, model-weight caching, and embedding endpoints breaks that. The package would become "miscellaneous AI stuff," which is the failure mode `CODING_STANDARDS.md` warns against ("a correct, slightly verbose solution is better than a clever but fragile one"). Also: ai-assist is on the **established surface** per `ACTIVE_DEVELOPMENT.md` (only `ai-assist` and `crypto-utils` are listed as active within ts-extras, and recent work has been additive — thinking-events, image generation). A pivot from "cloud" to "cloud + local" is a substantial cohesion change.

**Sub-option 1b: new sibling package `@fgv/ts-ai-local` (Node) + `@fgv/ts-web-ai-local` (browser).** This is the structurally honest version of "direct incorporation": a new pair of packages that own the in-process-model story end-to-end. Surface would include: pipeline lifecycle, model registry, WebGPU/CPU selection, quantization options, embedding API, classification API, structured-output generation. **Pros:** clean cohesion; can take opinions on lifecycle. **Cons:** large surface for a v0.1; the discipline that produced `@fgv/ts-extras-webauthn`'s minimal 6-primitive boundary is explicitly the *opposite* of taking opinions; you'd be picking battles (model registry shape, cache invalidation, GPU/CPU policy) that the upstream library already handles. The "NOT in scope" list for the WebAuthn boundary is the relevant reference — it's load-bearing precisely because the consumer's domain shape is *their* problem, not the library's. Scope estimate: 4–6 weeks of stream work for an opinionated v0.1, plus ongoing maintenance churn as the underlying runtime evolves.

### Option 2 — Result-shaped facade over `@huggingface/transformers` (and possibly `ollama-js`)

Mirror the `@fgv/ts-extras-webauthn` discipline: ~5–8 primitive operations, zero orchestration, everything else "use the upstream library directly with `captureAsyncResult`." Candidate surface:

| Package | Function | Return |
|---|---|---|
| `@fgv/ts-extras-transformers` | `loadPipeline(task, modelId, opts)` | `Promise<Result<Pipeline>>` |
| `@fgv/ts-extras-transformers` | `runPipeline(pipeline, input, opts)` | `Promise<Result<Output>>` |
| `@fgv/ts-extras-transformers` | `embed(pipeline, text)` | `Promise<Result<Float32Array>>` |
| `@fgv/ts-extras-transformers` | `classify(pipeline, text)` | `Promise<Result<Array<{label, score}>>>` |
| `@fgv/ts-web-extras-transformers` | (same surface, browser entry point) | — |

The package is a wire/lifecycle Result adapter; everything else (which model, which quantization, when to load, when to dispose, how to cache, GPU vs CPU policy) is the consumer's problem and routes through the upstream `@huggingface/transformers` API directly. Explicit "NOT in scope" list — mirroring WebAuthn's discipline — would include: model registry, lifecycle/disposal policy, GPU/CPU fallback, multi-pipeline orchestration, batching, embedding-store integration, classifier-label allowlists.

**Pros:**

- Matches the established `@fgv/ts-extras-webauthn` precedent exactly. The pattern is *new but proven within fgv* — `docs/FUTURE.md` already names "future LLM provider wrappers" as a likely candidate for the eventual `integrations/` top-level directory.
- Tiny initial scope; ships in a single short stream (~1 week).
- Doesn't lock fgv into opinions about model lifecycle that the runtime ecosystem is still evolving (WebGPU coverage is climbing fast; quantization formats keep shifting; the right shape for "what's my pipeline cache" is genuinely unsettled).
- Cleanly extensible: if a *second* runtime warrants a wrap later (`@fgv/ts-extras-ollama` for the sidecar pattern, or `@fgv/ts-extras-onnxruntime` for the low-level layer), it's the same shape.

**Cons:**

- Less leverage than a fully-opinionated `@fgv/ts-ai-local`. Consumers still write meaningful glue (caching, lifecycle, model-id management).
- "Wrapping a constructor + a few methods in `captureAsyncResult`" is arguably so thin that consumers could just write it themselves. The WebAuthn precedent answered this by pointing at the Result-discipline contract: every fgv consumer expects fallible operations to return `Result<T>`, and the alternative is `captureAsyncResult` boilerplate at every call site. That's the right answer here too.

**Boundary fit:** strong. `@huggingface/transformers` v4's API is throw-on-failure, browser+Node parity, model-agnostic, Apache-2.0, actively maintained, has 200+ supported architectures. It's exactly the upstream-library shape the WebAuthn precedent was designed for.

### Option 3 — Leave to applications

Current state. Consumers who need local models import `@huggingface/transformers` or `node-llama-cpp` directly and write their own `captureAsyncResult` wrappers, their own pipeline cache, their own glue to `generateJsonCompletion`. **Cost of not standardizing**: every consumer reinvents the Result boundary; the "extending core libraries over working around them" discipline (`CODING_STANDARDS.md`) gets diluted by an obvious gap — fallible upstream operations that *don't* go through a Result-shaped boundary. For one consumer, fine; for two, friction; for three, contagion (the kind that `TECH_DEBT.md` cites as the 23-instance save/restore-globals problem and the 20-instance partial-mock-Result problem).

**Counter:** no fgv-internal consumer demonstrably needs this *yet*. `ts-prompt-assist` v0.1 hasn't shipped and its v0.1 scope explicitly excludes LLM-call orchestration. If no consumer surfaces in the next 1–2 cycles, the cost of standardizing now is real and the cost of waiting is small.

---

## 6. Specific fgv-fit observations

- **`ts-prompt-assist` safety policy.** `IPromptSafetyPolicy` today has `suspiciousPatterns` (regex) and a binary `'warn' | 'reject'` action. A local-classifier-backed screener (e.g. small content-moderation model) is a *natural* extension point. But it's already pluggable today via consumer-supplied logic that calls *any* local model; `ts-prompt-assist` doesn't need to know about the model surface. So this is **not** a direct argument for standardization.
- **Local embedding for qualifier-style semantic resolution in `ts-res`.** "Find the closest matching qualifier value by embedding similarity" is plausible as a future qualifier-type plugin. But `ts-res` qualifier types are already an extension point and a future consumer would plug in their own embedding source. Again, not a direct argument.
- **`generateJsonCompletion<T>` reuse.** If local pipelines return JSON-shaped text, they can already pipe through `fencedStringifiedJson` + the consumer's `Converter<T>`. The Result-boundary package wouldn't even need to know — its output is `string`, the downstream pipeline takes over. This is a **mild argument for standardization**: if local-model output flows through fgv's existing structured-output pipeline, then having local-model invocation also be Result-shaped completes the picture.
- **`docs/FUTURE.md` already names the recurring pattern.** The `integrations/` top-level directory entry explicitly lists "future LLM provider wrappers" as a likely future Result-integration-boundary package. A local-models wrap is *exactly that*. Doing it now would land the second such package and start informing whether the `integrations/` directory question deserves resolution.

---

## 7. Recommendation

**Option 2** — ship a Result-shaped facade over `@huggingface/transformers` v4 as a pair of packages (`@fgv/ts-extras-transformers` + `@fgv/ts-web-extras-transformers`), with discipline mirroring `@fgv/ts-extras-webauthn` exactly: ~5–8 primitive operations, zero orchestration, explicit "NOT in scope" list, consumers retain ownership of pipeline lifecycle / caching / GPU policy / model registry.

**Reasoning.** The fgv repo already has a documented disciplined pattern for *exactly this situation* — an external library with a throw-on-failure API that fgv's consumers will inevitably use, and that without a Result boundary will accumulate `captureAsyncResult` boilerplate at every consumer call site. The repo's published policy is that "consumers' trust depends on" the canonical libraries actually being canonical (`CODING_STANDARDS.md`); leaving a fallible-operation gap visible in the surface signals that the Result discipline is selectively applied. Option 2 closes that gap with minimal scope, defers all opinionated choices to a later stream when consumer pressure surfaces them, and lands the second instance of the integration-boundary pattern that `docs/FUTURE.md` is already tracking as a candidate for its own directory.

**Why not Option 1.** ai-assist's cohesion as a *cloud-LLM* client is currently sharp and load-bearing. Pivoting it to "cloud + local" loses that. A separate `@fgv/ts-ai-local` package would have to take a position on model registry / lifecycle / GPU policy and ship that as v0.1 — which is exactly the kind of opinionated scope that the WebAuthn boundary's discipline explicitly avoids, and which the upstream ecosystem (quantization formats, WebGPU coverage, runtime selection) is still actively evolving. The cost of being wrong is moderate; the benefit over Option 2 is mostly hypothetical leverage that no current consumer needs.

**Why not Option 3.** No current consumer demonstrably needs local-models support — but the *signal value* of having the Result-discipline boundary visible for the local-model case is real. The first time a `ts-prompt-assist` consumer wants a local-classifier safety backend (plausible inside 1–2 cycles), or the first time an in-repo demo wants to show embedding-based prompt selection, the boundary will be needed and the cost of having it ready is low (Option 2 is ~1 week of stream work). Option 3 also leaves the `integrations/` directory question parked indefinitely — a second wrap package would unblock that decision.

**Strongest counter-argument to the recommendation.** The thinness of a `captureAsyncResult`-around-`pipeline()` wrapper is genuinely close to "consumers can write this themselves in 5 lines." The WebAuthn precedent answered this argument by pointing at consistency-of-discipline and per-consumer-glue-cost, but that argument is strongest when there's actual consumer pressure. Right now there is none. The honest read is: **the recommendation is correct in shape but the timing is "next stream slot, not this one."** If the orchestrator has a slot open and no higher-priority work, do it; if there's pressure on more urgent streams (e.g. ts-prompt-assist v0.1 ship), defer. The cost of waiting one or two cycles is small. The cost of doing it badly (i.e. as Option 1) would be larger.

A surprise worth surfacing: **the sidecar/HTTP local path is already supported by ai-assist with zero changes.** Ollama, LM Studio, llamafile, and WebLLM-with-OpenAI-compat-API all speak the OpenAI wire format. A consumer that wants "run a local Llama-3 via Ollama and use it through ai-assist" can already do that today by constructing an `IAiProviderDescriptor` with `baseUrl: 'http://127.0.0.1:11434/v1'`. The thing fgv could add cheaply *right now*, independent of the larger decision, is a documentation note + a pre-built descriptor template for the OpenAI-compatible local sidecar pattern. That's <1 day of work and would cover a meaningful slice of local-model use cases without any new package.

---

## 8. Concrete next-step shape

If Option 2 is accepted, the smallest first-step stream:

**Stream: `ts-extras-transformers-boundary` (v0.1)**

- Create `libraries/ts-extras-transformers/` (Node) and `libraries/ts-web-extras-transformers/` (browser). Both depend on `@huggingface/transformers` ^4.x and `@fgv/ts-utils`.
- Surface (subject to `@huggingface/transformers` API specifics — verify against actual v4 typings before locking):
  - `loadPipeline(task, modelId, opts?)` → `Promise<Result<Pipeline>>` — wraps `pipeline(...)`.
  - `runPipeline(pipeline, input, opts?)` → `Promise<Result<unknown>>` — typed at the call site by the consumer's Converter.
  - `embed(modelId, text, opts?)` → `Promise<Result<Float32Array>>` — convenience for the embedding task.
  - `classify(modelId, text, opts?)` → `Promise<Result<Array<{label: string; score: number}>>>` — convenience for the text-classification task.
- Explicit `LIBRARY_CAPABILITIES.md` "NOT in scope" list: pipeline cache / lifecycle, model registry, GPU/CPU policy, quantization selection, embedding-store integration, classifier-label allowlists, batching, dispose semantics. Consumers use the upstream library directly for any of these.
- Test fixtures: a tiny ONNX model (e.g. `Xenova/distilbert-base-uncased-finetuned-sst-2-english` for classification, `Xenova/all-MiniLM-L6-v2` for embeddings) loaded via the upstream HF cache in CI.
- 100% coverage on the Result-boundary wrappers themselves (which is essentially just the `captureAsyncResult` paths plus argument validation).

**Companion micro-stream (independent, can land sooner):**

- Document the "OpenAI-compatible local sidecar" pattern in `LIBRARY_CAPABILITIES.md` ai-assist section: a short note + example showing how to construct an `IAiProviderDescriptor` pointing at `http://127.0.0.1:11434/v1` for Ollama (and a corresponding LM Studio / llamafile note). This is <1 day and covers a meaningful slice of local-model use cases independent of the larger Option-2 decision.

If Option 3 is accepted instead, the minimum fgv should do is: add a `LIBRARY_CAPABILITIES.md` decision-shortcut entry explicitly naming "local in-process model invocation" as deliberately out-of-scope and pointing consumers at `@huggingface/transformers` / `node-llama-cpp` directly (with the canonical `captureAsyncResult` snippet), plus the OpenAI-compatible-sidecar note above. That preserves the discipline that nothing accidentally accumulates as an undocumented gap.

---

## Sources

- [Transformers.js v4: Now Available on NPM (Hugging Face blog)](https://huggingface.co/blog/transformersjs-v4)
- [huggingface/transformers.js GitHub](https://github.com/huggingface/transformers.js)
- [Release 4.0.0 · huggingface/transformers.js](https://github.com/huggingface/transformers.js/releases/tag/4.0.0)
- [withcatai/node-llama-cpp GitHub](https://github.com/withcatai/node-llama-cpp)
- [node-llama-cpp embedding guide](https://node-llama-cpp.withcat.ai/guide/embedding)
- [ONNX Runtime Web — WebGPU tutorial](https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html)
- [WebLLM (mlc-ai/web-llm) GitHub](https://github.com/mlc-ai/web-llm)
- [WebLLM project home](https://webllm.mlc.ai/)
- [Ollama JavaScript library (ollama/ollama-js)](https://github.com/ollama/ollama-js)
- [EmbeddingGemma announcement (Google Developers blog)](https://developers.googleblog.com/en/introducing-embeddinggemma/)
- [On-device small language models with multimodality, RAG, and Function Calling (Google Developers blog)](https://developers.googleblog.com/google-ai-edge-small-language-models-multimodality-rag-function-calling/)
- [The Best Open-Source Small Language Models (SLMs) in 2026 (BentoML)](https://www.bentoml.com/blog/the-best-open-source-small-language-models)
