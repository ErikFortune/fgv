/**
 * `@fgv/ts-extras-ollama` — Result-integration boundary over the official `ollama` JS library
 * (Node-side).
 *
 * A thin facade that wraps the `ollama` client's native-API calls in `Result<T>` from
 * `@fgv/ts-utils`, mirroring the discipline established by `@fgv/ts-extras-webauthn` and
 * `@fgv/ts-extras-transformers`: one-line `captureResult` / `captureAsyncResult` wrappers around
 * upstream primitives with **no opinionated orchestration** above the boundary.
 *
 * This package owns **exactly and only** the native-Ollama surface that the OpenAI-compatible
 * `/v1` endpoint cannot express: model management (`/api/tags`, `/api/show`, `/api/ps`,
 * `/api/delete`), streamed model pulls (`/api/pull`), and grammar-constrained structured output
 * (`/api/chat` with a full-JSON-schema `format`). The text-completion / streaming / tool-use path
 * is **not** duplicated here — `@fgv/ts-extras/ai-assist` owns it via the `/v1` compat layer
 * (point a provider descriptor's `endpoint` at `http://localhost:11434/v1`).
 *
 * **Explicitly NOT in scope:**
 * - Text completion / free-text chat / streaming chat (ai-assist owns it via `/v1`).
 * - Browser / CORS path (Node-only at v0.1; a future `@fgv/ts-web-extras-ollama` is its home).
 * - Model authoring / publishing (`push`, `create`, `copy`) — use the `ollama` lib directly.
 * - `keep_alive` / model-lifecycle policy — pass-through only, no policy applied.
 * - Pull-progress UI / rendering — `onProgress` hands raw chunks to the consumer.
 * - Multi-host orchestration / connection pooling / retries / backoff — one client = one host.
 *
 * For any of the above, use the `ollama` library directly (with `captureAsyncResult` for your own
 * Result wrapping); the opaque client handle returned by {@link createOllamaClient} is the
 * upstream instance, so nothing this boundary omits is hidden from you.
 *
 * @packageDocumentation
 */

import {
  Ollama,
  type ChatRequest,
  type ListResponse,
  type Message,
  type ModelResponse,
  type ModelDetails,
  type Options,
  type ProgressResponse,
  type ShowResponse
} from 'ollama';
import { captureAsyncResult, captureResult, succeed, type Result } from '@fgv/ts-utils';
import { type JsonObject, type JsonValue, type JsonSchema } from '@fgv/ts-json-base';

/**
 * Construction parameters for an Ollama client. All optional; defaults match the `ollama` JS
 * library (host `http://127.0.0.1:11434`).
 * @public
 */
export interface ICreateOllamaClientParams {
  /** Server address. Defaults to `http://127.0.0.1:11434`. */
  readonly host?: string;
  /**
   * Custom `fetch` implementation. Injecting a fetch is the primary unit-test seam and the hook
   * for a future proxy / browser path.
   */
  readonly fetch?: typeof fetch;
  /** Custom headers included on every request (e.g. an auth token for a guarded sidecar). */
  readonly headers?: Record<string, string>;
}

/**
 * Opaque client handle. Re-export of the upstream `ollama` `Ollama` instance type — consumers
 * retain full access to the upstream API for anything this boundary does not wrap.
 * @public
 */
export type IOllamaClient = Ollama;

/**
 * Constructs an Ollama client. Synchronous (the constructor performs no I/O), so returns
 * `Result<IOllamaClient>` rather than a promise. A malformed `host` (which the upstream
 * constructor rejects) surfaces as `Result.fail`.
 *
 * @param params - Optional {@link ICreateOllamaClientParams}. Omitted fields fall back to the
 *   `ollama` library defaults.
 * @returns `Result<IOllamaClient>` wrapping the upstream `Ollama` instance.
 * @public
 */
export function createOllamaClient(params?: ICreateOllamaClientParams): Result<IOllamaClient> {
  // The upstream `Ollama` constructor reads each config field with `?? <default>`, so omitted or
  // `undefined` fields fall back to the library defaults — no per-field guarding needed.
  return captureResult(() => new Ollama(params ?? {}));
}

// ─── Shared normalized model types (§3.2) ───────────────────────────────────────

/**
 * GGUF / model detail block, common to `/api/tags`, `/api/ps`, and `/api/show`. All fields
 * optional — Ollama omits any it cannot determine.
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
 * A model currently loaded into memory (`/api/ps`). Note `/api/ps` does NOT return
 * `modified_at`, so this does not extend {@link IOllamaModel}.
 * @public
 */
