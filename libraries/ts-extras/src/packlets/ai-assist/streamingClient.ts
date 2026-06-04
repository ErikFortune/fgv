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
 * Streaming chat completion client. Public façade over the per-format
 * adapters under `streamingAdapters/`: provider dispatch and pre-flight
 * validation live here; format-specific request/translation logic and the
 * typed event-payload validators live with each adapter.
 *
 * @packageDocumentation
 */

import { fail, Result } from '@fgv/ts-utils';

import { resolveEffectiveBaseUrl } from './endpoint';
import { type IAiStreamEvent, resolveModel } from './model';
import { callAnthropicStream } from './streamingAdapters/anthropic';
import { type IProviderCompletionStreamParams, type IStreamApiConfig } from './streamingAdapters/common';
import { callGeminiStream } from './streamingAdapters/gemini';
import { callOpenAiChatStream } from './streamingAdapters/openaiChat';
import { callOpenAiResponsesStream } from './streamingAdapters/openaiResponses';
import {
  checkTemperatureConflict,
  mergeThinkingConfig,
  providerDiscriminatorForId,
  type IResolvedThinkingConfig
} from './thinkingOptionsResolver';

export { callProxiedCompletionStream } from './streamingAdapters/proxy';
export type { IProviderCompletionStreamParams } from './streamingAdapters/common';

/**
 * Re-export `executeClientToolTurn` from the continuation builder so callers
 * can import it directly from the streaming-client surface.
 *
 * @remarks
 * **Why `clientTools` does not flow through `callProviderCompletionStream`:**
 * Client tools require a stateful per-stream accumulation buffer (for thinking
 * blocks, tool-use args, Gemini functionCall accumulation) that is owned by the
 * continuation builder's execution context. Passing `clientTools` through the
 * generic `callProviderCompletionStream` entry would require the caller to manage
 * the accumulation buffer externally. `executeClientToolTurn` is therefore the
 * canonical (and only) call path for client tools in Phase C. Callers that need
 * both server tools and client tools in the same request should use
 * `executeClientToolTurn` with both `tools` (server) and `clientTools` present;
 * `callProviderCompletionStream` is for server-tools-only or no-tools requests.
 */
/* c8 ignore next 5 - barrel re-export; function is covered by clientToolContinuationBuilder tests */
export {
  executeClientToolTurn,
  type IExecuteClientToolTurnParams,
  type IExecuteClientToolTurnResult
} from './streamingAdapters/clientToolContinuationBuilder';

/**
 * Calls the appropriate streaming chat completion API for a given provider.
 *
 * @remarks
 * Pre-flight rejection: when `descriptor.streamingCorsRestricted === true`
 * and the call isn't being routed through a proxy, this returns
 * `Result.fail` before fetch is invoked. Callers should route through
 * {@link AiAssist.callProxiedCompletionStream} or surface the failure to the user.
 *
 * Connection-time failures (auth, network, non-2xx) surface as the outer
 * `Result.fail`. Once iteration begins, errors mid-stream surface as a
 * terminal error event ({@link AiAssist.IAiStreamError}) followed by the iterable
 * ending. The final successful event is {@link AiAssist.IAiStreamDone}.
 *
 * @param params - Request parameters including descriptor, API key, prompt, and optional tools
 * @returns A streaming iterable of unified events, or a Result.fail
 * @public
 */
export async function callProviderCompletionStream(
  params: IProviderCompletionStreamParams
): Promise<Result<AsyncIterable<IAiStreamEvent>>> {
  const {
    descriptor,
    apiKey,
    prompt,
    messagesBefore,
    temperature,
    modelOverride,
    logger,
    tools,
    signal,
    endpoint,
    thinking
  } = params;

  const baseUrlResult = resolveEffectiveBaseUrl(descriptor, endpoint);
  if (baseUrlResult.isFailure()) {
    return fail(baseUrlResult.message);
  }
  if (descriptor.streamingCorsRestricted) {
    return fail(`provider "${descriptor.id}" requires a proxy for streaming; none is configured`);
  }
  if (prompt.attachments.length > 0 && !descriptor.acceptsImageInput) {
    return fail(`provider "${descriptor.id}" does not accept image input`);
  }

  const hasTools = tools !== undefined && tools.length > 0;
  const discriminator = providerDiscriminatorForId(descriptor.id);
  const hasThinkingConfig =
    discriminator !== undefined &&
    (thinking?.effort !== undefined ||
      thinking?.providers?.some((b) => b.provider === 'other' || b.provider === discriminator) === true);
  const modelContext = hasThinkingConfig ? 'thinking' : hasTools ? 'tools' : undefined;

  const model = resolveModel(modelOverride ?? descriptor.defaultModel, modelContext);
  if (model.length === 0) {
    return fail(
      `provider "${descriptor.id}": no model resolved; pass modelOverride or set descriptor.defaultModel`
    );
  }

  let resolvedThinking: IResolvedThinkingConfig | undefined;
  if (thinking !== undefined) {
    if (discriminator !== undefined) {
      const mergeResult = mergeThinkingConfig(thinking, model, discriminator);
      /* c8 ignore next 3 - mergeThinkingConfig always succeeds; defensive guard */
      if (mergeResult.isFailure()) {
        return fail(mergeResult.message);
      }
      resolvedThinking = mergeResult.value;
      const conflictResult = checkTemperatureConflict(resolvedThinking, discriminator, temperature);
      if (conflictResult.isFailure()) {
        return fail(conflictResult.message);
      }
    }
  }

  const effectiveTemperature = temperature ?? 0.7;

  const config: IStreamApiConfig = {
    baseUrl: baseUrlResult.value,
    apiKey,
    model
  };

  switch (descriptor.apiFormat) {
    case 'openai':
      if (hasTools) {
        return callOpenAiResponsesStream(
          config,
          prompt,
          tools,
          messagesBefore,
          effectiveTemperature,
          logger,
          signal,
          resolvedThinking
        );
      }
      return callOpenAiChatStream(
        config,
        prompt,
        messagesBefore,
        effectiveTemperature,
        logger,
        signal,
        resolvedThinking
      );
    case 'anthropic':
      return callAnthropicStream(
        config,
        prompt,
        messagesBefore,
        effectiveTemperature,
        tools,
        logger,
        signal,
        resolvedThinking
      );
    case 'gemini':
      return callGeminiStream(
        config,
        prompt,
        messagesBefore,
        effectiveTemperature,
        tools,
        logger,
        signal,
        resolvedThinking
      );
    /* c8 ignore next 4 - defensive coding: exhaustive switch guaranteed by TypeScript */
    default: {
      const _exhaustive: never = descriptor.apiFormat;
      return fail(`unsupported API format: ${String(_exhaustive)}`);
    }
  }
}
