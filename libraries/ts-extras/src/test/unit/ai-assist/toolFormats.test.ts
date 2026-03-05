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

import '@fgv/ts-utils-jest';

// eslint-disable-next-line @rushstack/packlets/mechanics
import type {
  AiServerToolConfig,
  IAiProviderDescriptor,
  IAiToolEnablement
} from '../../../packlets/ai-assist/model';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  resolveEffectiveTools,
  toAnthropicTools,
  toGeminiTools,
  toResponsesApiTools
} from '../../../packlets/ai-assist/toolFormats';

// ============================================================================
// Test data
// ============================================================================

const webSearchTool: AiServerToolConfig = { type: 'web_search' };

const webSearchWithDomains: AiServerToolConfig = {
  type: 'web_search',
  allowedDomains: ['example.com', 'docs.example.com'],
  maxUses: 3
};

const webSearchWithBlocked: AiServerToolConfig = {
  type: 'web_search',
  blockedDomains: ['untrusted.com']
};

const webSearchWithImageUnderstanding: AiServerToolConfig = {
  type: 'web_search',
  enableImageUnderstanding: true
};

function makeDescriptor(overrides: Partial<IAiProviderDescriptor> = {}): IAiProviderDescriptor {
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
    ...overrides
  };
}

// ============================================================================
// resolveEffectiveTools
// ============================================================================

describe('resolveEffectiveTools', () => {
  test('returns empty array when no tools configured and none passed', () => {
    const descriptor = makeDescriptor();
    expect(resolveEffectiveTools(descriptor)).toEqual([]);
  });

  test('returns empty array when settings tools are all disabled', () => {
    const descriptor = makeDescriptor();
    const settings: IAiToolEnablement[] = [{ type: 'web_search', enabled: false }];
    expect(resolveEffectiveTools(descriptor, settings)).toEqual([]);
  });

  test('returns enabled settings tools', () => {
    const descriptor = makeDescriptor();
    const settings: IAiToolEnablement[] = [{ type: 'web_search', enabled: true }];
    expect(resolveEffectiveTools(descriptor, settings)).toEqual([{ type: 'web_search' }]);
  });

  test('uses settings tool config when provided', () => {
    const descriptor = makeDescriptor();
    const settings: IAiToolEnablement[] = [
      { type: 'web_search', enabled: true, config: webSearchWithDomains }
    ];
    expect(resolveEffectiveTools(descriptor, settings)).toEqual([webSearchWithDomains]);
  });

  test('per-call tools override settings entirely', () => {
    const descriptor = makeDescriptor();
    const settings: IAiToolEnablement[] = [
      { type: 'web_search', enabled: true, config: webSearchWithDomains }
    ];
    const perCall = [webSearchTool];
    expect(resolveEffectiveTools(descriptor, settings, perCall)).toEqual([webSearchTool]);
  });

  test('per-call empty array disables all tools', () => {
    const descriptor = makeDescriptor();
    const settings: IAiToolEnablement[] = [{ type: 'web_search', enabled: true }];
    expect(resolveEffectiveTools(descriptor, settings, [])).toEqual([]);
  });

  test('filters tools not supported by provider', () => {
    const descriptor = makeDescriptor({ supportedTools: [] });
    const settings: IAiToolEnablement[] = [{ type: 'web_search', enabled: true }];
    expect(resolveEffectiveTools(descriptor, settings)).toEqual([]);
  });

  test('filters per-call tools not supported by provider', () => {
    const descriptor = makeDescriptor({ supportedTools: [] });
    expect(resolveEffectiveTools(descriptor, undefined, [webSearchTool])).toEqual([]);
  });
});

// ============================================================================
// toResponsesApiTools (xAI/OpenAI)
// ============================================================================

describe('toResponsesApiTools', () => {
  test('formats basic web search tool', () => {
    expect(toResponsesApiTools([webSearchTool])).toEqual([{ type: 'web_search' }]);
  });

  test('includes allowed_domains filter', () => {
    expect(toResponsesApiTools([webSearchWithDomains])).toEqual([
      {
        type: 'web_search',
        filters: {
          allowed_domains: ['example.com', 'docs.example.com']
        }
      }
    ]);
  });

  test('includes excluded_domains filter', () => {
    expect(toResponsesApiTools([webSearchWithBlocked])).toEqual([
      {
        type: 'web_search',
        filters: {
          excluded_domains: ['untrusted.com']
        }
      }
    ]);
  });

  test('includes enable_image_understanding when set', () => {
    expect(toResponsesApiTools([webSearchWithImageUnderstanding])).toEqual([
      {
        type: 'web_search',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        enable_image_understanding: true
      }
    ]);
  });

  test('returns empty array for empty input', () => {
    expect(toResponsesApiTools([])).toEqual([]);
  });
});

// ============================================================================
// toAnthropicTools
// ============================================================================

describe('toAnthropicTools', () => {
  test('formats basic web search tool', () => {
    expect(toAnthropicTools([webSearchTool])).toEqual([{ type: 'web_search_20250305', name: 'web_search' }]);
  });

  test('includes max_uses', () => {
    expect(toAnthropicTools([webSearchWithDomains])).toEqual([
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 3,
        allowed_domains: ['example.com', 'docs.example.com']
      }
    ]);
  });

  test('includes blocked_domains', () => {
    expect(toAnthropicTools([webSearchWithBlocked])).toEqual([
      {
        type: 'web_search_20250305',
        name: 'web_search',
        blocked_domains: ['untrusted.com']
      }
    ]);
  });

  test('returns empty array for empty input', () => {
    expect(toAnthropicTools([])).toEqual([]);
  });
});

// ============================================================================
// toGeminiTools
// ============================================================================

describe('toGeminiTools', () => {
  test('formats web search as google_search', () => {
    expect(toGeminiTools([webSearchTool])).toEqual([{ google_search: {} }]);
  });

  test('ignores web search domain filters (not supported by Gemini)', () => {
    // Gemini doesn't support domain filtering — just google_search: {}
    expect(toGeminiTools([webSearchWithDomains])).toEqual([{ google_search: {} }]);
  });

  test('returns empty array for empty input', () => {
    expect(toGeminiTools([])).toEqual([]);
  });
});
