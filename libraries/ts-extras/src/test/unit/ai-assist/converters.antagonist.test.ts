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
 * Antagonist torture tests — target class 3 (ai-assist-antagonist phase 2):
 * convert/validate symmetry — no silent field-drop. For every exported converter
 * in `converters.ts`, round-trips a value with EVERY optional field populated
 * simultaneously and asserts (whole-object equality) that none is silently
 * dropped, plus a companion "absent-stays-absent" case. This is the ai-assist
 * analog of the #524 `aiClientToolConfig.annotations` field-drop near-miss.
 *
 * Wrong impl every test in this file guards against: a `Converters.object` /
 * `Converters.strictObject` field map that omits a field the TypeScript
 * interface declares — the field silently vanishes on conversion even though
 * the input carried it and the static type promises it round-trips.
 */

import '@fgv/ts-utils-jest';

import { JsonSchema } from '@fgv/ts-json-base';

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  aiAssistProviderConfig,
  aiAssistSettings,
  aiClientToolConfig,
  aiServerToolConfig,
  aiToolAnnotations,
  aiToolEnablement,
  aiWebSearchToolConfig
} from '../../../packlets/ai-assist/converters';

describe('aiWebSearchToolConfig — maximal optionals round-trip', () => {
  const maximal = {
    type: 'web_search' as const,
    allowedDomains: ['a.com', 'b.com'],
    blockedDomains: ['c.com'],
    maxUses: 5,
    enableImageUnderstanding: true
  };

  test('every optional field survives conversion', () => {
    expect(aiWebSearchToolConfig.convert(maximal)).toSucceedWith(maximal);
  });

  test('absent optionals stay absent (not present as undefined-valued keys)', () => {
    expect(aiWebSearchToolConfig.convert({ type: 'web_search' })).toSucceedAndSatisfy((config) => {
      expect(Object.keys(config).sort()).toEqual(['type']);
    });
  });
});

describe('aiServerToolConfig (discriminated union) — maximal optionals round-trip', () => {
  test('a maximal web_search config survives conversion through the discriminated union', () => {
    const maximal = {
      type: 'web_search' as const,
      allowedDomains: ['x.com'],
      blockedDomains: ['y.com'],
      maxUses: 3,
      enableImageUnderstanding: false
    };
    expect(aiServerToolConfig.convert(maximal)).toSucceedWith(maximal);
  });
});

describe('aiToolAnnotations — maximal optionals round-trip', () => {
  const maximal = {
    title: 'Delete Everything',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true
  };

  test('all five hint fields survive conversion simultaneously', () => {
    expect(aiToolAnnotations.convert(maximal)).toSucceedWith(maximal);
  });

  test('absent optionals stay absent', () => {
    expect(aiToolAnnotations.convert({})).toSucceedAndSatisfy((config) => {
      expect(Object.keys(config)).toEqual([]);
    });
  });
});

describe('aiClientToolConfig — maximal optionals round-trip (the #524-analog field)', () => {
  const schema = JsonSchema.object({ q: JsonSchema.string() });
  const maximalAnnotations = {
    title: 'Recall Memory',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  };

  test('annotations with all five nested hints populated survives conversion', () => {
    const input = {
      type: 'client_tool' as const,
      name: 'recall_memory',
      description: 'Recall stored user context',
      parametersSchema: schema,
      annotations: maximalAnnotations
    };
    expect(aiClientToolConfig.convert(input)).toSucceedAndSatisfy((config) => {
      expect(config.type).toBe('client_tool');
      expect(config.name).toBe('recall_memory');
      expect(config.description).toBe('Recall stored user context');
      expect(config.parametersSchema).toBe(schema);
      expect(config.annotations).toEqual(maximalAnnotations);
    });
  });

  test('absent annotations stays absent (not an empty object)', () => {
    const input = {
      type: 'client_tool' as const,
      name: 'recall_memory',
      description: 'Recall stored user context',
      parametersSchema: schema
    };
    expect(aiClientToolConfig.convert(input)).toSucceedAndSatisfy((config) => {
      expect(config.annotations).toBeUndefined();
      expect('annotations' in config).toBe(false);
    });
  });
});