export interface IOllamaRunningModel extends IOllamaModelBase {
  /** When the model will be unloaded, parsed from the RFC3339 wire value. */
  readonly expiresAt: Date;
  /** Bytes resident in VRAM (0 when fully on CPU). */
  readonly sizeVram: number;
}

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

/**
 * Result of a delete. Returns a meaningful value rather than `Result<void>` (per repo standards —
 * `Result<void>` is an anti-pattern).
 * @public
 */
export interface IOllamaDeleteResult {
  /** The model that was deleted. */
  readonly model: string;
  /** Always `true` — a failed delete surfaces as `Result.fail`, never `deleted: false`. */
  readonly deleted: true;
}

// ─── Wire → fgv normalization (§6.3, Appendix) ──────────────────────────────────

/**
 * Maps the upstream snake_case `ModelDetails` to the normalized camelCase {@link IOllamaModelDetail}.
 * Upstream types every field as a required `string`, but Ollama omits fields it cannot determine,
 * so individual values may be `undefined` at runtime — the normalized type reflects that by making
 * every field optional.
 */
function normalizeModelDetail(d: ModelDetails): IOllamaModelDetail {
  return {
    format: d.format,
    family: d.family,
    families: d.families,
    parameterSize: d.parameter_size,
    quantizationLevel: d.quantization_level,
    parentModel: d.parent_model
  };
}

/**
 * Maps a `/api/tags` `ModelResponse` to {@link IOllamaModel}. `modified_at` is normalized to a
 * `Date` via the `Date` constructor, which accepts both the RFC3339 string the wire actually
 * delivers and the `Date` the upstream type (inaccurately) claims.
 */
function normalizeModel(m: ModelResponse): IOllamaModel {
  return {
    name: m.name,
    model: m.model,
    size: m.size,
    digest: m.digest,
    details: normalizeModelDetail(m.details),
    modifiedAt: new Date(m.modified_at)
  };
}

/**
 * Maps a `/api/ps` `ModelResponse` to {@link IOllamaRunningModel}. `/api/ps` returns `expires_at`
 * and `size_vram` in place of `modified_at`.
 */
function normalizeRunningModel(m: ModelResponse): IOllamaRunningModel {
  return {
    name: m.name,
    model: m.model,
    size: m.size,
    digest: m.digest,
    details: normalizeModelDetail(m.details),
    expiresAt: new Date(m.expires_at),
    sizeVram: m.size_vram
  };
}

/**
 * Normalizes the `model_info` metadata bag. The upstream type annotates it as `Map<string, any>`,
 * but the lib returns `response.json()` verbatim, so the wire delivers a plain JSON object (or
 * omits the field). The single `as unknown as` bridge reconciles the inaccurate upstream annotation
 * with the actual JSON shape — there is no untyped input to validate here.
 */
function normalizeModelInfo(
  raw: ShowResponse['model_info']
): Readonly<Record<string, JsonValue>> | undefined {
  if (raw === undefined) {
    return undefined;
  }
  return raw as unknown as Readonly<Record<string, JsonValue>>;
}

/**
 * Maps a `/api/show` `ShowResponse` to {@link IOllamaModelInfo}. The remaining `ShowResponse`
 * fields (`license`, `system`, `messages`, `modified_at`, `projector_info`) are intentionally not
 * carried through — they are out of scope for the v0.1 surface.
 */
function normalizeShowResponse(r: ShowResponse): IOllamaModelInfo {
  return {
    modelfile: r.modelfile,
    parameters: r.parameters,
    template: r.template,
    details: normalizeModelDetail(r.details),
    modelInfo: normalizeModelInfo(r.model_info),
    capabilities: r.capabilities
  };
}

// ─── Model management primitives (§3.3) ─────────────────────────────────────────

/**
 * Lists models in the local store (`GET /api/tags`). Each entry is normalized to
 * {@link IOllamaModel} (camelCase, `modifiedAt` as a `Date`).
 *
 * @param client - A client from {@link createOllamaClient}.
 * @returns `Promise<Result<ReadonlyArray<IOllamaModel>>>`; upstream / transport errors are captured
 *   as `Failure`.
 * @public
 */
export async function listModels(client: IOllamaClient): Promise<Result<ReadonlyArray<IOllamaModel>>> {
  return captureAsyncResult(async () => {
    const response: ListResponse = await client.list();
    return response.models.map(normalizeModel);
  });
}

