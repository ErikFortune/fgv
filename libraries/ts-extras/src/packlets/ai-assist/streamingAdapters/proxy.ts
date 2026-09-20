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
 * **It carries the four completion-path events, not the whole union.**
 * `text-delta`, `tool-event`, `done` and `error` pass through; the three
 * `client-tool-*` dispatch events are not recognized and are dropped. That is a
 * real limit rather than an oversight: `executeClientToolTurn` has no proxied
 * entry point, so nothing produces those events on this path, and forwarding a
 * vocabulary no caller can reach would be dead code. A proxy implementor reading
 * this contract should not emit them.
 *
 * @packageDocumentation
 */

import { fail, Result, succeed, type Validator, Validators } from '@fgv/ts-utils';

import { normalizeOutboundMessages, splitChatRequest } from '../chatRequestBuilders';
import { type IAiStreamEvent, type ModelSpec, resolveProviderModel } from '../model';
import { parseSseEventJson, readSseEvents } from '../sseParser';
import { IProviderCompletionStreamParams, openSseConnection, validateEventPayload } from './common';

// ============================================================================
// Event payload shape — a tagged-event envelope
// ============================================================================

/**
 * The event types this adapter recognizes — deliberately the four completion-path
 * events, not all seven members of `IAiStreamEvent`.
 *
 * @remarks
 * The omitted three are the `client-tool-*` dispatch events. `IAiStreamEvent`'s own
 * docstring tells exhaustive switches over that union to be updated in lockstep
 * when those variants were added; this one is a deliberate exception, and saying so
 * here is the difference between a documented boundary and a switch someone forgot.
 * Revisit together with a proxied client-tool entry point, not before — see
 * `docs/FUTURE.md`, "A browser story for client-tool turns".
 * @internal
 */
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
      /* c8 ignore next 3 - defensive: malformed SSE events skipped */
      if (json === undefined) {
        continue;
      }
      const envelope = validateEventPayload(json, proxyEventEnvelope);
      // Reachable, not defensive: any event whose `type` is outside
      // `proxyEventTypes` lands here, which includes the three `client-tool-*`
      // variants a proxy might emit from a vocabulary this path does not carry.
      // It previously claimed to be unreachable defensive code, so the coverage
      // gate reported clean on the one branch that silently discards data.
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
 *   **Only `text-delta`, `tool-event`, `done` and `error` are carried** — an event
 *   of any other type, including the three `client-tool-*` variants, is discarded
 *   without error. Client-tool turns are not proxiable; `executeClientToolTurn`
 *   has no proxied entry point.
 * - Error response (when the proxy can't even start): JSON `{error: string}`
 *   with a non-2xx status, surfaced as `proxy: ${error}`.
 *
 * Two request parameters are handled before the body is composed, identically to
 * `callProxiedCompletion`: `tier` is resolved here and sent as a concrete
 * `modelOverride`, so a proxy needs no `tier` vocabulary; `endpoint` is refused,
 * because a proxy cannot confirm it honored it and reaching the provider's default
 * upstream instead would send the request somewhere the caller excluded.
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
  const {
    descriptor,
    apiKey,
    system,
    messages,
    temperature,
    modelOverride,
    logger,
    tools,
    signal,
    thinking,
    maxTokens,
    tier,
    endpoint
  } = params;

  // Enforce the same unified-request invariants the direct entry points apply
  // (non-empty messages, trailing user turn) so an invalid request fails fast
  // here rather than diverging at the proxy.
  const splitResult = splitChatRequest(system, messages);
  if (splitResult.isFailure()) {
    return fail(splitResult.message);
  }
  if (splitResult.value.prompt.attachments.length > 0 && !descriptor.acceptsImageInput) {
    return fail(`provider "${descriptor.id}" does not accept image input`);
  }

  // `tier` and `endpoint` are handled exactly as `callProxiedCompletion` handles them,
  // and for the same reasons — see the comments there. Briefly: the tier resolves on
  // this side because the descriptor holding both halves of the resolution is already
  // here, and the concrete model rides the existing `modelOverride` field, so a proxy
  // that predates tiers still honors one. `endpoint` cannot resolve here, has never
  // been sent, and forwarding it would be unverifiable, so it is refused rather than
  // dropped.
  if (endpoint !== undefined) {
    return fail(
      `callProxiedCompletionStream: endpoint is not supported on the proxied path — a proxy ` +
        `cannot confirm it honored it, and silently reaching the provider's default ` +
        `upstream would send the request somewhere the caller excluded. Use ` +
        `callProviderCompletionStream, or route the proxy itself at the intended upstream.`
    );
  }

  let effectiveModelOverride: ModelSpec | undefined = modelOverride;
  if (tier !== undefined) {
    const tierResult = resolveProviderModel(descriptor, modelOverride, tier);
    if (tierResult.isFailure()) {
      return fail(tierResult.message);
    }
    effectiveModelOverride = tierResult.value;
  }

  const body: Record<string, unknown> = {
    providerId: descriptor.id,
    apiKey,
    messages: normalizeOutboundMessages(splitResult.value),
    stream: true
  };
  // Temperature is forwarded only when explicitly provided, matching the direct path — the proxy
  // omits it from the upstream request so the provider default applies.
  if (temperature !== undefined) {
    body.temperature = temperature;
  }
  if (system !== undefined) {
    body.system = system;
  }
  if (effectiveModelOverride !== undefined) {
    body.modelOverride = effectiveModelOverride;
  }
  if (tools && tools.length > 0) {
    body.tools = tools;
  }
  if (thinking !== undefined) {
    body.thinking = thinking;
  }
  // Forwarded only when explicitly provided; the proxy is responsible for mapping it to the
  // correct upstream provider field (see AiAssist.usesMaxCompletionTokensField).
  if (maxTokens !== undefined) {
    body.maxTokens = maxTokens;
  }

  /* c8 ignore next 1 - optional logger */
  logger?.info(`AI streaming proxy request: provider=${descriptor.id}, proxy=${proxyUrl}`);

  const url = `${proxyUrl}/api/ai/completion-stream`;
  const conn = await openSseConnection(url, {}, body, logger, signal);
  return conn.onSuccess((response) => succeed(translateProxyStream(response)));
}
