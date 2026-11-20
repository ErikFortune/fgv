# Stream brief: `ai-assist-embeddings` — cross-provider embedding primitive

**Status:** commissioned 2026-06-06 (Erik). Integration branch: `ai-assist-embeddings` (off `release`).
**Type:** DESIGN-only now (like the Ollama B design). Produce a design doc + a clear **build recommendation** + phased plan. No implementation, no scaffolding.
**Why now:** elevated out of the `ollama-native` design (OQ-1). Ollama embeddings are reachable via `/v1/embeddings`, so a cross-provider ai-assist embedding primitive may **subsume or reshape** the native `embed` planned for `@fgv/ts-extras-ollama`. Erik wants this designed *before* we build any Ollama embedding code — "we might actually want to build it." This gates the Ollama B O-4 embed sub-task.

Deliverable: `.ai/tasks/active/ai-assist-embeddings/design.md` (+ short plan), on a branch off `ai-assist-embeddings`, PR'd into `ai-assist-embeddings`. **Never target `main`** — ai-assist is release-only active surface.

---

## Goal

Design a cross-provider **embedding primitive** for `@fgv/ts-extras/ai-assist`, analogous to the existing completion and image-generation primitives. Today ai-assist has **no embedding API at all** — `callProviderCompletion`, `callProviderImageGeneration`, streaming, and `executeClientToolTurn` exist, but nothing for `text → vector`. Embeddings are the missing third modality, and OpenAI / Gemini / Ollama(-via-`/v1`) / many self-hosted servers all expose them.

## Read first (the structural template + the seams)

The **image-generation primitive is the exact structural precedent** — it was added to ai-assist as a parallel capability with: a provider capability declaration on the descriptor, a per-provider format dispatch, an options resolver, and `callProvider*` entry points. Mirror it.

- `libraries/ts-extras/src/packlets/ai-assist/model.ts` — `IAiProviderDescriptor` (note `imageGeneration?: IAiImageModelCapability[]`), `AiApiFormat`, `IAiImageModelCapability`, `AiProviderId`. The embedding capability should follow the `imageGeneration` capability-declaration pattern.
- `libraries/ts-extras/src/packlets/ai-assist/apiClient.ts` — `callProviderImageGeneration` / `callProxiedImageGeneration` (the structural template), `callProviderCompletion`, `resolveEffectiveBaseUrl` usage, the per-format adapter functions (`/chat/completions`, `/responses`, `/messages`, Gemini `:generateContent`, image `/images/generations` + Gemini `:predict`). The embedding adapters slot in the same way.
- `libraries/ts-extras/src/packlets/ai-assist/registry.ts` — `IAiProviderDescriptor` instances (`openai`, `google-gemini`, `xai-grok`, `anthropic`, `ollama`, `openai-compat`) and `DEFAULT_MODEL_CAPABILITY_CONFIG`. Determine which providers get an embedding capability and what model patterns.
- The image-gen options resolver (`imageOptionsResolver` / `IResolvedImageOptions`) as the template for an embedding options resolver if one is warranted.
- `.ai/instructions/LIBRARY_CAPABILITIES.md` (the ai-assist entry; the integration-boundary + active-surface conventions) and `.ai/instructions/ACTIVE_DEVELOPMENT.md` (ai-assist is active surface — additive is cheap, no compat burden).
- The cross-link: `.ai/tasks/active/ollama-native/design.md` §9 OQ-1 + the 2026-06-06 amendment note — this stream resolves whether native Ollama `embed` is still needed.

## External knowledge (web search)

