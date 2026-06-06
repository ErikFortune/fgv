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

import { JsonSchema, type JsonValue } from '@fgv/ts-json-base';

// eslint-disable-next-line @rushstack/packlets/mechanics
import type {
  AiServerToolConfig,
  AiToolConfig,
  IAiClientToolConfig,
  IAiProviderDescriptor,
  IAiToolEnablement
} from '../../../packlets/ai-assist/model';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  resolveEffectiveTools,
  toAnthropicTools,
  toGeminiParameterSchema,
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

// ============================================================================
// Client tool test data
// ============================================================================

const memorySchema = JsonSchema.object({
  query: JsonSchema.string({ description: 'What to recall' })
});

const memoryTool: IAiClientToolConfig = {
  type: 'client_tool',
  name: 'recall_memory',
  description: 'Recall stored user context',
  parametersSchema: memorySchema
};

const weatherSchema = JsonSchema.object({
  location: JsonSchema.string({ description: 'City name' }),
  units: JsonSchema.optional(
    JsonSchema.enumOf(['celsius', 'fahrenheit'] as const, { description: 'Temperature units' })
  )
});

const weatherTool: IAiClientToolConfig = {
  type: 'client_tool',
  name: 'get_weather',
  description: 'Get current weather for a location',
  parametersSchema: weatherSchema
};

// The expected wire schema from the memory tool's parametersSchema.toJson()
const memoryWireSchema = memorySchema.toJson();
// The expected wire schema from the weather tool's parametersSchema.toJson()
const weatherWireSchema = weatherSchema.toJson();

// A client tool whose parameters schema nests an object property, so the recursive
// Gemini sanitizer must strip `additionalProperties` at more than the top level.
const nestedSchema = JsonSchema.object({
  filter: JsonSchema.object({
    field: JsonSchema.string({ description: 'Field to match' })
  })
});

const nestedTool: IAiClientToolConfig = {
  type: 'client_tool',
  name: 'search',
  description: 'Search with a nested filter',
  parametersSchema: nestedSchema
};

// Expected Gemini-sanitized parameters (draft-07 `additionalProperties` stripped at
// every nesting level). Authored explicitly — not derived from the function under test.
const memoryGeminiParams = {
  type: 'object',
  properties: { query: { type: 'string', description: 'What to recall' } },
  required: ['query']
};
const weatherGeminiParams = {
  type: 'object',
  properties: {
    location: { type: 'string', description: 'City name' },
    units: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'Temperature units' }
  },
  required: ['location']
};
const nestedGeminiParams = {
  type: 'object',
  properties: {
    filter: {
      type: 'object',
      properties: { field: { type: 'string', description: 'Field to match' } },
      required: ['field']
    }
  },
  required: ['filter']
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
    acceptsImageInput: true,
    streamingCorsRestricted: false,
    thinkingMode: 'optional',
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

  test('formats client tool as function type with parameters schema', () => {
    expect(toResponsesApiTools([memoryTool])).toEqual([
      {
        type: 'function',
        name: 'recall_memory',
        description: 'Recall stored user context',
        parameters: memoryWireSchema
      }
    ]);
  });

  test('formats multiple client tools', () => {
    const result = toResponsesApiTools([memoryTool, weatherTool]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      type: 'function',
      name: 'recall_memory',
      description: 'Recall stored user context',
      parameters: memoryWireSchema
    });
    expect(result[1]).toEqual({
      type: 'function',
      name: 'get_weather',
      description: 'Get current weather for a location',
      parameters: weatherWireSchema
    });
  });

  test('handles mixed server and client tools', () => {
    const tools: AiToolConfig[] = [webSearchTool, memoryTool];
    const result = toResponsesApiTools(tools);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'web_search' });
    expect(result[1]).toEqual({
      type: 'function',
      name: 'recall_memory',
      description: 'Recall stored user context',
      parameters: memoryWireSchema
    });
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

  test('formats client tool with input_schema (no type field)', () => {
    expect(toAnthropicTools([memoryTool])).toEqual([
      {
        name: 'recall_memory',
        description: 'Recall stored user context',
        input_schema: memoryWireSchema
      }
    ]);
  });

  test('formats multiple client tools', () => {
    const result = toAnthropicTools([memoryTool, weatherTool]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'recall_memory',
      description: 'Recall stored user context',
      input_schema: memoryWireSchema
    });
    expect(result[1]).toEqual({
      name: 'get_weather',
      description: 'Get current weather for a location',
      input_schema: weatherWireSchema
    });
  });

  test('client tool wire format has no type field (unlike server tools)', () => {
    const result = toAnthropicTools([memoryTool]);
    expect(result[0]).not.toHaveProperty('type');
  });

  test('handles mixed server and client tools', () => {
    const tools: AiToolConfig[] = [webSearchTool, memoryTool];
    const result = toAnthropicTools(tools);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('type', 'web_search_20250305');
    expect(result[1]).not.toHaveProperty('type');
    expect(result[1]).toHaveProperty('input_schema');
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

  test('formats client tool inside function_declarations', () => {
    expect(toGeminiTools([memoryTool])).toEqual([
      {
        function_declarations: [
          {
            name: 'recall_memory',
            description: 'Recall stored user context',
            parameters: memoryGeminiParams
          }
        ]
      }
    ]);
  });

  test('accumulates multiple client tools in a single function_declarations entry', () => {
    expect(toGeminiTools([memoryTool, weatherTool])).toEqual([
      {
        function_declarations: [
          {
            name: 'recall_memory',
            description: 'Recall stored user context',
            parameters: memoryGeminiParams
          },
          {
            name: 'get_weather',
            description: 'Get current weather for a location',
            parameters: weatherGeminiParams
          }
        ]
      }
    ]);
  });

  test('handles mixed server and client tools', () => {
    const tools: AiToolConfig[] = [webSearchTool, memoryTool];
    const result = toGeminiTools(tools);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ google_search: {} });
    expect(result[1]).toEqual({
      function_declarations: [
        {
          name: 'recall_memory',
          description: 'Recall stored user context',
          parameters: memoryGeminiParams
        }
      ]
    });
  });

  test('strips additionalProperties from a client tool parameters schema (top level)', () => {
    // The raw draft-07 schema carries `additionalProperties: false`, which Gemini rejects.
    expect(memoryWireSchema).toHaveProperty('additionalProperties', false);

    const result = toGeminiTools([memoryTool]);
    const declarations = (result[0] as { function_declarations: Array<{ parameters: object }> })
      .function_declarations;
    const params = declarations[0].parameters as Record<string, unknown>;
    expect(params).not.toHaveProperty('additionalProperties');
  });

  test('strips additionalProperties at every nesting level', () => {
    // Sanity-check the fixture: the raw schema carries additionalProperties on both the
    // outer object and the nested `filter` object.
    const rawParams = nestedSchema.toJson() as {
      additionalProperties?: unknown;
      properties: { filter: { additionalProperties?: unknown } };
    };
    expect(rawParams).toHaveProperty('additionalProperties', false);
    expect(rawParams.properties.filter).toHaveProperty('additionalProperties', false);

    const result = toGeminiTools([nestedTool]);
    const declarations = (result[0] as { function_declarations: Array<{ parameters: object }> })
      .function_declarations;
    const params = declarations[0].parameters as {
      additionalProperties?: unknown;
      properties: { filter: { additionalProperties?: unknown } };
    };
    expect(params).not.toHaveProperty('additionalProperties');
    expect(params.properties.filter).not.toHaveProperty('additionalProperties');
    // Full-shape check: only the stripped keys are removed; nothing else drops.
    expect(params).toEqual(nestedGeminiParams);
  });
});

