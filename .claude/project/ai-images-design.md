# AI Assist — Image Support Design

Status: step 1 done, step 2 done, sample app done, list-models done, step 3 done,
streaming chat done
Branch: `ai-images` (or successor `ai-stream`)
Scope: extend `@fgv/ts-extras` `ai-assist` packlet to support image input (vision)
and image output (generation), and thread an `AbortSignal` through all calls.

Out of scope (for now): image-modify / image-edit flows, streaming, OCR for the
copy-paste provider.

---

## Decisions

- **Transport:** base64 + explicit MIME type in JSON. No `data:` prefix on the
  wire; a `toDataUrl(img)` helper handles the browser-display case.
- **Copy-paste provider, image input:** sentinel injected into `combined`
  (`[N image attachment(s) — not included in copied text]`). OCR is a future
  enhancement, only if it can be done without heavy dependencies.
- **Copy-paste provider, image output:** not supported. Image generation
  requires a real provider.
- **AiPrompt:** extended in place — `attachments` is a new optional constructor
  arg defaulting to `[]`. Existing two-arg call sites are unaffected.
- **Image generation surface:** separate from chat completion. New
  `callProviderImageGeneration` / `callProxiedImageGeneration` entry points,
  new proxy endpoint, new hook entry point. Folding it into the chat path would
  force ugly union response types and a redundant retry loop.
- **AbortSignal:** added to both chat and image-gen params. Threaded through
  `fetch(..., {signal})`.
- **Default image model — OpenAI:** `dall-e-3` (just-works, no org verification
  required). Can be overridden via `model` on `IAiAssistProviderConfig`.
- **Image model selection reuses the existing `'image'` `ModelSpecKey`.** No
  separate `defaultImageModel` field — providers declare image models via
  `defaultModel: { base: '<chat>', image: '<gen>' }` and the image dispatcher
  calls `resolveModel(spec, 'image')`. Caller `model` overrides work for free
  with no schema change.
- **`dall-e-3` rejects `count > 1`.** The library does not pre-validate; the
  provider's 400 surfaces through the existing `fail` path. Document on the
  options type so callers know.
- **Size knobs:** `options.size` applies to openai-format providers (mapped to
  the API `size` field). Imagen reads `options.imagen.aspectRatio`. If `size`
  is set on Imagen, it's silently ignored.
- **No `truncated` field on image responses.** Image APIs don't truncate the
  way text does — they return N images, refuse, or error. If a caller cares
  whether they got fewer images than requested, they can compare
  `images.length` to their request `count`.
- **MIME types are read from the response when the provider supplies one
  (Imagen does); otherwise a per-format default is used (PNG for openai-images,
  JPEG for xai-images).** Defaults documented per adapter.
- **Proxy server is the consumer's responsibility.** This library defines the
  client and the wire contract; consumers implement the actual proxy. The
  contract is documented in the proxy section below — adding image generation
  means consumers must implement a new endpoint.

---

## Shared types (new in `model.ts`)

```ts
/** Universal image representation — used for input AND output. */
export interface IAiImageData {
  readonly mimeType: string;          // e.g. 'image/png', 'image/jpeg', 'image/webp'
  readonly base64: string;            // raw base64, no `data:` prefix
}

/** Helper for browser-display contexts. */
export function toDataUrl(image: IAiImageData): string;
```

---

## Image input (vision)

### `model.ts`

```ts
export interface IAiImageAttachment extends IAiImageData {
  /** OpenAI-specific hint; ignored by Anthropic and Gemini. */
  readonly detail?: 'low' | 'high' | 'auto';
}

export class AiPrompt {
  public readonly system: string;
  public readonly user: string;
  public readonly attachments: ReadonlyArray<IAiImageAttachment>;

  public constructor(
    user: string,
    system: string,
    attachments?: ReadonlyArray<IAiImageAttachment>
  );

  public get combined(): string;  // appends sentinel when attachments present
}

export type IChatContentPart =
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'image'; readonly image: IAiImageAttachment };

export interface IChatMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string | ReadonlyArray<IChatContentPart>;
}
```

