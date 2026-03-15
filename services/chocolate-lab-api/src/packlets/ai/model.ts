/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Request/response types and converters for the AI completion endpoint.
 * @packageDocumentation
 */

import { type Converter, Converters } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';

// ============================================================================
// Request Types
// ============================================================================

/**
 * Chat message in a completion request.
 * @public
 */
export interface IApiChatMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

/**
 * Prompt content for a completion request.
 * @public
 */
export interface IApiPrompt {
  readonly system: string;
  readonly user: string;
}

/**
 * Request body for `POST /api/ai/completion`.
 * @public
 */
export interface IAiCompletionRequest {
  readonly providerId: AiAssist.AiProviderId;
  readonly apiKey: string;
  readonly prompt: IApiPrompt;
  readonly additionalMessages?: ReadonlyArray<IApiChatMessage>;
  readonly temperature?: number;
  readonly modelOverride?: AiAssist.ModelSpec;
  readonly tools?: ReadonlyArray<AiAssist.AiServerToolConfig>;
}

// ============================================================================
// Converters
// ============================================================================

const chatMessageRole: Converter<'system' | 'user' | 'assistant'> = Converters.enumeratedValue<
  'system' | 'user' | 'assistant'
>(['system', 'user', 'assistant']);

const apiChatMessage: Converter<IApiChatMessage> = Converters.strictObject<IApiChatMessage>({
  role: chatMessageRole,
  content: Converters.string
});

const apiPrompt: Converter<IApiPrompt> = Converters.strictObject<IApiPrompt>({
  system: Converters.string,
  user: Converters.string
});

/**
 * Converter for {@link IAiCompletionRequest}.
 * @public
 */
export const aiCompletionRequest: Converter<IAiCompletionRequest> =
  Converters.strictObject<IAiCompletionRequest>({
    providerId: AiAssist.aiProviderId,
    apiKey: Converters.string,
    prompt: apiPrompt,
    additionalMessages: Converters.arrayOf(apiChatMessage).optional(),
    temperature: Converters.number.optional(),
    modelOverride: AiAssist.modelSpec.optional(),
    tools: Converters.arrayOf(AiAssist.aiServerToolConfig).optional()
  });
