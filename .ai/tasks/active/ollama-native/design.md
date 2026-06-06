# Design: `@fgv/ts-extras-ollama` — native-API Result boundary

**Status:** design complete (Task B of the `ollama-native` stream). Implementation deferred until Task A + the MCP slice land.
**Author:** design agent (2026-06-06).
**Integration branch:** `ollama-native` (off `release`).
**Scoping source:** `.ai/tasks/active/ollama-native/brief.md` (Task B); the 2026-06-06 Ollama scoping pass (A-now-then-B; reject C).
**Structural template:** `@fgv/ts-extras-transformers` / `@fgv/ts-web-extras-transformers` (the `local-ai-exploration` cluster) and `@fgv/ts-extras-webauthn` (the canonical Result-integration boundary).

---

## 1. Problem & the two-axis local-AI story

`@fgv/*` is converging on a two-axis story for local/on-device AI:

- **In-process axis** — `@fgv/ts-extras-transformers` + `@fgv/ts-web-extras-transformers` wrap `@huggingface/transformers` (ONNX). The model runs *inside the JS process*; the consumer loads a pipeline and infers against it. Shipped by the `local-ai-exploration` cluster (B-1…B-5).
- **Sidecar axis** — a model server (Ollama) runs as a *same-host HTTP sidecar* at `http://127.0.0.1:11434`. The JS process is a thin client. The sidecar owns model weights, GGUF storage, VRAM lifecycle, and the inference loop.

The 2026-05-22 research note (`.ai/notes/orchestrator/research/local-models-incorporation.md` §3) surfaced the load-bearing observation for the sidecar axis: **an Ollama instance already speaks the OpenAI wire format at `/v1`.** So the *completion / streaming / tools / structured-via-prompt* half of "talk to a local Llama through Ollama" is **already covered today** by `@fgv/ts-extras/ai-assist` with zero new code — you point a provider descriptor's `endpoint` at `http://localhost:11434/v1` and call `callProviderCompletion` / `callProviderCompletionStream` / `executeClientToolTurn`.

What the `/v1` compatibility shim **cannot** express is everything that is *Ollama-the-model-server-specific*: enumerating locally-pulled models with their GGUF metadata, pulling a model with download progress, inspecting which models are resident in VRAM, deleting a model, and — the headline fidelity win — **grammar-constrained structured output** via the native `/api/chat` `format` field (a full JSON schema enforced by the sampler, not a prompt-and-hope instruction).

`@fgv/ts-extras-ollama` owns **exactly and only that native-only surface.** It does **not** duplicate the completion path; ai-assist keeps it.

This package is the second instance of the integration-boundary shape that `docs/FUTURE.md` tracks as a candidate for an eventual `integrations/` directory — and the first that wraps a *sidecar HTTP client* rather than an in-process runtime.

---

## 2. What works today vs. the gap (cited)

### Already works (do NOT rebuild — ai-assist owns it)

| Capability | Where | Notes |
|---|---|---|
| `ollama` provider descriptor | `libraries/ts-extras/src/packlets/ai-assist/registry.ts:146-159` | `id: 'ollama'`, `apiFormat: 'openai'`, `baseUrl: 'http://localhost:11434/v1'`, `defaultModel: ''`, `needsSecret: false`. |
| `openai-compat` provider descriptor | `registry.ts:214-227` | Generic self-hosted OpenAI-compat; `baseUrl: ''` (requires `endpoint` override). |
| Empty-key header omission | `libraries/ts-extras/src/packlets/ai-assist/endpoint.ts:40-42` | `bearerAuthHeader('')` → `{}`; local servers reject `Authorization: Bearer ` with an empty key. |
| `endpoint` override resolution | `endpoint.ts:53-87` | `resolveEffectiveBaseUrl(descriptor, endpoint?)` — validates http(s), strips trailing slash, rejects query/fragment/userinfo. |
| `IAiAssistProviderConfig.endpoint` | `libraries/ts-extras/src/packlets/ai-assist/model.ts:1321-1338` | Caller-supplied endpoint URL pointing a provider at a self-hosted server. |
| Completion / streaming / tools / list-models | ai-assist `callProviderCompletion*`, `executeClientToolTurn` | All work against local Ollama via `/v1`. PR #466 extended the `endpoint` override to `executeClientToolTurn`. |

Task A (separate PR → `release`) makes this discoverable: capability-config rules so `listModels(capability)` is non-empty, plus a `LIBRARY_CAPABILITIES.md` recipe.

### The gap (this package)

| Native endpoint | Why `/v1` can't do it |
|---|---|
| `GET /api/tags` | `/v1/models` lists ids only — no GGUF `size` / `family` / `parameter_size` / `quantization_level` / `modified_at`. |
| `POST /api/show` | No `/v1` equivalent for `modelfile` / `parameters` / `template` / `capabilities` / `model_info`. |
| `POST /api/pull` (streamed) | `/v1` has no model-download surface at all. Progress is JSON-lines streamed bytes. |
| `GET /api/ps` | No `/v1` equivalent for "which models are loaded + VRAM resident + expiry". |
| `DELETE /api/delete` | No `/v1` equivalent. |
| `POST /api/chat` with `format` = full JSON schema | The `/v1` path can only *prompt* for JSON and parse the reply (`generateJsonCompletion`); native `format` is **grammar-constrained** — the sampler is restricted to the schema, so malformed JSON is structurally impossible. Headline fidelity win. |
| `POST /api/embed` | ai-assist exposes no embedding API; flagged below (overlaps the transformers `embed` facade). |