`IAiProviderDescriptor` gains:
```ts
readonly acceptsImageInput: boolean;
```

Per-provider:
| Provider        | acceptsImageInput |
|-----------------|-------------------|
| `openai`        | true              |
| `anthropic`     | true              |
| `google-gemini` | true              |
| `xai-grok`      | true              |
| `groq`          | false             |
| `mistral`       | false             |
| `copy-paste`    | false             |

### `apiClient.ts`

`IProviderCompletionParams` gains `signal?: AbortSignal`.

Pre-flight: if `prompt.attachments.length > 0 && !descriptor.acceptsImageInput`,
fail fast — `provider "${id}" does not accept image input`.

Per-format request-body translation:
- **OpenAI chat / Responses API:** user `content` becomes a parts array:
  `[{type:'text',text}, {type:'image_url', image_url:{url:dataUrl, detail}}]`.
- **Anthropic:** user `content` becomes
  `[{type:'text',text}, {type:'image', source:{type:'base64', media_type, data}}]`.
  System stays a top-level string.
- **Gemini:** user `parts` becomes `[{text}, {inlineData:{mimeType, data}}]`.

Response shape unchanged (still text out).

### Proxy

Same `/api/ai/completion` endpoint. Payload grows; bump body limits as needed.

### `useAiAssist`

`copyPrompt` already calls `prompt.combined`, which now carries the sentinel.
No other changes — `generateDirect` is image-input-agnostic at the type level.

---

## Image output (generation)

### `model.ts`

```ts
export type AiImageApiFormat = 'openai-images' | 'gemini-imagen' | 'xai-images';

export interface IAiImageGenerationOptions {
  /**
   * For openai-format providers (openai-images, xai-images). Mapped to the
   * provider's `size` request field. Ignored by Imagen — use
   * `options.imagen.aspectRatio` instead.
   *
   * Note: `dall-e-3` only accepts these specific values. Other openai-format
   * models (gpt-image-1, dall-e-2) accept different sets — the library does
   * not pre-validate; provider 400 errors surface through the failure path.
   */
  readonly size?: '1024x1024' | '1024x1792' | '1792x1024' | 'auto';
  /**
   * Number of images to generate. Default 1.
   *
   * Note: `dall-e-3` rejects `count > 1`. The library does not pre-validate;
   * the provider 400 surfaces through the failure path.
   */
  readonly count?: number;
  readonly quality?: 'standard' | 'high';
  readonly seed?: number;              // ignored where unsupported
  /**
   * Imagen-specific options. Ignored by openai-format providers.
   */
  readonly imagen?: {
    readonly negativePrompt?: string;
    readonly aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  };
}

export interface IAiImageGenerationParams {
  readonly prompt: string;             // single string, no system/user split
  readonly options?: IAiImageGenerationOptions;
}

export interface IAiGeneratedImage extends IAiImageData {
  readonly revisedPrompt?: string;     // OpenAI rewrites prompts
}

export interface IAiImageGenerationResponse {
  readonly images: ReadonlyArray<IAiGeneratedImage>;
}
```

`IAiProviderDescriptor` gains one optional field:
```ts
readonly imageApiFormat?: AiImageApiFormat;
```

All known image-generation providers reuse the same `baseUrl` they use for
chat. No separate `imageBaseUrl` is needed today; if a provider ever needs a
different domain for image generation, add it then.

Image-model selection reuses the existing `'image'` `ModelSpecKey`. Providers
declare image models via the existing `defaultModel: ModelSpec` field, e.g.
`{ base: 'gpt-4o', image: 'dall-e-3' }`. The image dispatcher resolves with
`resolveModel(spec, 'image')`.

Per-provider mapping (defaultModel image branch shown):
| Provider        | imageApiFormat   | defaultModel.image             |
|-----------------|------------------|--------------------------------|
| `openai`        | `openai-images`  | `dall-e-3`                     |
| `xai-grok`      | `xai-images`     | `grok-2-image-1212` *          |
| `google-gemini` | `gemini-imagen`  | `imagen-3.0-generate-002` *    |
| `anthropic`     | —                | —                              |
| `groq`          | —                | —                              |
| `mistral`       | —                | —                              |
| `copy-paste`    | —                | —                              |