/**
 * Lists models currently loaded into memory (`GET /api/ps`). Each entry is normalized to
 * {@link IOllamaRunningModel} (camelCase, `expiresAt` as a `Date`, `sizeVram` in bytes).
 *
 * @param client - A client from {@link createOllamaClient}.
 * @returns `Promise<Result<ReadonlyArray<IOllamaRunningModel>>>`; upstream / transport errors are
 *   captured as `Failure`.
 * @public
 */
export async function listRunning(
  client: IOllamaClient
): Promise<Result<ReadonlyArray<IOllamaRunningModel>>> {
  return captureAsyncResult(async () => {
    const response: ListResponse = await client.ps();
    return response.models.map(normalizeRunningModel);
  });
}

/**
 * Full model detail, capabilities, parameters, and template (`POST /api/show`), normalized to
 * {@link IOllamaModelInfo}.
 *
 * @param client - A client from {@link createOllamaClient}.
 * @param model - The model name to inspect, e.g. `'llama3.1:8b'`.
 * @param options - Optional flags. `verbose: true` requests the full low-level `model_info` block.
 * @returns `Promise<Result<IOllamaModelInfo>>`; upstream / transport errors (e.g. unknown model)
 *   are captured as `Failure`.
 * @public
 */
export async function showModel(
  client: IOllamaClient,
  model: string,
  options?: { readonly verbose?: boolean }
): Promise<Result<IOllamaModelInfo>> {
  return captureAsyncResult(async () => {
    // `verbose` is a valid `/api/show` body field that the lib forwards verbatim, but the upstream
    // `ShowRequest` type omits it; building it as a non-literal object passes it through without a
    // cast (and omits the key entirely when no flag was supplied).
    const request = { model, ...(options?.verbose !== undefined && { verbose: options.verbose }) };
    const response: ShowResponse = await client.show(request);
    return normalizeShowResponse(response);
  });
}

/**
 * Deletes a model from the local store (`DELETE /api/delete`). Returns a meaningful
 * {@link IOllamaDeleteResult} rather than `Result<void>`.
 *
 * @param client - A client from {@link createOllamaClient}.
 * @param model - The model name to delete.
 * @returns `Promise<Result<IOllamaDeleteResult>>`; a missing model or transport error surfaces as
 *   `Failure`.
 * @public
 */
export async function deleteModel(
  client: IOllamaClient,
  model: string
): Promise<Result<IOllamaDeleteResult>> {
  return captureAsyncResult(async () => {
    await client.delete({ model });
    return { model, deleted: true };
  });
}

// ─── Pull with streamed progress (§3.4, §5) ─────────────────────────────────────

/**
 * A single progress chunk from a streamed pull (`/api/pull`). Ollama emits a JSON-lines stream;
 * each line is one of these. Fields map 1:1 from the upstream `ProgressResponse`; the layer fields
 * (`digest`/`total`/`completed`) are `undefined` on the manifest / verify / write phases.
 * @public
 */
