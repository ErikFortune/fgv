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
 * Antagonist torture tests — target class 7 (ai-assist-antagonist phase 2):
 * Gemini `web_search` x function-calling mutual exclusion.
 *
 * Gemini's `generateContent` HTTP-400s (`INVALID_ARGUMENT`) when built-in
 * grounding (mapped from `web_search` to `google_search`) and function calling
 * (`function_declarations`, from client tools) are combined in the same request.
 * Phase 2 surfaced that ai-assist had NO pre-flight guard — the combination was
 * serialized straight to the wire. This suite locks in the guard added in
 * response: `executeClientToolTurn` fails fast (before any network call) with a
 * clear message, and the pure `hasGeminiToolConflict` predicate is exercised
 * across every branch of the conflict rule.
 */

import '@fgv/ts-utils-jest';

import { succeed } from '@fgv/ts-utils';
import { JsonSchema } from '@fgv/ts-json-base';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  executeClientToolTurn,
  hasGeminiToolConflict
} from '../../../packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type {
  AiServerToolConfig,
  IAiClientTool,
  IAiProviderDescriptor
} from '../../../packlets/ai-assist/model';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { AiPrompt } from '../../../packlets/ai-assist/model';

const querySchema = JsonSchema.object({ query: JsonSchema.string() });

function clientTool(name: string): IAiClientTool {
  return {
    config: {
      type: 'client_tool',
      name,
      description: `tool ${name}`,
      parametersSchema: querySchema
    },
    execute: async () => succeed('ok')
  };
}

const webSearch: AiServerToolConfig = { type: 'web_search' };

function geminiDescriptor(): IAiProviderDescriptor {
  return {
    id: 'google-gemini',
    label: 'Gemini',
    buttonLabel: 'Gemini',
    needsSecret: true,
    apiFormat: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-3.5-flash',
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    thinkingMode: 'optional'
  };
}

const prompt = new AiPrompt('hello', 'system');

describe('hasGeminiToolConflict (pure conflict predicate)', () => {
  test('true only when BOTH a web_search server tool and at least one client tool are present', () => {
    // Wrong impl this catches: a check that fires on either tool kind alone, or
    // that ignores the server-tool side entirely.
    expect(hasGeminiToolConflict([webSearch], [clientTool('a')])).toBe(true);
  });

  test('false when there are no client tools (grounding-only is legal)', () => {
    // Wrong impl this catches: gating on the server tool alone and blocking a
    // valid web-search-only Gemini request.
    expect(hasGeminiToolConflict([webSearch], [])).toBe(false);
  });

  test('false when there is no web_search server tool (function-calling-only is legal)', () => {
    // tools undefined (no server tools) and tools present-but-empty both resolve
    // to "no grounding" — a client-tools-only request must pass.
    expect(hasGeminiToolConflict(undefined, [clientTool('a')])).toBe(false);
    expect(hasGeminiToolConflict([], [clientTool('a')])).toBe(false);
  });
});

describe('executeClientToolTurn — Gemini web_search x client-tool guard (antagonist)', () => {
  test('fails fast (before any wire call) when a Gemini turn combines web_search with a client tool', () => {
    // Wrong impl this catches: no pre-flight guard, so the combination serializes
    // to google_search + function_declarations and Gemini answers an opaque 400.
    const result = executeClientToolTurn({
      descriptor: geminiDescriptor(),
      apiKey: 'test-key',
      ...prompt.toRequest(),
      tools: [webSearch],
      clientTools: [clientTool('recall')],
      model: 'gemini-3.5-flash'
    });
    expect(result).toFailWith(/Gemini cannot combine web_search grounding with client \(function\) tools/i);
  });
});