\* xAI and Imagen model names churn — verify against provider docs at
implementation time.

### `apiClient.ts`

```ts
export interface IProviderImageGenerationParams {
  readonly descriptor: IAiProviderDescriptor;
  readonly apiKey: string;
  readonly params: IAiImageGenerationParams;
  readonly modelOverride?: ModelSpec;
  readonly logger?: Logging.ILogger;
  readonly signal?: AbortSignal;
}

export async function callProviderImageGeneration(
  params: IProviderImageGenerationParams
): Promise<Result<IAiImageGenerationResponse>>;

export async function callProxiedImageGeneration(
  proxyUrl: string,
  params: IProviderImageGenerationParams
): Promise<Result<IAiImageGenerationResponse>>;
```

Pre-flight: if `descriptor.imageApiFormat === undefined`, fail with
`provider "${id}" does not support image generation`.

Per-format adapters:
- **`openai-images`** — `POST ${baseUrl}/images/generations`
  body: `{model, prompt, n, size, response_format:'b64_json'}`
  response: `{data: [{b64_json, revised_prompt?}]}`. Provider does not return
  a MIME — default to `image/png`.
- **`xai-images`** — `POST ${baseUrl}/images/generations`
  body: `{model, prompt, n, response_format:'b64_json'}` (xAI ignores `size`)
  response: same shape as OpenAI. Provider does not return a MIME — default to
  `image/jpeg`.
- **`gemini-imagen`** — `POST ${baseUrl}/models/${model}:predict`
  body: `{instances:[{prompt}], parameters:{sampleCount, aspectRatio?, negativePrompt?}}`
  response: `{predictions: [{bytesBase64Encoded, mimeType}]}`. Read `mimeType`
  from each prediction.

### Proxy contract (consumer-implemented)

The library calls `POST ${proxyUrl}/api/ai/image-generation`. Consumers that
opt in to the proxy must implement this endpoint.

**Request body** (JSON):
```jsonc
{
  "providerId": "openai" | "xai-grok" | "google-gemini",
  "apiKey": "...",                  // forwarded by the client; proxy may swap for stored key
  "params": {
    "prompt": "...",
    "options": { /* IAiImageGenerationOptions, optional */ }
  },
  "modelOverride": "..." | { /* ModelSpec, optional */ }
}
```

**Response body** on success: an `IAiImageGenerationResponse`:
```jsonc
{
  "images": [
    { "mimeType": "image/png", "base64": "...", "revisedPrompt": "..." }
  ]
}
```

**Response body** on error: any object with a `string` `error` field. The
library surfaces it as `proxy: ${error}`. Non-2xx HTTP statuses also surface
as failures with the body text.

The proxy is responsible for:
- Looking up the provider descriptor by `providerId`.
- Resolving the effective model from `modelOverride` and per-provider defaults.
- Calling the provider's image API with the right shape (the same logic this
  library uses for direct calls).
- Returning the unified `IAiImageGenerationResponse` shape regardless of
  provider.

### `useAiAssist`

```ts
readonly generateImages: (
  provider: AiProviderId,
  params: IAiImageGenerationParams,
  signal?: AbortSignal
) => Promise<Result<IAiImageGenerationResponse>>;
```

Same proxy-or-direct decision as `generateDirect`; same keystore checks; no
retry loop, no JSON parsing.

---

## Implementation sequence

1. **Shared types + AbortSignal — DONE**
   - `IAiImageData`, `toDataUrl`, `signal?` on `IProviderCompletionParams`
   - Threaded through `fetchJson` and all four chat adapters
   - Tests for abort wire-through and abort error surfacing
2. **Image generation — full path — DONE**
   - Types in `model.ts` (params, response, descriptor extension)
   - Registry updates (`defaultModel.image` + `imageApiFormat` for openai,
     xai-grok, google-gemini)
   - Adapters in `apiClient.ts` (openai-images, xai-images, gemini-imagen)
   - `callProviderImageGeneration` + `callProxiedImageGeneration`
   - Hook entry point `generateImages` in `useAiAssist`
   - Unit tests for all three formats + proxy