Per-provider embedding API shapes and how divergent they are:
- **OpenAI** `/v1/embeddings` — `{ input: string|string[], model, dimensions?, encoding_format? } → { data: [{ embedding, index }], usage }`. `text-embedding-3-small/large`.
- **Gemini** — `:embedContent` / `:batchEmbedContents` (`text-embedding-004`, `gemini-embedding-001`); has a `taskType` (RETRIEVAL_QUERY vs RETRIEVAL_DOCUMENT vs SEMANTIC_SIMILARITY…) and `outputDimensionality`. Note the query-vs-document asymmetry — a real cross-provider modeling question.
- **Ollama** — `/api/embed` (native: `{ model, input } → { embeddings, total_duration, prompt_eval_count }`) AND `/v1/embeddings` (OpenAI-compat). Determine what native adds over `/v1`.
- **xAI** — check whether it offers embeddings at all (it may not); if not, the descriptor simply omits the capability.
- **openai-compat** — covers most self-hosted (vLLM, LM Studio, etc.) via the OpenAI shape.

## The core design questions to answer

1. **Surface.** Sketch `callProviderEmbedding({ descriptor, apiKey, params: { input: string | ReadonlyArray<string>, model?, dimensions?, taskType?, … }, endpoint?, signal? }): Promise<Result<IEmbeddingResult>>` (+ a `callProxiedEmbedding` mirror if image-gen has one). Batch input is the norm — design for `string[]` in, `number[][]` out. Decide the result shape (`{ vectors: ReadonlyArray<ReadonlyArray<number>>; model; usage? }`), and whether to expose `Float32Array` vs `number[]`.
2. **Format dispatch.** Does this need a new `AiEmbeddingFormat` union (openai / gemini / …) analogous to `AiApiFormat`, or can most providers be served by the OpenAI `/v1/embeddings` shape with only Gemini needing a distinct adapter? Recommend.
3. **Capability declaration.** Design `embedding?: IAiEmbeddingModelCapability[]` on `IAiProviderDescriptor` (model patterns, default dimensions, max batch, whether `taskType`/`dimensions` are supported) mirroring `IAiImageModelCapability`.
4. **The cross-provider modeling tension.** Gemini's `taskType` (query vs document) has no OpenAI analog. Decide how the unified surface handles provider-specific knobs (an optional field that providers ignore vs a per-provider options block, à la the image-gen layered options). Don't force a lowest-common-denominator that loses Gemini's retrieval asymmetry.
5. **The Ollama feedback.** Conclude explicitly: does `callProviderEmbedding` pointed at an Ollama `/v1` (or native) endpoint make `@fgv/ts-extras-ollama`'s native `embed` **redundant**? If yes, native embed is cut from Ollama B (OQ-1 resolves to "no"). If native `/api/embed` offers something material (`total_duration`/`prompt_eval_count`, reusing the already-loaded chat model without a second load), say so and scope the boundary between the two.
6. **Relationship to `@fgv/ts-extras-transformers`'s in-process `embed`.** Three embedding paths now exist conceptually (transformers ONNX in-process; ai-assist cross-provider HTTP; ollama native). Give the decision-shortcut guidance for when to use which.
7. **BUILD recommendation.** Erik: "we might actually want to build it." Give a clear go/no-go + sizing + phased plan (mirroring how ai-assist's image-gen primitive was built). Note whether it should be built before, with, or independent of Ollama B.

## Output structure for design.md

Problem (the missing third modality) & motivation; the image-gen primitive as the structural template (cite files); the proposed surface with full signatures + result types; the format-dispatch decision (new `AiEmbeddingFormat` vs reuse OpenAI shape); the capability-declaration design; per-provider wire mapping (OpenAI / Gemini / Ollama / openai-compat; xAI presence check); the cross-provider knob-handling decision (taskType/dimensions); the **Ollama-redundancy conclusion** (resolves Ollama OQ-1); the transformers-vs-ai-assist-vs-ollama decision-shortcut; test strategy (mock fetch + per-format fixtures, no live calls); explicit NOT-in-scope; open questions; and a **build recommendation + phased plan** (S/M/L). Respect Result pattern, no `any`, additive-extension discipline.

Design-only: no `rushx build`/`test` (no code). Report back: branch, PR number, the surface decision, the **Ollama-redundancy verdict** (the load-bearing output that unblocks Ollama B's embed), and the build recommendation.
