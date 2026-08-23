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
 * Tests for the structured-output feature: `resolveStructuredOutput`'s wire
 * shapes per provider format, the `structuredOutput` enforcement reported on
 * `IAiCompletionResponse`, Anthropic's forced-tool response-shape change,
 * degradation, server-tool conflicts, alias resolution, longest-prefix
 * matching, and `callProxiedCompletion`'s raw-schema forwarding.
 *
 * @remarks
 * `generateJsonCompletion`'s automatic schema inference from a
 * `JsonSchema.object(...)` converter is covered in `jsonCompletion.test.ts`,
 * where the rest of that surface already lives.
 */

import '@fgv/ts-utils-jest';

import { JsonSchema } from '@fgv/ts-json-base';
import type { JsonValue } from '@fgv/ts-json-base';
// The rewrite is @internal and deliberately not on the packlet's entry point; imported
// directly so its recursion contract can be pinned without widening the public surface.
// eslint-disable-next-line @rushstack/packlets/mechanics
import { hoistNullableOptionals } from '../../../packlets/ai-assist/structuredOutput';

import { AiAssist } from '../../..';
import {
  anthropicResponse,
  anthropicWithToolsResponse,
  geminiResponse,
  makeDescriptor,
  mockFetchResponse,
  openAiResponse,
  responsesApiResponse,
  testPrompt
} from './apiClientFixtures';

// ============================================================================
// Test helpers
// ============================================================================

const fooSchema = JsonSchema.object({ foo: JsonSchema.string() });

/** Top-level optional property — the direct case `hasOptionalProperties` exists for. */
const optionalPropSchema = JsonSchema.object({
  a: JsonSchema.string(),
  b: JsonSchema.optional(JsonSchema.string())
});

/** The optional property is nested inside another object schema, not at the top level. */
const nestedOptionalSchema = JsonSchema.object({
  outer: JsonSchema.object({ inner: JsonSchema.optional(JsonSchema.string()) })
});

/** The optional property lives inside an array's item schema. */
const arrayItemOptionalSchema = JsonSchema.object({
  items: JsonSchema.array(JsonSchema.object({ x: JsonSchema.optional(JsonSchema.string()) }))
});

/**
 * The same absent-able field, spelled required-and-nullable — the spelling OpenAI strict
 * mode actually accepts, and the reason `nullable` was added to `JsonSchema`.
 */
const nullablePropSchema = JsonSchema.object({
  a: JsonSchema.string(),
  b: JsonSchema.string({ nullable: true })
});

function lastRequestBody(): Record<string, unknown> {
  const fetchMock = global.fetch as jest.Mock;
  const calls = fetchMock.mock.calls;
  return JSON.parse(calls[calls.length - 1][1].body) as Record<string, unknown>;
}

function lastRequestUrl(): string {
  const fetchMock = global.fetch as jest.Mock;
  const calls = fetchMock.mock.calls;
  return calls[calls.length - 1][0] as string;
}

/** An Anthropic response whose content is ONLY the forced structured-output tool_use block. */
function anthropicToolForcedResponse(input: unknown, stopReason: string = 'tool_use'): unknown {
  return {
    content: [
      {
        type: 'tool_use',
        id: 'tu_1',
        name: AiAssist.ANTHROPIC_STRUCTURED_OUTPUT_TOOL_NAME,
        input
      }
    ],
    stop_reason: stopReason
  };
}

