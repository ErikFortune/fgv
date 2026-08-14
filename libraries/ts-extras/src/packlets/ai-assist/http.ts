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
 * Shared low-level HTTP helpers for the AI-assist provider clients (completion,
 * image generation, embedding). Internal to the packlet.
 * @packageDocumentation
 */

import { isJsonObject, type JsonObject } from '@fgv/ts-json-base';
import { captureAsyncResult, fail, type Logging, Result, succeed } from '@fgv/ts-utils';

/**
 * Internal API configuration built from a provider descriptor.
 * @internal
 */
export interface IAiApiConfig {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly model: string;
}

/**
 * Issue one request and parse a JSON object body, or fail.
 *
 * @remarks
 * The single implementation behind {@link fetchJson}, {@link fetchGetJson} and
 * {@link fetchMultipart} — the three differed *only* in how they built their
 * `RequestInit` and what they logged, and carried byte-identical copies of
 * everything after the `fetch` call. Non-2xx responses, network errors, invalid
 * JSON and non-object JSON bodies are all surfaced as `Result.fail`.
 * @internal
 */
async function _fetchAndParseJson(
  url: string,
  init: RequestInit,
  requestLabel: string,
  logger?: Logging.ILogger
): Promise<Result<JsonObject>> {
  /* c8 ignore next 1 - optional logger */
  logger?.detail(`AI API request: ${requestLabel}`);

  // `captureAsyncResult` normalizes both a synchronous throw and a rejected
  // promise, and its `_errorMessage` is the same `instanceof Error` shaping this
  // used to spell out by hand — so the failure text is unchanged and the
  // defensive `c8 ignore` on the non-Error branch is no longer needed here.
  const fetched: Result<Response> = await captureAsyncResult(() => fetch(url, init)).withErrorFormat(
    (msg) => `AI API request failed: ${msg}`
  );
  if (fetched.isFailure()) {
    /* c8 ignore next 1 - optional logger */
    logger?.error(fetched.message);
    return fail(fetched.message);
  }
  const response: Response = fetched.value;

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown error');
    /* c8 ignore next 1 - optional logger */
    logger?.error(`AI API returned ${response.status}: ${errorText}`);
    return fail(`AI API returned ${response.status}: ${errorText}`);
  }

  /* c8 ignore next 1 - optional logger */
  logger?.detail(`AI API response: ${response.status}`);

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    /* c8 ignore next 1 - optional logger */
    logger?.error('AI API returned invalid JSON response');
    return fail('AI API returned invalid JSON response');
  }

  if (!isJsonObject(json)) {
    /* c8 ignore next 1 - optional logger */
    logger?.error('AI API returned non-object JSON response');
    return fail('AI API returned non-object JSON response');
  }
  return succeed(json);
}

/**
 * Makes a JSON POST request and returns the parsed object body, or a failure.
 * @internal
 */
export async function fetchJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<JsonObject>> {
  return _fetchAndParseJson(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal
    },
    `POST ${url}`,
    logger
  );
}

/**
 * Makes an HTTP GET request and returns the parsed JSON, or a failure.
 * @internal
 */
export async function fetchGetJson(
  url: string,
  headers: Record<string, string>,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<JsonObject>> {
  return _fetchAndParseJson(url, { method: 'GET', headers, signal }, `GET ${url}`, logger);
}

/**
 * Makes a multipart/form-data POST request and returns the parsed JSON, or a
 * failure. The Content-Type header (with boundary) is set automatically by
 * `fetch` from the `FormData` body — callers must NOT pass it explicitly.
 * @internal
 */
export async function fetchMultipart(
  url: string,
  headers: Record<string, string>,
  body: FormData,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<JsonObject>> {
  return _fetchAndParseJson(
    url,
    { method: 'POST', headers, body, signal },
    `POST ${url} (multipart)`,
    logger
  );
}