// ============================================================================
// toGeminiParameterSchema (Gemini schema sanitizer)
// ============================================================================

describe('toGeminiParameterSchema', () => {
  test('strips additionalProperties recursively through properties and items', () => {
    const input: JsonValue = {
      type: 'object',
      additionalProperties: false,
      properties: {
        nested: { type: 'object', additionalProperties: false, properties: {} }
      },
      items: { type: 'object', additionalProperties: false, properties: {} }
    };
    expect(toGeminiParameterSchema(input)).toEqual({
      type: 'object',
      properties: { nested: { type: 'object', properties: {} } },
      items: { type: 'object', properties: {} }
    });
  });

  test('strips $schema (defensive — draft-07 emitters may include it)', () => {
    const input: JsonValue = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: { nested: { $schema: 'x', type: 'string' } }
    };
    expect(toGeminiParameterSchema(input)).toEqual({
      type: 'object',
      properties: { nested: { type: 'string' } }
    });
  });

  test('sanitizes schema nodes nested inside arrays', () => {
    const input: JsonValue = {
      anyOf: [{ type: 'object', additionalProperties: false, properties: {} }, { type: 'string' }]
    };
    expect(toGeminiParameterSchema(input)).toEqual({
      anyOf: [{ type: 'object', properties: {} }, { type: 'string' }]
    });
  });

  test('preserves a parameter literally named additionalProperties or $schema', () => {
    // Inside a `properties` map the keys are user-defined parameter names, not schema
    // keywords — they must survive even when they collide with a stripped keyword.
    const input: JsonValue = {
      type: 'object',
      additionalProperties: false,
      properties: {
        additionalProperties: { type: 'string', description: 'a real param' },
        $schema: { type: 'string' },
        nested: { type: 'object', additionalProperties: false, properties: {} }
      },
      required: ['additionalProperties']
    };
    expect(toGeminiParameterSchema(input)).toEqual({
      type: 'object',
      properties: {
        additionalProperties: { type: 'string', description: 'a real param' },
        $schema: { type: 'string' },
        nested: { type: 'object', properties: {} }
      },
      required: ['additionalProperties']
    });
  });

  test('passes through a schema with none of the stripped keys unchanged', () => {
    const clean: JsonValue = {
      type: 'object',
      properties: { name: { type: 'string', description: 'A name' } },
      required: ['name']
    };
    expect(toGeminiParameterSchema(clean)).toEqual(clean);
  });

  test('returns primitive values unchanged', () => {
    expect(toGeminiParameterSchema('hello')).toBe('hello');
    expect(toGeminiParameterSchema(42)).toBe(42);
    expect(toGeminiParameterSchema(true)).toBe(true);
    expect(toGeminiParameterSchema(null)).toBeNull();
  });
});
