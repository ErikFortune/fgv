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
 * The keyword-capability tables, tested against the exact JSON each wire format emits: one test
 * per format showing what passes, what translates and what folds.
 */

import '@fgv/ts-utils-jest';

import { JsonSchema, type JsonObject, type JsonValue } from '@fgv/ts-json-base';
import { succeed } from '@fgv/ts-utils';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type {
  AiProviderId,
  IAiClientTool,
  IAiProviderDescriptor,
  IAiStreamEvent
} from '../../../packlets/ai-assist/model';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiStructuredOutputCapability } from '../../../packlets/ai-assist/structuredOutputTypes';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { AiPrompt } from '../../../packlets/ai-assist/model';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { schemaKeywordsFor } from '../../../packlets/ai-assist/schemaKeywords';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { resolveStructuredOutput } from '../../../packlets/ai-assist/structuredOutput';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  toAnthropicTools,
  toGeminiParameterSchema,
  toGeminiTools,
  toResponsesApiTools
} from '../../../packlets/ai-assist/toolFormats';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { executeClientToolTurn } from '../../../packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder';

/** A parameter schema carrying every keyword, so each table's whole row is visible at once. */
const everything = JsonSchema.object({
  n: JsonSchema.number({ minimum: 1, maximum: 10, multipleOf: 0.5, title: 'N', default: 2 }),
  i: JsonSchema.integer({ exclusiveMinimum: 0, exclusiveMaximum: 100 }),
  x: JsonSchema.number({ exclusiveMinimum: 0 }),
  s: JsonSchema.string({
    minLength: 1,
    maxLength: 8,
    format: 'email',
    description: 'Who.',
    examples: ['a@b.c']
  }),
  d: JsonSchema.string({ format: 'duration' })
});

function tool(schema: JsonSchema.ISchemaValidator<unknown> = everything): IAiClientTool {
  return {
    config: { type: 'client_tool', name: 't', description: 'A tool', parametersSchema: schema },
    execute: async () => succeed('ok')
  } as unknown as IAiClientTool;
}

/** The emitted properties of the one client tool's schema, however the format nests it. */
function propertiesOf(schema: JsonValue): JsonObject {
  return (schema as JsonObject).properties as JsonObject;
}