3. **Image input (vision) — DONE**
   - `IAiImageAttachment` extends `IAiImageData` with optional `detail` hint
   - `AiPrompt.attachments` (defaults to `[]`); `combined` injects sentinel
   - `acceptsImageInput` on `IAiProviderDescriptor` (true for openai,
     anthropic, google-gemini, xai-grok; false for groq, mistral, copy-paste)
   - Adapter user-content translation per format:
     - openai chat: `{type:'text'}` + `{type:'image_url', image_url:{url, detail}}`
     - openai Responses API: `{type:'input_text'}` + `{type:'input_image', image_url}`
     - anthropic: `{type:'text'}` + `{type:'image', source:{type:'base64', media_type, data}}`
     - gemini: `{text}` + `{inlineData:{mimeType, data}}`
   - Pre-flight rejection in `callProviderCompletion` when attachments present
     but `descriptor.acceptsImageInput === false`
   - `callProxiedCompletion` forwards `attachments` in the prompt body
   - Unit tests covering each format's image-message wire shape, the
     pre-flight rejection, and proxy forwarding

   Sample app integration for image input is **not** part of this step —
   would require a separate "vision chat" UI flow distinct from image gen.
   Future enhancement.

### Implementation decisions logged during step 2

- **`as Record<string, unknown>` for the proxy `error`-field pre-check.** Both
  `callProxiedCompletion` and `callProxiedImageGeneration` use this single-line
  cast to peek at an optional `error` field before handing the body off to a
  proper validator for the success shape. The cast is *narrowing only* — no
  type claim is made beyond the `error` string read. Kept for consistency with
  the pre-existing chat-proxy code; not flagged for refactor.
- **Hook return asymmetry.** `generateImages` returns the raw
  `IAiImageGenerationResponse` rather than wrapping it in `IAiAssistResult`
  (which `generateDirect` does). Image responses aren't validated entities
  with a meaningful "source" field. If non-AI image sources (cache, local) are
  added later, wrap then.

Tests follow the pattern in
`libraries/ts-extras/src/test/unit/ai-assist/apiClient.test.ts`
(global `fetch` mocked per test).

---

---

## List models

Many providers do not authoritatively declare per-model capabilities, and
model-id sets churn (the Imagen 404 in the sample is the canonical case).
The library exposes a generic `listModels` that:

- Calls each provider's HTTP list endpoint via the existing `apiFormat`
  dispatch (no new descriptor field needed).
