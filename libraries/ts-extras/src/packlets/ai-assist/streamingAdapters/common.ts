// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Shared infrastructure for the per-format streaming adapters: HTTP connection
 * helper, common config and request-params types, and a typed-validation
 * helper for SSE event payloads.
 *
 * @packageDocumentation
 */

import { fail, type Logging, Result, succeed, type Validator } from '@fgv/ts-utils';

import {
  AiPrompt,
  type AiServerToolConfig,
  type IAiProviderDescriptor,
  type IChatMessage,
  type ModelSpec
} from '../model';

/**
 * Parameters for a streaming completion request. Structurally identical to
 * the non-streaming `IProviderCompletionParams`; kept as its own interface
 * so callers can be explicit about which path they're invoking.
 *
 * @public
 */
export interface IProviderCompletionStreamParams {
  /** The provider descriptor */
  readonly descriptor: IAiProviderDescriptor;
  /** API key for authentication */
  readonly apiKey: string;
  /** The structured prompt to send */
  readonly prompt: AiPrompt;
  /**
   * Prior conversation history to insert between the system prompt and the
   * prompt's user message. The new user turn (carried by `prompt.user`) is
   * always sent last, so the wire shape becomes
   * `[system, ...messagesBefore, user=prompt.user]`.
   */
  readonly messagesBefore?: ReadonlyArray<IChatMessage>;
  /** Sampling temperature (default: 0.7) */
  readonly temperature?: number;
  /** Optional model override — string or context-aware map. */
  readonly modelOverride?: ModelSpec;
  /** Optional logger for request/response observability. */
  readonly logger?: Logging.ILogger;
  /** Server-side tools to include in the request. */
  readonly tools?: ReadonlyArray<AiServerToolConfig>;
  /** Optional abort signal for cancelling the in-flight stream. */
  readonly signal?: AbortSignal;
  /**
   * Optional override of the descriptor's default base URL. Same semantics as
   * the non-streaming completion path: a well-formed `http`/`https` URL is
   * substituted for `descriptor.baseUrl` when composing the streaming
   * request, with the per-format suffix appended unchanged. Validated at the
   * dispatcher; auth shape is unaffected.
   */
  readonly endpoint?: string;
}

/**
 * Configuration for a single per-format streaming call: where to POST, what
 * key to authenticate with, and which model to request.
 *
 * @internal
 */
export interface IStreamApiConfig {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly model: string;
}

/**
 * Opens an SSE-style POST connection. Returns the underlying Response on a
 * 2xx; failures (network, non-2xx, missing body) surface as Result.fail
 * carrying the body text.
 *
 * @internal
 */
export async function openSseConnection(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<Response>> {
  /* c8 ignore next 1 - optional logger */
  logger?.detail(`AI streaming request: POST ${url}`);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...headers
      },
      body: JSON.stringify(body),
      signal
    });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    /* c8 ignore next 1 - optional logger */
    logger?.error(`AI streaming request failed: ${detail}`);
    return fail(`AI streaming request failed: ${detail}`);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown error');
    /* c8 ignore next 1 - optional logger */
    logger?.error(`AI streaming API returned ${response.status}: ${errorText}`);
    return fail(`AI streaming API returned ${response.status}: ${errorText}`);
  }
  if (!response.body) {
    return fail('AI streaming API returned an empty body');
  }
  return succeed(response);
}

/**
 * Validates a parsed SSE event payload against a typed shape, returning the
 * validated value or `undefined` if validation fails. Adapters use the
 * `undefined` return to skip unrecognized event shapes — the same lenient
 * behavior the inline casts had, but with a real type-checked path on the
 * happy case.
 *
 * @internal
 */
export function validateEventPayload<T>(json: unknown, validator: Validator<T>): T | undefined {
  const result = validator.validate(json);
  return result.isSuccess() ? result.value : undefined;
}