describe('aiToolEnablement — maximal optionals round-trip', () => {
  test('a populated nested config survives conversion', () => {
    const maximal = {
      type: 'web_search' as const,
      enabled: true,
      config: {
        type: 'web_search' as const,
        allowedDomains: ['a.com'],
        blockedDomains: ['b.com'],
        maxUses: 2,
        enableImageUnderstanding: true
      }
    };
    expect(aiToolEnablement.convert(maximal)).toSucceedWith(maximal);
  });

  test('absent config stays absent', () => {
    expect(aiToolEnablement.convert({ type: 'web_search', enabled: false })).toSucceedAndSatisfy((config) => {
      expect(config.config).toBeUndefined();
      expect('config' in config).toBe(false);
    });
  });
});

describe('modelSpec — nested per-tier round-trip (no silent branch drop)', () => {
  test('a fully-populated tier+modality map survives conversion (no key dropped)', () => {
    const input = { base: 'b', advanced: 'a', frontier: 'f', image: 'i', embedding: 'e' };
    expect(AiAssist.modelSpec.convert(input)).toSucceedWith(input);
  });

  test('a nested tier branch (itself a full map) survives conversion at every level', () => {
    const input = {
      base: 'b',
      advanced: { base: 'a-base', image: 'a-image' },
      frontier: { base: 'f-base', advanced: 'f-advanced', embedding: 'f-embedding' }
    };
    expect(AiAssist.modelSpec.convert(input)).toSucceedWith(input);
  });
});

describe('aiAssistProviderConfig — maximal optionals round-trip', () => {
  const maximal = {
    provider: 'openai' as const,
    secretName: 'openai-key',
    model: { base: 'gpt-5.4-mini', advanced: 'gpt-5.5' },
    tools: [{ type: 'web_search' as const, enabled: true, config: { type: 'web_search' as const } }],
    endpoint: 'https://my-proxy.example.com/v1'
  };

  test('every optional field survives conversion simultaneously', () => {
    expect(aiAssistProviderConfig.convert(maximal)).toSucceedWith(maximal);
  });

  test('absent optionals stay absent', () => {
    expect(aiAssistProviderConfig.convert({ provider: 'openai' })).toSucceedAndSatisfy((config) => {
      expect(Object.keys(config)).toEqual(['provider']);
    });
  });
});

describe('aiAssistSettings — maximal optionals round-trip', () => {
  const maximalProvider = {
    provider: 'anthropic' as const,
    secretName: 'anthropic-key',
    model: 'claude-sonnet-5',
    tools: [{ type: 'web_search' as const, enabled: true }],
    endpoint: 'https://my-proxy.example.com/anthropic'
  };
  const maximal = {
    providers: [maximalProvider],
    defaultProvider: 'anthropic' as const,
    proxyUrl: 'https://my-proxy.example.com',
    proxyAllProviders: true
  };

  test('every top-level optional field survives conversion simultaneously', () => {
    expect(aiAssistSettings.convert(maximal)).toSucceedWith(maximal);
  });

  test('absent top-level optionals stay absent', () => {
    expect(aiAssistSettings.convert({ providers: [] })).toSucceedAndSatisfy((settings) => {
      expect(Object.keys(settings)).toEqual(['providers']);
    });
  });

  // The converter and the shipped default constant must never drift from one another —
  // a change to IAiAssistSettings that updates DEFAULT_AI_ASSIST but not the converter's
  // field map (or vice versa) would surface here.
  test('the shipped DEFAULT_AI_ASSIST constant round-trips through the converter unchanged', () => {
    expect(aiAssistSettings.convert(AiAssist.DEFAULT_AI_ASSIST)).toSucceedWith(AiAssist.DEFAULT_AI_ASSIST);
  });
});
