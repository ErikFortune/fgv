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
 * Shared fixtures for the `apiClient.*.test.ts` family — the standard prompt,
 * a descriptor factory, `global.fetch` mocks, and one canned response body per
 * provider wire format.
 *
 * @remarks
 * Extracted when `apiClient.test.ts` approached the 2000-line `max-lines` cap.
 */

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiProviderDescriptor } from '../../../packlets/ai-assist/model';

// ============================================================================
// Test helpers
// ============================================================================

export const testPrompt: AiAssist.AiPrompt = new AiAssist.AiPrompt(
  'Generate a recipe',
  'You are a helpful assistant'
);

export function makeDescriptor(overrides: Partial<IAiProviderDescriptor> = {}): IAiProviderDescriptor {
  return {
    id: 'xai-grok',
    label: 'xAI Grok',
    buttonLabel: 'AI Assist | Grok',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-4-1-fast',
    supportedTools: ['web_search'],
    corsRestricted: true,
    acceptsImageInput: true,
    streamingCorsRestricted: false,
    thinkingMode: 'optional',
    ...overrides
  };
}

export function mockFetchResponse(body: unknown, status: number = 200): void {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body))
  };
  (global.fetch as jest.Mock).mockResolvedValue(response);
}

export function mockFetchError(error: Error): void {
  (global.fetch as jest.Mock).mockRejectedValue(error);
}

export function mockFetchHttpError(status: number, errorText: string): void {
  const response = {
    ok: false,
    status,
    text: jest.fn().mockResolvedValue(errorText)
  };
  (global.fetch as jest.Mock).mockResolvedValue(response);
}

// ============================================================================
// OpenAI response helpers
// ============================================================================

export function openAiResponse(content: string, finishReason: string = 'stop'): unknown {
  return {
    choices: [
      {
        message: { content },
        finish_reason: finishReason
      }
    ]
  };
}

// ============================================================================
// Anthropic response helpers
// ============================================================================

export function anthropicResponse(text: string, stopReason: string = 'end_turn'): unknown {
  return {
    content: [{ type: 'text', text }],
    stop_reason: stopReason
  };
}

// ============================================================================
// Gemini response helpers
// ============================================================================

export function geminiResponse(text: string, finishReason: string = 'STOP'): unknown {
  return {
    candidates: [
      {
        content: {
          parts: [{ text }]
        },
        finishReason
      }
    ]
  };
}

// ============================================================================
// Responses API response helpers (xAI/OpenAI with tools)
// ============================================================================

export function responsesApiResponse(text: string, status: string = 'completed'): unknown {
  return {
    output: [
      { type: 'web_search_call', id: 'ws_1', status: 'completed' },
      {
        type: 'message',
        id: 'msg_1',
        role: 'assistant',
        content: [{ type: 'output_text', text }]
      }
    ],
    status
  };
}

// ============================================================================
// Anthropic with tools response helpers
// ============================================================================

/* eslint-disable @typescript-eslint/naming-convention */
export function anthropicWithToolsResponse(text: string): unknown {
  return {
    content: [
      { type: 'text', text: "I'll search for that." },
      { type: 'server_tool_use', id: 'st_1', name: 'web_search', input: { query: 'test' } },
      { type: 'web_search_tool_result', tool_use_id: 'st_1', content: [] },
      { type: 'text', text }
    ],
    stop_reason: 'end_turn'
  };
}
/* eslint-enable @typescript-eslint/naming-convention */
