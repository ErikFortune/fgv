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
 * The two shapes whose wire support varies independently of any keyword — a numeric or boolean
 * `enum`, and a schema with no `type` (`JsonSchema.anyValue`) — pinned against the exact JSON each
 * wire format emits, and the refusal each wire that cannot carry an untyped node returns.
 */

import '@fgv/ts-utils-jest';

import { JsonSchema, type JsonObject } from '@fgv/ts-json-base';
import { succeed } from '@fgv/ts-utils';
import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { AiProviderId, IAiClientTool, IAiProviderDescriptor } from '../../../packlets/ai-assist/model';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { AiStructuredOutputFormat } from '../../../packlets/ai-assist/structuredOutputTypes';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { type ISchemaWireTarget, schemaKeywordsFor } from '../../../packlets/ai-assist/schemaKeywords';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  type IResolvedStructuredOutput,
  resolveStructuredOutput
} from '../../../packlets/ai-assist/structuredOutput';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  toAnthropicTools,
  toGeminiTools,
  toResponsesApiTools
} from '../../../packlets/ai-assist/toolFormats';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { callAnthropicStream } from '../../../packlets/ai-assist/streamingAdapters/anthropic';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { callGeminiStream } from '../../../packlets/ai-assist/streamingAdapters/gemini';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { callOpenAiResponsesStream } from '../../../packlets/ai-assist/streamingAdapters/openaiResponses';
import { TEST_PROMPT } from './streamingAdaptersFixtures';

/** A numeric enum, a boolean const-style enum and a string enum — no untyped node. */
const enums = JsonSchema.object({
  level: JsonSchema.integerEnumOf([1, 2], { description: 'Level.' }).orThrow(),
  on: JsonSchema.booleanEnumOf([true]).orThrow(),
  kind: JsonSchema.enumOf(['a', 'b'])
});

/** A tool with one untyped (pydantic `Any`) parameter. */
const untyped = JsonSchema.object({
  q: JsonSchema.string(),
  payload: JsonSchema.optional(JsonSchema.anyValue({ description: 'Anything.' }))
});

function tool(schema: JsonSchema.ISchemaValidator<unknown>, name: string = 'lookup'): IAiClientTool {
  return {
    config: { type: 'client_tool', name, description: 'A tool', parametersSchema: schema },
    execute: async () => succeed('ok')
  } as unknown as IAiClientTool;
}

const passedEnums: JsonObject = {
  level: { type: 'integer', enum: [1, 2], description: 'Level.' },
  on: { type: 'boolean', enum: [true] },
  kind: { type: 'string', enum: ['a', 'b'] }
};

const foldedEnums: JsonObject = {
  level: { type: 'integer', description: 'Level. Constraints: enum [1,2].' },
  on: { type: 'boolean', description: 'Constraints: enum [true].' },
  kind: { type: 'string', enum: ['a', 'b'] }
};

const UNTYPED_REFUSAL: RegExp =
  /^tool 'lookup': #\/properties\/payload: a schema with no 'type' \(matching any value\) cannot be sent on this wire/;