/** A forced tool_use block with NO `input` property at all (not even `undefined`). */
function anthropicToolForcedResponseMissingInputProperty(stopReason: string = 'tool_use'): unknown {
  return {
    content: [
      {
        type: 'tool_use',
        id: 'tu_1',
        name: AiAssist.ANTHROPIC_STRUCTURED_OUTPUT_TOOL_NAME
      }
    ],
    stop_reason: stopReason
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('structured output', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // ==========================================================================
  // A. Wire body, per provider format (+ B: enforcement reported)
  // ==========================================================================

  describe('wire body per provider format', () => {
    test('OpenAI chat completions + schema mode sends response_format json_schema', async () => {
      const descriptor = makeDescriptor({
        id: 'openai',
        apiFormat: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-5.6-luna',
        structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }]
      });
      mockFetchResponse(openAiResponse('{"foo":"bar"}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('schema');
      });
      expect(lastRequestUrl()).toBe('https://api.openai.com/v1/chat/completions');
      expect(lastRequestBody().response_format).toEqual({
        type: 'json_schema',
        json_schema: { name: 'response', strict: true, schema: fooSchema.toJson() }
      });
    });

    test('OpenAI chat completions + json-object mode sends response_format json_object', async () => {
      const descriptor = makeDescriptor({
        id: 'openai',
        apiFormat: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-5.6-luna',
        structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }]
      });
      mockFetchResponse(openAiResponse('{"anything":true}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        // OpenAI's json-object pre-flight (see section K below) requires the word
        // "json" somewhere in the conversation, so the system prompt names it —
        // this test is about the wire shape, not the pre-flight rule itself.
        ...testPrompt.toRequest(),
        system: 'You are a helpful assistant. Respond with JSON only.',
        structuredOutput: { mode: 'json-object' }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('json-mode');
      });
      expect(lastRequestBody().response_format).toEqual({ type: 'json_object' });
    });

    test('OpenAI Responses API + schema nests the constraint under text.format', async () => {
      // gpt-5.5-pro is Responses-only, so it routes through /responses even with
      // no tools requested — the same path a `responsesOnlyModelPrefixes` entry
      // always takes. The descriptor declares only the single `openai-json-schema`
      // capability (matching the shipped registry shape) — the Responses-API wire
      // shape is reached via `effectiveFormat`'s route-based coercion, not via a
      // second declared capability entry.
      const descriptor = makeDescriptor({
        id: 'openai',
        apiFormat: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-5.5-pro',
        responsesOnlyModelPrefixes: ['gpt-5.5-pro'],
        structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }]
      });
      mockFetchResponse(responsesApiResponse('{"foo":"bar"}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('schema');
      });
      expect(lastRequestUrl()).toBe('https://api.openai.com/v1/responses');
      const body = lastRequestBody();
      // The Responses-only route must never carry `response_format` — the OpenAI
      // Chat Completions shape — only `text.format`.
      expect(body.response_format).toBeUndefined();
      expect(body.text).toEqual({
        format: { type: 'json_schema', name: 'response', strict: true, schema: fooSchema.toJson() }
      });
    });

    test('OpenAI Responses API + json-object mode nests type json_object under text.format', async () => {
      const descriptor = makeDescriptor({
        id: 'openai',
        apiFormat: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-5.5-pro',
        responsesOnlyModelPrefixes: ['gpt-5.5-pro'],
        structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }]
      });
      mockFetchResponse(responsesApiResponse('{"anything":true}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        // OpenAI's json-object pre-flight (see section K below) requires the word
        // "json" somewhere in the conversation, so the system prompt names it —
        // this test is about the wire shape, not the pre-flight rule itself.
        ...testPrompt.toRequest(),
        system: 'You are a helpful assistant. Respond with JSON only.',
        structuredOutput: { mode: 'json-object' }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('json-mode');
      });
      const body = lastRequestBody();
      expect(body.response_format).toBeUndefined();
      expect(body.text).toEqual({ format: { type: 'json_object' } });
    });

    test('the SAME OpenAI model spells the constraint differently depending on the route', async () => {
      // Regression pin for `effectiveFormat`'s route-based coercion: the OpenAI
      // wire shape is NOT a function of the model alone. The same model takes
      // /chat/completions when the call carries no tools and /responses when it
      // does, and those two endpoints spell structured output differently
      // (`response_format` vs `text.format`). A single declared capability
      // (`openai-json-schema`) must resolve to the right one on each call.
      const descriptor = makeDescriptor({
        id: 'openai',
        apiFormat: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-5.6-luna',
        supportedTools: ['web_search'],
        structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }]
      });

      // Call 1: no tools — routes to /chat/completions.
      mockFetchResponse(openAiResponse('{"foo":"bar"}'));
      const withoutTools = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });
      expect(withoutTools).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('schema');
      });
      expect(lastRequestUrl()).toBe('https://api.openai.com/v1/chat/completions');
      const chatBody = lastRequestBody();
      expect(chatBody.response_format).toEqual({
        type: 'json_schema',
        json_schema: { name: 'response', strict: true, schema: fooSchema.toJson() }
      });
      expect('text' in chatBody).toBe(false);

      // Call 2: SAME model, WITH tools — routes to /responses.
      mockFetchResponse(responsesApiResponse('{"foo":"bar"}'));
      const withTools = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools: [{ type: 'web_search' }],
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });
      expect(withTools).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('schema');
      });
      expect(lastRequestUrl()).toBe('https://api.openai.com/v1/responses');
      const responsesBody = lastRequestBody();
      expect(responsesBody.response_format).toBeUndefined();
      expect(responsesBody.text).toEqual({
        format: { type: 'json_schema', name: 'response', strict: true, schema: fooSchema.toJson() }
      });
    });

    test('Gemini + schema sets responseMimeType and a SANITIZED responseSchema', async () => {
      const descriptor = makeDescriptor({
        id: 'google-gemini',
        apiFormat: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: 'gemini-3.5-flash',
        structuredOutput: [{ modelPrefix: '', format: 'gemini-response-schema' }]
      });
      mockFetchResponse(geminiResponse('{"foo":"bar"}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('schema');
      });
      const body = lastRequestBody();
      const generationConfig = body.generationConfig as Record<string, unknown>;
      expect(generationConfig.responseMimeType).toBe('application/json');

      // Sanity: the RAW schema does carry the draft-07 keywords Gemini rejects —
      // if this ever stops being true the sanitizer assertion below is vacuous.
      const raw = fooSchema.toJson() as Record<string, unknown>;
      expect(raw.additionalProperties).toBe(false);

      const sanitized = generationConfig.responseSchema as Record<string, unknown>;
      expect('additionalProperties' in sanitized).toBe(false);
      expect('$schema' in sanitized).toBe(false);
      // The rest of the schema (type, properties) survives sanitization.
      expect(sanitized.type).toBe('object');
      expect(sanitized.properties).toEqual({ foo: { type: 'string' } });
    });

    test('Gemini + json-object sets responseMimeType with no responseSchema', async () => {
      const descriptor = makeDescriptor({
        id: 'google-gemini',
        apiFormat: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: 'gemini-3.5-flash',
        structuredOutput: [{ modelPrefix: '', format: 'gemini-response-schema' }]
      });
      mockFetchResponse(geminiResponse('{"anything":true}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'json-object' }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('json-mode');
      });
      const generationConfig = lastRequestBody().generationConfig as Record<string, unknown>;
      expect(generationConfig.responseMimeType).toBe('application/json');
      expect('responseSchema' in generationConfig).toBe(false);
    });

    test('Anthropic + schema forces a synthetic tool and tool_choice', async () => {
      const descriptor = makeDescriptor({
        id: 'anthropic',
        apiFormat: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-sonnet-5',
        structuredOutput: [{ modelPrefix: '', format: 'anthropic-tool-forced' }]
      });
      mockFetchResponse(anthropicToolForcedResponse({ foo: 'bar' }));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('tool-forced');
        expect(r.content).toBe('{"foo":"bar"}');
      });
      const body = lastRequestBody();
      const tools = body.tools as ReadonlyArray<Record<string, unknown>>;
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe(AiAssist.ANTHROPIC_STRUCTURED_OUTPUT_TOOL_NAME);
      expect(tools[0].input_schema).toEqual(fooSchema.toJson());
      expect(body.tool_choice).toEqual({
        type: 'tool',
        name: AiAssist.ANTHROPIC_STRUCTURED_OUTPUT_TOOL_NAME
      });
    });
  });

  // ==========================================================================
  // B. No request at all reports 'none'
  // ==========================================================================

  describe('enforcement reporting', () => {
    test('no structuredOutput request at all reports "none" and sends no structured fields', async () => {
      const descriptor = makeDescriptor({
        id: 'openai',
        apiFormat: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-5.6-luna',
        structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }]
      });
      mockFetchResponse(openAiResponse('plain text'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('none');
      });
      expect('response_format' in lastRequestBody()).toBe(false);
    });
  });

  // ==========================================================================
  // C. Anthropic's response-shape change under 'tool-forced'
  // ==========================================================================

  describe('anthropic tool-forced response shape', () => {
    const descriptor = makeDescriptor({
      id: 'anthropic',
      apiFormat: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-sonnet-5',
      structuredOutput: [{ modelPrefix: '', format: 'anthropic-tool-forced' }]
    });

    test('re-serializes the forced tool_use input as the response content', async () => {
      mockFetchResponse(anthropicToolForcedResponse({ foo: 'bar' }));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.content).toBe('{"foo":"bar"}');
        expect(r.structuredOutput).toBe('tool-forced');
      });
    });

    test('fails loudly, naming the tool, when only text blocks come back', async () => {
      mockFetchResponse(anthropicResponse('a plain-text answer, no tool_use block'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });

      // The tool name is hardcoded here (rather than interpolated into a dynamically
      // built RegExp, which the repo's lint config flags) — every other assertion in
      // this file cross-checks it against `AiAssist.ANTHROPIC_STRUCTURED_OUTPUT_TOOL_NAME`,
      // so a rename would already break those and surface here too.
      expect(result).toFailWith(/no 'fgv_structured_output' tool_use block/i);
    });

    test('fails (not succeeds with undefined content) when the forced tool_use block has no input property at all', async () => {
      mockFetchResponse(anthropicToolForcedResponseMissingInputProperty());

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });

      // `JSON.stringify(undefined)` returns `undefined` (not a string, not a
      // throw) — asserting `isFailure()` explicitly rather than just checking
      // `content` is falsy, since `toSucceedWith({ content: undefined, ... })`
      // would also pass against the broken version that let `undefined` through
      // as a "successful" string.
      expect(result.isFailure()).toBe(true);
      expect(result).toFailWith(/returned no serializable input/i);
    });

    test('fails (not succeeds with undefined content) when the forced tool_use block has input: undefined', async () => {
      mockFetchResponse(anthropicToolForcedResponse(undefined));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });

      expect(result.isFailure()).toBe(true);
      expect(result).toFailWith(/returned no serializable input/i);
    });

    test('without structured output, plain text extraction is unchanged', async () => {
      mockFetchResponse(anthropicResponse('a plain-text answer'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.content).toBe('a plain-text answer');
        expect(r.structuredOutput).toBe('none');
      });
    });
  });

  // ==========================================================================
  // D. Degradation when the resolved model declares no capability
  // ==========================================================================

  describe('degradation', () => {
    test('default onUnsupported degrades to "none" and sends no structured fields', async () => {
      // The registry's `groq` descriptor declares no `structuredOutput` at all.
      const groq = AiAssist.getProviderDescriptor('groq').orThrow();
      mockFetchResponse(openAiResponse('plain text'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: groq,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('none');
      });
      expect('response_format' in lastRequestBody()).toBe(false);
    });

    test('onUnsupported: "fail" fails loudly naming the missing capability', async () => {
      const groq = AiAssist.getProviderDescriptor('groq').orThrow();

      const result = await AiAssist.callProviderCompletion({
        descriptor: groq,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: fooSchema, onUnsupported: 'fail' }
      });

      expect(result).toFailWith(/no structured-output capability/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('Anthropic cannot express json-object mode: degrades to "none" by default', async () => {
      const descriptor = makeDescriptor({
        id: 'anthropic',
        apiFormat: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-sonnet-5',
        structuredOutput: [{ modelPrefix: '', format: 'anthropic-tool-forced' }]
      });
      mockFetchResponse(anthropicResponse('plain text'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'json-object' }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('none');
      });
      const body = lastRequestBody();
      expect('tools' in body).toBe(false);
      expect('tool_choice' in body).toBe(false);
    });

    test('Anthropic + json-object + onUnsupported: "fail" fails loudly', async () => {
      const descriptor = makeDescriptor({
        id: 'anthropic',
        apiFormat: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-sonnet-5',
        structuredOutput: [{ modelPrefix: '', format: 'anthropic-tool-forced' }]
      });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'json-object', onUnsupported: 'fail' }
      });

      expect(result).toFailWith(/cannot enforce 'json-object'/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // E. Conflicts with server tools — never degradable
  // ==========================================================================

  describe('conflicts with server-side tools', () => {
    test('Anthropic: schema + web_search fails naming the conflict, even with onUnsupported: "degrade"', async () => {
      const descriptor = makeDescriptor({
        id: 'anthropic',
        apiFormat: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-sonnet-5',
        supportedTools: ['web_search'],
        structuredOutput: [{ modelPrefix: '', format: 'anthropic-tool-forced' }]
      });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools: [{ type: 'web_search' }],
        structuredOutput: { mode: 'schema', schema: fooSchema, onUnsupported: 'degrade' }
      });

      expect(result).toFailWith(/forcing a tool[\s\S]*cannot be combined with[\s\S]*server-side tools/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('Gemini: schema + web_search fails naming the conflict, even with onUnsupported: "degrade"', async () => {
      const descriptor = makeDescriptor({
        id: 'google-gemini',
        apiFormat: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: 'gemini-3.5-flash',
        supportedTools: ['web_search'],
        structuredOutput: [{ modelPrefix: '', format: 'gemini-response-schema' }]
      });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools: [{ type: 'web_search' }],
        structuredOutput: { mode: 'schema', schema: fooSchema, onUnsupported: 'degrade' }
      });

      expect(result).toFailWith(/cannot combine a response schema with server-side tools/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // F. Alias resolution
  // ==========================================================================

  describe('alias resolution', () => {
    // No shipped descriptor declares more than one `structuredOutput` entry any
    // more (the OpenAI Chat-vs-Responses split moved into `effectiveFormat`'s
    // route-based coercion — see the coercion test above) — so a hand-built
    // descriptor with a specific-prefix entry plus a catch-all is what exercises
    // the alias-vs-catch-all guard, mirroring the pattern already established for
    // `resolveImageCapability` / `resolveEmbeddingCapability` in registry.test.ts.
    const descriptor = makeDescriptor({
      id: 'openai',
      apiFormat: 'openai',
      defaultModel: 'gpt-5.6-luna',
      aliases: { '@openai:special': 'gpt-9-special' },
      structuredOutput: [
        { modelPrefix: 'gpt-9-special', format: 'anthropic-tool-forced' },
        { modelPrefix: '', format: 'openai-json-schema' }
      ]
    });

    test('an @alias resolves to its concrete id and matches the specific entry, not the catch-all', () => {
      expect(AiAssist.resolveStructuredOutputCapability(descriptor, '@openai:special')).toEqual({
        modelPrefix: 'gpt-9-special',
        format: 'anthropic-tool-forced'
      });
    });

    test('the alias and the concrete id it names resolve to the same capability', () => {
      expect(AiAssist.resolveStructuredOutputCapability(descriptor, '@openai:special')).toEqual(
        AiAssist.resolveStructuredOutputCapability(descriptor, 'gpt-9-special')
      );
    });

    test('an unresolvable alias yields undefined rather than falling through to the catch-all', () => {
      expect(AiAssist.resolveStructuredOutputCapability(descriptor, '@openai:no-such-role')).toBeUndefined();
    });

    test('a concrete id not matching the specific prefix falls through to the catch-all', () => {
      expect(AiAssist.resolveStructuredOutputCapability(descriptor, 'gpt-5.6-luna')).toEqual({
        modelPrefix: '',
        format: 'openai-json-schema'
      });
    });

    test('an unregistered @alias fails upstream, before structured output is even resolved', async () => {
      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        modelOverride: '@openai:no-such-role',
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });

      // resolveProviderModel (called before resolveStructuredOutput) is what fails.
      expect(result).toFailWith(/unknown model alias "@openai:no-such-role"/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('end-to-end: an @alias resolving to a Responses-only model still coerces to text.format', async () => {
      const responsesOnlyDescriptor = makeDescriptor({
        id: 'openai',
        apiFormat: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-5.6-luna',
        aliases: { '@openai:special': 'gpt-9-special' },
        responsesOnlyModelPrefixes: ['gpt-9-special'],
        structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }]
      });
      mockFetchResponse(responsesApiResponse('{"foo":"bar"}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: responsesOnlyDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        modelOverride: '@openai:special',
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });

      expect(result).toSucceed();
      expect(lastRequestUrl()).toBe('https://api.openai.com/v1/responses');
      const body = lastRequestBody();
      expect(body.response_format).toBeUndefined();
      expect(body.text).toEqual({
        format: { type: 'json_schema', name: 'response', strict: true, schema: fooSchema.toJson() }
      });
    });
  });

  // ==========================================================================
  // G. Longest-prefix matching on structuredOutput entries
  // ==========================================================================

  describe('longest-prefix matching', () => {
    const descriptor = makeDescriptor({
      id: 'openai',
      apiFormat: 'openai',
      structuredOutput: [
        { modelPrefix: '', format: 'openai-json-schema' },
        { modelPrefix: 'gpt-5', format: 'openai-responses-format' },
        { modelPrefix: 'gpt-5.5', format: 'anthropic-tool-forced' }
      ]
    });

    test('the longest matching prefix wins, regardless of declaration order', () => {
      expect(AiAssist.resolveStructuredOutputCapability(descriptor, 'gpt-5.5.9')).toEqual({
        modelPrefix: 'gpt-5.5',
        format: 'anthropic-tool-forced'
      });
    });

    test('a shorter, still-matching prefix wins when the longest one does not match', () => {
      expect(AiAssist.resolveStructuredOutputCapability(descriptor, 'gpt-5.4')).toEqual({
        modelPrefix: 'gpt-5',
        format: 'openai-responses-format'
      });
    });

    test('the catch-all wins when nothing more specific matches', () => {
      expect(AiAssist.resolveStructuredOutputCapability(descriptor, 'gpt-4o')).toEqual({
        modelPrefix: '',
        format: 'openai-json-schema'
      });
    });

    test('undefined when the descriptor declares no structuredOutput at all', () => {
      const bare = makeDescriptor({ id: 'openai', apiFormat: 'openai', structuredOutput: undefined });
      expect(AiAssist.resolveStructuredOutputCapability(bare, 'gpt-5.6-luna')).toBeUndefined();
    });
  });

  describe('supportsStructuredOutput', () => {
    test('true when the descriptor declares at least one entry', () => {
      const descriptor = makeDescriptor({
        id: 'anthropic',
        apiFormat: 'anthropic',
        structuredOutput: [{ modelPrefix: '', format: 'anthropic-tool-forced' }]
      });
      expect(AiAssist.supportsStructuredOutput(descriptor)).toBe(true);
    });

    test('false when the descriptor declares no structuredOutput at all', () => {
      const descriptor = makeDescriptor({ id: 'groq', apiFormat: 'openai', structuredOutput: undefined });
      expect(AiAssist.supportsStructuredOutput(descriptor)).toBe(false);
    });
  });

  // ==========================================================================
  // H. callProxiedCompletion
  // ==========================================================================

  describe('callProxiedCompletion', () => {
    test('forwards the RAW schema (not the validator object) in the proxy body', async () => {
      mockFetchResponse({ content: '{"foo":"bar"}', structuredOutput: 'schema' });

      await AiAssist.callProxiedCompletion('http://localhost:3001', {
        descriptor: makeDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: fooSchema, onUnsupported: 'fail' }
      });

      const body = lastRequestBody();
      expect(body.structuredOutput).toEqual({
        mode: 'schema',
        schema: fooSchema.toJson(),
        onUnsupported: 'fail'
      });
      // Explicitly not the validator object — the raw wire form is JSON-serializable
      // and the validator is not.
      expect(typeof (body.structuredOutput as Record<string, unknown>).schema).toBe('object');
    });

    test('forwards a json-object mode request without an onUnsupported field when unset', async () => {
      mockFetchResponse({ content: '{"anything":true}', structuredOutput: 'json-mode' });

      await AiAssist.callProxiedCompletion('http://localhost:3001', {
        descriptor: makeDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'json-object' }
      });

      const body = lastRequestBody();
      expect(body.structuredOutput).toEqual({ mode: 'json-object' });
    });

    test('forwards a json-object mode request WITH an onUnsupported field when set', async () => {
      mockFetchResponse({ content: '{"anything":true}', structuredOutput: 'json-mode' });

      await AiAssist.callProxiedCompletion('http://localhost:3001', {
        descriptor: makeDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'json-object', onUnsupported: 'fail' }
      });

      const body = lastRequestBody();
      expect(body.structuredOutput).toEqual({ mode: 'json-object', onUnsupported: 'fail' });
    });

    test('passes through a proxy response that reports the enforcement it applied', async () => {
      mockFetchResponse({ content: '{"foo":"bar"}', structuredOutput: 'schema' });

      const result = await AiAssist.callProxiedCompletion('http://localhost:3001', {
        descriptor: makeDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('schema');
        expect(r.content).toBe('{"foo":"bar"}');
      });
    });

    test('fails when a request was made but the proxy omits structuredOutput (predates the feature)', async () => {
      mockFetchResponse({ content: '{"foo":"bar"}' });

      const result = await AiAssist.callProxiedCompletion('http://localhost:3001', {
        descriptor: makeDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });

      expect(result).toFailWith(/predate the feature/i);
    });

    test('succeeds with "none" when no structuredOutput request was made and the proxy omits it', async () => {
      mockFetchResponse({ content: 'plain text' });

      const result = await AiAssist.callProxiedCompletion('http://localhost:3001', {
        descriptor: makeDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('none');
        expect(r.content).toBe('plain text');
      });
      expect('structuredOutput' in lastRequestBody()).toBe(false);
    });
  });

  // ==========================================================================
  // I. OpenAI strict mode rejects schemas with optional properties
  // ==========================================================================
  //
  // `JsonSchema.optional(...)` emits a property absent from `required`. OpenAI's
  // `strict: true` requires EVERY property in `required`, so such a schema is a
  // hard 400 on both OpenAI wire formats. This is a capability mismatch routed
  // through `onUnsupported`, not relocated into an opaque provider error.

  describe('OpenAI strict mode: a required-and-nullable property is accepted', () => {
    // The counterpart to the suite below, and the point of `nullable`: the same
    // absent-able field, spelled so that every property stays in `required`. If this ever
    // starts degrading, the feature has silently stopped delivering what it exists for.
    const chatDescriptor = makeDescriptor({
      id: 'openai',
      apiFormat: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-5.6-luna',
      structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }]
    });

    test('sends the schema and reports "schema" rather than degrading', async () => {
      mockFetchResponse(openAiResponse('{}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: chatDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: nullablePropSchema }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('schema');
      });
      const body = lastRequestBody();
      const format = (body.response_format as Record<string, unknown>).json_schema as Record<string, unknown>;
      const schema = format.schema as Record<string, unknown>;
      // Both properties required — that is the whole constraint — and `b` nullable.
      expect(schema.required).toEqual(['a', 'b']);
      expect((schema.properties as Record<string, unknown>).b).toEqual({ type: ['string', 'null'] });
    });

    test('does not degrade under onUnsupported: fail either', async () => {
      mockFetchResponse(openAiResponse('{}'));

      expect(
        await AiAssist.callProviderCompletion({
          descriptor: chatDescriptor,
          apiKey: 'test-key',
          ...testPrompt.toRequest(),
          structuredOutput: { mode: 'schema', schema: nullablePropSchema, onUnsupported: 'fail' }
        })
      ).toSucceed();
    });
  });

  describe('OpenAI strict mode: schemas with optional properties', () => {
    const chatDescriptor = makeDescriptor({
      id: 'openai',
      apiFormat: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-5.6-luna',
      structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }]
    });

    test('Chat Completions: degrades to "none" by default, sending no response_format', async () => {
      mockFetchResponse(openAiResponse('plain text'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: chatDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: optionalPropSchema }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('none');
      });
      expect('response_format' in lastRequestBody()).toBe(false);
    });

    test('Chat Completions: onUnsupported: "fail" fails, naming the strict requirement', async () => {
      const result = await AiAssist.callProviderCompletion({
        descriptor: chatDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: optionalPropSchema, onUnsupported: 'fail' }
      });

      expect(result).toFailWith(
        /optional properties[\s\S]*strict structured output requires every property to be required/i
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('Responses API route: the SAME rule applies — degrades to "none" by default, no text.format', async () => {
      const descriptor = makeDescriptor({
        id: 'openai',
        apiFormat: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-5.6-luna',
        supportedTools: ['web_search'],
        structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }]
      });
      mockFetchResponse(responsesApiResponse('plain text'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools: [{ type: 'web_search' }],
        structuredOutput: { mode: 'schema', schema: optionalPropSchema }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('none');
      });
      expect(lastRequestUrl()).toBe('https://api.openai.com/v1/responses');
      expect('text' in lastRequestBody()).toBe(false);
    });

    test('Responses API route: the SAME rule applies — onUnsupported: "fail" fails, naming the strict requirement', async () => {
      const descriptor = makeDescriptor({
        id: 'openai',
        apiFormat: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-5.6-luna',
        supportedTools: ['web_search'],
        structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }]
      });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools: [{ type: 'web_search' }],
        structuredOutput: { mode: 'schema', schema: optionalPropSchema, onUnsupported: 'fail' }
      });

      expect(result).toFailWith(
        /optional properties[\s\S]*strict structured output requires every property to be required/i
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('a fully-required schema is unaffected: still sends response_format and reports "schema"', async () => {
      mockFetchResponse(openAiResponse('{"foo":"bar"}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: chatDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('schema');
      });
      expect(lastRequestBody().response_format).toEqual({
        type: 'json_schema',
        json_schema: { name: 'response', strict: true, schema: fooSchema.toJson() }
      });
    });

    test('Gemini is unaffected: an optional-property schema still sends responseSchema and reports "schema"', async () => {
      const descriptor = makeDescriptor({
        id: 'google-gemini',
        apiFormat: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: 'gemini-3.5-flash',
        structuredOutput: [{ modelPrefix: '', format: 'gemini-response-schema' }]
      });
      mockFetchResponse(geminiResponse('{"a":"x"}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: optionalPropSchema }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('schema');
      });
      const generationConfig = lastRequestBody().generationConfig as Record<string, unknown>;
      expect(generationConfig.responseSchema).toBeDefined();
    });

    test('Anthropic is unaffected: an optional-property schema still forces the tool and reports "tool-forced"', async () => {
      const descriptor = makeDescriptor({
        id: 'anthropic',
        apiFormat: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-sonnet-5',
        structuredOutput: [{ modelPrefix: '', format: 'anthropic-tool-forced' }]
      });
      mockFetchResponse(anthropicToolForcedResponse({ a: 'x' }));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: optionalPropSchema }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('tool-forced');
      });
      const tools = lastRequestBody().tools as ReadonlyArray<Record<string, unknown>>;
      expect(tools[0].input_schema).toEqual(optionalPropSchema.toJson());
    });

    test('the check is recursive: an optional property nested INSIDE another object is caught', async () => {
      const result = await AiAssist.callProviderCompletion({
        descriptor: chatDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: nestedOptionalSchema, onUnsupported: 'fail' }
      });

      expect(result).toFailWith(/optional properties/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('the check is recursive: an optional property nested inside an ARRAY ITEM schema is caught', async () => {
      const result = await AiAssist.callProviderCompletion({
        descriptor: chatDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: arrayItemOptionalSchema, onUnsupported: 'fail' }
      });

      expect(result).toFailWith(/optional properties/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // I2. adaptOptionalToNullable — hoisting the optionals that already admit null
  // ==========================================================================
  //
  // The refusal above is correct for `optional(string())`, whose validator rejects
  // `null`. It is over-broad for `optional(string({ nullable: true }))`: that node
  // is ALREADY `['string','null']` on the wire, so it differs from a required
  // sibling only by absence from `required`. Listing it there narrows the permitted
  // replies from absent-or-null-or-value to null-or-value — a strict SUBSET of what
  // the supplied schema accepts. The safety condition is read off the schema rather
  // than asserted by the caller, which is why the flag cannot be set wrongly.

  // The rewrite is exported, so its recursion contract is pinned directly as well as
  // through the wire. A property value that is not an object cannot come from
  // `ISchemaValidator.toJson()`, but `hoistNullableOptionals` is a total function over
  // `JsonValue` and reading `.type` off `null` would throw — so the guard is real and
  // is tested rather than assumed.
  describe('hoistNullableOptionals: malformed and exotic nodes', () => {
    test('leaves primitives, null and arrays of them untouched', () => {
      expect(hoistNullableOptionals('text')).toBe('text');
      expect(hoistNullableOptionals(7)).toBe(7);
      expect(hoistNullableOptionals(null)).toBeNull();
      expect(hoistNullableOptionals([1, 'a', null])).toEqual([1, 'a', null]);
    });

    test('a property whose value is not an object is never hoisted', () => {
      const malformed = {
        type: 'object',
        properties: { a: null, b: 'junk', c: [1, 2], d: { type: ['string', 'null'] } }
      } as unknown as JsonValue;
      // Only `d` — the one node that actually declares a nullable type — is hoisted.
      expect(hoistNullableOptionals(malformed)).toEqual({
        type: 'object',
        properties: { a: null, b: 'junk', c: [1, 2], d: { type: ['string', 'null'] } },
        required: ['d']
      });
    });

    test('an object with no properties map is returned structurally unchanged', () => {
      const node = { type: 'string', description: 'x' } as unknown as JsonValue;
      expect(hoistNullableOptionals(node)).toEqual(node);
    });

    test('an already-required nullable property is not duplicated in required', () => {
      const node = {
        type: 'object',
        properties: { a: { type: ['string', 'null'] } },
        required: ['a']
      } as unknown as JsonValue;
      expect(hoistNullableOptionals(node)).toEqual(node);
    });
  });

  describe('OpenAI strict mode: adaptOptionalToNullable', () => {
    const chatDescriptor = makeDescriptor({
      id: 'openai',
      apiFormat: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-5.6-luna',
      structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }]
    });

    /** Every optional is nullable — fully hoistable. */
    const hoistableSchema = JsonSchema.object({
      a: JsonSchema.string(),
      b: JsonSchema.optional(JsonSchema.string({ nullable: true }))
    });

    /** One nullable optional and one plain one — hoisting cannot rescue this schema. */
    const partlyHoistableSchema = JsonSchema.object({
      ok: JsonSchema.optional(JsonSchema.string({ nullable: true })),
      bad: JsonSchema.optional(JsonSchema.string())
    });

    /** Hoistable, but only reachable by recursing into an object and an array. */
    const deepHoistableSchema = JsonSchema.object({
      outer: JsonSchema.object({ inner: JsonSchema.optional(JsonSchema.integer({ nullable: true })) }),
      items: JsonSchema.array(
        JsonSchema.object({ x: JsonSchema.optional(JsonSchema.string({ nullable: true })) })
      )
    });

    test('THE SAFETY PROPERTY: every reply the hoisted schema permits, the supplied schema accepts', () => {
      // This is the whole justification for the flag, so it is pinned directly rather
      // than inferred from the wire tests below. Hoisting removes the caller's option
      // to omit the key; it never admits a value the caller would reject.
      expect(hoistableSchema.validate({ a: 'x', b: null })).toSucceedWith({ a: 'x', b: null });
      expect(hoistableSchema.validate({ a: 'x', b: 'y' })).toSucceedWith({ a: 'x', b: 'y' });
      // And the converse — the property that makes the NON-hoistable case a real refusal
      // rather than a conservative one.
      expect(optionalPropSchema.validate({ a: 'x', b: null })).toFail();
    });

    test('hoists the nullable optional into required and sends the schema, reporting "schema"', async () => {
      mockFetchResponse(openAiResponse('{"a":"x","b":null}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: chatDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: hoistableSchema, adaptOptionalToNullable: true }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('schema');
      });
      const sent = (lastRequestBody().response_format as Record<string, unknown>).json_schema as Record<
        string,
        unknown
      >;
      const schema = sent.schema as Record<string, unknown>;
      expect(schema.required).toEqual(['a', 'b']);
      // The node itself is untouched — only its membership in `required` changed.
      expect((schema.properties as Record<string, unknown>).b).toEqual({ type: ['string', 'null'] });
    });

    test('without the flag the SAME schema still refuses — the default is unchanged', async () => {
      mockFetchResponse(openAiResponse('plain text'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: chatDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: hoistableSchema }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('none');
      });
      expect('response_format' in lastRequestBody()).toBe(false);
    });

    test('a non-nullable optional is NOT hoisted: the schema still refuses, and nothing is sent', async () => {
      const result = await AiAssist.callProviderCompletion({
        descriptor: chatDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: {
          mode: 'schema',
          schema: partlyHoistableSchema,
          adaptOptionalToNullable: true,
          onUnsupported: 'fail'
        }
      });

      // The error names the adapt-specific situation rather than repeating the
      // generic advice, because the caller has already taken the generic advice.
      expect(result).toFailWith(/hoisted the ones that admit null, but at least one does not/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('a partly-hoistable schema degrades whole — it never sends a half-adapted schema', async () => {
      mockFetchResponse(openAiResponse('plain text'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: chatDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: {
          mode: 'schema',
          schema: partlyHoistableSchema,
          adaptOptionalToNullable: true
        }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('none');
      });
      expect('response_format' in lastRequestBody()).toBe(false);
    });

    test('hoisting is recursive: it reaches nested objects and array item schemas', async () => {
      mockFetchResponse(openAiResponse('{"outer":{"inner":null},"items":[]}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: chatDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: deepHoistableSchema, adaptOptionalToNullable: true }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('schema');
      });
      const sent = (lastRequestBody().response_format as Record<string, unknown>).json_schema as Record<
        string,
        unknown
      >;
      const schema = sent.schema as Record<string, unknown>;
      const props = schema.properties as Record<string, Record<string, unknown>>;
      expect(props.outer.required).toEqual(['inner']);
      expect((props.items.items as Record<string, unknown>).required).toEqual(['x']);
    });

    test('the flag is inert where the rule does not apply: Gemini still sends the schema unhoisted', async () => {
      const descriptor = makeDescriptor({
        id: 'google-gemini',
        apiFormat: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: 'gemini-3.5-flash',
        structuredOutput: [{ modelPrefix: '', format: 'gemini-response-schema' }]
      });
      mockFetchResponse(geminiResponse('{"a":"x"}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: hoistableSchema, adaptOptionalToNullable: true }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('schema');
      });
      // Gemini has no all-required rule, so `b` keeps its optionality: the flag must
      // not narrow a reply on a provider that never needed it narrowed.
      const generationConfig = lastRequestBody().generationConfig as Record<string, unknown>;
      const schema = generationConfig.responseSchema as Record<string, unknown>;
      expect(schema.required).toEqual(['a']);
    });
  });

  // ==========================================================================
  // J. Server-tools conflict keys off the RESOLVED wire, not the declared format
  // ==========================================================================
  //
  // Anthropic + json-object has no expression on the wire (the forced-tool
  // mechanism needs a schema to force a tool to), so the request degrades to
  // sending nothing — and there is no tools-channel conflict to reject. Gemini
  // CAN express json-object (`responseMimeType` alone), so its conflict is real.

  describe('server-tools conflict resolved against the wire, not the declared format', () => {
    test('Anthropic + json-object + server tools: degrades to "none" (regression fix — the wire is empty, so there is nothing to conflict with)', async () => {
      const descriptor = makeDescriptor({
        id: 'anthropic',
        apiFormat: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-sonnet-5',
        supportedTools: ['web_search'],
        structuredOutput: [{ modelPrefix: '', format: 'anthropic-tool-forced' }]
      });
      mockFetchResponse(anthropicWithToolsResponse('a plain-text answer'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools: [{ type: 'web_search' }],
        structuredOutput: { mode: 'json-object' }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('none');
      });
      const body = lastRequestBody();
      // `tools` carries the CALLER's server tool, never clobbered by an empty
      // structured-output wire.
      expect((body.tools as ReadonlyArray<Record<string, unknown>>)[0].name).toBe('web_search');
      expect('tool_choice' in body).toBe(false);
    });

    test('Anthropic + json-object + server tools + onUnsupported: "fail": fails on enforceability, NOT on a tools conflict', async () => {
      const descriptor = makeDescriptor({
        id: 'anthropic',
        apiFormat: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-sonnet-5',
        supportedTools: ['web_search'],
        structuredOutput: [{ modelPrefix: '', format: 'anthropic-tool-forced' }]
      });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools: [{ type: 'web_search' }],
        structuredOutput: { mode: 'json-object', onUnsupported: 'fail' }
      });

      expect(result).toFailWith(/cannot enforce 'json-object'/i);
      if (result.isFailure()) {
        expect(result.message).not.toMatch(/server-side tools/i);
      }
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('Gemini + json-object + server tools: still fails — Gemini CAN express json-object, so the conflict is real (asymmetry with Anthropic)', async () => {
      const descriptor = makeDescriptor({
        id: 'google-gemini',
        apiFormat: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: 'gemini-3.5-flash',
        supportedTools: ['web_search'],
        structuredOutput: [{ modelPrefix: '', format: 'gemini-response-schema' }]
      });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools: [{ type: 'web_search' }],
        structuredOutput: { mode: 'json-object', onUnsupported: 'degrade' }
      });

      expect(result).toFailWith(/cannot combine a response schema with server-side tools/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('OpenAI + schema + server tools: succeeds — no conflict on that format', async () => {
      const descriptor = makeDescriptor({
        id: 'openai',
        apiFormat: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-5.6-luna',
        supportedTools: ['web_search'],
        structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }]
      });
      mockFetchResponse(responsesApiResponse('{"foo":"bar"}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools: [{ type: 'web_search' }],
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('schema');
      });
      expect(lastRequestUrl()).toBe('https://api.openai.com/v1/responses');
      expect(lastRequestBody().text).toEqual({
        format: { type: 'json_schema', name: 'response', strict: true, schema: fooSchema.toJson() }
      });
    });
  });

  // ==========================================================================
  // K. OpenAI json-object mode requires "json" somewhere in the conversation
  // ==========================================================================
  //
  // OpenAI 400s on `response_format: { type: 'json_object' }` unless a message
  // mentions JSON. `callProviderCompletion` pre-empts this with a named failure
  // before the wire call, the same treatment the Gemini grounding-plus-tools
  // conflict already gets.

  describe('OpenAI json-object mode pre-flight: requires the word "json"', () => {
    const descriptor = makeDescriptor({
      id: 'openai',
      apiFormat: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-5.6-luna',
      structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }]
    });

    test('fails, naming the requirement, when no message mentions json anywhere — and makes no wire call', async () => {
      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'json-object' }
      });

      expect(result).toFailWith(/json/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('the word in the system prompt satisfies the requirement', async () => {
      mockFetchResponse(openAiResponse('{"anything":true}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: 'Respond using json only.',
        messages: [{ role: 'user', content: 'Generate a recipe' }],
        structuredOutput: { mode: 'json-object' }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('json-mode');
      });
    });

    test('the word in a message satisfies the requirement', async () => {
      mockFetchResponse(openAiResponse('{"anything":true}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        messages: [{ role: 'user', content: 'Generate a recipe and reply with json.' }],
        structuredOutput: { mode: 'json-object' }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('json-mode');
      });
    });

    test('the check is case-insensitive: uppercase JSON in the system prompt satisfies it', async () => {
      mockFetchResponse(openAiResponse('{"anything":true}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: 'Respond using JSON only.',
        messages: [{ role: 'user', content: 'Generate a recipe' }],
        structuredOutput: { mode: 'json-object' }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('json-mode');
      });
    });

    test('the check is case-insensitive: mixed-case Json in a message satisfies it', async () => {
      mockFetchResponse(openAiResponse('{"anything":true}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        messages: [{ role: 'user', content: 'Reply with Json please.' }],
        structuredOutput: { mode: 'json-object' }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('json-mode');
      });
    });

    test('Gemini has no such rule: succeeds with no mention of json anywhere', async () => {
      const geminiDescriptor = makeDescriptor({
        id: 'google-gemini',
        apiFormat: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: 'gemini-3.5-flash',
        structuredOutput: [{ modelPrefix: '', format: 'gemini-response-schema' }]
      });
      mockFetchResponse(geminiResponse('{"anything":true}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: geminiDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'json-object' }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('json-mode');
      });
    });

    test('OpenAI + schema mode is unaffected: succeeds with no mention of json anywhere (the rule is json-object only)', async () => {
      mockFetchResponse(openAiResponse('{"foo":"bar"}'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        structuredOutput: { mode: 'schema', schema: fooSchema }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('schema');
      });
    });
  });
});