---

## 3. Native-only surface

**Shape discipline (from the WebAuthn / transformers precedent):** ~7 primitives, every fallible op returns `Promise<Result<T>>` (sync `Result<T>` for the non-I/O factory), `captureAsyncResult` around every upstream call, **zero opinionated orchestration**, explicit NOT-in-scope list (§8). Primitives are **client-first** (mirroring transformers' `classify(classifier, …)` / `embed(extractor, …)`): the factory returns a client handle, every primitive takes it as the first argument.

### 3.1 Factory

```typescript
/**
 * Construction parameters for an Ollama client. All optional; defaults match
 * the `ollama` JS library (host `http://127.0.0.1:11434`).
 * @public
 */
export interface ICreateOllamaClientParams {
  /** Server address. Defaults to `http://127.0.0.1:11434`. */
  readonly host?: string;
  /**
   * Custom fetch implementation. Injecting a fetch is the primary unit-test
   * seam (see §7) and the hook for a future proxy / browser path.
   */
  readonly fetch?: typeof fetch;
  /** Custom headers included on every request (e.g. an auth token for a guarded sidecar). */
  readonly headers?: Record<string, string>;
}

/**
 * Opaque client handle. Re-export of the upstream `ollama` `Ollama` instance
 * type — consumers retain full access to the upstream API for anything this
 * boundary does not wrap (§8).
 * @public
 */
export type IOllamaClient = Ollama; // re-exported from the `ollama` package

/**
 * Constructs an Ollama client. Synchronous (the constructor performs no I/O),
 * so returns `Result<IOllamaClient>` rather than a promise.
 * @public
 */
export function createOllamaClient(
  params?: ICreateOllamaClientParams
): Result<IOllamaClient>; // captureResult(() => new Ollama({ host, fetch, headers }))
```

### 3.2 Shared model types (fgv-owned, normalized)

Decided to **normalize** the wire shapes into fgv-owned `readonly` camelCase interfaces rather than passing through the upstream snake_case types (see §6.3 for the rationale and how this differs from transformers' passthrough).

```typescript
/**
 * GGUF / model detail block, common to `/api/tags`, `/api/ps`, `/api/show`.
 * All fields optional — Ollama omits any it cannot determine.
 * @public
 */
export interface IOllamaModelDetail {
  /** Storage format, e.g. `'gguf'`. */
  readonly format?: string;
  /** Primary architecture family, e.g. `'llama'`. */
  readonly family?: string;
  /** All architecture families this model belongs to. */
  readonly families?: ReadonlyArray<string>;
  /** Human-readable parameter count, e.g. `'8.0B'`. */
  readonly parameterSize?: string;
  /** Quantization level, e.g. `'Q4_0'`. */
  readonly quantizationLevel?: string;
  /** Parent model for fine-tunes / derived models. */
  readonly parentModel?: string;
}

/**
 * Fields common to a locally-stored model and a running model.
 * @public
 */
export interface IOllamaModelBase {
  /** Tagged name, e.g. `'llama3.1:8b'`. */
  readonly name: string;
  /** Underlying model id (often equal to `name`). */
  readonly model: string;
  /** On-disk size in bytes. */
  readonly size: number;
  /** SHA-256 manifest digest. */
  readonly digest: string;
  /** GGUF / architecture detail. */
  readonly details: IOllamaModelDetail;
}

/**
 * A model present in the local store (`/api/tags`).
 * @public
 */
export interface IOllamaModel extends IOllamaModelBase {
  /** Last-modified timestamp, parsed from the RFC3339 wire value. */
  readonly modifiedAt: Date;
}

/**
 * A model currently loaded into memory (`/api/ps`). Note `/api/ps` does NOT
 * return `modified_at`, so this does not extend {@link IOllamaModel}.
 * @public
 */
export interface IOllamaRunningModel extends IOllamaModelBase {
  /** When the model will be unloaded, parsed from the RFC3339 wire value. */
  readonly expiresAt: Date;
  /** Bytes resident in VRAM (0 when fully on CPU). */
  readonly sizeVram: number;
}
```

### 3.3 Model management (4 primitives)

```typescript
/**
 * Lists models in the local store (`GET /api/tags`).
 * @public
 */
export function listModels(client: IOllamaClient): Promise<Result<ReadonlyArray<IOllamaModel>>>;

/**
 * Full model detail, capabilities, parameters, and template (`POST /api/show`).
 * @public
 */
export interface IOllamaModelInfo {
  /** The Modelfile source, when returned. */
  readonly modelfile?: string;
  /** Default parameters string. */
  readonly parameters?: string;
  /** The prompt template. */
  readonly template?: string;
  /** GGUF / architecture detail. */
  readonly details: IOllamaModelDetail;
  /** Low-level model metadata key-value map (`model_info`). */
  readonly modelInfo?: Readonly<Record<string, JsonValue>>;
  /** Declared capabilities, e.g. `['completion', 'tools', 'vision', 'thinking']`. */
  readonly capabilities?: ReadonlyArray<string>;
}

export function showModel(
  client: IOllamaClient,
  model: string,
  options?: { readonly verbose?: boolean }
): Promise<Result<IOllamaModelInfo>>;

/**
 * Lists models currently loaded into memory (`GET /api/ps`).
 * @public
 */
export function listRunning(client: IOllamaClient): Promise<Result<ReadonlyArray<IOllamaRunningModel>>>;

/**
 * Result of a delete. Returns a meaningful value rather than `Result<void>`
 * (per repo standards — `Result<void>` is an anti-pattern).
 * @public
 */
export interface IOllamaDeleteResult {
  readonly model: string;
  readonly deleted: true;
}

/**
 * Deletes a model from the local store (`DELETE /api/delete`).
 * @public
 */
export function deleteModel(client: IOllamaClient, model: string): Promise<Result<IOllamaDeleteResult>>;
```

### 3.4 Pull with streamed progress (1 primitive — the trickiest; see §5)

```typescript
/**
 * A single progress chunk from a streamed pull (`/api/pull`). Ollama emits a
 * JSON-lines stream; each line is one of these.
 * @public
 */
export interface IOllamaPullProgress {
  /**
   * Phase string, e.g. `'pulling manifest'`, `'pulling <digest>'`,
   * `'verifying sha256 digest'`, `'writing manifest'`, `'success'`.
   */
  readonly status: string;
  /** Layer digest being transferred (present during `'pulling <digest>'` phases). */
  readonly digest?: string;
  /** Total bytes for the current layer, when known. */
  readonly total?: number;
  /** Bytes transferred so far for the current layer, when known. */
  readonly completed?: number;
}

/**
 * Terminal result of a completed pull. Returns a meaningful value (not
 * `Result<void>`): the final status plus a count of progress chunks observed.
 * @public
 */
export interface IOllamaPullResult {
  readonly model: string;
  /** The `status` of the final chunk, normally `'success'`. */
  readonly finalStatus: string;
  /** Number of progress chunks observed (useful for tests and diagnostics). */
  readonly chunkCount: number;
}

/**
 * Parameters for {@link pullModel}.
 * @public
 */
export interface IPullModelParams {
  /** Model to pull, e.g. `'llama3.1:8b'`. */
  readonly model: string;
  /** Allow pulling from insecure (non-TLS) registries. */
  readonly insecure?: boolean;
  /**
   * Progress callback, invoked once per JSON-lines chunk as it arrives. The
   * `Result` returned by `pullModel` resolves only after the stream
   * terminates; progress is surfaced here in the interim. A throw from this
   * callback fails the whole pull (it runs inside the captured loop).
   */
  readonly onProgress?: (progress: IOllamaPullProgress) => void;
  /**
   * Abort signal. Cancels the in-flight pull; the upstream stream throws an
   * `AbortError`, which surfaces as `Result.fail`.
   */
  readonly signal?: AbortSignal;
}

/**
 * Pulls a model with streamed progress (`POST /api/pull`).
 * @public
 */
export function pullModel(client: IOllamaClient, params: IPullModelParams): Promise<Result<IOllamaPullResult>>;
```

### 3.5 Grammar-constrained structured output (1 primitive — headline; see §4)

```typescript
/**
 * A chat message in Ollama native shape.
 * @public
 */
export interface IOllamaChatMessage {
  readonly role: 'system' | 'user' | 'assistant' | 'tool';
  readonly content: string;
  /** Base64 image data for vision models (no `data:` prefix). */
  readonly images?: ReadonlyArray<string>;
}

/**
 * Result of a grammar-constrained structured chat. Carries both the validated
 * typed value and the raw JSON text the model emitted, for diagnostics.
 * @public
 */
export interface IOllamaChatStructuredResult<T> {
  /** The parsed-and-validated value (validated by the same schema sent on the wire). */
  readonly value: T;
  /** The raw `message.content` JSON string the model emitted. */
  readonly raw: string;
  /** The model that produced the response. */
  readonly model: string;
  /** Provider-reported finish reason, when present. */
  readonly doneReason?: string;
}

/**
 * Parameters for {@link chatStructured}.
 * @public
 */
export interface IChatStructuredParams<T> {
  readonly model: string;
  readonly messages: ReadonlyArray<IOllamaChatMessage>;
  /**
   * The single source of truth for both the wire schema (`schema.toJson()`,
   * sent as the native `format` field) and the result validator
   * (`schema.validate()`). Author with `JsonSchema.object(...)` from
   * `@fgv/ts-json-base`; `T` is derived via `JsonSchema.Static<typeof schema>`.
   * A runtime-discovered (MCP) schema parsed via `JsonSchema.fromJson(raw)`
   * also works — its `T` is `JsonValue`.
   */
  readonly schema: JsonSchema.ISchemaValidator<T>;
  /** Native Ollama `options` (temperature, num_ctx, seed, …). Passed verbatim. */
  readonly options?: Readonly<Record<string, JsonValue>>;
  /** Native `keep_alive` (duration string or seconds). Passed verbatim — no policy applied. */
  readonly keepAlive?: string | number;
}

/**
 * Single-turn grammar-constrained structured chat (`POST /api/chat` with
 * `format` = full JSON schema, `stream: false`).
 * @public
 */
export function chatStructured<T>(
  client: IOllamaClient,
  params: IChatStructuredParams<T>
): Promise<Result<IOllamaChatStructuredResult<T>>>;
```

### 3.6 Native embeddings (1 primitive — flagged; see §8 OQ)

```typescript
/**
 * Result of a native embedding call (`/api/embed`).
 * @public
 */
export interface IOllamaEmbedResult {
  readonly model: string;
  /** One vector per input string (Ollama always returns an array-of-arrays). */
  readonly embeddings: ReadonlyArray<ReadonlyArray<number>>;
  /** Total wall-clock duration in nanoseconds, when reported. */
  readonly totalDuration?: number;
  /** Prompt token count, when reported. */
  readonly promptEvalCount?: number;
}

/**
 * Parameters for {@link embed}.
 * @public
 */
export interface IEmbedParams {
  readonly model: string;
  /** A single string or a batch of strings. */
  readonly input: string | ReadonlyArray<string>;
  /** Truncate inputs that exceed context length (Ollama default `true`). */
  readonly truncate?: boolean;
  /** Output dimension override, where the model supports it. */
  readonly dimensions?: number;
  /** Native `options`, passed verbatim. */
  readonly options?: Readonly<Record<string, JsonValue>>;
}

/**
 * Generates embeddings (`POST /api/embed`).
 * @public
 */
export function embed(client: IOllamaClient, params: IEmbedParams): Promise<Result<IOllamaEmbedResult>>;
```

**Surface summary:** `createOllamaClient` + 7 primitives (`listModels`, `showModel`, `listRunning`, `deleteModel`, `pullModel`, `chatStructured`, `embed`). Matches the WebAuthn (6) / transformers (5) boundary footprint.

---

## 4. `chatStructured` + `JsonSchema` design (the no-drift core)

The fidelity win is **grammar-constrained sampling**: Ollama restricts the token sampler to the supplied JSON schema, so the response is structurally guaranteed to match — fundamentally stronger than ai-assist's prompt-and-parse `generateJsonCompletion` (which asks the model nicely and then parses, tolerating fences and prose via `fencedStringifiedJson`).

The single-source-of-truth mechanism leans entirely on `@fgv/ts-json-base`'s `JsonSchema.ISchemaValidator<T>` (`libraries/ts-json-base/src/packlets/json-schema-builder/types.ts:58`), which **is** a `Validator<T>` and also carries `toJson()`:

```
            ┌──────────────────────────────────────────┐
   author → │  const schema = JsonSchema.object({...})  │  ← ONE declaration
            └──────────────────────────────────────────┘
                    │                          │
       schema.toJson()                   schema.validate(parsed)
                    │                          │
         wire `format` field          result validator
        (sent to /api/chat)         (checks the reply)
```

Because the wire schema and the result validator are the *same object*, they **cannot drift** — exactly the property the brief calls for, and the same discipline ai-assist's client-tool `parametersSchema` already uses (`model.ts:204-216`).

**Implementation sketch** (all inside one `captureAsyncResult`):

1. `const wire = params.schema.toJson();`
2. `client.chat({ model, messages, format: wire, stream: false, options, keep_alive })` — `stream: false` because a structured document is validated whole; partial JSON has no validation value.
3. `JSON.parse(response.message.content)` → the model's emitted object (grammar guarantees it parses, but we still capture parse failure for robustness against older daemons).
4. `params.schema.validate(parsed)` → on success, `{ value, raw: content, model, doneReason }`; on failure, propagate the validator's error with context (`chatStructured(${model}): response failed schema validation: ${msg}`).

`T` flows end-to-end: `JsonSchema.Static<typeof schema>` derives it at the call site; the function is generic in `T`; the result is `IOllamaChatStructuredResult<T>`. No caller-supplied `T`, no cast. A runtime-discovered schema (`JsonSchema.fromJson(raw)` → `ISchemaValidator<JsonValue>`) flows through with `T = JsonValue`.

**`format` sanitization caveat (decided, with a hedge):** `schema.toJson()` emits draft-07 with `additionalProperties: false` and `$schema` by default. Ollama's `format` accepts a standard JSON schema; unlike Gemini (which the ai-assist Gemini adapter must sanitize), Ollama is expected to tolerate these keywords. **Decided:** send `schema.toJson()` verbatim at v0.1. **Hedge:** if implementation-time testing against a live daemon shows Ollama rejecting `$schema`/`additionalProperties`, add a minimal recursive sanitizer (the ai-assist Gemini adapter is the reference implementation). This is an implementation detail, not a surface change — noted here so the implementer expects it.

---

## 5. Pull-progress streaming design

This is the piece the brief flags as trickiest. Ollama's `/api/pull` returns a **JSON-lines stream** (newline-delimited JSON objects), one per progress event, terminating with `{"status":"success"}`. The `ollama` JS library already parses this into an `AsyncGenerator<ProgressResponse>` when `stream: true` — so wrapping the lib (§6) means we do **not** hand-roll JSON-lines framing.

**Two candidate shapes were considered:**

- **(A) Terminal `Result` + `onProgress` callback** *(chosen).* `pullModel(client, { model, onProgress }) → Promise<Result<IOllamaPullResult>>`. The function drives the async generator internally, invokes `onProgress` per chunk, and resolves the `Result` once the stream terminates (success → `succeed({ finalStatus, chunkCount })`; mid-stream throw / `AbortError` → `fail`). The entire consume-loop sits inside `captureAsyncResult`, so any upstream error — connection drop, registry 404, abort, or a throwing `onProgress` — becomes a single `Failure`.
- **(B) Return `Result<AsyncIterable<IOllamaPullProgress>>`** and let the consumer drive the loop. Rejected for v0.1: per-chunk errors aren't Result-shaped (the consumer must `try/catch` the `for await`), there's no clean terminal-success value, and it pushes framing concerns back onto the consumer — the opposite of a Result boundary.

**Why (A) fits the Result discipline.** The terminal outcome (did the pull succeed?) is the thing a consumer chains on; progress is a side-channel for UI, which is *consumer policy* (§8). This mirrors how `executeClientToolTurn` splits a progress channel (`events`) from a terminal `Promise<Result<…>>` (`nextTurn`) — except pull has no post-stream computation, so a callback is lighter than a second iterable. The chosen shape is the minimal Result-idiomatic surface; (B) remains available to consumers who want it by calling `client.pull({ stream: true })` directly (the boundary doesn't hide it).

**Mapping per chunk:** upstream `ProgressResponse` (`{ status, digest, total, completed }`) maps 1:1 to `IOllamaPullProgress` (same field names, all already camel/flat) — a trivial structural copy, validated in tests against a multi-chunk fixture (§7).

**Abort:** `params.signal` is wired to the upstream client's abort path. Decided to include it now (cheap, the lib supports it, and a multi-minute model download with no cancel is a poor surface) — flagged in §8 as the one nicety most defensibly cut if the first consumer doesn't want it.

---

## 6. Decisions: wrap-vs-fetch & dependency posture

### 6.1 Wrap the `ollama` JS library — NOT direct `fetch` *(decided)*

**Decision: depend on and wrap the official `ollama` package.**

Rationale:
- **It owns the hard parts.** JSON-lines stream framing for `/api/pull` (and chat streaming), `AsyncGenerator` production, the abort plumbing, and host/header/fetch wiring are all handled. Hand-rolling JSON-lines framing over raw `fetch` is precisely the "reimplement a partial version of a primitive" anti-pattern `CODING_STANDARDS.md` warns against — and it's the trickiest, most error-prone part of this surface (§5).
- **Exact precedent.** This *is* the transformers boundary's posture: wrap a well-maintained, throw-on-failure upstream lib in `Result`, add zero orchestration. `@fgv/ts-extras-transformers` wraps `@huggingface/transformers`; `@fgv/ts-extras-ollama` wraps `ollama`. Same shape, same justification.
- **`fetch` injection is preserved.** The `ollama` constructor takes a custom `fetch` (`new Ollama({ host, fetch, headers })`), which is our unit-test seam (§7) and the future proxy/browser hook — so wrapping the lib does **not** cost us the fetch-level control that a direct-fetch design would have offered.
- **`captureAsyncResult` is the entire adapter.** Every primitive is `captureAsyncResult(() => client.<method>(...))` plus a thin wire→fgv mapping. The boundary stays genuinely thin.

The cost of wrapping (a runtime dep on `ollama`) is exactly the cost the transformers package already accepted for `@huggingface/transformers`, and lockstep versioning makes it cheap.

### 6.2 Dependency posture — `ollama` as a **peer dependency** *(decided)*

Mirror `@fgv/ts-extras-transformers` exactly (`package.json`): `ollama` is both a `peerDependency` (consumer brings their pinned version) and a `devDependency` (so the package builds and tests). `@fgv/ts-utils` and `@fgv/ts-json-base` are `dependencies` (`workspace:*`); `@fgv/ts-utils` is additionally a peer (transformers does this).

Rationale: the `ollama` client is the consumer's runtime contract with their sidecar; a peer dep lets the consumer control the version and avoids version-skew between the boundary's pin and the consumer's. This is the established integration-boundary convention in this repo.

`@fgv/ts-json-base` is a hard `dependency` (not peer) because `chatStructured` consumes `JsonSchema.ISchemaValidator` as a first-class part of the surface — it's not optional the way the upstream client is.

### 6.3 Normalize wire shapes into fgv-owned types *(decided)*

Unlike transformers (which passes upstream `Pipeline` / `TextClassificationOutput` types straight through), `@fgv/ts-extras-ollama` defines fgv-owned `readonly` camelCase interfaces (§3.2) and maps from the upstream wire shapes.

Rationale, and why the divergence from transformers is justified:
- The brief explicitly asks for `IOllamaModel`, `IOllamaModelDetail`, `IOllamaRunningModel`, `IOllamaPullProgress`.
- Ollama returns **plain JSON data objects** (snake_case: `modified_at`, `size_vram`, `quantization_level`) — normalizing to camelCase `Date`-typed fields is cheap, testable, and matches repo conventions. A transformers `Pipeline`, by contrast, is an opaque stateful callable that *can't* be normalized — passthrough is forced there, not chosen.
- Normalizing insulates consumers from upstream `ollama`-lib type churn (the peer-dep version can move without breaking our surface).

The upstream `Ollama` *client* type is still re-exported (as `IOllamaClient`) because it's an opaque handle, not data.

### 6.4 Node-only at v0.1 *(decided)*

`@fgv/ts-extras-ollama` is Node-only (localhost HTTP; `node-rig`-style packaging like transformers' Node side). The browser path — `import ollama from 'ollama/browser'` plus the sidecar's `OLLAMA_ORIGINS` CORS allowlist — is **out-of-scope-but-possible** (§8) and the natural shape of a future `@fgv/ts-web-extras-ollama` sibling (mirroring `@fgv/ts-web-extras-transformers`), queued to `docs/FUTURE.md`, not built now.

---

## 7. Test strategy (no live daemon)

**Two layers, both fully offline, 100% coverage on the boundary.**

### Layer 1 — structural client mock (primary; fast, deterministic)

Because primitives are client-first, unit tests pass a hand-built object implementing only the methods exercised (`list`, `show`, `ps`, `pull`, `delete`, `embed`, `chat`) — typed against the upstream method shapes. This tests the wire→fgv mapping, the `Result` success/failure paths, and the `chatStructured` parse+validate logic without touching HTTP or the `ollama` lib internals:

- `listModels` / `listRunning` / `showModel` — mock returns canned `ListResponse` / `ShowResponse`; assert camelCase mapping, `Date` parsing, optional-field handling. Mock *throws* → assert `Result.fail` with context.
- `deleteModel` — mock resolves; assert `{ model, deleted: true }`. Mock throws (404) → `fail`.
- `pullModel` — mock `pull` returns an async generator yielding a **multi-chunk** sequence (`pulling manifest` → `pulling <digest>` with `total`/`completed` → `verifying` → `writing manifest` → `success`); assert `onProgress` invoked per chunk, `chunkCount`, `finalStatus`. Generator that throws mid-iteration → `fail`. A throwing `onProgress` → `fail`. An aborted `signal` → `fail` (AbortError).
- `chatStructured` — mock `chat` returns `{ message: { content: '<json>' }, model, done_reason }`; assert `value` validates, `raw` preserved. Cases: valid JSON matching schema (succeed); JSON that parses but fails `schema.validate` (fail with validation context); non-JSON content (fail with parse context); assert `format` arg equals `schema.toJson()` on the call.
- `embed` — mock returns `{ embeddings: [[…]] }`; assert array-of-arrays mapping; single vs batch input.
- `createOllamaClient` — assert it constructs (succeed); constructor-throw path → `fail` (`captureResult`).

### Layer 2 — fetch-level integration (thin; verifies the real `ollama` wiring)

A small set of tests build a real client via `createOllamaClient({ fetch })` with a **mock `fetch`** returning canned `Response` objects, to verify the package wires the actual `ollama` lib correctly — especially the two things layer 1 stubs over:

- **`/api/pull` JSON-lines parsing** — mock `fetch` returns a `Response` whose body is a `ReadableStream` emitting newline-delimited JSON chunks; assert `pullModel`'s `onProgress` sees each parsed chunk (proves the lib's stream parsing flows through our loop).
- **`/api/chat` `format` on the wire** — assert the request body the mock `fetch` receives actually contains `format: <schema.toJson()>` (proves the no-drift claim end-to-end, not just at the mock-method boundary).

**Fixtures** (checked in under `src/test/unit/fixtures/`): `tags.json`, `show.json`, `ps.json`, `embed.json`, `chat-structured.json`, and a `pull-chunks.jsonl` multi-chunk progress stream.

**No live daemon, no model downloads** — every test runs in CI with zero external dependencies. (This is stricter than transformers, which loads tiny ONNX models from the HF cache; the Ollama boundary can be fully mocked because it's a pure HTTP/data surface.)

---

## 8. Explicitly NOT in scope

Mirroring the WebAuthn/transformers "NOT in scope" discipline — this list is load-bearing.

- **Text completion / free-text chat / streaming chat** → ai-assist owns this via the OpenAI-compat `/v1` path. `@fgv/ts-extras-ollama` does the *native-only* surface; it does not duplicate completions. (Use `callProviderCompletion*` / `executeClientToolTurn` with an `endpoint` override.)
- **Browser / CORS path** → Node-only at v0.1. `ollama/browser` + the sidecar's `OLLAMA_ORIGINS` allowlist is the documented out-of-scope-but-possible path; a future `@fgv/ts-web-extras-ollama` sibling is its home (queued to `docs/FUTURE.md`).
- **Model authoring / publishing** — `push`, `create`, `copy`. Not consumer-driven; use the `ollama` lib directly with `captureAsyncResult`.
- **`keep_alive` / model lifecycle policy** — `keepAlive` is a pass-through param on `chatStructured`/`embed`; the boundary applies no preload/unload policy.
- **Pull-progress UI / rendering** — `onProgress` hands raw chunks to the consumer; formatting a progress bar is consumer policy.
- **Multi-host orchestration / connection pooling / retries / backoff** — one client = one host. Consumers compose multiple clients themselves.
- **Native tool-calling on `/api/chat`** — ai-assist owns tool turns (`executeClientToolTurn`). The native tool path is deferred (no consumer pressure; would overlap ai-assist's surface).
- **`webSearch` / `webFetch` (Ollama cloud)** — out of the local-sidecar story entirely.
- **Low-level `version` / `abort` handles** — use the lib directly (the boundary does accept an `AbortSignal` on `pullModel`).
- **Embedding-store / vector-DB integration, similarity math** — `embed` returns raw vectors; everything downstream is the consumer's.
- **A new `'ollama-native'` `AiApiFormat` in ai-assist** — explicitly rejected by the scoping pass (brief §"Reject: Option C").

---

## 9. Open questions

### Genuinely consumer-dependent — HELD (await first consumer)

| ID | Question | Why it's genuinely held | Lean |
|---|---|---|---|
| OQ-1 | **Does `embed` belong in this package** given `@fgv/ts-extras-transformers` already ships `embed`? | The value is real but consumer-shaped: reusing an **already-pulled GGUF** in a running Ollama sidecar (no second model download, no ONNX runtime) vs. the transformers facade's separate ONNX model. Whether that matters depends on whether the first consumer is *already running Ollama for chat* (then native embed is free) or *only* wants embeddings (then transformers is lighter). | **HELD pending the `ai-assist-embeddings` design (Erik, 2026-06-06) — do NOT build native `embed` here yet.** Ollama embeddings are reachable through `/v1/embeddings`, so a cross-provider ai-assist embedding primitive may subsume or reshape this native `embed`. Design that primitive first; only build native `embed` in this package if that design concludes it adds something `/v1`-through-ai-assist can't (e.g. native `total_duration`/`prompt_eval_count`, or reusing the already-loaded chat model). See the amendment note below. |
| OQ-2 | **`generate`-style structured output** (single-prompt `/api/generate` with `format`) in addition to chat-style `chatStructured`? | `/api/generate` is the non-chat single-prompt endpoint; some consumers prefer it for one-shot extraction. Whether it's worth a second structured primitive depends on whether the first consumer thinks in chat-messages or single-prompts. | **Defer** — `chatStructured` covers the need (a one-message user turn is equivalent); add `generateStructured` only if a consumer wants the leaner single-prompt shape. |
| OQ-3 | **`AbortSignal` on the read/embed/chat primitives** (not just `pullModel`)? | Pull is the obvious long op; whether short ops also need cancellation is consumer-shaped (e.g. a consumer with aggressive request budgets). | **AMENDED (orchestrator review, 2026-06-06): include `AbortSignal` on `chatStructured` AND `pullModel`.** Local grammar-constrained generation is a multi-second *interactive* op, not a "short op" — cancellation (navigate-away, request budget, model switch) is a real need and the mechanism already exists for `pullModel`, so the marginal cost is ~nil. Defer signals only on the genuinely-fast metadata ops (`listModels`/`showModel`/`listRunning`/`deleteModel`) — additive later. |

### Decided (NOT consumer-dependent — locked in this design)

| Decision | §  |
|---|---|
| Wrap the `ollama` JS lib, not direct `fetch`. | 6.1 |
| `ollama` as peer dependency; `@fgv/ts-json-base` as hard dependency. | 6.2 |
| Normalize wire shapes to fgv-owned camelCase `readonly` types; re-export the opaque client type. | 6.3 |
| Node-only at v0.1; browser/CORS as future `@fgv/ts-web-extras-ollama`. | 6.4 |
| 7 primitives + factory; client-first argument convention. | 3 |
| `chatStructured` is non-streaming; `schema.toJson()` ⇄ `schema.validate()` single-source no-drift. | 4 |
| `pullModel` = terminal `Result` + `onProgress` callback (not a returned async-iterable). | 5 |
| Two-layer offline test strategy (structural client mock + fetch-level integration); no live daemon. | 7 |
| `Result<void>` avoided — `deleteModel`/`pullModel` return meaningful values. | 3.3–3.4 |
| `format` sent verbatim at v0.1; **budget a draft-07 sanitizer in O-4** (orchestrator amendment, 2026-06-06) — per the Gemini precedent (`toGeminiParameterSchema` strips `$schema`/`additionalProperties` for its schema subset), `schema.toJson()` very likely needs the same before Ollama's `format` accepts it. The live-testbed pass confirms, but plan for it rather than treating it as a surprise. | 4 |

### Amendment note — orchestrator review (2026-06-06)

Erik reviewed the OQ recommendations and accepted them with these changes:

1. **OQ-3 → include `AbortSignal` on `chatStructured`** (not just `pullModel`). Local structured generation is a multi-second interactive op; cancellation is a real need. Reflected in O-4.
2. **`format` sanitizer → budgeted into O-4** rather than "add only if live testing rejects" — the Gemini precedent strongly implies `schema.toJson()`'s draft-07 keys (`$schema`/`additionalProperties`) need stripping before Ollama accepts `format`.
3. **OQ-1 (`embed`) → HELD, elevated to a prerequisite.** Erik: design a **cross-provider ai-assist embedding primitive *first*** — "we might actually want to build it." Ollama embeddings are reachable via `/v1/embeddings`, so that primitive may subsume native `embed`. This adds a new gate on O-4's embed sub-task (and a new design stream, `ai-assist-embeddings`). The rest of the Ollama B plan (O-1…O-3, O-4 structured-output) is unaffected and proceeds on the existing "after Task A + MCP slice" schedule.

**Updated dependency for O-4's embed sub-task:** Task A + MCP slice land **AND** the `ai-assist-embeddings` design concludes. Forward-looking: a cross-provider embedding primitive in ai-assist would also serve OpenAI/Gemini/Ollama-via-`/v1`, so it should not be entrenched as Ollama-only.

---

## 10. Phased implementation plan

Begins **after** Task A (recipe + capability config → `release`) **and** the MCP slice land. Mirrors the `local-ai-exploration` B-1→B-4 cadence. Sizing: S ≈ ≤0.5 day, M ≈ 1–1.5 days, L ≈ 2 days.

| Phase | Scope | Size | Exit |
|---|---|---|---|
| **O-1 — Scaffold** | Register `libraries/ts-extras-ollama` in `rush.json`; `package.json` (peer `ollama` + `@fgv/ts-utils`, dep `@fgv/ts-json-base`), heft node-rig config, `tsconfig`, `eslint.config.js`, api-extractor, `README` skeleton, empty-but-compilable `index.ts`. `rush add -p ollama` (dev+peer). Mirror the transformers Node-side scaffold exactly. 100% coverage trivially (empty surface). | S | `rush build` + `rushx lint` + `rushx test` green; package registered. |
| **O-2 — Model management (read half)** | `createOllamaClient` factory; normalized types (§3.2); `listModels`, `showModel`, `listRunning`, `deleteModel`; layer-1 structural-mock tests + `tags`/`show`/`ps` fixtures. | M | All four read/delete primitives at 100%; `code-reviewer` pass before coverage closure. |
| **O-3 — Pull with streamed progress** | `pullModel` + `IOllamaPullProgress`/`IOllamaPullResult`/`IPullModelParams`; `onProgress` callback loop inside `captureAsyncResult`; `AbortSignal`; multi-chunk mock generator + layer-2 fetch-level JSON-lines integration test. The trickiest phase — budget review rounds. | M/L | `pullModel` at 100% incl. abort + throwing-callback + mid-stream-error paths; layer-2 JSON-lines test green. |
| **O-4 — Structured output + docs** | `chatStructured<T>` **with `AbortSignal`** (OQ-3) + `JsonSchema` no-drift wiring + layer-2 wire-`format` assertion + **draft-07 `format` sanitizer** (locked-decision note); `LIBRARY_CAPABILITIES.md` entry + decision-shortcuts; README quick-start; cross-link from the ai-assist Ollama recipe (Task A). **`embed` is HELD** (OQ-1) pending the `ai-assist-embeddings` design — add it here only if that design concludes native `embed` belongs in this package. | M | Structured surface at 100%; `code-reviewer` + Copilot loop; caps doc landed. |
| *(future)* **O-5 — Browser sibling** | `@fgv/ts-web-extras-ollama` over `ollama/browser` + `OLLAMA_ORIGINS` doc. Deferred; `docs/FUTURE.md` entry filed at O-4 close. | — | Not in this stream. |

**Aggregate:** ~1 S + 2 M + 1 M/L ≈ 4–5 focused days, matching the research note's "single short stream" sizing for an integration boundary.

---

## Appendix — wire→fgv field mapping reference

| Endpoint | Wire (snake_case) | fgv (camelCase) |
|---|---|---|
| `/api/tags` `.models[]` | `name`, `model`, `modified_at`, `size`, `digest`, `details.{format,family,families,parameter_size,quantization_level,parent_model}` | `IOllamaModel` — `modifiedAt: Date`, `details.parameterSize`, `details.quantizationLevel`, `details.parentModel` |
| `/api/ps` `.models[]` | + `expires_at`, `size_vram` (no `modified_at`) | `IOllamaRunningModel` — `expiresAt: Date`, `sizeVram` |
| `/api/show` | `modelfile`, `parameters`, `template`, `details`, `model_info`, `capabilities` | `IOllamaModelInfo` — `modelInfo`, rest 1:1 |
| `/api/pull` chunk | `status`, `digest?`, `total?`, `completed?` | `IOllamaPullProgress` — 1:1 |
| `/api/chat` resp | `message.content`, `model`, `done_reason?` | `IOllamaChatStructuredResult` — `raw`, `value` (validated), `model`, `doneReason` |
| `/api/embed` resp | `model`, `embeddings`, `total_duration?`, `prompt_eval_count?` | `IOllamaEmbedResult` — `totalDuration`, `promptEvalCount` |
