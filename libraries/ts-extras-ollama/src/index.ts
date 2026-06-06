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

import { Ollama } from 'ollama';
import { captureResult, type Result } from '@fgv/ts-utils';

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