describe('schema keyword capability tables, per wire format', () => {
  test('OpenAI/xAI Responses tools: ranges pass, a shared format passes, the rest folds', () => {
    for (const providerId of ['openai', 'xai-grok']) {
      const [wire] = toResponsesApiTools([tool().config], providerId);
      expect(propertiesOf(wire.parameters)).toEqual({
        n: {
          type: 'number',
          minimum: 1,
          maximum: 10,
          description: 'Constraints: multipleOf 0.5; title "N"; default 2.'
        },
        i: { type: 'integer', exclusiveMinimum: 0, exclusiveMaximum: 100 },
        x: { type: 'number', exclusiveMinimum: 0 },
        s: {
          type: 'string',
          format: 'email',
          description: 'Who. Constraints: minLength 1; maxLength 8; examples ["a@b.c"].'
        },
        d: { type: 'string', description: 'Constraints: format "duration".' }
      });
    }
  });

  test('OpenAI-format providers whose support is unverified get every keyword folded', () => {
    for (const providerId of ['mistral', 'groq', 'openai-compat', 'ollama', undefined]) {
      const [wire] = toResponsesApiTools([tool().config], providerId);
      expect(propertiesOf(wire.parameters).i).toEqual({
        type: 'integer',
        description: 'Constraints: exclusiveMinimum 0; exclusiveMaximum 100.'
      });
    }
  });

  test('Anthropic tools: every keyword passes, emitted exactly as toJson() states it', () => {
    const [wire] = toAnthropicTools([tool().config]);
    expect(wire.input_schema).toEqual(everything.toJson());
  });

  test('Gemini tools: documented keywords pass, integer exclusive bounds translate, the rest folds', () => {
    const [{ function_declarations: declarations }] = toGeminiTools([tool().config]) as JsonObject[];
    const parameters = ((declarations as JsonObject[])[0] as JsonObject).parameters;
    expect(propertiesOf(parameters)).toEqual({
      n: {
        type: 'number',
        minimum: 1,
        maximum: 10,
        title: 'N',
        default: 2,
        description: 'Constraints: multipleOf 0.5.'
      },
      // x > 0 is x >= 1 and x < 100 is x <= 99, exactly, for an integer.
      i: { type: 'integer', minimum: 1, maximum: 99 },
      // A number has no inclusive equivalent, so the exclusive bound folds.
      x: { type: 'number', description: 'Constraints: exclusiveMinimum 0.' },
      s: {
        type: 'string',
        minLength: 1,
        maxLength: 8,
        format: 'email',
        description: 'Who. Constraints: examples ["a@b.c"].'
      },
      d: { type: 'string', format: 'duration' }
    });
  });

  test('Gemini translation keeps the tighter of an exclusive and an inclusive bound, and survives nullability', () => {
    const caps = schemaKeywordsFor('gemini');
    const tighterInclusive = JsonSchema.integer({
      minimum: 5,
      exclusiveMinimum: 2,
      maximum: 7,
      exclusiveMaximum: 9
    });
    expect(toGeminiParameterSchema(JsonSchema.adaptSchemaKeywords(tighterInclusive.toJson(), caps))).toEqual({
      type: 'integer',
      minimum: 5,
      maximum: 7
    });
    const tighterExclusive = JsonSchema.integer({
      minimum: 1,
      exclusiveMinimum: 2.5,
      maximum: 9,
      exclusiveMaximum: 4
    });
    expect(toGeminiParameterSchema(JsonSchema.adaptSchemaKeywords(tighterExclusive.toJson(), caps))).toEqual({
      type: 'integer',
      minimum: 3,
      maximum: 3
    });
    const nullable = JsonSchema.integer({ nullable: true, exclusiveMaximum: 10 });
    expect(toGeminiParameterSchema(JsonSchema.adaptSchemaKeywords(nullable.toJson(), caps))).toEqual({
      type: 'integer',
      nullable: true,
      maximum: 9
    });
  });

  test('the Gemini dialect sanitizer copies default and examples as data, not schema', () => {
    expect(
      toGeminiParameterSchema({
        type: 'object',
        properties: {},
        default: { additionalProperties: false, type: ['string', 'null'] },
        examples: [{ $schema: 'x' }],
        additionalProperties: false
      })
    ).toEqual({
      type: 'object',
      properties: {},
      default: { additionalProperties: false, type: ['string', 'null'] },
      examples: [{ $schema: 'x' }]
    });
  });
});

describe('schema keyword capability tables, structured output', () => {
  const schema = JsonSchema.object({
    n: JsonSchema.integer({ minimum: 1, maximum: 5, default: 3 }),
    s: JsonSchema.string({ maxLength: 4, format: 'hostname' })
  });

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

  function wireFor(
    format: IAiStructuredOutputCapability['format'],
    providerId: AiProviderId = 'openai',
    usesResponsesApi: boolean = false
  ): JsonObject {
    return resolveStructuredOutput(
      descriptor(providerId),
      'm',
      { mode: 'schema', schema },
      undefined,
      usesResponsesApi,
      () => ({ modelPrefix: '', format })
    ).orThrow().wire;
  }

  const openAiShape: JsonObject = {
    type: 'object',
    properties: {
      n: { type: 'integer', minimum: 1, maximum: 5, description: 'Constraints: default 3.' },
      s: { type: 'string', description: 'Constraints: maxLength 4; format "hostname".' }
    },
    required: ['n', 's'],
    additionalProperties: false
  };

  test('OpenAI strict (Chat Completions and Responses): ranges pass, the rest folds', () => {
    const chat = wireFor('openai-json-schema');
    expect(((chat.response_format as JsonObject).json_schema as JsonObject).schema).toEqual(openAiShape);
    const responses = wireFor('openai-json-schema', 'xai-grok', true);
    expect(((responses.text as JsonObject).format as JsonObject).schema).toEqual(openAiShape);
  });

  test('OpenAI strict for an unverified provider folds every keyword', () => {
    const wire = wireFor('openai-json-schema', 'mistral');
    expect(propertiesOf(((wire.response_format as JsonObject).json_schema as JsonObject).schema).n).toEqual({
      type: 'integer',
      description: 'Constraints: minimum 1; maximum 5; default 3.'
    });
  });

  test('Anthropic JSON outputs: default passes, a listed format passes, constraints fold', () => {
    const wire = wireFor('anthropic-output-format', 'anthropic');
    expect(propertiesOf(((wire.output_config as JsonObject).format as JsonObject).schema)).toEqual({
      n: { type: 'integer', default: 3, description: 'Constraints: minimum 1; maximum 5.' },
      s: { type: 'string', format: 'hostname', description: 'Constraints: maxLength 4.' }
    });
  });

  test('Anthropic forced tool: an ordinary tool, so every keyword passes', () => {
    const wire = wireFor('anthropic-tool-forced', 'anthropic');
    expect(((wire.tools as JsonObject[])[0] as JsonObject).input_schema).toEqual(schema.toJson());
  });

  test('Gemini response schema: documented keywords pass, then the dialect translation applies', () => {
    const wire = wireFor('gemini-response-schema', 'google-gemini');
    expect(wire.responseSchema).toEqual({
      type: 'object',
      properties: {
        n: { type: 'integer', minimum: 1, maximum: 5, default: 3 },
        s: { type: 'string', maxLength: 4, format: 'hostname' }
      },
      required: ['n', 's']
    });
  });

  test('a folded constraint still rejects an out-of-range reply through the caller validator', () => {
    expect(schema.validate({ n: 9, s: 'ok' })).toFailWith(/maximum/);
  });
});

