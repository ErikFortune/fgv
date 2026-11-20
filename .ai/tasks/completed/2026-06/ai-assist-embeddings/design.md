# Design: ai-assist-embeddings — cross-provider embedding primitive

**Stream:** ai-assist-embeddings
**Phase:** A — design only (no implementation, no scaffolding)
**Date:** 2026-06-06
**Status:** Draft — awaiting orchestrator/user signoff
**Integration branch:** `ai-assist-embeddings` (off `release`)
**Structural template:** the ai-assist image-generation primitive
**Resolves:** ollama-native OQ-1 (is native Ollama `embed` still needed?)

---

## Table of Contents

1. [Problem & motivation — the missing third modality](#1-problem--motivation--the-missing-third-modality)
2. [The image-gen primitive as the structural template](#2-the-image-gen-primitive-as-the-structural-template)
3. [Proposed surface — signatures + result types](#3-proposed-surface--signatures--result-types)
4. [Format-dispatch decision — `AiEmbeddingFormat` vs reuse OpenAI shape](#4-format-dispatch-decision--aiembeddingformat-vs-reuse-openai-shape)
5. [Capability-declaration design](#5-capability-declaration-design)
6. [Per-provider wire mapping](#6-per-provider-wire-mapping)
7. [Cross-provider knob handling — taskType / dimensions](#7-cross-provider-knob-handling--tasktype--dimensions)
8. [The Ollama-redundancy conclusion (resolves OQ-1)](#8-the-ollama-redundancy-conclusion-resolves-oq-1)
9. [transformers-vs-ai-assist-vs-ollama decision shortcut](#9-transformers-vs-ai-assist-vs-ollama-decision-shortcut)
10. [Test strategy](#10-test-strategy)
11. [Explicitly NOT in scope](#11-explicitly-not-in-scope)
12. [Open questions](#12-open-questions)
13. [Build recommendation + phased plan](#13-build-recommendation--phased-plan)

---

## 1. Problem & motivation — the missing third modality

`@fgv/ts-extras/ai-assist` is the repo's cross-provider "distant-LLM HTTP client." It exposes
three modalities today, all built on the same descriptor → capability → format-dispatch →
`callProvider*` spine:

| Modality | Entry points | Status |
|---|---|---|
| **Completion** (text → text) | `callProviderCompletion` / `callProviderCompletionStream` / `executeClientToolTurn` | shipped |
| **Image generation** (text → image) | `callProviderImageGeneration` / `callProxiedImageGeneration` | shipped |
| **Embedding** (text → vector) | — | **absent** |

Embeddings are the missing third modality. They are the single most common cloud+local AI
operation in 2026 (see `.ai/notes/orchestrator/research/local-models-incorporation.md` §"Embedding
generation"): semantic search, RAG retrieval pre-filtering, dedup, "find similar," and zero-shot
classification by cosine similarity to label embeddings. OpenAI, Gemini, Ollama (via `/v1` and
native `/api/embed`), and essentially every self-hosted OpenAI-compatible server (vLLM, LM Studio,
llama.cpp's openai-server) all expose an embedding endpoint. ai-assist exposes none of them.

**Cohesion check (important, because the local-models research note flagged it).** The research
note's §"Sub-option 1a: extend ai-assist" rejected folding embeddings into ai-assist *on cohesion
grounds* — but the thing it rejected was the **in-process pipeline** story (stateful pipeline
lifecycle, WebGPU buffer management, model-weight caching). A pure **HTTP `callProviderEmbedding`**
is exactly the same shape as `callProviderCompletion`: descriptor in, `fetch` out, `Result<T>` back.
It IS cohesive with ai-assist's "distant-LLM HTTP client" identity. The non-cohesive thing —
in-process model execution — already lives in its correct home (`@fgv/ts-extras-transformers`). So
this design adds the cloud-HTTP embedding leg to ai-assist and leaves the in-process leg where it is.
That split is the spine of §9.

ai-assist is **active surface** per `ACTIVE_DEVELOPMENT.md` (only `ai-assist` and `crypto-utils` are
active within ts-extras). This whole feature is **additive** — a new optional descriptor field, new
exported types, new `callProvider*` entry points. No existing export changes. Per the lockstep policy
that makes additive extension cheap, this is the textbook case for "extend the primitive."

---

## 2. The image-gen primitive as the structural template

The image-generation primitive is the **exact structural precedent** and this design mirrors it
field-for-field. The four moving parts (cite files on `release`/this branch):

1. **Capability declaration on the descriptor.**
   `IAiProviderDescriptor.imageGeneration?: ReadonlyArray<IAiImageModelCapability>`
   (`model.ts:692`, capability shape at `model.ts:701`). Empty/undefined ⇒ provider doesn't support
   the modality. Each entry is keyed by `modelPrefix` (longest-prefix wins) and carries a `format`
   plus per-format flags.

2. **A format union for dispatch.** `AiImageApiFormat` (`model.ts:504`) =
   `'openai-images' | 'gemini-imagen' | 'xai-images' | 'xai-images-edits' | 'gemini-image-out'`,
   parallel to the completion `AiApiFormat` (`model.ts:486`).

3. **Capability resolution + dispatcher.** `supportsImageGeneration` (`registry.ts:320`) and
   `resolveImageCapability` (longest-prefix match, `registry.ts:338`); the dispatcher
   `callProviderImageGeneration` (`apiClient.ts:1392`) resolves base URL via `resolveEffectiveBaseUrl`,
   resolves the model via `resolveModel(..., 'image')`, resolves the capability, then `switch`es on
   `capability.format` to a per-format adapter. `callProxiedImageGeneration` (`apiClient.ts:1968`) is
   the browser/CORS mirror that POSTs to `${proxyUrl}/api/ai/image-generation`.

4. **An options resolver** (`imageOptionsResolver.ts`): merges generic top-level options with
   per-family blocks into a flat `IResolvedImageOptions` wire shape (`imageOptionsResolver.ts:99`),
   then `validateResolvedOptions` pre-validates against the capability before the wire call.

Each of these has a 1:1 embedding analog below. **The dispatch spine is reused verbatim; only the
adapters and result shape are new.** Embeddings are structurally *simpler* than image-gen (no
reference-image branch, no multipart, no per-family layered-options matrix), so the embedding version
is a strict subset of the image-gen complexity.

---

## 3. Proposed surface — signatures + result types

### 3.1 Request / result types (`model.ts`)

```typescript
/**
 * A single embedding task-type hint (Gemini-style). Cross-provider; providers
 * that don't support task typing ignore it. Open string union so new Gemini
 * task types don't force a churn, with the known set enumerated for ergonomics.
 * @public
 */
export type AiEmbeddingTaskType =
  | 'retrieval-query'
  | 'retrieval-document'
  | 'semantic-similarity'
  | 'classification'
  | 'clustering'
  | 'code-retrieval-query'
  | 'question-answering'
  | 'fact-verification'
  | (string & {});

/**
 * Parameters for an embedding request. Batch is the norm: `input` accepts a
 * single string or an array; the result always exposes a vector array aligned
 * by index to the input.
 * @public
 */
export interface IAiEmbeddingParams {
  /** One or more input strings. A bare string is treated as a single-element batch. */
  readonly input: string | ReadonlyArray<string>;
  /**
   * Requested output dimensionality. Honored only by models that support
   * dimension reduction (OpenAI text-embedding-3-*, Gemini gemini-embedding-001
   * via MRL truncation). Ignored — with a trace-level note — by models that
   * don't (see §7).
   */
  readonly dimensions?: number;
  /**
   * Task-type hint. Maps to Gemini `taskType`; no-op on OpenAI/Ollama/compat.
   * Preserves Gemini's query-vs-document retrieval asymmetry (see §7).
   */
  readonly taskType?: AiEmbeddingTaskType;
}

/**
 * Token-usage accounting for an embedding call, when the provider reports it.
 * @public
 */
export interface IAiEmbeddingUsage {
  /** Tokens consumed by the input(s). */
  readonly promptTokens?: number;
  /** Total tokens billed. */
  readonly totalTokens?: number;
}

/**
 * Result of an embedding call. `vectors[i]` is the embedding for `input[i]`,
 * in request order.
 * @public
 */
export interface IAiEmbeddingResult {
  /** One vector per input, aligned by index. `number[]` (see §3.3 on Float32Array). */
  readonly vectors: ReadonlyArray<ReadonlyArray<number>>;
  /** The model that produced the vectors (resolved, provider-native id). */
  readonly model: string;
  /** Dimensionality of each returned vector (vectors[0].length; 0 for empty input). */
  readonly dimensions: number;
  /** Token usage, when the provider reports it. */
  readonly usage?: IAiEmbeddingUsage;
}
```

### 3.2 Entry points (`apiClient.ts`)

```typescript
/**
 * Parameters for a provider embedding request. Mirrors
 * {@link IProviderImageGenerationParams}.
 * @public
 */
export interface IProviderEmbeddingParams {
  readonly descriptor: IAiProviderDescriptor;
  readonly apiKey: string;
  readonly params: IAiEmbeddingParams;
  /** Optional model override; uses descriptor.defaultModel.embedding otherwise. */
  readonly modelOverride?: ModelSpec;
  readonly logger?: Logging.ILogger;
  readonly signal?: AbortSignal;
  /** Optional base-URL override; per-route suffix appended unchanged. */
  readonly endpoint?: string;
}

/**
 * Calls the appropriate embedding API for a given provider. Routes by the
 * `format` of the resolved {@link IAiEmbeddingModelCapability}.
 * @public
 */
export async function callProviderEmbedding(
  params: IProviderEmbeddingParams
): Promise<Result<IAiEmbeddingResult>>;

/**
 * Proxy mirror of {@link callProviderEmbedding}. POSTs to
 * `${proxyUrl}/api/ai/embedding`.
 * @public
 */
export async function callProxiedEmbedding(
  proxyUrl: string,
  params: IProviderEmbeddingParams
): Promise<Result<IAiEmbeddingResult>>;
```

`callProxiedEmbedding` is included because the image-gen primitive has `callProxiedImageGeneration`
and embeddings have the same browser-CORS exposure (OpenAI/Gemini are reachable browser-side, but a
deployment that routes "all providers through the proxy" via `proxyAllProviders` needs the proxy leg
to exist). It is **cheap** (the proxy POST + response-validate pattern is ~30 lines, copied from the
image-gen mirror) and omitting it would be the only place the embedding surface diverges from its
template. Recommend: include it.

### 3.3 `number[]` vs `Float32Array` — recommend `number[]`

The result exposes `ReadonlyArray<ReadonlyArray<number>>`, **not** `Float32Array`. Reasons:

- **JSON-wire fidelity.** Every provider returns embeddings as JSON arrays of doubles (or base64 of
  float32, which we decode). The proxy leg round-trips through JSON — `Float32Array` is not
  JSON-serializable and would force a custom (de)serializer at the proxy boundary, breaking the
  symmetric "validate the JSON response" pattern shared with completion/image-gen.
- **Validator-friendliness.** `Converters.arrayOf(Converters.number)` validates a `number[]` directly;
  there is no `Float32Array` converter and adding one is out of scope.
- **Precision.** The wire format is already float32 on most providers; widening to JS `number`
  (float64) is lossless. Consumers who want a typed array call `Float32Array.from(vector)` — a
  one-liner — at the point they hand it to a vector store / WebGPU buffer.
- **Consistency with `IAiImageData`.** Image-gen returns base64 strings, not `Uint8Array`, for the
  same JSON-boundary reason. `number[]` is the embedding analog of that decision.

The research note (§"Embedding generation": *"The output shape is trivial: `Float32Array` of fixed
dimension"*) describes the *in-process transformers* shape, where the upstream library hands back a
`Tensor`/typed array directly with no JSON boundary. That's the right shape there and `number[]` is
the right shape here; the two embedding legs legitimately differ on this point. Noted as OQ-2 for
signoff in case the orchestrator wants wire-shape symmetry across the two legs.

---

## 4. Format-dispatch decision — `AiEmbeddingFormat` vs reuse OpenAI shape

**Decision: introduce a new `AiEmbeddingFormat` union, but with only two members.**

```typescript
/**
 * API format categories for embedding provider routing.
 * @public
 */
export type AiEmbeddingFormat = 'openai-embeddings' | 'gemini-embeddings';
```

Rationale:

- The OpenAI `/v1/embeddings` shape covers **OpenAI, Ollama-via-`/v1`, openai-compat, and any future
  OpenAI-shaped provider** — one adapter, one fixture family. This is the overwhelming majority case.
- **Gemini is genuinely divergent** and cannot be served by the OpenAI shape: different route
  (`:embedContent` / `:batchEmbedContents`, not `/embeddings`), different auth header
  (`x-goog-api-key`, already the Gemini pattern in the completion/image adapters), different request
  body (`requests: [{ model, content: { parts: [{ text }] }, taskType, outputDimensionality }]`),
  different response (`embeddings: [{ values: number[] }]`), and the `taskType` semantics that have
  no OpenAI analog. It needs its own adapter.
- A two-member union (rather than "reuse `AiApiFormat`" or "a boolean `geminiEmbeddings` flag") keeps
  the embedding dispatch **structurally identical** to image-gen's `switch (capability.format)` and
  leaves clean room for a third member if a future provider (Cohere `embed-v3`, Voyage) turns out to
  be neither OpenAI- nor Gemini-shaped. It also keeps the embedding format namespace separate from the
  completion `AiApiFormat` so the two can't be accidentally cross-wired.

**Not** reusing `AiApiFormat` directly: `AiApiFormat`'s `'anthropic'` member is meaningless for
embeddings (Anthropic has no embedding endpoint — see §6), and `'openai'`/`'gemini'` there route to
*chat* endpoints. A separate union prevents that category confusion, mirroring exactly why image-gen
got `AiImageApiFormat` instead of overloading `AiApiFormat`.

The dispatcher:

```typescript
switch (capability.format) {
  case 'openai-embeddings':
    return callOpenAiEmbeddings(config, request, capability, logger, signal);
  case 'gemini-embeddings':
    return callGeminiEmbeddings(config, request, capability, logger, signal);
  /* c8 ignore next 4 - exhaustive switch guaranteed by TypeScript */
  default: {
    const _exhaustive: never = capability.format;
    return fail(`unsupported embedding API format: ${String(_exhaustive)}`);
  }
}
```

---

## 5. Capability-declaration design

Mirror `IAiImageModelCapability`. New optional field on the descriptor + new capability interface +
two registry helpers.

```typescript
// On IAiProviderDescriptor (additive, optional):
/**
 * Embedding capabilities, scoped to model id prefixes. Empty/undefined means
 * the provider does not support embeddings. Longest-prefix match wins
 * (see {@link AiAssist.resolveEmbeddingCapability}).
 *
 * Embedding-model selection uses a new `'embedding'` {@link ModelSpecKey};
 * providers that declare `embedding` should declare a model in
 * `defaultModel.embedding`.
 */
readonly embedding?: ReadonlyArray<IAiEmbeddingModelCapability>;

/**
 * Embedding capability for a model family within a provider.
 * @public
 */
export interface IAiEmbeddingModelCapability {
  /** Prefix matched against the resolved embedding model id; '' is catch-all, longest wins. */
  readonly modelPrefix: string;
  /** API format used to dispatch requests for matching models. */
  readonly format: AiEmbeddingFormat;
  /** Whether matching models honor `dimensions` (OpenAI 3-*, gemini-embedding-001). */
  readonly supportsDimensions?: boolean;
  /** Whether matching models honor `taskType` (Gemini only today). */
  readonly supportsTaskType?: boolean;
  /** Native fixed output dimension, when the model has one (for empty-input / metadata). */
  readonly defaultDimensions?: number;
  /** Max inputs accepted per request; dispatcher pre-validates batch size when set. */
  readonly maxBatchSize?: number;
}
```

New `ModelSpecKey`: add `'embedding'` to the `ModelSpecKey` union (`model.ts:379`) and to
`allModelSpecKeys` (`model.ts:385`). This is additive and parallels how image-gen reused/extended the
`ModelSpecKey` set (it uses `'image'`). The dispatcher calls `resolveModel(modelOverride ??
descriptor.defaultModel, 'embedding')`.

Registry helpers (`registry.ts`), parallel to `supportsImageGeneration` / `resolveImageCapability`:

```typescript
export function supportsEmbedding(descriptor: IAiProviderDescriptor): boolean;
export function resolveEmbeddingCapability(
  descriptor: IAiProviderDescriptor,
  modelId: string
): IAiEmbeddingModelCapability | undefined; // longest-prefix match, identical algorithm
```

**No layered options resolver.** The image-gen `imageOptionsResolver` exists because image-gen has a
large per-family option matrix (size/quality/style/aspect-ratio/background/... across 5 families).
Embeddings have exactly **two** knobs (`dimensions`, `taskType`), both already flat on
`IAiEmbeddingParams`, both validated trivially against the resolved capability inside the dispatcher.
A dedicated resolver module would be over-engineering. (Revisit only if a provider-specific embedding
options matrix materializes — none exists in 2026.) This is the one place the embedding design is
*deliberately simpler* than the template, and the reasoning is the same one `CODING_STANDARDS.md`
gives: "Three similar lines is better than a premature abstraction."

### 5.1 Registry entries

| Provider | `embedding` capability | Default embedding model |
|---|---|---|
| `openai` | `[{ modelPrefix: 'text-embedding-3', format: 'openai-embeddings', supportsDimensions: true, maxBatchSize: 2048 }, { modelPrefix: '', format: 'openai-embeddings' }]` | `defaultModel.embedding: 'text-embedding-3-small'` |
| `google-gemini` | `[{ modelPrefix: '', format: 'gemini-embeddings', supportsDimensions: true, supportsTaskType: true, defaultDimensions: 3072 }]` | `defaultModel.embedding: 'gemini-embedding-001'` |
| `ollama` | `[{ modelPrefix: '', format: 'openai-embeddings' }]` (via `/v1/embeddings`) | none (self-hosted; caller supplies, e.g. `nomic-embed-text`) |
| `openai-compat` | `[{ modelPrefix: '', format: 'openai-embeddings' }]` | none (caller supplies) |
| `groq` | omit (no embeddings endpoint as of 2026) | — |
| `mistral` | `[{ modelPrefix: '', format: 'openai-embeddings' }]` — `mistral-embed` is OpenAI-shaped¹ | `defaultModel.embedding: 'mistral-embed'` |
| `xai-grok` | **omit** — xAI has no public embeddings endpoint (§6) | — |
| `anthropic` | **omit** — no first-party embeddings (§6) | — |
| `copy-paste` | omit (not an HTTP provider) | — |

¹ Mistral's embeddings are OpenAI-compatible; including it is low-cost but optional — flag as OQ-3 if
the orchestrator prefers to ship only the providers exercised by fixtures. Recommend include.

Also add an `'embedding'` member to `AiModelCapability` (`model.ts:1052`) and corresponding
`DEFAULT_MODEL_CAPABILITY_CONFIG` rules (`registry.ts:362`) so `callProviderListModels` can filter
embedding models (e.g. `openai: { idPattern: /^text-embedding/, capabilities: ['embedding'] }`,
`google-gemini: { idPattern: /embedding/, capabilities: ['embedding'] }`).

---

## 6. Per-provider wire mapping

### 6.1 OpenAI (`openai-embeddings` format) — also Ollama-via-`/v1`, openai-compat, Mistral

**Route:** `POST {baseUrl}/embeddings` · **Auth:** `Authorization: Bearer {apiKey}` (Ollama/compat:
no key).

Request:
```json
{ "model": "text-embedding-3-small", "input": ["a", "b"], "dimensions": 512, "encoding_format": "float" }
```
- `input`: pass the array verbatim (single string → `[string]`). `dimensions` sent only when
  `capability.supportsDimensions` and the caller supplied it. `encoding_format: 'float'` always
  (avoids the base64 decode path; recommend not exposing base64 — OQ).

Response:
```json
{ "object": "list",
  "data": [ { "object": "embedding", "index": 0, "embedding": [/* floats */] },
            { "object": "embedding", "index": 1, "embedding": [/* floats */] } ],
  "model": "text-embedding-3-small",
  "usage": { "prompt_tokens": 8, "total_tokens": 8 } }
```
- Validate with `Converters.object`. **Sort `data` by `index`** before extracting `embedding` (the
  spec allows out-of-order; align to request order). Map `usage` → `IAiEmbeddingUsage`.

### 6.2 Gemini (`gemini-embeddings` format)

**Route:** `POST {baseUrl}/models/{model}:batchEmbedContents` (always use the batch route; a single
input is a one-element batch — uniform code path). · **Auth:** `x-goog-api-key: {apiKey}`.

Request:
```json
{ "requests": [
    { "model": "models/gemini-embedding-001",
      "content": { "parts": [ { "text": "a" } ] },
      "taskType": "RETRIEVAL_DOCUMENT",
      "outputDimensionality": 512 } ] }
```
- One `requests[]` entry per input. `taskType` mapped from `AiEmbeddingTaskType` →
  `SCREAMING_SNAKE_CASE` (`'retrieval-document'` → `'RETRIEVAL_DOCUMENT'`), sent only when
  `capability.supportsTaskType` and supplied. `outputDimensionality` from `dimensions` when supported.
- `model` inside each request must be the fully-qualified `models/{id}` form.

Response:
```json
{ "embeddings": [ { "values": [/* floats */] }, { "values": [/* floats */] } ] }
```
- Aligned by request order (no `index` field). Map `embeddings[i].values` → `vectors[i]`. Gemini does
  not report token usage on the embed endpoint → `usage` omitted.
- MRL note: when `outputDimensionality < 3072`, Gemini truncates from the end and the result is **not
  re-normalized**; the spec recommends consumers L2-normalize. We do **not** normalize in the library
  (that's a consumer-domain decision) but document it on `IAiEmbeddingResult`. (OQ-4: should we offer
  an opt-in `normalize?: boolean`? Recommend: no, out of scope — leave to the vector store.)

### 6.3 Ollama — native `/api/embed` (NOT used by this primitive; see §8)

For completeness/§8: `POST {host}/api/embed` with `{ "model", "input": string | string[] }` →
`{ "model", "embeddings": number[][], "total_duration", "load_duration", "prompt_eval_count" }`.
This primitive routes Ollama through `/v1/embeddings` (openai-embeddings format) instead — §8 explains
why and what native would add.

### 6.4 xAI — no embeddings endpoint

Confirmed via xAI API docs (June 2026): **xAI does not expose a public text-embeddings endpoint.**
Embedding-adjacent functionality exists only inside the higher-level Collections (RAG) API, which is
not a `text → vector` primitive. The `xai-grok` descriptor therefore **omits** the `embedding` field
entirely — `supportsEmbedding(xai)` returns `false` and `callProviderEmbedding` fails up front with
`provider "xai-grok" does not support embeddings`. (This is the designed behavior, identical to how a
non-image provider rejects image-gen.)

### 6.5 Anthropic — no first-party embeddings

Anthropic has never shipped a first-party embeddings endpoint (it points users to Voyage AI). The
`anthropic` descriptor omits `embedding`. Same up-front rejection path.

---

## 7. Cross-provider knob handling — taskType / dimensions

The brief's central modeling tension: **Gemini's `taskType` (RETRIEVAL_QUERY vs RETRIEVAL_DOCUMENT
vs SEMANTIC_SIMILARITY…) has no OpenAI analog, and the query-vs-document asymmetry is the whole point
of retrieval embeddings.** Don't flatten it away.

**Decision: optional flat fields on `IAiEmbeddingParams` (`dimensions`, `taskType`), gated by
per-capability `supports*` flags — NOT a per-provider layered options block.**

Why flat-optional rather than the image-gen layered `models[]` block:

- There are only two knobs, and both are **conceptually cross-provider** even if only some providers
  honor them. `dimensions` is honored by OpenAI 3-* AND Gemini. `taskType` is Gemini-only *today* but
  is a general retrieval concept (Cohere has `input_type`, Voyage has `input_type`) — modeling it as a
  first-class cross-provider field positions us for those without churn.
- The image-gen layered block exists to disambiguate **conflicting** per-family option *vocabularies*
  (dall-e `size` strings vs xAI aspect ratios vs Imagen `imageSize`). Embeddings have no such
  conflict: `dimensions` is an integer everywhere, `taskType` is a single enum.

**Handling policy (the load-bearing part — don't silently lose Gemini's asymmetry):**

| Caller supplies | Capability supports it | Behavior |
|---|---|---|
| `taskType` | yes (Gemini) | Mapped to wire `taskType`. Full asymmetry preserved. |
| `taskType` | no (OpenAI/Ollama/compat) | **No-op, with a `logger.info` note** ("model X ignores taskType"). NOT a failure — the same embedding text is valid input; the hint is simply unused. This is correct because OpenAI 3-* models are symmetric (query and document embed identically). |
| `dimensions` | yes | Sent on the wire (`dimensions` / `outputDimensionality`). |
| `dimensions` | no | **No-op with a `logger.info` note.** NOT a failure. The model returns its native dimension; `IAiEmbeddingResult.dimensions` reflects what actually came back. |

Rationale for no-op-not-fail: a caller building a cross-provider RAG pipeline wants to pass
`taskType: 'retrieval-query'` once and have it *apply where it matters* and *be harmlessly ignored
where it doesn't* — failing would force per-provider branching at the call site, defeating the
cross-provider primitive's purpose. The `logger.info` note keeps it diagnosable. The escape hatch for
"I really need to know if it was honored" is `IAiEmbeddingResult.dimensions` (reflects reality) and
the capability query (`resolveEmbeddingCapability(...).supportsTaskType`).

This preserves Gemini's retrieval asymmetry fully (a Gemini caller gets query/document optimization)
while keeping a clean lowest-common-denominator call site for the symmetric providers — without
lowering Gemini to that denominator.

The `'other'`-style escape hatch (verbatim `JsonObject` passthrough, as image-gen's
`IOtherModelOptions` has) is **deferred** — there is no provider-specific embedding param beyond
these two in 2026. If one appears, add an optional `providerParams?: JsonObject` to
`IAiEmbeddingParams` then (additive). Flagged as OQ-5.

---

## 8. The Ollama-redundancy conclusion (resolves OQ-1)

**Verdict: `callProviderEmbedding` pointed at Ollama's `/v1/embeddings` makes a dedicated native
`embed` in `@fgv/ts-extras-ollama` REDUNDANT. Cut native embed from Ollama B (OQ-1 → "no").**

Reasoning:

1. **Ollama serves embeddings on `/v1/embeddings` in the exact OpenAI shape.** ai-assist's
   `ollama` descriptor already routes completion through `/v1` (`baseUrl:
   'http://localhost:11434/v1'`, `apiFormat: 'openai'`). Adding `embedding: [{ modelPrefix: '',
   format: 'openai-embeddings' }]` to that descriptor means `callProviderEmbedding({ descriptor:
   ollama, params: { input } })` Just Works against a local Ollama with **zero Ollama-specific code**.
   It reuses the OpenAI adapter, the OpenAI fixtures, the endpoint override, the proxy leg.

2. **What native `/api/embed` adds is marginal and not worth a parallel code path:**
   - `total_duration` / `load_duration` / `prompt_eval_count` — diagnostics, not the embedding. No
     known consumer needs them programmatically; they're observable via the Ollama server logs.
   - `truncate` and `keep_alive` knobs — niche; `keep_alive` (model-residency tuning) is the one
     genuinely-native thing, and it's an *operational* concern better set via Ollama's own config /
     a warmup call than threaded through a cross-provider embedding type.
   - "Reuse the already-loaded chat model without a second load" — **not actually a native-only
     advantage.** `/v1/embeddings` hits the same Ollama runtime and the same model-residency cache;
     there is no second-load penalty inherent to the `/v1` route. Embedding and chat are different
     models anyway (you embed with `nomic-embed-text`, you chat with `llama3`), so the "reuse the
     loaded model" framing doesn't apply to the embedding case.

3. **The cohesion win is decisive.** One cross-provider embedding surface that treats Ollama as "just
   another OpenAI-shaped endpoint via `endpoint` override" is dramatically better than two embedding
   APIs (a cross-provider one *and* an Ollama-native one) that a consumer must choose between. The
   `@fgv/ts-extras-ollama` package, if it ships at all, should focus on what is *genuinely
   Ollama-native and has no `/v1` equivalent* (model pull/list/show/`ps`/lifecycle management) — not
   re-expose an embedding endpoint that the cross-provider primitive already covers.

**Boundary statement for Ollama B:** native `embed` is **out**. If, post-ship, a concrete consumer
demonstrates a hard need for `prompt_eval_count`/`keep_alive` at embed time, revisit as an additive
`@fgv/ts-extras-ollama` extension — but do not build it speculatively. This unblocks Ollama B's O-4
embed sub-task to be **deleted**, not implemented.

---

## 9. transformers-vs-ai-assist-vs-ollama decision shortcut

Three embedding paths now exist conceptually. The decision shortcut (proposed for
`LIBRARY_CAPABILITIES.md`):

> **Need a text embedding (`text → vector`)?**
> - **In-process, local, no network, you own the model lifecycle** (on-device RAG pre-filter, offline,
>   privacy-sensitive, zero per-call cost) → `embed` / `loadPipeline('feature-extraction', …)` from
>   **`@fgv/ts-extras-transformers`** (Node) / **`@fgv/ts-web-extras-transformers`** (browser).
>   Returns a raw `Tensor` (pass `{ pooling: 'mean', normalize: true }` for a sentence vector). You
>   manage model download/cache/device/quantization.
> - **Cross-provider cloud HTTP** (OpenAI `text-embedding-3-*`, Gemini `gemini-embedding-001`,
>   Mistral `mistral-embed`, or a **self-hosted OpenAI-compatible / Ollama server via the `endpoint`
>   override**) → `callProviderEmbedding` from **`@fgv/ts-extras/ai-assist`**. Batch in, `number[][]`
>   out, `Result`-wrapped, descriptor-driven. This is also the **Ollama** answer — point it at
>   `http://localhost:11434/v1`; there is no separate Ollama embedding API.
> - **There is no third "Ollama-native embedding" path** — Ollama embeddings are reached via the
>   cross-provider HTTP primitive above (see ai-assist-embeddings design §8).

One-line mental model: **`@fgv/ts-extras-transformers` = the weights run in *your* process;
`callProviderEmbedding` = the weights run on *a server you `fetch`*.** Local vs distant is the whole
distinction, same as completion (transformers/node-llama-cpp would be local completion; ai-assist is
distant completion).

---

## 10. Test strategy

Mirror the image-gen tests: **mock `fetch`, per-format fixtures, no live calls.** 100% coverage gate.

1. **Per-format response fixtures** (canonical JSON captured from API docs):
   - `openai-embeddings`: single-input and batch (2+ inputs), with and without `usage`, and an
     **out-of-order `data` array** to prove index-sorting.
   - `gemini-embeddings`: single and batch `batchEmbedContents` responses; a reduced-dimension
     response (proves `dimensions` flows through and the result reports the reduced length).
2. **Request-body assertions (the load-bearing tests — see the C4 cautionary tale in
   `TESTING_GUIDELINES.md`):** assert the *outgoing request body* actually contains what the caller
   asked for. Specifically — a test that `taskType: 'retrieval-query'` on a Gemini call produces
   `"taskType": "RETRIEVAL_QUERY"` in the request body, and that the *same* call on an OpenAI
   descriptor produces a body with **no** `taskType` field (the no-op path) and emits the info note.
   Without this, coverage could be 100% while the central cross-provider knob silently never reaches
   the wire.
3. **Dispatch + capability tests:** `supportsEmbedding` true/false; `resolveEmbeddingCapability`
   longest-prefix; up-front rejection for xAI/Anthropic; "no embedding model resolved" when
   `defaultModel.embedding` is absent and no override given (Ollama/compat path).
4. **Batch alignment:** N inputs → N vectors in request order, for both formats.
5. **`endpoint` override:** Ollama/compat path constructs `{endpoint}/embeddings`.
6. **`callProxiedEmbedding`:** proxy POST shape + `{error}` surfacing, mirroring the image proxy test.
7. **Error paths:** non-2xx, malformed response (missing `data`/`embeddings`), empty input.
8. **`code-reviewer` pass BEFORE coverage closure** (per `TESTING_GUIDELINES.md` §"Coverage Gap
   Resolution") — the request-body class of test above is exactly what that ordering protects.

No `Float32Array` in tests (we return `number[]`). Result matchers throughout
(`toSucceedAndSatisfy`, `toFailWith`).

---

## 11. Explicitly NOT in scope

- **In-process / local embedding** — owned by `@fgv/ts-extras-transformers`. Not duplicated here.
- **Ollama-native `/api/embed`** — subsumed by `/v1/embeddings` (§8). Not built.
- **A layered embedding-options resolver** — two flat knobs don't warrant it (§5).
- **`Float32Array` result type** — `number[]`; consumers convert (§3.3).
- **Library-side L2 normalization** of vectors — consumer/vector-store concern (§6.2).
- **`encoding_format: 'base64'` exposure** — always request `'float'`; base64 decode path omitted.
- **Vector storage / similarity / cosine / a vector index** — not ai-assist's job.
- **Classification / reranking endpoints** (Cohere rerank, etc.) — a future, separate modality.
- **Anthropic / xAI embedding shims via third parties (Voyage)** — callers use those providers directly.
- **Streaming embeddings** — embeddings are single-shot; no streaming concept.
- **Caching / dedup of embedding calls** — consumer concern (use `Crc32Normalizer` for keys).

---

## 12. Open questions

- **OQ-2 (result wire shape):** `number[]` (recommended, §3.3) vs `Float32Array` for symmetry with
  the transformers leg. Recommend `number[]`.
- **OQ-3 (Mistral inclusion):** ship `mistral` embedding capability now (OpenAI-shaped, low cost) or
  defer to "providers with fixtures only"? Recommend include.
- **OQ-4 (normalize knob):** offer opt-in `normalize?: boolean` on `IAiEmbeddingParams`? Recommend no
  (out of scope; vector-store concern).
- **OQ-5 (provider-params escape hatch):** add `providerParams?: JsonObject` now or defer until a
  third knob appears? Recommend defer (additive when needed).
- **OQ-6 (proxy leg):** include `callProxiedEmbedding` in v1 (recommended, §3.2) or defer until a
  browser consumer needs it?
- **OQ-7 (cohesion signoff):** the local-models research note's §1a rejected embeddings-in-ai-assist;
  this design argues the rejection was about the *in-process* leg, not cloud HTTP (§1). Confirm the
  orchestrator/Erik agrees the cloud-HTTP embedding leg belongs in ai-assist. (The brief commissioning
  this implies yes, but it's the one strategic call worth an explicit ack.)

---

## 13. Build recommendation + phased plan

**Recommendation: GO. Build it. Size: S–M (small-to-medium). Build it independent of, and ideally
before, Ollama B** — because it *removes* scope from Ollama B (the embed sub-task) and establishes
the embedding surface Ollama would otherwise have to coordinate with.

Why GO:
- Genuinely missing modality with broad, demonstrated demand (the single most common local+cloud AI
  op per the research note).
- **Additive, active-surface, lockstep-cheap** — no compat burden, no consumer churn.
- The structural template (image-gen) is proven and mirrors 1:1; embeddings are a *strict subset* of
  its complexity (no reference images, no multipart, no layered-options matrix).
- It resolves a live blocking question for another stream (Ollama B OQ-1) in the direction that
  *reduces* total work.

Why S–M and not L: only two adapters (one is a near-copy of an existing pattern), two flat knobs, no
options-resolver module, no streaming. The biggest single piece of work is the Gemini
`batchEmbedContents` adapter + its taskType mapping, all of which is well-specified above.

### Phasing

**Phase 1 — Types + capability + registry (S).**
`AiEmbeddingFormat`, `AiEmbeddingTaskType`, `IAiEmbeddingParams`, `IAiEmbeddingResult`,
`IAiEmbeddingUsage`, `IAiEmbeddingModelCapability`; `'embedding'` added to `ModelSpecKey` /
`allModelSpecKeys` / `AiModelCapability`; descriptor `embedding?` field; registry entries (OpenAI,
Gemini, Ollama, openai-compat, Mistral) + `DEFAULT_MODEL_CAPABILITY_CONFIG` rules; `supportsEmbedding`
/ `resolveEmbeddingCapability` helpers + their unit tests. Export the new symbols from the packlet
`index.ts`. *No wire calls yet — fully testable in isolation.*

**Phase 2 — OpenAI-format adapter + dispatcher (S–M).**
`callOpenAiEmbeddings` (response validator with index-sort, usage mapping), the `callProviderEmbedding`
dispatcher (base-URL resolve, model resolve, capability resolve, batch-size validate, format switch,
up-front rejection for unsupported providers), `endpoint` override. Fixtures + request-body +
batch-alignment + error-path tests. **This phase alone delivers OpenAI + Ollama + openai-compat +
Mistral embeddings** (all openai-embeddings format) — i.e. it already resolves OQ-1 in practice.

**Phase 3 — Gemini adapter + proxy leg (M).**
`callGeminiEmbeddings` (`batchEmbedContents`, taskType SCREAMING_SNAKE mapping,
`outputDimensionality`, `models/{id}` qualification, no-usage), wire into the dispatcher switch;
`callProxiedEmbedding`. Gemini fixtures incl. reduced-dimension + taskType-in-body assertion; proxy
tests. `code-reviewer` pass, then coverage closure to 100%.

**Phase 4 — Docs (S).**
`LIBRARY_CAPABILITIES.md`: the ai-assist embedding bullet + the three-way decision shortcut (§9);
update the ai-assist entry's modality list. README quick-start snippet. Note the Ollama-redundancy
verdict where Ollama is described.

Phases 1–2 are independently shippable and already unblock Ollama B. Phase 3 completes cross-provider
coverage. Total estimate: well within a single focused stream.

### Acceptance criteria
- [ ] `rushx build` / `rushx lint` / `rushx test` (100% coverage) pass in `@fgv/ts-extras`.
- [ ] `rushx fixlint` run before final commit.
- [ ] No `any`; all fallible ops return `Result<T>`; additive-only (no changed/removed exports).
- [ ] Request-body tests prove taskType/dimensions reach the wire (and are absent on no-op providers).
- [ ] `code-reviewer` run before coverage closure; findings resolved/dispositioned.
- [ ] `LIBRARY_CAPABILITIES.md` decision-shortcut + Ollama-redundancy note landed.

---

## 14. Orchestrator review amendments (2026-06-07) — apply during implementation

Erik reviewed and **blessed** the design (build it). Implement as written, with these adjustments folded in:

1. **Naming → `AiEmbeddingApiFormat`** (not `AiEmbeddingFormat`), for symmetry with the existing `AiApiFormat` / `AiImageApiFormat`. Members unchanged (`'openai-embeddings' | 'gemini-embeddings'`).
2. **Empty-input behavior — pin it (§3.1 was ambiguous):** short-circuit an empty `input` array to `succeed({ vectors: [], model: <resolved>, dimensions: 0 })` with **no wire call** (most providers HTTP-400 on empty input). Cover with a test.
3. **`maxBatchSize` exceeded → `fail` up front** (no auto-chunking). Fine for v1; file transparent batch-chunking as a `docs/FUTURE.md` follow-up (some RAG consumers will exceed 2048).
4. **Self-hosted `listModels` capability caveat:** the `ollama`/`openai-compat` catch-all in `DEFAULT_MODEL_CAPABILITY_CONFIG` tags every model `chat` (can't id-detect `nomic-embed-text`), so a self-hosted embedding model won't auto-surface as `embedding` capability. Don't try to fix it; **document the limitation** in the recipe (caller supplies the model + can override `capabilityConfig`).
5. **`encoding_format: 'float'` is a known assumption** — a strict openai-compat server *could* reject an unknown field. Note it in the per-provider mapping; low risk.

**OQ-7 (cohesion) → RESOLVED: yes.** The cloud-HTTP embedding leg belongs in ai-assist (the research-note rejection was about the *in-process* leg). Proceed.

**Sequencing / base context:** this branch is now re-baselined on a `release` that includes the **message-ordering** unification (#480: every *turn* entry point takes `{ system?, messages }`). The embedding primitive is a **new, separate** entry point taking `input: string | string[]` (NOT conversation messages), so the unification does not change the embedding surface — but **follow the post-message-ordering code structure** of the sibling `callProvider*` functions (params-interface shape, `resolveEffectiveBaseUrl` + model/capability resolution, the proxy mirror) so the new code matches current conventions, not a stale snapshot. The **Ollama-redundancy verdict is settled** (native embed CUT from Ollama B — already shipped without it); this primitive is Ollama's only embedding path via `/v1`.
