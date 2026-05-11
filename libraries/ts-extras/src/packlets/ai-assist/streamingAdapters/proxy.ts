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
 * Streaming adapter for a caller-provided proxy server. Unlike the
 * provider-specific adapters, the proxy speaks our own unified vocabulary
 * directly: each `data:` line is a JSON-serialized {@link AiAssist.IAiStreamEvent},
 * so this adapter only validates the event-type discriminator and forwards.
 *
 * @packageDocumentation
 */

import { Result, succeed, type Validator, Validators } from '@fgv/ts-utils';

import { type IAiStreamEvent } from '../model';
import { parseSseEventJson, readSseEvents } from '../sseParser';
import { IProviderCompletionStreamParams, openSseConnection, validateEventPayload } from './common';

// ============================================================================
// Event payload shape — a tagged-event envelope
// ============================================================================

type ProxyEventType = 'text-delta' | 'tool-event' | 'done' | 'error';

/**
 * Minimal envelope used to identify and discriminate proxy events. Once the
 * `type` is recognized, the event is forwarded as-is — the unified shape is
 * the proxy contract, so there's no further per-type validation here.
 *
 * @internal
 */
interface IProxyEventEnvelope {
  readonly type: ProxyEventType;
}

const proxyEventTypes: ReadonlyArray<ProxyEventType> = ['text-delta', 'tool-event', 'done', 'error'];

const proxyEventEnvelope: Validator<IProxyEventEnvelope> = Validators.object<IProxyEventEnvelope>({
  type: Validators.enumeratedValue<ProxyEventType>(proxyEventTypes)
});

// ============================================================================
// Stream translator
// ============================================================================

/**
 * Translates a proxied SSE stream back into {@link AiAssist.IAiStreamEvent} objects.
 * Validation is limited to the type discriminator; the proxy is contractually
 * required to emit shape-correct unified events.
 *
 * @internal
 */
async function* translateProxyStream(response: Response): AsyncGenerator<IAiStreamEvent> {
  try {
    /* c8 ignore next - body is non-null at this point per openSseConnection */
    if (!response.body) return;
    for await (const message of readSseEvents(response.body)) {
      const json = parseSseEventJson(message.data);
      if (json === undefined) {
        /* c8 ignore start - defensive: malformed SSE events skipped */ continue;
      } /* c8 ignore stop */
      const envelope = validateEventPayload(json, proxyEventEnvelope);
      if (!envelope) {
        continue;
      }
      const event = json as IAiStreamEvent;
      yield event;
      if (envelope.type === 'done' || envelope.type === 'error') {
        return;
      }
    }
  } catch (err: unknown) /* c8 ignore start - defensive: stream errors are always Error instances */ {
    yield { type: 'error', message: err instanceof Error ? err.message : String(err) };
  } /* c8 ignore stop */
}

// ============================================================================
// Public entry point
// ============================================================================

/**
 * Calls the streaming chat endpoint on a proxy server instead of calling
 * the provider directly from the browser.
 *
 * @remarks
 * Proxy contract:
 * - Endpoint: `POST ${proxyUrl}/api/ai/completion-stream`
 * - Request body: same JSON as `/api/ai/completion` plus `"stream": true`
 * - Response: `Content-Type: text/event-stream`; body is the unified
 *   {@link AiAssist.IAiStreamEvent} JSON-serialized one event per SSE `data:` line
 *   (no `event:` line needed since the type discriminator is in the JSON).
 * - Error response (when the proxy can't even start): JSON `{error: string}`
 *   with a non-2xx status, surfaced as `proxy: ${error}`.
 *
 * The proxy server is responsible for opening the upstream SSE connection,
 * translating provider-native events to the unified vocabulary, and
 * forwarding events as they arrive (no buffering). The library does not
 * ship a proxy implementation.
 *
 * @public
 */
export async function callProxiedCompletionStream(
  proxyUrl: string,
  params: IProviderCompletionStreamParams
): Promise<Result<AsyncIterable<IAiStreamEvent>>> {
  const { descriptor, apiKey, prompt, messagesBefore, temperature, modelOverride, logger, tools, signal } =
    params;

  const promptBody: Record<string, unknown> = { system: prompt.system, user: prompt.user };
  if (prompt.attachments.length > 0) {
    promptBody.attachments = prompt.attachments;
  }
  const body: Record<string, unknown> = {
    providerId: descriptor.id,
    apiKey,
    prompt: promptBody,
    /* c8 ignore next 1 - defensive: temperature always uses default 0.7 in proxy streaming tests */
    temperature: temperature ?? 0.7,
    stream: true
  };
  if (messagesBefore && messagesBefore.length > 0) {
    body.messagesBefore = messagesBefore;
  }
  if (modelOverride !== undefined) {
    body.modelOverride = modelOverride;
  }
  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  /* c8 ignore next 1 - optional logger */
  logger?.info(`AI streaming proxy request: provider=${descriptor.id}, proxy=${proxyUrl}`);

  const url = `${proxyUrl}/api/ai/completion-stream`;
  const conn = await openSseConnection(url, {}, body, logger, signal);
  return conn.onSuccess((response) => succeed(translateProxyStream(response)));
}