describe('the shape rules, per tool wire format', () => {
  test('OpenAI/xAI tools pass a numeric enum and refuse an untyped node', () => {
    for (const providerId of ['openai', 'xai-grok']) {
      const target: ISchemaWireTarget = { providerId, model: 'm' };
      expect(toResponsesApiTools([tool(enums).config], target)).toSucceedAndSatisfy(([wire]) => {
        expect((wire.parameters as JsonObject).properties).toEqual(passedEnums);
      });
      expect(toResponsesApiTools([tool(untyped).config], target)).toFailWith(UNTYPED_REFUSAL);
      expect(toResponsesApiTools([tool(untyped).config], target)).toFailWith(/\(OpenAI-format tools\)$/);
    }
  });

  test('an unverified OpenAI-format server folds a numeric enum and refuses an untyped node', () => {
    expect(toResponsesApiTools([tool(enums).config], { providerId: 'groq' })).toSucceedAndSatisfy(
      ([wire]) => {
        expect((wire.parameters as JsonObject).properties).toEqual(foldedEnums);
      }
    );
    expect(toResponsesApiTools([tool(untyped).config])).toFailWith(
      /cannot be sent on this wire \(OpenAI-format tools, unverified server\)$/
    );
  });

  test('Anthropic tools pass both: a numeric enum, and an untyped node as {}', () => {
    expect(toAnthropicTools([tool(enums).config], { providerId: 'anthropic' })).toSucceedAndSatisfy(
      ([wire]) => {
        expect((wire.input_schema as JsonObject).properties).toEqual(passedEnums);
      }
    );
    expect(toAnthropicTools([tool(untyped).config], { providerId: 'anthropic' })).toSucceedAndSatisfy(
      ([wire]) => {
        expect(wire.input_schema).toEqual({
          type: 'object',
          properties: { q: { type: 'string' }, payload: { description: 'Anything.' } },
          required: ['q'],
          additionalProperties: false
        });
      }
    );
    // An endpoint override reaches an unverified server.
    expect(toAnthropicTools([tool(untyped).config])).toFailWith(UNTYPED_REFUSAL);
  });

  test('Gemini folds a numeric enum keeping its type, and refuses an untyped node', () => {
    expect(
      toGeminiTools([{ type: 'web_search' }, tool(enums).config], { providerId: 'google-gemini' })
    ).toSucceedAndSatisfy((wire) => {
      expect(wire[0]).toEqual({ google_search: {} });
      const [declaration] = wire[1].function_declarations as JsonObject[];
      expect((declaration.parameters as JsonObject).properties).toEqual(foldedEnums);
    });
  });

  test('a host-authored client tool Gemini cannot carry fails the whole request, loudly, by design', () => {
    // Direct client tools are the host's own code, so a schema the wire cannot carry is an authoring
    // error and fails the request naming the tool. MCP tools are different: `adaptMcpTools` admits
    // them against the wire table, so one server tool with `{}` is skipped rather than failing here.
    expect(
      toGeminiTools([tool(enums, 'ok').config, tool(untyped).config], { providerId: 'google-gemini' })
    ).toFailWith(UNTYPED_REFUSAL);
    expect(
      toGeminiTools([tool(enums, 'ok').config, tool(untyped).config], { providerId: 'google-gemini' })
    ).toFailWith(/\(Gemini\)$/);
  });

  test('a nullable numeric enum on Gemini folds, and the sanitizer still translates the union', () => {
    const nullable = JsonSchema.object({
      n: JsonSchema.numberEnumOf([0.5, 1], { nullable: true }).orThrow()
    });
    expect(toGeminiTools([tool(nullable).config], { providerId: 'google-gemini' })).toSucceedAndSatisfy(
      ([wire]) => {
        const [declaration] = wire.function_declarations as JsonObject[];
        expect((declaration.parameters as JsonObject).properties).toEqual({
          n: { type: 'number', nullable: true, description: 'Constraints: enum [0.5,1,null].' }
        });
      }
    );
  });

  test('every table states both shape rules', () => {
    const expected: Record<string, [string, string]> = {
      'responses-tools': ['pass', 'refuse'],
      'openai-strict-output': ['pass', 'refuse'],
      'anthropic-tools': ['pass', 'pass'],
      'anthropic-json-outputs': ['pass', 'refuse'],
      gemini: ['fold', 'refuse']
    };
    for (const [format, [nonStringEnum, untypedRule]] of Object.entries(expected)) {
      const table = schemaKeywordsFor(format as Parameters<typeof schemaKeywordsFor>[0], {
        providerId:
          format === 'gemini' ? 'google-gemini' : format.startsWith('anthropic') ? 'anthropic' : 'openai'
      });
      expect([table.nonStringEnum, table.untyped]).toEqual([nonStringEnum, untypedRule]);
    }
  });
});

describe('AiAssist.clientToolSchemaKeywords — the table a host passes to adaptMcpTools', () => {
  function provider(id: AiProviderId, apiFormat: 'openai' | 'anthropic' | 'gemini'): IAiProviderDescriptor {
    return {
      id,
      label: id,
      buttonLabel: id,
      needsSecret: true,
      apiFormat,
      baseUrl: 'https://example.invalid/v1',
      defaultModel: 'm',
      supportedTools: [],
      corsRestricted: false,
      streamingCorsRestricted: false,
      acceptsImageInput: false
    };
  }

  test('follows the descriptor to the tool wire its requests use', () => {
    expect(AiAssist.clientToolSchemaKeywords(provider('anthropic', 'anthropic'))).toBe(
      schemaKeywordsFor('anthropic-tools', { providerId: 'anthropic' })
    );
    expect(AiAssist.clientToolSchemaKeywords(provider('google-gemini', 'gemini'))).toBe(
      schemaKeywordsFor('gemini', { providerId: 'google-gemini' })
    );
    expect(AiAssist.clientToolSchemaKeywords(provider('openai', 'openai'), { model: 'gpt-4o' })).toBe(
      schemaKeywordsFor('responses-tools', { providerId: 'openai', model: 'gpt-4o' })
    );
    expect(AiAssist.clientToolSchemaKeywords(provider('anthropic', 'anthropic')).untyped).toBe('pass');
    expect(AiAssist.clientToolSchemaKeywords(provider('openai', 'openai')).untyped).toBe('refuse');
  });

  test('an endpoint override, an unverified provider and a fine-tuned model get the conservative table', () => {
    expect(
      AiAssist.clientToolSchemaKeywords(provider('anthropic', 'anthropic'), {
        endpoint: 'https://gw.invalid'
      })
    ).toBe(JsonSchema.unverifiedWireSchemaKeywords);
    expect(AiAssist.clientToolSchemaKeywords(provider('groq', 'openai'))).toBe(
      JsonSchema.unverifiedWireSchemaKeywords
    );
    expect(AiAssist.clientToolSchemaKeywords(provider('openai', 'openai'), { model: 'ft:gpt-4o:x' })).toBe(
      JsonSchema.unverifiedWireSchemaKeywords
    );
  });
});