describe('a folded constraint on the tool path', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function collect(iter: AsyncIterable<IAiStreamEvent>): Promise<IAiStreamEvent[]> {
    const out: IAiStreamEvent[] = [];
    for await (const event of iter) {
      out.push(event);
    }
    return out;
  }

  test('Gemini folds multipleOf, and a model call breaking it is refused before execute runs', async () => {
    const sse = [
      `data: ${JSON.stringify({
        candidates: [
          { content: { parts: [{ functionCall: { name: 'pick', args: { n: 7 } } }] }, finishReason: 'STOP' }
        ]
      })}\n\n`
    ];
    let sentBody: JsonObject | undefined;
    const encoder = new TextEncoder();
    (global.fetch as jest.Mock).mockImplementation((...args: unknown[]) => {
      sentBody = JSON.parse((args[1] as RequestInit).body as string) as JsonObject;
      let i = 0;
      return Promise.resolve({
        ok: true,
        status: 200,
        body: new ReadableStream<Uint8Array>({
          pull(controller: ReadableStreamDefaultController<Uint8Array>): void {
            if (i < sse.length) {
              controller.enqueue(encoder.encode(sse[i++]));
            } else {
              controller.close();
            }
          }
        }),
        text: jest.fn().mockResolvedValue(''),
        headers: new Map([['content-type', 'text/event-stream']])
      });
    });

    const execute = jest.fn(async () => succeed('picked'));
    const pick: IAiClientTool = {
      config: {
        type: 'client_tool',
        name: 'pick',
        description: 'Pick a multiple of five',
        parametersSchema: JsonSchema.object({ n: JsonSchema.integer({ multipleOf: 5 }) })
      },
      execute
    } as unknown as IAiClientTool;

    const result = executeClientToolTurn({
      descriptor: {
        id: 'google-gemini',
        label: 'Gemini',
        buttonLabel: 'Gemini',
        needsSecret: true,
        apiFormat: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: 'gemini-2.5-flash',
        supportedTools: [],
        corsRestricted: false,
        streamingCorsRestricted: false,
        acceptsImageInput: false
      },
      apiKey: 'k',
      ...new AiPrompt('hello', 'system').toRequest(),
      clientTools: [pick],
      model: 'gemini-2.5-flash'
    });
    expect(result).toSucceed();
    const turn = result.orThrow();
    const events = await collect(turn.events);

    const declarations = ((sentBody?.tools as JsonObject[])[0] as JsonObject)
      .function_declarations as JsonObject[];
    expect(propertiesOf(declarations[0].parameters)).toEqual({
      n: { type: 'integer', description: 'Constraints: multipleOf 5.' }
    });

    expect(execute).not.toHaveBeenCalled();
    const resultEvent = events.find((e) => e.type === 'client-tool-result');
    expect(resultEvent).toMatchObject({ type: 'client-tool-result', isError: true });
    expect(JSON.stringify(resultEvent)).toMatch(/multipleOf/);
  });
});