- Translates native capability declarations where the provider supplies them
  (Gemini's `supportedGenerationMethods`).
- Augments capabilities from a config of `(idPattern → capabilities)` rules,
  shipped as `DEFAULT_MODEL_CAPABILITY_CONFIG`. Callers can override per call.
- Optionally filters by capability.
- Returns `Result.fail` on listing errors — never silently falls back to
  empty. Consumers can show the error and fall back to free-text entry.

### Capability vocabulary

```ts
export type AiModelCapability = 'chat' | 'tools' | 'vision' | 'image-generation';
```

Adding more later is cheap; adding the *first* one after consumers exist
forces churn everywhere. All four are in the initial vocab.

### Config shape

```ts
export interface IAiModelCapabilityRule {
  readonly idPattern: RegExp;
  readonly capabilities: ReadonlyArray<AiModelCapability>;
  /** Optional friendly-name override; the function form lets one rule format
   *  many ids (e.g. `(id) => id.toUpperCase()`). */
  readonly displayName?: string | ((id: string) => string);
}

export interface IAiModelCapabilityConfig {
  /** Per-provider rules tried before global rules. */
  readonly perProvider?: { readonly [P in AiProviderId]?: ReadonlyArray<IAiModelCapabilityRule> };
  /** Cross-provider fallback. */
  readonly global?: ReadonlyArray<IAiModelCapabilityRule>;
}

export const DEFAULT_MODEL_CAPABILITY_CONFIG: IAiModelCapabilityConfig;
```

### Resolution algorithm

For each model returned by the provider:

1. Translate native capability info if the provider supplied any.
2. Walk per-provider rules then global rules; **union** every match's
   capabilities into the model's set. Multiple rules can contribute, so
   focused rules (one capability per rule) compose cleanly.
3. Filter by the requested capability if specified.

### API surface

```ts
export interface IAiModelInfo {
  readonly id: string;
  readonly capabilities: ReadonlySet<AiModelCapability>;
  readonly displayName?: string;
}

export interface IProviderListModelsParams {
  readonly descriptor: IAiProviderDescriptor;
  readonly apiKey: string;
  readonly capability?: AiModelCapability;
  readonly capabilityConfig?: IAiModelCapabilityConfig;
  readonly signal?: AbortSignal;
  readonly logger?: Logging.ILogger;
}

callProviderListModels(params): Promise<Result<ReadonlyArray<IAiModelInfo>>>
callProxiedListModels(proxyUrl, params): Promise<Result<ReadonlyArray<IAiModelInfo>>>
```

Plus `listModels(provider, capability?)` on the `useAiAssist` hook.

### List endpoints (keyed off existing `apiFormat`)

| `apiFormat` | Endpoint                  | Auth header    | Native capability info             |
|-------------|---------------------------|----------------|------------------------------------|
| openai      | `GET ${baseUrl}/models`   | `Bearer`       | none — fully driven by config      |
| anthropic   | `GET ${baseUrl}/models`   | `x-api-key`    | none — fully driven by config      |
| gemini      | `GET ${baseUrl}/models`   | `x-goog-api-key` | `supportedGenerationMethods` array |

### Out of scope (deferred)

- **Caching.** Listing is a config-level operation called rarely; no need to
  cache yet. Add per-session memoization if it ever shows up in profiling.

---

---

## Streaming chat

Driven by a conversational use case (recipe analysis with web-search
grounding) where progressive output is meaningfully better UX than waiting
for a complete response.

### Decisions

- **Separate entry point.** `callProviderCompletionStream` parallel to
  `callProviderCompletion`. Streaming and the JSON-correction retry loop
  in `generateDirect` don't compose — buffering a stream just to validate
  defeats the point.
- **Per-provider CORS control for streaming.** New mandatory descriptor
  field `streamingCorsRestricted: boolean`. Initial values mirror
  `corsRestricted` (only xai-grok is `true`); callers verify in their app
  and we flip individual values if any provider gates streaming separately.
- **No proxied streaming server in this repo.** We ship
  `callProxiedCompletionStream` and a documented contract; consumer
  implements the SSE-forwarding endpoint. `corsRestricted` providers
  without a proxy fail up front with an actionable message.
- **Server-side tool events surface as stream events**, but the library
  never invokes client-side tools — that's a non-goal.
- **Callback-based hook surface.** `streamDirect(provider, prompt,
  onEvent, signal?)` fits React state updates better than async iterables.
  Underlying library function returns `Promise<Result<AsyncIterable<...>>>`
  for testability and composition.
- **Final aggregation in the hook.** `streamDirect` resolves with
  `Result<{fullText, truncated}>` — callers get both progressive UI
  updates via `onEvent` and the complete result for downstream use.

### Event vocabulary

```ts
export type IAiStreamEvent =
  | { type: 'text-delta'; delta: string }
  | { type: 'tool-event'; toolType: AiServerToolType; phase: 'started' | 'completed'; detail?: string }
  | { type: 'done'; truncated: boolean; fullText: string }
  | { type: 'error'; message: string };
```

Mid-stream errors surface as a terminal `error` event. `done` arrives
only on success. Caller-initiated abort just stops iteration; no event
needed.

### API

```ts
export interface IProviderCompletionStreamParams extends IProviderCompletionParams {
  // structurally identical; reuses descriptor / apiKey / prompt / tools / signal
}

callProviderCompletionStream(params): Promise<Result<AsyncIterable<IAiStreamEvent>>>
callProxiedCompletionStream(proxyUrl, params): Promise<Result<AsyncIterable<IAiStreamEvent>>>
```

Plus on the hook:
```ts
readonly streamDirect: (
  provider: AiProviderId,
  prompt: AiPrompt,
  onEvent: (event: IAiStreamEvent) => void,
  signal?: AbortSignal
) => Promise<Result<{ fullText: string; truncated: boolean }>>;
```

### SSE adapters per format

| `apiFormat` | Endpoint                              | Notable events                              |
|-------------|---------------------------------------|---------------------------------------------|
| openai (chat) | `${baseUrl}/chat/completions` w/ `stream:true` | data lines with `choices[0].delta.content`; `[DONE]` marker; `finish_reason` in last data |
| openai (responses) | `${baseUrl}/responses` w/ `stream:true` | named events: `response.output_text.delta`, `response.web_search_call.in_progress`/`.completed`, `response.completed` |
| anthropic | `${baseUrl}/messages` w/ `stream:true` | named events: `content_block_start` (text or `server_tool_use`/`web_search_tool_result`), `content_block_delta`, `message_stop` |
| gemini | `${baseUrl}/models/${model}:streamGenerateContent?alt=sse` | newline-separated JSON envelopes; grounding metadata in final chunk; no explicit tool-progress markers |

### Pre-flight CORS rejection (graceful failure)

`callProviderCompletionStream` rejects up front when
`descriptor.streamingCorsRestricted === true` and the call isn't being
routed through a proxy:
```
provider "xai-grok" requires a proxy for streaming; none is configured
```
Caller gets a useful Result.fail before fetch is invoked, instead of
letting the browser CORS error surface unstructured.

### Proxy contract (consumer-implemented)

`POST ${proxyUrl}/api/ai/completion-stream`. Same JSON request body as
`/api/ai/completion` plus `"stream": true`. Response: `Content-Type:
text/event-stream`; body is the unified `IAiStreamEvent` JSON serialized
one event per SSE `data:` line. The proxy:
- Opens upstream SSE connection, translates provider-native events to the
  unified vocabulary, writes them as fast as they arrive.
- Handles client disconnect (close upstream connection, propagate abort).
- Surfaces upstream errors as a terminal `{type: 'error', message}` event.

We don't write or test the proxy server here; the contract is documented
above for consumers to implement.

### Out of scope

- **Client-side tools / function calling.** No support in synchronous
  mode either; intentional.
- **Streaming for entity-validation use cases.** The JSON-correction retry
  loop in `generateDirect` is a deliberately separate flow.
- **Streaming for image generation or list-models.** Those don't have a
  meaningful streaming model.

---

## Open follow-ups (not in scope)

- ~~**`useAiAssist` hook tests.**~~ Done. Hook coverage at 99.78% statements
  / 88.54% branches across `actions`, `copyPrompt`, `generateDirect`,
  `generateImages`, and `listModels`. The remaining branch gap is mostly
  optional-chaining permutations on logger/keystore presence.
- **Consumer proxy must implement `/api/ai/image-generation` before
  enabling.** Any consumer with `proxyAllProviders: true` (or with `xai-grok`
  enabled, since it's CORS-restricted) will fail at runtime the first time
  `generateImages` is called against an un-updated proxy.
- **Refactor proxy `error`-field check to a `Validators.oneOf` discriminator.**
  Both `callProxiedCompletion` and `callProxiedImageGeneration` could share
  the success/error split if we want to drop the small `as Record` cast. Low
  priority; only worth doing as a coordinated cleanup of both functions.
- **Chat-proxy coverage gap.** `callProxiedCompletion` is untested
  (pre-existing). When it gets tests, mirror the pattern from
  `callProxiedImageGeneration` (mock `fetch`, success, `error` field, malformed
  body, abort signal forwarding, network error).
- Streaming (text and image) — needs a fundamentally different return type.
- Image edit / image variation flows — would unblock image input on the
  generation side and let copy-paste support image-out via "describe this".
- Tesseract.js or remote OCR for the copy-paste image-input flow.
- Body-size limits on the proxy when shipping multi-MB attachments.
- Per-provider MIME negotiation (currently we assume what each provider returns).
