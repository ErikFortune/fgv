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
import { callProviderCompletion } from '../../../packlets/ai-assist/completionClient';
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
      const [wire] = toResponsesApiTools([tool().config], { providerId, model: 'gpt-x' });
      expect(propertiesOf(wire.parameters)).toEqual({
        // `title` is dropped, not folded; `default` folds as its own sentence.
        n: {
          type: 'number',
          minimum: 1,
          maximum: 10,
          description: 'Constraints: multipleOf 0.5. Default: 2.'
        },
        i: { type: 'integer', exclusiveMinimum: 0, exclusiveMaximum: 100 },
        x: { type: 'number', exclusiveMinimum: 0 },
        s: {
          type: 'string',
          format: 'email',
          description: 'Who. Constraints: minLength 1; maxLength 8. Examples: ["a@b.c"].'
        },
        d: { type: 'string', description: 'Format: duration.' }
      });
    }
  });

  test('OpenAI-format providers whose support is unverified get every keyword folded', () => {
    for (const providerId of ['mistral', 'groq', 'openai-compat', 'ollama', undefined]) {
      const [wire] = toResponsesApiTools([tool().config], { providerId });
      expect(propertiesOf(wire.parameters).i).toEqual({
        type: 'integer',
        description: 'Constraints: exclusiveMinimum 0; exclusiveMaximum 100.'
      });
    }
    expect(propertiesOf(toResponsesApiTools([tool().config])[0].parameters).x).toEqual({
      type: 'number',
      description: 'Constraints: exclusiveMinimum 0.'
    });
  });

  test('a verified provider with no model named still gets its table', () => {
    const [wire] = toResponsesApiTools([tool().config], { providerId: 'openai' });
    expect(propertiesOf(wire.parameters).x).toEqual({ type: 'number', exclusiveMinimum: 0 });
  });

  test('an OpenAI fine-tuned model gets every keyword folded, since OpenAI documents none for it', () => {
    const [wire] = toResponsesApiTools([tool().config], { providerId: 'openai', model: 'ft:gpt-4o:org::id' });
    expect(propertiesOf(wire.parameters).i).toEqual({
      type: 'integer',
      description: 'Constraints: exclusiveMinimum 0; exclusiveMaximum 100.'
    });
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
        description: 'Who. Examples: ["a@b.c"].'
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

  test('Gemini folds an integer exclusive bound whose translation would not be exact (beyond 2^53)', () => {
    const caps = schemaKeywordsFor('gemini');
    const big = JsonSchema.integer({ exclusiveMinimum: 2 ** 53 });
    expect(JsonSchema.adaptSchemaKeywords(big.toJson(), caps)).toEqual({
      type: 'integer',
      description: `Constraints: exclusiveMinimum ${2 ** 53}.`
    });
    const below = JsonSchema.integer({ exclusiveMaximum: -(2 ** 53) });
    expect(JsonSchema.adaptSchemaKeywords(below.toJson(), caps)).toEqual({
      type: 'integer',
      description: `Constraints: exclusiveMaximum ${-(2 ** 53)}.`
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
    usesResponsesApi: boolean = false,
    target: { providerId?: string; model?: string } = { providerId, model: 'm' }
  ): JsonObject {
    return resolveStructuredOutput(
      descriptor(providerId),
      'm',
      { mode: 'schema', schema },
      undefined,
      usesResponsesApi,
      () => ({ modelPrefix: '', format }),
      target
    ).orThrow().wire;
  }

  const openAiShape: JsonObject = {
    type: 'object',
    properties: {
      n: { type: 'integer', minimum: 1, maximum: 5, description: 'Default: 3.' },
      s: { type: 'string', description: 'Constraints: maxLength 4. Format: hostname.' }
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
      description: 'Constraints: minimum 1; maximum 5. Default: 3.'
    });
  });

  test('Anthropic JSON outputs: default passes, a listed format passes, constraints fold', () => {
    const wire = wireFor('anthropic-output-format', 'anthropic');
    expect(propertiesOf(((wire.output_config as JsonObject).format as JsonObject).schema)).toEqual({
      n: { type: 'integer', default: 3, description: 'Constraints: minimum 1; maximum 5.' },
      s: { type: 'string', format: 'hostname', description: 'Constraints: maxLength 4.' }
    });
  });

  test('an OpenAI descriptor pointed at another endpoint is an unverified server: everything folds', () => {
    const wire = wireFor('openai-json-schema', 'openai', false, { model: 'm' });
    expect(propertiesOf(((wire.response_format as JsonObject).json_schema as JsonObject).schema).n).toEqual({
      type: 'integer',
      description: 'Constraints: minimum 1; maximum 5. Default: 3.'
    });
  });

  test('a fine-tuned OpenAI model folds everything in structured output too', () => {
    const wire = wireFor('openai-json-schema', 'openai', false, {
      providerId: 'openai',
      model: 'ft:gpt-4o:x'
    });
    expect(propertiesOf(((wire.response_format as JsonObject).json_schema as JsonObject).schema).n).toEqual({
      type: 'integer',
      description: 'Constraints: minimum 1; maximum 5. Default: 3.'
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

describe('an endpoint override is an unverified server', () => {
  const openAi: IAiProviderDescriptor = {
    id: 'openai',
    label: 'OpenAI',
    buttonLabel: 'OpenAI',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-x',
    supportedTools: [],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }]
  };
  const ranged = JsonSchema.object({ n: JsonSchema.integer({ minimum: 1 }) });
  let bodies: JsonObject[];

  beforeEach(() => {
    bodies = [];
    const encoder = new TextEncoder();
    jest.spyOn(global, 'fetch').mockImplementation(async (__url, init) => {
      bodies.push(JSON.parse(String(init?.body)) as JsonObject);
      const done = `event: response.completed\ndata: ${JSON.stringify({
        response: { status: 'completed' }
      })}\n\n`;
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: '{"n":1}' }, finish_reason: 'stop' }] }),
        text: async () => '',
        body: new ReadableStream<Uint8Array>({
          start(controller: ReadableStreamDefaultController<Uint8Array>): void {
            controller.enqueue(encoder.encode(done));
            controller.close();
          }
        }),
        headers: new Headers({ 'content-type': 'text/event-stream' })
      } as unknown as Response;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function toolParameters(endpoint: string | undefined): Promise<JsonObject> {
    const pick: IAiClientTool = {
      config: { type: 'client_tool', name: 'pick', description: 'Pick', parametersSchema: ranged },
      execute: async () => succeed('ok')
    } as unknown as IAiClientTool;
    const turn = executeClientToolTurn({
      descriptor: openAi,
      apiKey: 'k',
      ...(endpoint !== undefined && { endpoint }),
      ...new AiPrompt('hello', 'system').toRequest(),
      clientTools: [pick],
      model: 'gpt-x'
    }).orThrow();
    const events: IAiStreamEvent[] = [];
    for await (const event of turn.events) {
      events.push(event);
    }
    expect(events.length).toBeGreaterThan(0);
    return ((bodies[0].tools as JsonObject[])[0] as JsonObject).parameters as JsonObject;
  }

  test('a client tool sent to an OpenAI descriptor on its own endpoint passes minimum', async () => {
    expect(propertiesOf(await toolParameters(undefined)).n).toEqual({ type: 'integer', minimum: 1 });
  });

  test('the same tool sent through an endpoint override folds it', async () => {
    expect(propertiesOf(await toolParameters('https://gateway.example/v1')).n).toEqual({
      type: 'integer',
      description: 'Constraints: minimum 1.'
    });
  });

  test('structured output through an endpoint override folds it too', async () => {
    expect(
      await callProviderCompletion({
        descriptor: openAi,
        apiKey: 'k',
        endpoint: 'https://gateway.example/v1',
        ...new AiPrompt('hello', 'system').toRequest(),
        structuredOutput: { mode: 'schema', schema: ranged }
      })
    ).toSucceed();
    const sent = ((bodies[0].response_format as JsonObject).json_schema as JsonObject).schema;
    expect(propertiesOf(sent).n).toEqual({ type: 'integer', description: 'Constraints: minimum 1.' });
  });
});