describe('the shape rules on structured output', () => {
  function descriptor(id: AiProviderId): IAiProviderDescriptor {
    return {
      id,
      label: id,
      buttonLabel: id,
      needsSecret: true,
      apiFormat: 'openai',
      baseUrl: 'https://example.invalid/v1',
      defaultModel: 'm',
      supportedTools: [],
      corsRestricted: false,
      streamingCorsRestricted: false,
      acceptsImageInput: false
    };
  }

  function resolve(
    format: AiStructuredOutputFormat,
    schema: JsonSchema.ISchemaValidator<unknown>,
    providerId: AiProviderId,
    onUnsupported: 'fail' | 'degrade' = 'fail'
  ): ReturnType<typeof resolveStructuredOutput> {
    return resolveStructuredOutput(
      descriptor(providerId),
      'm',
      { mode: 'schema', schema, onUnsupported },
      undefined,
      false,
      () => ({ modelPrefix: '', format }),
      { providerId, model: 'm' }
    );
  }

  const answer = JsonSchema.object({ grade: JsonSchema.integerEnumOf([1, 2, 3]).orThrow() });
  const anyAnswer = JsonSchema.object({ value: JsonSchema.anyValue() });

  test('a numeric enum passes on OpenAI strict and Anthropic JSON outputs, and folds on Gemini', () => {
    expect(resolve('openai-json-schema', answer, 'openai')).toSucceedAndSatisfy(
      (r: IResolvedStructuredOutput) => {
        expect(r.wire).toEqual({
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'response',
              strict: true,
              schema: {
                type: 'object',
                properties: { grade: { type: 'integer', enum: [1, 2, 3] } },
                required: ['grade'],
                additionalProperties: false
              }
            }
          }
        });
      }
    );
    expect(resolve('anthropic-output-format', answer, 'anthropic')).toSucceedAndSatisfy((r) => {
      expect(r.wire).toEqual({
        output_config: {
          format: {
            type: 'json_schema',
            schema: {
              type: 'object',
              properties: { grade: { type: 'integer', enum: [1, 2, 3] } },
              required: ['grade'],
              additionalProperties: false
            }
          }
        }
      });
    });
    expect(resolve('gemini-response-schema', answer, 'google-gemini')).toSucceedAndSatisfy((r) => {
      expect(r.wire).toEqual({
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: { grade: { type: 'integer', description: 'Constraints: enum [1,2,3].' } },
          required: ['grade']
        }
      });
    });
  });

  test('an untyped node is a capability mismatch, under onUnsupported, where the format refuses it', () => {
    for (const [format, providerId] of [
      ['openai-json-schema', 'openai'],
      ['openai-responses-format', 'openai'],
      ['anthropic-output-format', 'anthropic'],
      ['gemini-response-schema', 'google-gemini']
    ] as const) {
      const refused = resolve(format, anyAnswer, providerId);
      expect(refused).toFailWith(
        /^the supplied schema cannot be sent as \S+ structured output: #\/properties\/value: a schema with no 'type' \(matching any value\) cannot be sent on this wire .*; pass onUnsupported: 'degrade'/
      );
      expect(refused.message).toContain(`sent as ${format} structured output`);
      expect(resolve(format, anyAnswer, providerId, 'degrade')).toSucceedAndSatisfy((r) => {
        expect(r.enforcement).toBe('none');
      });
    }
  });

  test('the forced-tool mechanism takes the Anthropic tools table, so an untyped node passes as {}', () => {
    expect(resolve('anthropic-tool-forced', anyAnswer, 'anthropic')).toSucceedAndSatisfy((r) => {
      expect(r.enforcement).toBe('tool-forced');
      const [forced] = r.wire.tools as JsonObject[];
      expect((forced.input_schema as JsonObject).properties).toEqual({ value: {} });
    });
  });
});

describe('the streaming adapters refuse a request carrying an untyped node, before sending it', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('Gemini', async () => {
    const result = await callGeminiStream(
      {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'g',
        apiKey: 'k',
        providerId: 'google-gemini'
      },
      TEST_PROMPT,
      undefined,
      undefined,
      [tool(untyped).config]
    );
    expect(result).toFailWith(
      /^Gemini streaming: tool 'lookup': #\/properties\/payload: a schema with no 'type'/
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('Anthropic, through an endpoint override', async () => {
    const result = await callAnthropicStream(
      { baseUrl: 'https://gateway.invalid/v1', model: 'c', apiKey: 'k' },
      TEST_PROMPT,
      undefined,
      undefined,
      [tool(untyped).config]
    );
    expect(result).toFailWith(/^Anthropic streaming: tool 'lookup': #\/properties\/payload/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('OpenAI Responses', async () => {
    const result = await callOpenAiResponsesStream(
      { baseUrl: 'https://api.openai.com/v1', model: 'o', apiKey: 'k', providerId: 'openai' },
      TEST_PROMPT,
      [tool(untyped).config],
      undefined,
      undefined
    );
    expect(result).toFailWith(/^OpenAI Responses streaming: tool 'lookup': #\/properties\/payload/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
