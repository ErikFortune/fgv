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

import { AiAssist } from '../../..';
import {
  anthropicResponse,
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
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
});