export interface IOllamaPullProgress {
  /**
   * Phase string, e.g. `'pulling manifest'`, `'pulling <digest>'`, `'verifying sha256 digest'`,
   * `'writing manifest'`, `'success'`.
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
 * Terminal result of a completed pull. Returns a meaningful value (not `Result<void>`): the final
 * status plus a count of progress chunks observed.
 * @public
 */
export interface IOllamaPullResult {
  /** The model that was pulled. */
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
   * Progress callback, invoked once per JSON-lines chunk as it arrives. The `Result` returned by
   * {@link pullModel} resolves only after the stream terminates; progress is surfaced here in the
   * interim. A throw from this callback fails the whole pull (it runs inside the captured loop).
   */
  readonly onProgress?: (progress: IOllamaPullProgress) => void;
  /**
   * Abort signal. Cancels the in-flight pull; the upstream stream throws an `AbortError`, which
   * surfaces as `Result.fail`. An already-aborted signal cancels immediately.
   */
  readonly signal?: AbortSignal;
}

/**
 * Maps an upstream `ProgressResponse` chunk to {@link IOllamaPullProgress}. The upstream type marks
 * every field required, but the layer fields are omitted (and thus `undefined` at runtime) on the
 * non-transfer phases — a direct structural copy preserves that, matching the optional fields.
 */
function normalizePullProgress(c: ProgressResponse): IOllamaPullProgress {
  return {
    status: c.status,
    digest: c.digest,
    total: c.total,
    completed: c.completed
  };
}

/**
 * Pulls a model with streamed progress (`POST /api/pull`). Drives the upstream JSON-lines stream
 * internally, invoking `params.onProgress` once per chunk, and resolves the `Result` once the
 * stream terminates. Any upstream error — connection drop, registry 404, abort, or a throwing
 * `onProgress` — becomes a single `Failure`; success returns a meaningful {@link IOllamaPullResult}
 * rather than `Result<void>`.
 *
 * @param client - A client from {@link createOllamaClient}.
 * @param params - {@link IPullModelParams} — the model, optional `insecure` flag, optional
 *   `onProgress` callback, and optional `AbortSignal`.
 * @returns `Promise<Result<IOllamaPullResult>>`.
 * @public
 */
export async function pullModel(
  client: IOllamaClient,
  params: IPullModelParams
): Promise<Result<IOllamaPullResult>> {
  return captureAsyncResult(async () => {
    const request = {
      model: params.model,
      stream: true as const,
      ...(params.insecure !== undefined && { insecure: params.insecure })
    };
    const iterator = await client.pull(request);

    // Wire the abort signal to the upstream iterator's abort path. An already-aborted signal
    // cancels immediately; otherwise abort on first fire (and clean the listener up in `finally`).
    const abortListener = (): void => iterator.abort();
    if (params.signal !== undefined) {
      if (params.signal.aborted) {
        iterator.abort();
      } else {
        params.signal.addEventListener('abort', abortListener, { once: true });
      }
    }

    let chunkCount = 0;
    let finalStatus = '';
    try {
      for await (const chunk of iterator) {
        params.onProgress?.(normalizePullProgress(chunk));
        chunkCount += 1;
        finalStatus = chunk.status;
      }
    } finally {
      params.signal?.removeEventListener('abort', abortListener);
    }

    return { model: params.model, finalStatus, chunkCount };
  });
}

// ─── Grammar-constrained structured output (§3.5, §4) ───────────────────────────

/**
 * A chat message in Ollama native shape.
 * @public
 */
export interface IOllamaChatMessage {
  /** The message role. */
  readonly role: 'system' | 'user' | 'assistant' | 'tool';
  /** The message text. */
  readonly content: string;
  /** Base64 image data for vision models (no `data:` prefix). */
  readonly images?: ReadonlyArray<string>;
}

/**
 * Result of a grammar-constrained structured chat. Carries both the validated typed value and the
 * raw JSON text the model emitted, for diagnostics.
 * @public
 */
export interface IOllamaChatStructuredResult<T> {
  /** The parsed-and-validated value (validated by the same schema sent on the wire). */
  readonly value: T;
  /** The raw `message.content` JSON string the model emitted (assembled across stream chunks). */
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
  /** The model to chat with, e.g. `'llama3.1:8b'`. */
  readonly model: string;
  /** The conversation so far. */
  readonly messages: ReadonlyArray<IOllamaChatMessage>;
  /**
   * The single source of truth for both the wire schema (`schema.toJson()`, sent as the native
   * `format` field) and the result validator (`schema.validate()`). Author with
   * `JsonSchema.object(...)` from `@fgv/ts-json-base`; `T` is derived via
   * `JsonSchema.Static<typeof schema>`. A runtime-discovered (MCP) schema parsed via
   * `JsonSchema.fromJson(raw)` also works — its `T` is `JsonValue`.
   */
  readonly schema: JsonSchema.ISchemaValidator<T>;
  /** Native Ollama `options` (temperature, num_ctx, seed, …). Passed verbatim. */
  readonly options?: Readonly<Record<string, JsonValue>>;
  /** Native `keep_alive` (duration string or seconds). Passed verbatim — no policy applied. */
  readonly keepAlive?: string | number;
  /**
   * Abort signal. Cancels the in-flight generation; the upstream stream throws an `AbortError`,
   * which surfaces as `Result.fail`. An already-aborted signal cancels immediately.
   */
  readonly signal?: AbortSignal;
}

/**
 * Recursively removes the JSON-Schema keywords (`$schema`, `additionalProperties`) — *if present*
 * — that Ollama's `format` does not need. `JsonSchema.object(...).toJson()` emits
 * `additionalProperties: false` on object nodes; `$schema` is not added by default but may appear
 * on a runtime-discovered schema (`JsonSchema.fromJson(raw)`). Mirrors the ai-assist Gemini
 * precedent (`toGeminiParameterSchema`): the keywords are removed only where they appear as schema
 * *keywords* (siblings of `type`/`properties`/…). Inside a `properties` map the keys are
 * user-defined property names, not keywords, so they are preserved verbatim while each property's
 * subschema value is still recursively sanitized. Stripping is infallible, so it returns a plain
 * value rather than a `Result`.
 */
function sanitizeFormatSchema(schema: JsonValue): JsonValue {
  if (Array.isArray(schema)) {
    return schema.map(sanitizeFormatSchema);
  }
  if (schema !== null && typeof schema === 'object') {
    const out: JsonObject = {};
    for (const [key, value] of Object.entries(schema)) {
      if (key === '$schema' || key === 'additionalProperties') {
        continue;
      }
      if (key === 'properties' && value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const properties: JsonObject = {};
        for (const [name, propSchema] of Object.entries(value)) {
          properties[name] = sanitizeFormatSchema(propSchema);
        }
        out[key] = properties;
      } else {
        out[key] = sanitizeFormatSchema(value);
      }
    }
    return out;
  }
  return schema;
}

/**
 * Maps an {@link IOllamaChatMessage} to the upstream `Message` wire shape, copying the optional
 * base64 `images` array only when present.
 */
function toWireMessage(message: IOllamaChatMessage): Message {
  return {
    role: message.role,
    content: message.content,
    ...(message.images !== undefined && { images: [...message.images] })
  };
}

/**
 * Single-turn grammar-constrained structured chat (`POST /api/chat` with `format` = full JSON
 * schema). The fidelity win over ai-assist's prompt-and-parse path is **grammar-constrained
 * sampling**: Ollama restricts the token sampler to the supplied schema, so the response is
 * structurally guaranteed to match.
 *
 * The schema is the single source of truth: `schema.toJson()` (draft-07-sanitized) is sent as the
 * wire `format`, and the same `schema.validate()` checks the reply — they cannot drift. `T` flows
 * end-to-end from `JsonSchema.Static<typeof schema>`; no caller-supplied `T`, no cast.
 *
 * Runs over the streaming chat path internally, assembling the full document from the stream
 * chunks and validating it whole — partial JSON has no validation value. (The design §4 sketch
 * said `stream: false`, but the locked OQ-3 amendment requires an `AbortSignal`, and the `ollama`
 * lib only threads a signal on the streaming path — its non-streaming request has no signal
 * plumbing. The streaming `AbortableAsyncIterator.abort()` is "the mechanism that already exists
 * for `pullModel`".) Any upstream error, abort, parse failure, or validation failure surfaces as a
 * single `Failure` with context.
 *
 * @param client - A client from {@link createOllamaClient}.
 * @param params - {@link IChatStructuredParams} — model, messages, the `JsonSchema` schema, and
 *   optional `options` / `keepAlive` / `signal`.
 * @returns `Promise<Result<IOllamaChatStructuredResult<T>>>`.
 * @public
 */
export async function chatStructured<T>(
  client: IOllamaClient,
  params: IChatStructuredParams<T>
): Promise<Result<IOllamaChatStructuredResult<T>>> {
  const accumulated = await captureAsyncResult(async () => {
    const wireFormat = sanitizeFormatSchema(params.schema.toJson());
    const request: ChatRequest & { stream: true } = {
      model: params.model,
      messages: params.messages.map(toWireMessage),
      // The wire schema accepts a plain object; the lib types `format` as `string | object`.
      format: wireFormat as object,
      stream: true,
      // The lib types `options` narrowly as `Partial<Options>`, but the native API accepts an
      // arbitrary option bag forwarded verbatim — bridge the (overly narrow) upstream type.
      ...(params.options !== undefined && { options: params.options as unknown as Partial<Options> }),
      ...(params.keepAlive !== undefined && { keep_alive: params.keepAlive })
    };
    const iterator = await client.chat(request);

    const abortListener = (): void => iterator.abort();
    if (params.signal !== undefined) {
      if (params.signal.aborted) {
        iterator.abort();
      } else {
        params.signal.addEventListener('abort', abortListener, { once: true });
      }
    }

    let raw = '';
    let model = params.model;
    let doneReason: string | undefined;
    try {
      for await (const chunk of iterator) {
        raw += chunk.message.content;
        model = chunk.model;
        if (chunk.done) {
          doneReason = chunk.done_reason;
        }
      }
    } finally {
      params.signal?.removeEventListener('abort', abortListener);
    }
    return { raw, model, doneReason };
  });

  return accumulated.onSuccess(({ raw, model, doneReason }) =>
    captureResult(() => JSON.parse(raw) as unknown)
      .withErrorFormat(
        (message) => `chatStructured(${params.model}): response was not valid JSON: ${message}`
      )
      .onSuccess((parsed) =>
        params.schema
          .validate(parsed)
          .withErrorFormat(
            (message) => `chatStructured(${params.model}): response failed schema validation: ${message}`
          )
          .onSuccess((value) => succeed({ value, raw, model, doneReason }))
      )
  );
}
