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
import { fail, type Logging, Result, succeed } from '@fgv/ts-utils';

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
 * Makes a JSON POST request and returns the parsed object body, or a failure.
 * Non-2xx responses, network errors, invalid JSON, and non-object JSON bodies
 * are all surfaced as `Result.fail`.
 * @internal
 */
export async function fetchJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<JsonObject>> {
  /* c8 ignore next 1 - optional logger */
  logger?.detail(`AI API request: POST ${url}`);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body),
      signal
    });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    /* c8 ignore next 1 - optional logger */
    logger?.error(`AI API request failed: ${detail}`);
    return fail(`AI API request failed: ${detail}`);
  }

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
