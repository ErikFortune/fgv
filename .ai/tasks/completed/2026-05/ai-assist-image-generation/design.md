# Design: ai-assist Image Generation (Phase A)

**Stream:** ai-assist-image-generation  
**Phase:** A — research and design  
**Date:** 2026-05-11  
**Status:** draft for orchestrator/user signoff

---

## 1. Provider Capability Inventory

> **Research note:** OpenAI's platform docs (`platform.openai.com`) returned HTTP 403 (login-gated). The OpenAI section uses training-data knowledge (cutoff August 2025) with `[training-data]` markers on specific values that should be live-verified before encoding as registry constants. xAI and Google sections used live-fetched documentation; sources cited by URL.

---

### 1.1 OpenAI `dall-e-2` [training-data — verify]

**Reference:** https://platform.openai.com/docs/api-reference/images/create

**Endpoints:**
- `POST /v1/images/generations` — text-to-image
- `POST /v1/images/edits` — inpainting; **requires PNG with alpha-channel mask** (different from gpt-image-1's maskless reference-image edits)
- `POST /v1/images/variations` — generate variations of an input image

**Parameters:**

| Parameter | Accepted values | Default | Notes |
|---|---|---|---|
| `model` | `"dall-e-2"` | — | |
| `prompt` | string (max ~1000 chars) | required | |
| `n` | 1–10 | 1 | Up to 10 images per call |
| `size` | `"256x256"`, `"512x512"`, `"1024x1024"` | `"1024x1024"` | Only square; three choices |
| `response_format` | `"url"`, `"b64_json"` | `"url"` | |
| `quality` | not supported | — | Ignored or errors |
| `style` | not supported | — | |
| `seed` | not supported | — | |

**Reference image support:** Yes, via `/v1/images/edits` — but requires an alpha-channel mask. Our current reference-image path sends maskless multipart; this would fail for dall-e-2.

**Response:** `data[].b64_json` or `data[].url`. No `revised_prompt`.

**Quirks:**
- Oldest model; lowest cost.
- The `/edits` and `/variations` endpoints are unique to dall-e-2.
- Mask requirement on edits makes our current maskless reference-image path incompatible.

---

### 1.2 OpenAI `dall-e-3` [training-data — verify]

**Reference:** https://platform.openai.com/docs/api-reference/images/create

**Endpoints:** `POST /v1/images/generations` only.

**Parameters:**

| Parameter | Accepted values | Default | Notes |
|---|---|---|---|
| `model` | `"dall-e-3"` | — | |
| `prompt` | string (max ~4000 chars) | required | |
| `n` | **1 only** | 1 | `n=2` returns an error — hard limit |
| `size` | `"1024x1024"`, `"1792x1024"`, `"1024x1792"` | `"1024x1024"` | |
| `quality` | `"standard"`, **`"hd"`** | `"standard"` | **`"hd"` not `"high"` — source of the quality-mismatch bug** |
| `style` | `"vivid"`, `"natural"` | `"vivid"` | `"vivid"` = hyper-real; `"natural"` = more realistic |
| `response_format` | `"url"`, `"b64_json"` | `"url"` | |
| `seed` | not officially supported | — | |

**Reference image support:** None.

**Response:** `data[].b64_json` or `data[].url` plus `data[].revised_prompt` (unique to dall-e-3 — model rewrites prompts; this field shows what was actually sent).

**Quirks:**
- `n=1` hard limit; call multiple times for multiple images.
- `"hd"` quality runs a second pass; ~2× cost.
- `style` parameter is dall-e-3-only and has meaningful visual impact.
- Prompt rewriting is aggressive; `revised_prompt` often differs substantially from input.

---

### 1.3 OpenAI `gpt-image-1` [training-data — verify; ** = high-priority live verification]

**Reference:** https://platform.openai.com/docs/api-reference/images/create

**Endpoints:**
- `POST /v1/images/generations`
- `POST /v1/images/edits` — maskless reference-image-guided generation (visual context, not inpainting)

**Parameters:**

| Parameter | Accepted values | Default | Notes |
|---|---|---|---|
| `model` | `"gpt-image-1"` | — | |
| `prompt` | string | required | |
| `n` | 1–10 | 1 | |
| `size` | `"1024x1024"`, `"1536x1024"`, `"1024x1536"`, `"auto"` ** | `"auto"` | Different from dall-e-3's `1792x...` sizes |
| `quality` | `"low"`, `"medium"`, `"high"`, `"auto"` | `"auto"` | Entirely different from dall-e-3's vocabulary |
| `background` | `"transparent"`, `"opaque"`, `"auto"` | `"auto"` | `"transparent"` requires `output_format: "png"` |
| `moderation` | `"low"`, `"auto"` | `"auto"` | |
| `output_format` | `"png"`, `"jpeg"`, `"webp"` | `"png"` | Replaces `response_format` — see quirks |
| `output_compression` | integer 0–100 | 100 | JPEG/WebP compression; irrelevant for PNG |
| `response_format` | **NOT ACCEPTED** | — | **Root cause of the 400 bug.** Model rejects this. |
| `style` | not supported | — | |
| `seed` | not documented as stable | — | |

**Reference image support:** Yes, via `/v1/images/edits`. Maskless multipart form-data. gpt-image-1 uses reference images as visual context, not inpainting targets.

**Response:** `data[].b64_json` always. No URL mode available via public API. No `revised_prompt`.

**Quirks:**
- **`response_format` is rejected with a 400.** Our code unconditionally sends `response_format: 'b64_json'` — confirmed root cause of the bug.
- `output_format` replaces `response_format` for output format control. For base64 retrieval, send `output_format: "png"` (or desired format); response always returns `b64_json`.
- `background: "transparent"` only with `output_format: "png"`.
- Requires organization-level API approval.

---

### 1.4 Google Imagen 4 (Gemini API `:predict`)

**References (live-fetched):**
- https://ai.google.dev/gemini-api/docs/models/imagen
- https://ai.google.dev/gemini-api/docs/imagen
- https://cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/4-0-generate-001

> **Critical deprecation notice:** `imagen-3.0-generate-002` is deprecated and **shuts down June 24–30, 2026** (within weeks of this writing). The registry currently uses this model. Phase B must migrate to Imagen 4 models immediately.

**Current GA models:**
- `imagen-4.0-generate-001` — standard; 1–4 images; supports 2K output
- `imagen-4.0-ultra-generate-001` — highest quality; **max 1 image per call**
- `imagen-4.0-fast-generate-001` — fast/cheap; 1–4 images

**Endpoint:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:predict
```

Auth: `x-goog-api-key` header. Body: `{ instances: [{ prompt: string }], parameters: { ... } }`.

**Parameters (`parameters` block):**

| Parameter | Accepted values | Notes |
|---|---|---|
| `sampleCount` | 1–4 (standard/fast); **1 only (ultra)** | Number of images |
| `aspectRatio` | `"1:1"` (default), `"3:4"`, `"4:3"`, `"9:16"`, `"16:9"` | No pixel dimensions |
| `imageSize` | `"1K"` (default), `"2K"` | Standard and Ultra support 2K; not all models |
| `addWatermark` | boolean | Default `true` (SynthID). Must be `false` to use `seed` |
| `seed` | integer 1–2147483647 | Only works when `addWatermark: false` |
| `enhancePrompt` | boolean | LLM-based prompt rewriting before generation |
| `personGeneration` | `"allow_all"`, `"allow_adult"`, `"dont_allow"` | Content safety |
| `safetySetting` | `"block_low_and_above"`, `"block_medium_and_above"` (default), `"block_only_high"` | |
| `outputOptions` | `{ mimeType: "image/jpeg"\|"image/png", compressionQuality: int }` | Output format control |
| `includeRaiReason` | boolean | Include Responsible AI reason in response |

**Parameters REMOVED in Imagen 4 (vs Imagen 3):**
- `negativePrompt` — **no longer supported** in standard Imagen 4 generate endpoint. (Was in Imagen 3; currently exposed in our `imagen` escape hatch — this field is now stale.)
- `sampleImageStyle` — not a current Imagen 4 parameter.

**Reference image support:** None via `:predict`. Reference images require Gemini Flash Image.

**Response:** `predictions[].bytesBase64Encoded` + optional `predictions[].mimeType`.

**Quirks:**
- `seed` requires `addWatermark: false` — attempting seed with watermark enabled silently ignores it or errors.
- `negativePrompt` is gone from Imagen 4; our current `imagen.negativePrompt` field is silently ignored (or may error) with current models.
- Ultra model is capped at 1 image per call.
- Imagen 3 deprecation is imminent; any production use of `imagen-3.0-generate-002` will break end of June 2026.

---

### 1.5 Google Gemini 2.5 Flash Image (`:generateContent`, "Nano Banana")

**References (live-fetched):**
- https://ai.google.dev/gemini-api/docs/image-generation
- https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-image
- https://developers.googleblog.com/gemini-2-5-flash-image-now-ready-for-production-with-new-aspect-ratios/

**Endpoint:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
```

**Current model:** `gemini-2.5-flash-image`

**Request body:**
```json
{
  "contents": [{ "role": "user", "parts": [...] }],
  "generationConfig": {
    "responseModalities": ["IMAGE"],
    "imageConfig": { "aspectRatio": "16:9" },
    "candidateCount": 1
  }
}
```

**Key parameters:**

| Parameter | Location | Accepted values | Notes |
|---|---|---|---|
| `responseModalities` | `generationConfig` | `["IMAGE"]`, `["IMAGE", "TEXT"]`, `["TEXT"]` | **Required** for image output. If omitted, model may return text-only. |
| `imageConfig.aspectRatio` | `generationConfig` | `"1:1"`, `"3:2"`, `"2:3"`, `"3:4"`, `"4:3"`, `"4:5"`, `"5:4"`, `"9:16"`, `"16:9"`, `"21:9"` | Wider range than Imagen 4 |
| `candidateCount` | `generationConfig` | 1 (currently) | Multiple images theoretically possible; SDK has reported bugs |
| Reference images | `contents[].parts[]` | `inlineData: { mimeType, data }` | Up to 3 input images for composition/editing |

**Output format:** Currently **JPEG only**. There is no documented way to request PNG or WebP output from this model. Live-fetched GitHub issues confirm `outputMimeType` as an `imageConfig` parameter is not yet working. Our current code captures `part.inlineData.mimeType` from the response, which will correctly be `"image/jpeg"`.

**Response:** `candidates[].content.parts[]` with `inlineData` blocks (images) and/or `text` parts.

**Quirks:**
- **`responseModalities: ["IMAGE"]` is required** but our current `callGeminiImageOutGeneration` does NOT set this. This is likely causing silent text-only responses or generation failures. **High priority fix.**
- `candidateCount > 1` has reported SDK-level bugs (Extra inputs are not permitted). Effectively 1 image per call.
- `seed` not supported.
- Output is JPEG regardless of request; `mimeType` in response will say `image/jpeg`.
- The model can query Google Search during generation (a unique capability vs Imagen).
- Each generated image costs 1,290 output tokens (pricing/rate-limit impact).

---

### 1.6 xAI Image Generation

**References (live-fetched):**
- https://docs.x.ai/developers/model-capabilities/images/generation
- https://docs.x.ai/docs/guides/image-generations
- https://docs.x.ai/developers/models/grok-2-image-1212

> **Critical deprecation notice:** `grok-2-image-1212` is **deprecated as of February 28, 2026.** The registry currently uses this as the default image model — it must be updated.

**Current models:**
- `grok-imagine-image` — standard generation model (replaces `grok-2-image-1212`)
- `grok-imagine-image-quality` — higher quality (recommended for new requests)
- ~~`grok-imagine-image-pro`~~ — deprecated May 15, 2026; use `grok-imagine-image-quality` instead

**Endpoint:**
- `POST https://api.x.ai/v1/images/generations` — text-to-image
- `POST https://api.x.ai/v1/images/edits` — reference-image editing (**new — not supported on the deprecated model**)

**Parameters (new Imagine models):**

| Parameter | Accepted values | Notes |
|---|---|---|
| `model` | `"grok-imagine-image"`, `"grok-imagine-image-quality"` | |
| `prompt` | string | required |
| `n` | 1–10 | |
| `aspect_ratio` | `"1:1"`, `"3:4"`, `"4:3"`, `"9:16"`, `"16:9"`, `"2:3"`, `"3:2"`, `"9:19"`, `"19.5:9"`, `"9:20"`, `"20:9"`, `"1:2"`, `"2:1"`, `"auto"` | Replaces OpenAI-style `size` strings |
| `resolution` | `"2k"`, `"720p"` (model-dependent) | Optional |
| `response_format` | `"url"`, `"b64_json"` | Accepted (unlike gpt-image-1) |
| `size` | not accepted | OpenAI-style pixel strings are not supported |
| `quality` | not accepted | No quality parameter |
| `seed` | not documented | |

**Reference image support (new Imagine models):** Yes, via `/v1/images/edits`. Up to 3 source images as `{ "type": "image_url", "url": "<public URL or base64 data URI>" }` objects — a **JSON body format**, not multipart form-data. This is a different wire format from OpenAI's edits endpoint.

**Response:** `data[].b64_json` or `data[].url`. Output is JPEG.

**Quirks:**
- **Wire format divergence from OpenAI:** New xAI Imagine models use `aspect_ratio` (aspect ratio strings) instead of `size` (pixel dimension strings). Current code passes `size` from options — this parameter is silently ignored by xAI, which means the size control our callers expect doesn't work.
- **Reference image wire format is different from OpenAI:** xAI edits use JSON with `{ "type": "image_url" }` objects; OpenAI uses multipart form-data. Our current `callOpenAiImagesEdits` would not work for xAI edits.
- `grok-2-image-1212` is deprecated and should be removed from the registry default model.
- CORS restriction means browser callers need a proxy (already handled).

---

### 1.7 openai-compat (self-hosted)

The `openai-compat` descriptor has no `imageGeneration` entries — it declares no image-generation capabilities. This is correct. Self-hosted servers rarely expose image endpoints, and claiming support would break callers who configure openai-compat against a server that doesn't have them. Leave as-is.

---

## 2. Current Implementation Gap Analysis

### 2.1 Wire encoding wrong (provider rejects values we send)

| Gap | Affected model(s) | Current behavior | Provider behavior |
|---|---|---|---|
| `response_format: 'b64_json'` sent unconditionally | `gpt-image-1` | `callOpenAiImagesGenerations` and `callOpenAiImagesEdits` always send this | Provider returns HTTP 400 |
| `quality: 'high'` sent to dall-e-3 | `dall-e-3` | Type accepts `'high'`; code passes through | dall-e-3 expects `'hd'` not `'high'` |
| `quality: 'standard'` sent to gpt-image-1 | `gpt-image-1` | Type accepts `'standard'`; code passes through | gpt-image-1 expects `'low'\|'medium'\|'high'\|'auto'` |
| `size: '1792x1024'` sent to gpt-image-1 | `gpt-image-1` | Type allows `'1792x1024'`; code passes through | gpt-image-1 uses `'1536x1024'` for landscape |
| `size: '1024x1792'` sent to gpt-image-1 | `gpt-image-1` | Type allows `'1024x1792'`; code passes through | gpt-image-1 uses `'1024x1536'` for portrait |
| `size` passed to xAI Imagine models | `grok-imagine-*` | Code passes `size` through; silently ignored | xAI uses `aspect_ratio`, not pixel strings |
| `negativePrompt` in Imagen request | `imagen-4.*` | Sent in `parameters` block | Not supported in Imagen 4; may error or be ignored |

### 2.2 Capability not exposed (provider supports it, our type doesn't)

| Gap | Affected model(s) |
|---|---|
| `dall-e-2` sizes `256x256`, `512x512` | `dall-e-2` |
| `dall-e-3` `style` param (`'vivid'` / `'natural'`) | `dall-e-3` |
| `gpt-image-1` portrait/landscape sizes (`1536x1024`, `1024x1536`) | `gpt-image-1` |
| `gpt-image-1` quality tiers `'low'`, `'medium'`, `'auto'` | `gpt-image-1` |
| `gpt-image-1` `background`, `moderation`, `output_format`, `output_compression` | `gpt-image-1` |
| xAI `aspect_ratio` parameter | `grok-imagine-*` |
| Imagen 4 `imageSize`, `addWatermark`, `enhancePrompt`, `outputOptions` | `imagen-4.*` |
| Gemini Flash Image `imageConfig.aspectRatio` | `gemini-*-image` |

### 2.3 Validation gap (caller can pass invalid values, we don't catch them)

| Gap | Trigger |
|---|---|
| `dall-e-3` + `count > 1` | Caller passes `count: 2`; provider errors |
| Quality value for wrong model | `'hd'` to gpt-image-1; `'high'` to dall-e-3 |
| Size value for wrong model | `'1792x1024'` to gpt-image-1 |
| `dall-e-2` + non-square size | `'1792x1024'` to dall-e-2 |
| Imagen Ultra + `count > 1` | `count: 2` to `imagen-4.0-ultra-generate-001` |

### 2.4 Pre-emptive over-send (always-sent param that some models reject)

| Gap | Code location | Affected model(s) |
|---|---|---|
| `response_format: 'b64_json'` always appended | `callOpenAiImagesGenerations` ~L1067; `callOpenAiImagesEdits` ~L1108 | `gpt-image-1` (400); safe for dall-e-2, dall-e-3, xAI |

### 2.5 Coverage gap (provider surface broken or unsupported)

| Gap | Notes |
|---|---|
| `responseModalities: ["IMAGE"]` not set in Gemini Flash path | `callGeminiImageOutGeneration` doesn't set `responseModalities`. The model may return text-only or fail silently. **Likely already broken in production.** |
| xAI default model is deprecated | Registry has `grok-2-image-1212` as default; deprecated Feb 28 2026 |
| Imagen 3 deprecation | Registry uses `imagen-3.0-generate-002` implicitly (via `modelPrefix: 'imagen-'`); Imagen 3 shuts down June 24–30, 2026 |
| xAI reference image wire format incompatible | Even if `acceptsImageReferenceInput` were enabled for xAI, our multipart form-data path would not work — new xAI edits use JSON body |
| `callGeminiImageOutGeneration` missing `generationConfig` | No `generationConfig` block at all in the request body means `responseModalities`, `imageConfig.aspectRatio`, `candidateCount` are all inaccessible |
| `dall-e-2` reference images blocked correctly but for undocumented reason | Currently blocked because `acceptsImageReferenceInput` is absent (false). The real reason — mask requirement incompatibility — is not documented in the registry. |

---

## 3. Type-Shape Recommendation

### 3.1 Three approaches

**Approach A — Single unified type, registry-driven runtime validation**

`IAiImageGenerationOptions` expands to include the full union of all parameters. Registry entries enumerate accepted values per model. The dispatcher validates before building the wire request.

Tradeoffs:
- ✅ Simple caller API; one type; additive changes don't break callers
- ✅ Matches library's existing philosophy (provider abstraction, thin caller layer)
- ✅ Migration cost: near-zero for callers who don't use quality/size params
- ⚠️ TypeScript can't prevent passing `style` to gpt-image-1; runtime validation required
- ⚠️ `quality` union becomes heterogeneous (`'standard' | 'hd' | 'low' | 'medium' | 'high' | 'auto'`) without TypeScript-level per-model fidelity

**Approach B — Discriminated union per model**

`IAiImageGenerationParams` becomes a discriminated union on model name. Full type-level fidelity.

Tradeoffs:
- ✅ TypeScript catches `style` on gpt-image-1 at compile time
- ❌ Breaking change for all callers; immediate migration required across all consumers
- ❌ Model name in the params type conflicts with model resolution (model is currently resolved from registry/defaultModel, not provided by the caller)
- ❌ New provider model requires new union arm + new per-model options interface
- ❌ Heavy migration cost under lockstep versioning policy

**Approach C — Common subset + per-provider escape hatch**

Minimal type with `provider?: Record<string, unknown>` escape hatches.

Tradeoffs:
- ✅ Stable cross-provider surface
- ❌ Escape hatch is untyped; callers lose all type safety for provider-specific params
- ❌ Even `size` and `quality` would land in the untyped escape hatch
- ❌ Doesn't solve the problem

### 3.2 Recommendation: Approach A

**Approach A** is recommended. Justification:

1. The library is a provider abstraction layer — callers pass params; the dispatcher routes. Adding per-model type branching (Approach B) undermines this.
2. `ts-app-shell/useAiAssist` passes `IAiImageGenerationParams` through without inspecting it; it doesn't need model-specific types.
3. Under lockstep versioning, Approach B forces all consumers to update immediately. Approach A's additive changes require only targeted quality-value fixes.
4. The active-surface clause gives us a free hand on breaking changes, but the lockstep cost is real. The one breaking change (quality `'high'` → `'hd'` for dall-e-3) is narrow and grep-findable.
5. xAI's move to `aspect_ratio` instead of `size` is a bigger concern: callers who pass `size` to xAI get silent no-ops. Approach A lets us surface this as a validated field with clear semantics rather than a silent divergence. Adding an `aspectRatio` field alongside `size` in the unified type is cleaner than duplicating types per-provider.

**Migration impact of Approach A:** See §8.

---

## 4. Registry-Shape Recommendation

### 4.1 Proposed new `IAiImageModelCapability` fields

```typescript
export interface IAiImageModelCapability {
  // Existing fields
  readonly modelPrefix: string;
  readonly format: AiImageApiFormat;
  readonly acceptsImageReferenceInput?: boolean;

  // --- New fields ---

  /**
   * Accepted `size` string values for this model. When defined, the
   * dispatcher pre-validates and returns Result.fail if caller's size is
   * not in this set. When undefined, no size validation.
   */
  readonly acceptedSizes?: ReadonlyArray<AiImageSize>;

  /**
   * Accepted `quality` values. When defined, pre-validates. An empty array
   * means "this model has no quality parameter — don't send it."
   */
  readonly acceptedQualities?: ReadonlyArray<AiImageQuality>;

  /**
   * Maximum count (n). When defined, pre-validates count <= maxCount.
   */
  readonly maxCount?: number;

  /**
   * How to encode the output format parameter on the wire:
   * - `'response-format'`: send `response_format: 'b64_json'` (dall-e-2, dall-e-3, xAI legacy)
   * - `'output-format'`: send `output_format: <caller's outputFormat ?? 'png'>` (gpt-image-1)
   * - `'none'`: send neither (Imagen, Gemini Flash — format is in request params, not a wire field)
   */
  readonly outputParamStyle?: 'response-format' | 'output-format' | 'none';

  /**
   * Default MIME type for response images when the provider doesn't include
   * it in the response body. Used to populate IAiGeneratedImage.mimeType.
   */
  readonly defaultOutputMimeType?: string;

  /**
   * Whether this model accepts the `style` parameter (dall-e-3 only).
   */
  readonly acceptsStyle?: boolean;

  /**
   * Whether this model accepts gpt-image-1 extension params:
   * background, moderation, output_format, output_compression.
   */
  readonly acceptsGptImageExtensions?: boolean;

  /**
   * Whether this model uses aspect_ratio (xAI Imagine style) instead of
   * size pixel strings. When true, the dispatcher sends `aspect_ratio`
   * from options.aspectRatio and ignores options.size.
   */
  readonly usesAspectRatio?: boolean;
}
```

Also propose adding `AiImageApiFormat` value for xAI's updated wire format. The key question (see §9, Q5) is whether to add `'xai-images-v2'` or update the existing `'xai-images'` format handling. **Recommendation:** Update the existing `callOpenAiImageGeneration` adapter rather than adding a new format — the format name documents the API shape, not the model generation; both old and new xAI models route through the same adapter with different registry capability entries.

### 4.2 Concrete registry entries

**openai provider:**
```typescript
imageGeneration: [
  {
    modelPrefix: 'gpt-image-',
    format: 'openai-images',
    acceptsImageReferenceInput: true,
    acceptedSizes: ['1024x1024', '1536x1024', '1024x1536', 'auto'],
    acceptedQualities: ['low', 'medium', 'high', 'auto'],
    maxCount: 10,
    outputParamStyle: 'output-format',    // rejects response_format; use output_format
    defaultOutputMimeType: 'image/png',   // default; override-able via outputFormat option
    acceptsGptImageExtensions: true
  },
  {
    modelPrefix: 'dall-e-3',
    format: 'openai-images',
    acceptsImageReferenceInput: false,    // explicit: no edits endpoint for dall-e-3
    acceptedSizes: ['1024x1024', '1792x1024', '1024x1792'],
    acceptedQualities: ['standard', 'hd'],
    maxCount: 1,                          // hard limit
    outputParamStyle: 'response-format',
    defaultOutputMimeType: 'image/png',
    acceptsStyle: true
  },
  {
    modelPrefix: 'dall-e-2',
    format: 'openai-images',
    acceptsImageReferenceInput: false,    // edits need mask; our maskless path incompatible
    acceptedSizes: ['256x256', '512x512', '1024x1024'],
    acceptedQualities: [],                // no quality param — don't send it
    maxCount: 10,
    outputParamStyle: 'response-format',
    defaultOutputMimeType: 'image/png'
  },
  {
    modelPrefix: '',                      // catch-all for unknown openai models
    format: 'openai-images',
    outputParamStyle: 'response-format',
    defaultOutputMimeType: 'image/png'
  }
]
```

**xai-grok provider:**
```typescript
// Update defaultModel.image to a current model
defaultModel: {
  base: 'grok-4-1-fast',
  tools: 'grok-4-1-fast-reasoning',
  image: 'grok-imagine-image-quality'  // was: 'grok-2-image-1212' (deprecated)
},
imageGeneration: [
  {
    modelPrefix: '',
    format: 'xai-images',
    acceptsImageReferenceInput: false,   // edits wire format incompatible with our path
    acceptedQualities: [],               // no quality param
    maxCount: 10,
    outputParamStyle: 'response-format',
    defaultOutputMimeType: 'image/jpeg',
    usesAspectRatio: true               // uses aspect_ratio, not size pixel strings
  }
]
```

> **Note on xAI reference images:** The new xAI Imagine models DO support reference images via `/images/edits`, but the wire format (JSON body with `{ type: "image_url" }` objects) is different from OpenAI's multipart form-data. We should block reference images for xAI until a dedicated adapter is implemented. The `acceptsImageReferenceInput: false` flag handles this.

**google-gemini provider:**
```typescript
imageGeneration: [
  {
    modelPrefix: 'imagen-',
    format: 'gemini-imagen',
    acceptsImageReferenceInput: false,
    acceptedQualities: [],
    outputParamStyle: 'none',
    defaultOutputMimeType: 'image/png'
    // No acceptedSizes — Imagen uses aspectRatio not pixel dimensions
  },
  {
    modelPrefix: '',
    format: 'gemini-image-out',
    acceptsImageReferenceInput: true,
    maxCount: 1,
    acceptedQualities: [],
    outputParamStyle: 'none',
    defaultOutputMimeType: 'image/jpeg'  // Flash Image currently outputs JPEG only
  }
]
```

> **Note on rule ordering:** `resolveImageCapability` picks longest `modelPrefix` match. `imagen-` (7 chars) wins over `''` (0 chars) for any `imagen-*` model. This is correct. The empty string catch-all for gemini correctly routes `gemini-2.5-flash-image` to `gemini-image-out`.

---

## 5. Failure Semantics Policy

### 5.1 Where pre-validation kicks in

Pre-validation runs in `callProviderImageGeneration` after capability resolution, before request build:

1. `supportsImageGeneration(descriptor)` — fail fast
2. Resolve model string
3. Resolve `IAiImageModelCapability`
4. Check `acceptsImageReferenceInput`
5. **(NEW)** `validateImageOptions(model, capability, options)` — validates size, quality, count against registry fields
6. Build wire request using the validated options

**New `validateImageOptions` function:**
```typescript
function validateImageOptions(
  model: string,
  capability: IAiImageModelCapability,
  options: IAiImageGenerationOptions | undefined
): Result<IAiImageGenerationOptions>
```

Returns the original options object on success. On first violation, returns `Result.fail` with contextual message. Fail-fast (no aggregation) — image generation is a single request.

### 5.2 Where we let providers 400

Parameters not expressed in the registry (novel values, future additions) surface as provider 400s through the failure path, same as today. The goal is to catch enumerable, known-bad values at the client; not to be a comprehensive validator.

### 5.3 Silent translation policy

**No silent translation.** Specific cases:

- `quality: 'high'` → NOT silently translated to `'hd'` for dall-e-3. Registry lists `'hd'` as accepted; validator rejects `'high'` with a clear message.
- `size: '1792x1024'` for gpt-image-1 → rejected, not silently mapped to `'1536x1024'`.
- `size` for xAI → NOT silently mapped to `aspect_ratio`. If caller passes `size`, it's ignored (with a note in docs); the `aspectRatio` field is the right field for xAI.

**Exception (output normalization):** MIME type assignment is output normalization, not input translation, and is acceptable.

### 5.4 Error message format

```
model "dall-e-3": quality "high" is not accepted; accepted values: ["standard", "hd"]
model "dall-e-3": count 4 exceeds maximum of 1
model "gpt-image-1": size "1792x1024" is not accepted; accepted values: ["1024x1024", "1536x1024", "1024x1536", "auto"]
model "imagen-4.0-ultra-generate-001": count 2 exceeds maximum of 1
```

Format: `model "${model}": ${field} ${JSON.stringify(value)} is not accepted; accepted values: ${JSON.stringify(accepted)}`

---

## 6. Output Shape Unification

### 6.1 Current output shape

```typescript
interface IAiGeneratedImage extends IAiImageData {
  readonly mimeType: string;
  readonly base64: string;
  readonly revisedPrompt?: string;
}
interface IAiImageGenerationResponse {
  readonly images: ReadonlyArray<IAiGeneratedImage>;
}
```

This shape is already good. No structural changes recommended.

### 6.2 Provider-to-shape mapping

| Provider | Response shape | Current normalization | Issue |
|---|---|---|---|
| OpenAI `/generations` + `/edits` | `data[].b64_json` | `base64: item.b64_json`, `mimeType: 'image/png'` (hardcoded) | gpt-image-1 MIME type should reflect `output_format` |
| xAI `/generations` | `data[].b64_json` (JPEG) | `base64: item.b64_json`, `mimeType: 'image/jpeg'` | Correct; new models also JPEG |
| Imagen `:predict` | `predictions[].bytesBase64Encoded` + `mimeType?` | `base64: pred.bytesBase64Encoded`, `mimeType: pred.mimeType ?? 'image/png'` | Correct |
| Gemini Flash `:generateContent` | `candidates[].content.parts[].inlineData` | `base64: part.inlineData.data`, `mimeType: part.inlineData.mimeType` | Correct; JPEG from response |

**Fix needed:** When gpt-image-1 is called with `outputFormat: 'jpeg'` or `outputFormat: 'webp'`, the response MIME type should be `'image/jpeg'` or `'image/webp'`, not `'image/png'`. The current architecture passes `defaultMimeType` as a constant at the dispatch level; this needs to become dynamic for gpt-image-1.

**Fix:** Thread the effective `output_format` value from options into `callOpenAiImageGeneration` and use it to set the MIME type in the response normalizer.

### 6.3 Provider-specific output fields

| Field | Provider | Disposition |
|---|---|---|
| `revised_prompt` | dall-e-3 only | Already in `revisedPrompt?` — keep |
| Safety metadata | Imagen | Not surfaced; omit (filtered calls fail before we parse) |
| Gemini candidate `finishReason` | Gemini Flash | Already ignored; correct |
| Google Search grounding metadata | Gemini Flash | Not surfaced; omit |

**No additions to `IAiGeneratedImage`.** A `providerExtras?: Record<string, unknown>` bag is explicitly deferred until a concrete consumer need exists.

---

## 7. Streaming

Image generation is synchronous across all four providers as of 2026-05-11:

| Provider | Streaming image gen? |
|---|---|
| OpenAI (dall-e-2, dall-e-3, gpt-image-1) | No. `/images/generations` is synchronous. |
| xAI (grok-imagine-*) | No. Same synchronous OpenAI-compatible format. |
| Google Imagen `:predict` | No. Synchronous request-response. |
| Google Gemini Flash `:generateContent` | No streaming image output. The `:generateContent` endpoint supports streaming for text, but image `inlineData` parts are only present in the non-streaming response. |

No streaming integration needed in phase B. If streaming image generation is added by any provider in the future, the architecture accommodates it cleanly — a new `AiImageApiFormat` value and a new adapter in the dispatch switch.

---

## 8. Migration Impact

### 8.1 `IAiImageGenerationOptions.quality` field

**Current type:** `quality?: 'standard' | 'high'`  
**New type:** `quality?: 'standard' | 'hd' | 'low' | 'medium' | 'high' | 'auto'`

**Breaking for:** Callers using `quality: 'high'` targeting dall-e-3 (was already broken at the wire level; `dall-e-3` wanted `'hd'`). They must change to `quality: 'hd'`.

**Blast radius:** `ts-app-shell` (1 in-repo consumer — passes params through; likely doesn't set `quality`); `personaility` (1 known external consumer). Grep for `quality.*high` in both repos. **Verify before claiming blast radius is zero.**

**Migration:** Change `quality: 'high'` → `quality: 'hd'` in callers that target dall-e-3. Callers targeting gpt-image-1 with `quality: 'high'` are already correct.

### 8.2 `IAiImageGenerationOptions.size` field

**Current type:** `size?: '1024x1024' | '1024x1792' | '1792x1024' | 'auto'`  
**New type:** Superset with additional values added.

**Breaking for:** None — additive.

### 8.3 `IAiImageGenerationOptions` new optional fields

New: `style?`, `background?`, `moderation?`, `outputFormat?`, `outputCompression?`, `aspectRatio?`

**Breaking for:** None — all optional.

### 8.4 `IAiImageGenerationOptions.imagen.negativePrompt` field

**Current:** `imagen.negativePrompt` accepted and sent to Imagen.  
**New:** Should be removed or marked deprecated. Imagen 4 doesn't support it; Imagen 3 shuts down June 2026.

**Breaking for:** Any caller using `imagen.negativePrompt`. Since `ai-assist` is on the active-surface list, we can remove it.

**Blast radius:** Unknown. Grep for `negativePrompt` in consumer code. Likely low usage.

**Migration:** Remove the field; callers who use it need to drop it.

### 8.5 Registry `IAiImageModelCapability` new optional fields

All new optional fields; no breaking change for code that constructs capability objects.

### 8.6 xAI default model update

`defaultModel.image` changes from `'grok-2-image-1212'` (deprecated) to `'grok-imagine-image-quality'`.

**Breaking for:** Callers who pass no model override and use xAI image generation. The wire format is compatible; the model name changes. If the new model has different visual characteristics, that's an expected change.

**Blast radius:** Any active xAI image callers. The deprecated model may already be throwing errors (it was deprecated Feb 28 2026). **This is a correctness fix.**

### 8.7 Imagen 3 → Imagen 4 migration

The registry currently uses `modelPrefix: 'imagen-'` as a catch-all, so any `imagen-3.*` or `imagen-4.*` model routes through `gemini-imagen` format. No code change needed at the format level. The `defaultModel.image` for `google-gemini` is `'gemini-2.5-flash-image'` (not an Imagen model), so the imagen path is only reached via explicit `modelOverride`.

**If any consumer explicitly overrides to `imagen-3.0-generate-002`:** They will break when Imagen 3 shuts down June 24–30, 2026. **Notify consumers to switch to `imagen-4.0-generate-001`.**

### 8.8 `imagen.negativePrompt` removal

See §8.4 above.

### 8.9 Behavior change — pre-validation

Callers who previously passed invalid options (e.g. `count: 5` to dall-e-3) will now get `Result.fail` from `callProviderImageGeneration` rather than a provider 400. Error message changes from provider-shaped to our format (see §5.4). Both are `Result.fail`; the calling code is unaffected.

### 8.10 Summary of breaking changes

| Change | Action required | Blast radius |
|---|---|---|
| `quality: 'high'` → `'hd'` for dall-e-3 | Grep consumer code; change dall-e-3 callers | 1 in-repo + 1 known external |
| `imagen.negativePrompt` removal | Drop from callers | Likely low; verify |
| xAI default model update | None (correctness fix; deprecated model already broken) | xAI image callers |
| Imagen 3 deprecation | Switch to `imagen-4.0-generate-001` in overrides | Any consumer using Imagen explicitly |

All other changes are additive. Total callsite changes: 0–3 lines across known consumers (estimate pending grep verification).

---

## 9. Open Questions for Signoff

### Q1: Gemini Flash Image — `responseModalities` already broken?

`callGeminiImageOutGeneration` doesn't set `responseModalities: ["IMAGE"]` in the request body. Per live-fetched Gemini docs, this is required to get image output. If the model defaults to text-only or rejects the request without it, **all Gemini Flash Image calls are currently broken** with "no image parts in response."

**Need to know before phase B:** Is Gemini Flash Image currently returning images in production, or is this already broken? A live test call would resolve this. If it's broken, this is the highest-priority fix (higher than the gpt-image-1 `response_format` issue, since that at least fails loudly with a 400).

### Q2: xAI reference image wire format

New xAI Imagine models support `/v1/images/edits` but use a JSON body with `{ "type": "image_url" }` objects, not multipart form-data. Our current `callOpenAiImagesEdits` would not work for xAI even if we enabled `acceptsImageReferenceInput`.

**Decision:** Keep `acceptsImageReferenceInput: false` for xAI in phase B, and defer a dedicated xAI edits adapter to a later stream. This is an additive future change; it doesn't block the core fixes.

**Confirm:** Is there a known consumer need for xAI reference images now? If yes, scope it into phase B.

### Q3: gpt-image-1 MIME type tracking for non-PNG output

When a caller requests `outputFormat: 'jpeg'`, the response `mimeType` should be `'image/jpeg'`. The current dispatcher passes `defaultMimeType: 'image/png'` as a constant. Two options:

- **Option A:** Thread effective `outputFormat` from options into `callOpenAiImageGeneration` and use it to set MIME type.
- **Option B:** Use `defaultOutputMimeType` from the capability entry for gpt-image-1 (set to `'image/png'`) but override based on caller's `outputFormat` option.

**Recommendation:** Option A is cleaner. The MIME type is determined by the request, so it should be threaded with the request parameters. **Confirm this is acceptable.**

### Q4: `acceptedQualities: []` semantics

Proposed: `acceptedQualities: []` means "no quality parameter — don't send it." An alternative is an explicit `supportsQualityParam?: boolean` flag.

**Decision needed:** Is the dual interpretation (`[]` = don't send; `undefined` = don't validate) clear enough, or should there be a separate boolean? The current proposal uses `[]` for dall-e-2 and xAI. **Confirm preferred approach.** Recommendation: `[]` is adequate for a library-internal registry; add a comment in the interface JSDoc explaining the semantics.

### Q5: xAI `usesAspectRatio` flag vs new `AiImageApiFormat` value

xAI Imagine models use `aspect_ratio` instead of `size`. Two implementation approaches:

- **Option A:** Add `usesAspectRatio?: boolean` to the capability entry and branch within the existing `callOpenAiImageGeneration` adapter.
- **Option B:** Add a new `AiImageApiFormat` value (`'xai-images-v2'`?) and a dedicated adapter.

**Recommendation:** Option A for phase B. The difference is one field name (`size` vs `aspect_ratio`); a small branch in the adapter is less overhead than a new format value and new adapter. Option B is appropriate if xAI's API diverges further in the future.

**Confirm:** Is adding `aspectRatio?: string` to `IAiImageGenerationOptions` the right UX for xAI callers (instead of overloading `size`)? Since Imagen also uses aspect ratios (in the `imagen.aspectRatio` field), there's prior art for per-provider aspect ratio fields. **Recommendation:** Add a top-level `aspectRatio` field to `IAiImageGenerationOptions` alongside `size`, with docs noting which providers use each.

### Q6: Imagen `imagen` field — rename, restructure, or expand?

The current `imagen` escape hatch has `negativePrompt` (now obsolete) and `aspectRatio` (Imagen-specific). With Imagen 4 adding `imageSize`, `addWatermark`, `enhancePrompt`, `outputOptions`, the `imagen` bag will grow.

**Options:**
- Expand `imagen` with new fields (keeping it as a per-provider escape hatch)
- Move `imagen.aspectRatio` to top-level (since xAI now also uses aspect ratios) and keep `imagen` for Imagen-only knobs
- Rename `imagen` to something more descriptive (e.g. `imagenOptions`)

**Recommendation:** Move `aspectRatio` to top-level (shared by xAI and Imagen). Keep `imagen` for the Imagen-specific knobs (`imageSize`, `addWatermark`, `enhancePrompt`, `outputOptions`) renamed to `imagenOptions` for clarity. Remove `negativePrompt` from this bag. **Confirm.**

### Q7: Imagen Ultra `maxCount: 1` handling

`imagen-4.0-ultra-generate-001` only supports 1 image per call. The registry uses prefix-matching (`modelPrefix: 'imagen-'` catches all Imagen models). To enforce the Ultra constraint, we'd need either:
- A separate registry entry with `modelPrefix: 'imagen-4.0-ultra-'` and `maxCount: 1`
- Or rely on the provider's error (which is a 400 from the API)

**Recommendation:** Add an explicit `imagen-4.0-ultra-` entry with `maxCount: 1`. The prefix matching already handles this correctly since `imagen-4.0-ultra-generate-001` (22 chars) matches `imagen-4.0-ultra-` (18 chars) before `imagen-` (7 chars).

**Confirm:** Should we add the Ultra-specific entry in phase B, or accept the provider 400 for now?

### Q8: xAI `resolution` parameter

xAI Imagine models accept a `resolution` parameter (`"2k"`, `"720p"`). Should this be exposed? It's a new capability not currently expressible.

**Recommendation:** Add `resolution?: string` to the xAI-specific section (or top-level with a provider-specific note) if there's a near-term consumer need. Otherwise defer. **Confirm priority.**

### Q9: Consumer verification of `quality` usage

The `quality: 'high'` → `'hd'` rename is the only non-additive breaking change. Before phase B finalizes the type, grep `personaility` and `ts-app-shell` for any usage of `quality` in image generation contexts. If neither uses it, the blast radius is zero and no callsite migration is needed.

**Action:** Orchestrator/user should verify quality field usage in consumer repos before accepting the migration path as zero-cost.

### Q10: Gemini Flash `candidateCount` vs multiple calls

The Gemini Flash Image model theoretically supports multiple images via `candidateCount` but the Python SDK has reported bugs with `number_of_images`. Our TypeScript implementation uses raw `fetch` calls, not the SDK, so SDK bugs don't apply. However, the model documentation is ambiguous about whether `candidateCount > 1` is actually supported.

**Decision:** For phase B, use `maxCount: 1` in the registry and make multiple calls at the application level if multiple images are needed. Revisit if Google stabilizes multiple-image support in the API spec.

---

## Appendix A: Proposed Type Additions

```typescript
// New aliases
export type AiImageSize =
  | '256x256' | '512x512'            // dall-e-2
  | '1024x1024'                       // all models
  | '1024x1792' | '1792x1024'        // dall-e-3
  | '1024x1536' | '1536x1024'        // gpt-image-1
  | 'auto';                           // gpt-image-1

export type AiImageQuality =
  | 'standard' | 'hd'                // dall-e-3
  | 'low' | 'medium' | 'high' | 'auto'; // gpt-image-1

// Updated IAiImageGenerationOptions
export interface IAiImageGenerationOptions {
  /**
   * Pixel dimensions for OpenAI image models. Each model has its own accepted
   * set; the dispatcher pre-validates against the registry.
   * Note: xAI uses `aspectRatio` instead; Imagen uses `imagenOptions.aspectRatio`.
   */
  readonly size?: AiImageSize;
  /** Number of images. Default 1. Some models enforce a maximum (dall-e-3: 1). */
  readonly count?: number;
  /**
   * Quality tier. Accepted values differ per model:
   * - dall-e-3: 'standard' | 'hd'
   * - gpt-image-1: 'low' | 'medium' | 'high' | 'auto'
   * Other models ignore this field.
   */
  readonly quality?: AiImageQuality;
  /** Reproducibility seed, where supported. */
  readonly seed?: number;
  /**
   * Aspect ratio for xAI Imagine models. Ignored by OpenAI and Google models.
   * xAI ignores `size`; pass `aspectRatio` for dimension control with xAI.
   */
  readonly aspectRatio?: string;
  /** dall-e-3 only. 'vivid' = hyper-real; 'natural' = more realistic. */
  readonly style?: 'vivid' | 'natural';
  /** gpt-image-1 only. Background transparency control. */
  readonly background?: 'transparent' | 'opaque' | 'auto';
  /** gpt-image-1 only. Content moderation strictness. */
  readonly moderation?: 'low' | 'auto';
  /** gpt-image-1 only. Output encoding format (replaces response_format). */
  readonly outputFormat?: 'png' | 'jpeg' | 'webp';
  /** gpt-image-1 only. JPEG/WebP compression level 0–100. */
  readonly outputCompression?: number;
  /** Imagen-specific options. Ignored by other providers. */
  readonly imagenOptions?: {
    readonly aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
    readonly imageSize?: '1K' | '2K';
    readonly addWatermark?: boolean;
    readonly enhancePrompt?: boolean;
    readonly outputMimeType?: 'image/jpeg' | 'image/png';
    readonly outputCompressionQuality?: number;
  };
}
```

---

## Appendix B: Implementation Checklist for Phase B

The following are discrete implementation units for scope estimation. This is not the phase B brief.

1. **`model.ts`** — Add `AiImageSize`, `AiImageQuality` type aliases; update `IAiImageGenerationOptions`; add new fields to `IAiImageModelCapability`.

2. **`registry.ts`** — Replace 2 openai entries with 4 per-model entries; update xai-grok (model name + new capability fields); update google-gemini; update xai `defaultModel.image`.

3. **`imageValidation.ts`** (new file) or inline — `validateImageOptions(model, capability, options): Result<IAiImageGenerationOptions>`.

4. **`apiClient.ts`** — Multiple changes:
   - Add validation call in `callProviderImageGeneration`
   - Fix `callOpenAiImagesGenerations` for `outputParamStyle` switching
   - Fix `callOpenAiImagesEdits` same
   - Add `generationConfig.responseModalities: ["IMAGE"]` to `callGeminiImageOutGeneration`
   - Add `generationConfig.imageConfig.aspectRatio` to Gemini Flash path
   - Handle `usesAspectRatio` in the openai-images adapter for xAI models
   - Handle model-specific params: `style` for dall-e-3, gpt-image-1 extensions
   - Thread MIME type correctly for gpt-image-1 `outputFormat`
   - Update Imagen request builder to use Imagen 4 params (`imagenOptions.*`)

5. **Tests** — 100% coverage required on all new code; update existing tests for new validation behavior.

6. **`LIBRARY_CAPABILITIES.md`** — Expand ai-assist section for image generation.
