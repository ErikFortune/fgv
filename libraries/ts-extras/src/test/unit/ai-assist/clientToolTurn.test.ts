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
 * Tests for `executeClientToolTurn` — the single-turn client-tool helper.
 *
 * @remarks
 * Split out of `clientToolContinuationBuilder.test.ts` when that file reached
 * the 2000-line `max-lines` cap; the per-provider continuation builders it also
 * covered stay there.
 */

import '@fgv/ts-utils-jest';

import { fail, succeed } from '@fgv/ts-utils';
import { JsonSchema } from '@fgv/ts-json-base';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { executeClientToolTurn } from '../../../packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiClientTool, IAiProviderDescriptor, IAiStreamEvent } from '../../../packlets/ai-assist/model';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { AiPrompt } from '../../../packlets/ai-assist/model';

// ============================================================================
// Test helpers
// ============================================================================
// ============================================================================
// Test helpers
// ============================================================================

function makeReadable(chunks: ReadonlyArray<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller: ReadableStreamDefaultController<Uint8Array>): void {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]));
      } else {
        controller.close();
      }
    }
  });
}

function mockSseResponse(chunks: ReadonlyArray<string>, status: number = 200): void {
  const body = makeReadable(chunks);
  const response = {
    ok: status >= 200 && status < 300,
    status,
    body,
    text: jest.fn().mockResolvedValue(''),
    headers: new Map([['content-type', 'text/event-stream']])
  };
  (global.fetch as jest.Mock).mockResolvedValue(response);
}

async function collect(iter: AsyncIterable<IAiStreamEvent>): Promise<IAiStreamEvent[]> {
  const out: IAiStreamEvent[] = [];
  for await (const event of iter) {
    out.push(event);
  }
  return out;
}

const testPrompt = new AiPrompt('hello', 'system');

function makeAnthropicDescriptor(): IAiProviderDescriptor {
  return {
    id: 'anthropic',
    label: 'Anthropic',
    buttonLabel: 'Anthropic',
    needsSecret: true,
    apiFormat: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-6',
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    thinkingMode: 'optional'
  };
}

function makeOpenAiDescriptor(): IAiProviderDescriptor {
  return {
    id: 'openai',
    label: 'OpenAI',
    buttonLabel: 'OpenAI',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    thinkingMode: 'unsupported'
  };
}

function makeGeminiDescriptor(): IAiProviderDescriptor {
  return {
    id: 'google-gemini',
    label: 'Gemini',
    buttonLabel: 'Gemini',
    needsSecret: true,
    apiFormat: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    thinkingMode: 'optional'
  };
}

// ============================================================================
// executeClientToolTurn
// ============================================================================

describe('executeClientToolTurn', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const recallSchema = JsonSchema.object({ query: JsonSchema.string() });
  type RecallParams = JsonSchema.Static<typeof recallSchema>;

  function makeMemoryTool(handler: (args: RecallParams) => Promise<string>): IAiClientTool<RecallParams> {
    return {
      config: {
        type: 'client_tool',
        name: 'recall_memory',
        description: 'Recall stored context',
        parametersSchema: recallSchema
      },
      execute: async (args) => {
        const result = await handler(args);
        return succeed(result);
      }
    };
  }

  // ---- Anthropic SSE helpers ------------------------------------------------

  function anthropicToolUseSse(toolId: string, toolName: string, argsJson: string): string[] {
    return [
      `event: content_block_start\ndata: ${JSON.stringify({
        index: 0,
        content_block: { type: 'tool_use', id: toolId, name: toolName }
      })}\n\n`,
      `event: content_block_delta\ndata: ${JSON.stringify({
        index: 0,
        delta: { type: 'input_json_delta', partial_json: argsJson }
      })}\n\n`,
      `event: content_block_stop\ndata: ${JSON.stringify({ index: 0 })}\n\n`,
      `event: message_delta\ndata: ${JSON.stringify({ delta: { stop_reason: 'tool_use' } })}\n\n`,
      `event: message_stop\ndata: {}\n\n`
    ];
  }

  function anthropicDoneSse(): string[] {
    return [
      `event: content_block_start\ndata: ${JSON.stringify({
        index: 0,
        content_block: { type: 'text' }
      })}\n\n`,
      `event: content_block_delta\ndata: ${JSON.stringify({
        index: 0,
        delta: { type: 'text_delta', text: 'done' }
      })}\n\n`,
      `event: content_block_stop\ndata: ${JSON.stringify({ index: 0 })}\n\n`,
      `event: message_delta\ndata: ${JSON.stringify({ delta: { stop_reason: 'end_turn' } })}\n\n`,
      `event: message_stop\ndata: {}\n\n`
    ];
  }

  // ---- Gemini SSE helpers ---------------------------------------------------

  function geminiToolCallSse(toolName: string, args: Record<string, unknown>): string[] {
    return [
      `data: ${JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ functionCall: { name: toolName, args } }]
            },
            finishReason: 'TOOL_CODE'
          }
        ]
      })}\n\n`,
      `data: ${JSON.stringify({
        candidates: [
          {
            content: { parts: [{ text: '' }] },
            finishReason: 'STOP'
          }
        ]
      })}\n\n`
    ];
  }

  // --------------------------------------------------------------------------

  // Helper: mock fetch to capture the request body and immediately return a
  // minimal well-formed SSE response that closes the stream cleanly.
  function mockFetchCapturingBody(
    onCapture: (body: Record<string, unknown>) => void,
    sseLine: string = 'event: message_stop\ndata: {}\n\n'
  ): void {
    const encoder = new TextEncoder();
    (global.fetch as jest.Mock).mockImplementation((...args: unknown[]) => {
      const init = args[1] as RequestInit;
      onCapture(JSON.parse(init.body as string) as Record<string, unknown>);
      const body = new ReadableStream<Uint8Array>({
        start(controller: ReadableStreamDefaultController<Uint8Array>): void {
          controller.enqueue(encoder.encode(sseLine));
          controller.close();
        }
      });
      return Promise.resolve({
        ok: true,
        status: 200,
        body,
        text: jest.fn().mockResolvedValue(''),
        headers: new Map([['content-type', 'text/event-stream']])
      });
    });
  }

  // ============================================================================
  // P1-1 regression: client tools must reach the provider in the request body
  // ============================================================================

  test('fails fast when the current turn has attachments and the provider does not accept image input', () => {
    const result = executeClientToolTurn({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'test-key',
      messages: [
        { role: 'user', content: 'describe', attachments: [{ mimeType: 'image/png', base64: 'AA' }] }
      ],
      clientTools: [makeMemoryTool(async () => 'irrelevant')] as IAiClientTool[],
      model: 'claude-sonnet-4-6'
    });
    expect(result).toFailWith(/does not accept image input/i);
  });

  test('fails fast when no model resolves (parity with the direct entry points)', () => {
    const result = executeClientToolTurn({
      descriptor: { ...makeAnthropicDescriptor(), defaultModel: '' },
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      clientTools: [makeMemoryTool(async () => 'irrelevant')] as IAiClientTool[]
    });
    expect(result).toFailWith(/no model resolved/i);
  });

  describe('client tools reach the provider (P1-1 regression)', () => {
    test('Anthropic: request body tools array contains input_schema entry for client tool', async () => {
      let capturedBody: Record<string, unknown> | undefined;
      mockFetchCapturingBody((b) => {
        capturedBody = b;
      });

      const tool = makeMemoryTool(async () => 'irrelevant');
      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'claude-sonnet-4-6'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      await collect(result.value.events);

      // The Anthropic wire format for a client tool is { name, description, input_schema }
      expect(capturedBody).toBeDefined();
      const tools = capturedBody?.tools as unknown[] | undefined;
      expect(tools).toBeDefined();
      const clientToolEntry = (tools ?? []).find(
        (t) => (t as Record<string, unknown>).name === 'recall_memory'
      );
      expect(clientToolEntry).toBeDefined();
      expect((clientToolEntry as Record<string, unknown>).input_schema).toBeDefined();
      expect((clientToolEntry as Record<string, unknown>).description).toBe('Recall stored context');
    });

    test('Anthropic: server tools and client tools coexist in request body', async () => {
      let capturedBody: Record<string, unknown> | undefined;
      mockFetchCapturingBody((b) => {
        capturedBody = b;
      });

      const tool = makeMemoryTool(async () => 'irrelevant');
      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools: [{ type: 'web_search' }],
        clientTools: [tool] as IAiClientTool[],
        model: 'claude-sonnet-4-6'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      await collect(result.value.events);

      // Both the server tool (type: 'web_search_20250305') and the client tool must be present.
      expect(capturedBody).toBeDefined();
      const tools = capturedBody?.tools as unknown[] | undefined;
      expect(tools).toBeDefined();
      expect((tools ?? []).length).toBeGreaterThanOrEqual(2);
      const hasWebSearch = (tools ?? []).some(
        (t) => (t as Record<string, unknown>).type === 'web_search_20250305'
      );
      const hasClientTool = (tools ?? []).some(
        (t) => (t as Record<string, unknown>).name === 'recall_memory'
      );
      expect(hasWebSearch).toBe(true);
      expect(hasClientTool).toBe(true);
    });

    test('OpenAI: request body tools array contains function entry for client tool', async () => {
      let capturedBody: Record<string, unknown> | undefined;
      mockFetchCapturingBody((b) => {
        capturedBody = b;
      }, `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`);

      const tool = makeMemoryTool(async () => 'irrelevant');
      const result = executeClientToolTurn({
        descriptor: makeOpenAiDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'gpt-4o'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      await collect(result.value.events);

      // The OpenAI/Responses API wire format for a client tool is { type: 'function', name, description, parameters }
      expect(capturedBody).toBeDefined();
      const tools = capturedBody?.tools as unknown[] | undefined;
      expect(tools).toBeDefined();
      const clientToolEntry = (tools ?? []).find(
        (t) =>
          (t as Record<string, unknown>).type === 'function' &&
          (t as Record<string, unknown>).name === 'recall_memory'
      );
      expect(clientToolEntry).toBeDefined();
      expect((clientToolEntry as Record<string, unknown>).description).toBe('Recall stored context');
      expect((clientToolEntry as Record<string, unknown>).parameters).toBeDefined();
    });

    test('Gemini: request body tools contain functionDeclarations entry for client tool', async () => {
      let capturedBody: Record<string, unknown> | undefined;
      mockFetchCapturingBody(
        (b) => {
          capturedBody = b;
        },
        `data: ${JSON.stringify({
          candidates: [{ content: { parts: [{ text: '' }] }, finishReason: 'STOP' }]
        })}\n\n`
      );

      const tool = makeMemoryTool(async () => 'irrelevant');
      const result = executeClientToolTurn({
        descriptor: makeGeminiDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'gemini-2.5-flash'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      await collect(result.value.events);

      // Gemini groups client tools under { function_declarations: [...] }
      expect(capturedBody).toBeDefined();
      const tools = capturedBody?.tools as unknown[] | undefined;
      expect(tools).toBeDefined();
      const functionDeclarationsEntry = (tools ?? []).find(
        (t) => (t as Record<string, unknown>).function_declarations !== undefined
      );
      expect(functionDeclarationsEntry).toBeDefined();
      const functionDeclarations = (functionDeclarationsEntry as Record<string, unknown>)
        .function_declarations as unknown[];
      expect(functionDeclarations).toBeDefined();
      const memoryDecl = functionDeclarations.find(
        (d) => (d as Record<string, unknown>).name === 'recall_memory'
      );
      expect(memoryDecl).toBeDefined();
      expect((memoryDecl as Record<string, unknown>).description).toBe('Recall stored context');
    });
  });

  // --------------------------------------------------------------------------

  describe('id-correlation failure surfaces through nextTurn (defense-in-depth)', () => {
    test('fails nextTurn loud when an executed tool result cannot be correlated to a buffered tool_use id', async () => {
      // Drive a buffer-index collision: two tool_use blocks reuse SSE index 0, so
      // the executed result (toolu_A) is keyed to a buffer entry that the later
      // block (toolu_B) overwrote. The builder must fail loud rather than emit a
      // continuation whose tool_result references an id absent from the assistant
      // turn — exactly the "malformed identifier" class. End-to-end proof that the
      // single-source-of-truth guard wires through executeClientToolTurn.
      const sse = [
        `event: content_block_start\ndata: ${JSON.stringify({
          index: 0,
          content_block: { type: 'tool_use', id: 'toolu_A', name: 'recall_memory' }
        })}\n\n`,
        `event: content_block_delta\ndata: ${JSON.stringify({
          index: 0,
          delta: { type: 'input_json_delta', partial_json: '{"query":"a"}' }
        })}\n\n`,
        `event: content_block_stop\ndata: ${JSON.stringify({ index: 0 })}\n\n`,
        // Second tool_use reuses index 0, overwriting toolu_A in the buffer.
        `event: content_block_start\ndata: ${JSON.stringify({
          index: 0,
          content_block: { type: 'tool_use', id: 'toolu_B', name: 'recall_memory' }
        })}\n\n`,
        `event: message_delta\ndata: ${JSON.stringify({ delta: { stop_reason: 'tool_use' } })}\n\n`,
        `event: message_stop\ndata: {}\n\n`
      ];
      mockSseResponse(sse);
      const tool = makeMemoryTool(async (args) => `result-${args.query}`);

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'claude-sonnet-4-6'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      const events = await collect(result.value.events);
      const turnResult = await result.value.nextTurn;

      expect(turnResult).toFailWith(/toolu_A.*does not match any buffered/i);
      // The failure also surfaces inline on the event stream (parity with the
      // stream-open-failure path), not only via nextTurn.
      expect(events.some((e) => e.type === 'error' && /does not match any buffered/i.test(e.message))).toBe(
        true
      );
    });
  });

  describe('happy-path round-trip (Anthropic)', () => {
    test('executes memory tool and resolves nextTurn with continuation', async () => {
      mockSseResponse(anthropicToolUseSse('toolu_01', 'recall_memory', '{"query":"user prefs"}'));
      const tool = makeMemoryTool(async (args) => `User prefers ${args.query}`);

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'claude-sonnet-4-6'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      const events = await collect(result.value.events);
      const turnResult = await result.value.nextTurn;

      expect(events.some((e) => e.type === 'client-tool-call-start')).toBe(true);
      expect(events.some((e) => e.type === 'client-tool-call-done')).toBe(true);
      expect(events.some((e) => e.type === 'client-tool-result')).toBe(true);

      const resultEvent = events.find((e) => e.type === 'client-tool-result');
      expect(resultEvent).toBeDefined();
      if (resultEvent?.type === 'client-tool-result') {
        expect(resultEvent.isError).toBe(false);
        expect(resultEvent.toolName).toBe('recall_memory');
      }

      expect(turnResult).toSucceedAndSatisfy((r) => {
        expect(r.continuation).toBeDefined();
        expect(r.continuation?.toolCallsSummary).toHaveLength(1);
        expect(r.continuation?.toolCallsSummary[0].toolName).toBe('recall_memory');
        expect(r.continuation?.toolCallsSummary[0].isError).toBe(false);
      });
    });
  });

  describe('endpoint override', () => {
    test('substitutes endpoint for descriptor.baseUrl on the tool-turn request', async () => {
      mockSseResponse(anthropicDoneSse());

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [makeMemoryTool(async () => 'unused')] as IAiClientTool[],
        model: 'claude-sonnet-4-6',
        endpoint: 'http://localhost:11434/v1'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      await collect(result.value.events);
      await result.value.nextTurn;

      const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchUrl).toBe('http://localhost:11434/v1/messages');
    });

    test('falls back to descriptor.baseUrl when no endpoint is supplied', async () => {
      mockSseResponse(anthropicDoneSse());

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [makeMemoryTool(async () => 'unused')] as IAiClientTool[],
        model: 'claude-sonnet-4-6'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      await collect(result.value.events);
      await result.value.nextTurn;

      const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchUrl).toBe('https://api.anthropic.com/v1/messages');
    });

    test('honors endpoint when descriptor.baseUrl is empty (local / openai-compat server)', async () => {
      mockSseResponse(anthropicDoneSse());

      const result = executeClientToolTurn({
        descriptor: { ...makeAnthropicDescriptor(), baseUrl: '' },
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [makeMemoryTool(async () => 'unused')] as IAiClientTool[],
        model: 'claude-sonnet-4-6',
        endpoint: 'http://192.168.1.42:1234/v1'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      await collect(result.value.events);
      await result.value.nextTurn;

      const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchUrl).toBe('http://192.168.1.42:1234/v1/messages');
    });

    test('rejects a malformed endpoint up front, before opening the stream', () => {
      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [makeMemoryTool(async () => 'unused')] as IAiClientTool[],
        model: 'claude-sonnet-4-6',
        endpoint: 'not a url'
      });

      expect(result).toFailWith(/endpoint is not a valid URL/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('model optional — falls back to descriptor.defaultModel when omitted', () => {
    test('uses descriptor.defaultModel when model is not supplied', async () => {
      // P2-5: model is optional; when absent, resolveModel(descriptor.defaultModel) is used.
      let capturedBody: Record<string, unknown> | undefined;
      const encoder = new TextEncoder();
      (global.fetch as jest.Mock).mockImplementation((...args: unknown[]) => {
        const init = args[1] as RequestInit;
        capturedBody = JSON.parse(init.body as string) as Record<string, unknown>;
        const body = new ReadableStream<Uint8Array>({
          start(controller: ReadableStreamDefaultController<Uint8Array>): void {
            controller.enqueue(encoder.encode('event: message_stop\ndata: {}\n\n'));
            controller.close();
          }
        });
        return Promise.resolve({
          ok: true,
          status: 200,
          body,
          text: jest.fn().mockResolvedValue(''),
          headers: new Map([['content-type', 'text/event-stream']])
        });
      });

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [] as IAiClientTool[]
        // model is intentionally omitted
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      await collect(result.value.events);

      // The default model for the Anthropic descriptor is 'claude-sonnet-4-6'
      expect(capturedBody?.model).toBe('claude-sonnet-4-6');
    });
  });

  describe('happy-path round-trip (Gemini)', () => {
    test('executes memory tool via Gemini functionCall and resolves nextTurn', async () => {
      mockSseResponse(geminiToolCallSse('recall_memory', { query: 'prefs' }));
      const tool = makeMemoryTool(async (args) => `pref-${args.query}`);

      const result = executeClientToolTurn({
        descriptor: makeGeminiDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'gemini-2.5-flash'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      const events = await collect(result.value.events);
      const turnResult = await result.value.nextTurn;

      expect(events.some((e) => e.type === 'client-tool-call-done')).toBe(true);
      expect(events.some((e) => e.type === 'client-tool-result')).toBe(true);

      expect(turnResult).toSucceedAndSatisfy((r) => {
        expect(r.continuation).toBeDefined();
        expect(r.continuation?.messages[0]).toMatchObject({ role: 'model' });
        expect(r.continuation?.messages[1]).toMatchObject({ role: 'user' });
      });
    });
  });

  describe('no tool calls → continuation: undefined', () => {
    test('resolves with continuation: undefined when model does not call any tools', async () => {
      mockSseResponse(anthropicDoneSse());
      const tool = makeMemoryTool(async () => 'never called');

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'claude-sonnet-4-6'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      await collect(result.value.events);
      const turnResult = await result.value.nextTurn;

      expect(turnResult).toSucceedAndSatisfy((r) => {
        expect(r.continuation).toBeUndefined();
        expect(r.fullText).toBe('done');
      });
    });
  });

  describe('unknown tool name', () => {
    test('emits client-tool-result with isError=true and resolves nextTurn as Result.fail', async () => {
      mockSseResponse(anthropicToolUseSse('toolu_unk', 'unknown_tool', '{}'));

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [],
        model: 'claude-sonnet-4-6'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      const events = await collect(result.value.events);
      const turnResult = await result.value.nextTurn;

      const errorEvent = events.find((e) => e.type === 'client-tool-result');
      expect(errorEvent).toBeDefined();
      if (errorEvent?.type === 'client-tool-result') {
        expect(errorEvent.isError).toBe(true);
        expect(errorEvent.result).toMatch(/unknown tool/i);
      }

      expect(turnResult).toFailWith(/unknown tool/i);
    });
  });

  describe('schema validation failure', () => {
    test('emits client-tool-result with isError=true and continues (does not fail nextTurn)', async () => {
      // Send args that fail the schema (query is missing → extra property only, no string)
      mockSseResponse(anthropicToolUseSse('toolu_bad', 'recall_memory', '{"wrong_field":"x"}'));
      const tool = makeMemoryTool(async () => 'should not be called');

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'claude-sonnet-4-6'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      const events = await collect(result.value.events);
      const turnResult = await result.value.nextTurn;

      const resultEvent = events.find((e) => e.type === 'client-tool-result');
      expect(resultEvent).toBeDefined();
      if (resultEvent?.type === 'client-tool-result') {
        expect(resultEvent.isError).toBe(true);
      }

      // nextTurn should still resolve as success (stream completed; tool error is in continuation)
      expect(turnResult).toSucceedAndSatisfy((r) => {
        expect(r.continuation).toBeDefined();
        expect(r.continuation?.toolCallsSummary[0].isError).toBe(true);
      });
    });
  });

  describe('execute returning Result.fail', () => {
    test('emits client-tool-result with isError=true and includes error in continuation', async () => {
      mockSseResponse(anthropicToolUseSse('toolu_fail', 'recall_memory', '{"query":"x"}'));
      const tool: IAiClientTool<RecallParams> = {
        config: {
          type: 'client_tool',
          name: 'recall_memory',
          description: 'Recall',
          parametersSchema: recallSchema
        },
        execute: async () => fail('memory service unavailable')
      };

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'claude-sonnet-4-6'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      const events = await collect(result.value.events);
      const turnResult = await result.value.nextTurn;

      const resultEvent = events.find((e) => e.type === 'client-tool-result');
      expect(resultEvent).toBeDefined();
      if (resultEvent?.type === 'client-tool-result') {
        expect(resultEvent.isError).toBe(true);
        expect(resultEvent.result).toMatch(/memory service unavailable/i);
      }

      expect(turnResult).toSucceedAndSatisfy((r) => {
        expect(r.continuation).toBeDefined();
        expect(r.continuation?.toolCallsSummary[0].isError).toBe(true);
        expect(r.continuation?.toolCallsSummary[0].result).toMatch(/memory service unavailable/i);
      });
    });
  });

  describe('execute throwing', () => {
    test('emits client-tool-result with isError=true when execute callback throws', async () => {
      mockSseResponse(anthropicToolUseSse('toolu_throw', 'recall_memory', '{"query":"x"}'));
      const tool: IAiClientTool<RecallParams> = {
        config: {
          type: 'client_tool',
          name: 'recall_memory',
          description: 'Recall',
          parametersSchema: recallSchema
        },
        execute: async () => {
          throw new Error('unexpected crash');
        }
      };

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'claude-sonnet-4-6'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      const events = await collect(result.value.events);
      const turnResult = await result.value.nextTurn;

      const resultEvent = events.find((e) => e.type === 'client-tool-result');
      expect(resultEvent).toBeDefined();
      if (resultEvent?.type === 'client-tool-result') {
        expect(resultEvent.isError).toBe(true);
        expect(resultEvent.result).toMatch(/unexpected crash/i);
      }

      expect(turnResult).toSucceedAndSatisfy((r) => {
        expect(r.continuation?.toolCallsSummary[0].isError).toBe(true);
      });
    });
  });

  describe('stream open failure', () => {
    test('yields error event and resolves nextTurn as fail when stream fails to open', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('network failure'));

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [],
        model: 'claude-sonnet-4-6'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      const events = await collect(result.value.events);
      const turnResult = await result.value.nextTurn;

      expect(events.some((e) => e.type === 'error')).toBe(true);
      expect(turnResult).toFailWith(/network failure/i);
    });
  });

  describe('error event mid-stream', () => {
    test('yields error event and resolves nextTurn as fail when stream emits error event', async () => {
      // Anthropic emits 'event: error' with a JSON payload containing an error message.
      const errorSse = [
        `event: error\ndata: ${JSON.stringify({
          error: { type: 'server_error', message: 'internal server error' }
        })}\n\n`
      ];
      mockSseResponse(errorSse);

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [],
        model: 'claude-sonnet-4-6'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      const events = await collect(result.value.events);
      const turnResult = await result.value.nextTurn;

      expect(events.some((e) => e.type === 'error')).toBe(true);
      expect(turnResult).toFailWith(/internal server error/i);
    });
  });

  describe('tool result serialization failures', () => {
    test('emits isError result event when tool returns a circular structure', async () => {
      mockSseResponse(anthropicToolUseSse('toolu_01', 'recall_memory', '{"query":"x"}'));

      interface ICircularValue {
        self?: ICircularValue;
      }
      const circular: ICircularValue = {};
      circular.self = circular;

      const tool: IAiClientTool = {
        config: {
          type: 'client_tool',
          name: 'recall_memory',
          description: 'Recall stored context',
          parametersSchema: recallSchema
        },
        execute: async () => succeed(circular)
      };

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool],
        model: 'claude-sonnet-4-6'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      const events = await collect(result.value.events);
      const resultEvent = events.find((e) => e.type === 'client-tool-result');
      expect(resultEvent).toBeDefined();
      if (resultEvent?.type === 'client-tool-result') {
        expect(resultEvent.isError).toBe(true);
        expect(resultEvent.toolName).toBe('recall_memory');
        expect(resultEvent.result).toMatch(/failed to serialize tool result/i);
        expect(resultEvent.result).toMatch(/recall_memory/);
      }
    });

    test('emits isError result event when tool returns undefined (JSON.stringify produces undefined)', async () => {
      mockSseResponse(anthropicToolUseSse('toolu_01', 'recall_memory', '{"query":"x"}'));

      const tool: IAiClientTool = {
        config: {
          type: 'client_tool',
          name: 'recall_memory',
          description: 'Recall stored context',
          parametersSchema: recallSchema
        },
        execute: async () => succeed(undefined)
      };

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool],
        model: 'claude-sonnet-4-6'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      const events = await collect(result.value.events);
      const resultEvent = events.find((e) => e.type === 'client-tool-result');
      expect(resultEvent).toBeDefined();
      if (resultEvent?.type === 'client-tool-result') {
        expect(resultEvent.isError).toBe(true);
        expect(resultEvent.toolName).toBe('recall_memory');
        expect(resultEvent.result).toMatch(/non-serializable value/i);
        expect(resultEvent.result).toMatch(/recall_memory/);
      }
    });
  });

  describe('duplicate client tool name', () => {
    test('returns Result.fail immediately when two tools share the same name', () => {
      const tool = makeMemoryTool(async () => 'irrelevant');
      const duplicate = makeMemoryTool(async () => 'also irrelevant');

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool, duplicate] as IAiClientTool[],
        model: 'claude-sonnet-4-6'
      });

      expect(result).toFailWith(/duplicate client tool name.*recall_memory/i);
    });
  });

  describe('explicit temperature', () => {
    test('passes explicit temperature through to the underlying adapter', async () => {
      mockSseResponse(anthropicDoneSse());

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [],
        model: 'claude-sonnet-4-6',
        temperature: 0.5
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      await collect(result.value.events);
      const turnResult = await result.value.nextTurn;
      expect(turnResult).toSucceedAndSatisfy((r) => {
        expect(r.continuation).toBeUndefined();
      });
    });
  });

  describe('tool-event passthrough', () => {
    test('forwards tool-event (web_search) events from the underlying stream', async () => {
      // Anthropic emits tool-event for server_tool_use blocks (web_search).
      const webSearchSse = [
        `event: content_block_start\ndata: ${JSON.stringify({
          index: 0,
          content_block: { type: 'server_tool_use', id: 'stu_01', name: 'web_search' }
        })}\n\n`,
        `event: content_block_stop\ndata: ${JSON.stringify({ index: 0 })}\n\n`,
        `event: content_block_start\ndata: ${JSON.stringify({
          index: 1,
          content_block: { type: 'web_search_tool_result' }
        })}\n\n`,
        `event: content_block_stop\ndata: ${JSON.stringify({ index: 1 })}\n\n`,
        `event: message_delta\ndata: ${JSON.stringify({ delta: { stop_reason: 'end_turn' } })}\n\n`,
        `event: message_stop\ndata: {}\n\n`
      ];
      mockSseResponse(webSearchSse);

      const result = executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [],
        model: 'claude-sonnet-4-6'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      const events = await collect(result.value.events);
      await result.value.nextTurn;

      expect(events.some((e) => e.type === 'tool-event')).toBe(true);
    });
  });

  // ============================================================================
  // Multi-round cumulative continuation (load-bearing regression reference)
  // ============================================================================

  describe('multi-round cumulative continuation', () => {
    // This test is the canonical reference that was missing when the footgun
    // was introduced. It drives 3 Anthropic tool rounds with mock fetch,
    // asserting that continuation.messages grows cumulatively each round and
    // that feeding it back via replace (not manual concat) produces the correct
    // wire tail on subsequent rounds.

    function anthropicToolUseSseForRound(toolId: string, query: string): string[] {
      return anthropicToolUseSse(toolId, 'recall_memory', `{"query":"${query}"}`);
    }

    test('continuation.messages is cumulative across 3 rounds and replace-pattern produces correct wire tail', async () => {
      const capturedBodies: Record<string, unknown>[] = [];

      // Sequence of fetch responses: rounds 1, 2, 3 each return a tool call; round 4 returns done.
      const responseQueue: string[][] = [
        anthropicToolUseSseForRound('toolu_r1', 'round1'),
        anthropicToolUseSseForRound('toolu_r2', 'round2'),
        anthropicToolUseSseForRound('toolu_r3', 'round3'),
        anthropicDoneSse()
      ];
      let callIndex = 0;
      const encoder = new TextEncoder();
      (global.fetch as jest.Mock).mockImplementation((...args: unknown[]) => {
        const init = args[1] as RequestInit;
        capturedBodies.push(JSON.parse(init.body as string) as Record<string, unknown>);
        const chunks = responseQueue[callIndex++] ?? anthropicDoneSse();
        const body = new ReadableStream<Uint8Array>({
          start(controller: ReadableStreamDefaultController<Uint8Array>): void {
            for (const chunk of chunks) {
              controller.enqueue(encoder.encode(chunk));
            }
            controller.close();
          }
        });
        return Promise.resolve({
          ok: true,
          status: 200,
          body,
          text: jest.fn().mockResolvedValue(''),
          headers: new Map([['content-type', 'text/event-stream']])
        });
      });

      const tool = makeMemoryTool(async (args) => `result-${args.query}`);
      const descriptor = makeAnthropicDescriptor();

      // --- Round 1: no prior continuation ---
      const r1 = executeClientToolTurn({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'claude-sonnet-4-6'
        // continuationMessages: omitted (first round)
      });
      expect(r1).toSucceed();
      if (r1.isFailure()) return;
      await collect(r1.value.events);
      const r1Result = await r1.value.nextTurn;

      // Round 1 should yield a continuation with exactly 2 messages (assistant + user)
      expect(r1Result).toSucceedAndSatisfy((r) => {
        expect(r.continuation).toBeDefined();
        expect(r.continuation!.messages).toHaveLength(2);
        expect(r.continuation!.messages[0].role).toBe('assistant');
        expect(r.continuation!.messages[1].role).toBe('user');
        // toolCallsSummary is per-round only
        expect(r.continuation!.toolCallsSummary).toHaveLength(1);
        expect(r.continuation!.toolCallsSummary[0].toolName).toBe('recall_memory');
      });

      const tail1 = r1Result.isSuccess() ? r1Result.value.continuation!.messages : [];

      // --- Round 2: supply round-1 tail via replace ---
      const r2 = executeClientToolTurn({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'claude-sonnet-4-6',
        continuationMessages: tail1
      });
      expect(r2).toSucceed();
      if (r2.isFailure()) return;
      await collect(r2.value.events);
      const r2Result = await r2.value.nextTurn;

      // Round 2: continuation.messages must be cumulative (round-1 tail + round-2 tail = 4 messages)
      expect(r2Result).toSucceedAndSatisfy((r) => {
        expect(r.continuation).toBeDefined();
        expect(r.continuation!.messages).toHaveLength(4);
        // First 2 are round-1's messages
        expect(r.continuation!.messages[0].role).toBe('assistant');
        expect(r.continuation!.messages[1].role).toBe('user');
        // Next 2 are round-2's messages
        expect(r.continuation!.messages[2].role).toBe('assistant');
        expect(r.continuation!.messages[3].role).toBe('user');
        // toolCallsSummary is per-round only (just round 2's call)
        expect(r.continuation!.toolCallsSummary).toHaveLength(1);
        expect(r.continuation!.toolCallsSummary[0].toolName).toBe('recall_memory');
      });

      const tail2 = r2Result.isSuccess() ? r2Result.value.continuation!.messages : [];

      // --- Round 3: supply cumulative round-1+2 tail via replace ---
      const r3 = executeClientToolTurn({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'claude-sonnet-4-6',
        continuationMessages: tail2
      });
      expect(r3).toSucceed();
      if (r3.isFailure()) return;
      await collect(r3.value.events);
      const r3Result = await r3.value.nextTurn;

      // Round 3: continuation.messages must be cumulative (all 3 rounds = 6 messages)
      expect(r3Result).toSucceedAndSatisfy((r) => {
        expect(r.continuation).toBeDefined();
        expect(r.continuation!.messages).toHaveLength(6);
        // Roles in order: assistant/user/assistant/user/assistant/user
        expect(r.continuation!.messages[0].role).toBe('assistant');
        expect(r.continuation!.messages[1].role).toBe('user');
        expect(r.continuation!.messages[2].role).toBe('assistant');
        expect(r.continuation!.messages[3].role).toBe('user');
        expect(r.continuation!.messages[4].role).toBe('assistant');
        expect(r.continuation!.messages[5].role).toBe('user');
        // toolCallsSummary is per-round only (just round 3's call)
        expect(r.continuation!.toolCallsSummary).toHaveLength(1);
      });

      const tail3 = r3Result.isSuccess() ? r3Result.value.continuation!.messages : [];

      // --- Round 4: final round returns no tool calls → continuation: undefined ---
      const r4 = executeClientToolTurn({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'claude-sonnet-4-6',
        continuationMessages: tail3
      });
      expect(r4).toSucceed();
      if (r4.isFailure()) return;
      await collect(r4.value.events);
      const r4Result = await r4.value.nextTurn;

      expect(r4Result).toSucceedAndSatisfy((r) => {
        expect(r.continuation).toBeUndefined();
      });

      // --- Wire tail verification: each round's request body contains the full prior tail ---
      // Round 1 (capturedBodies[0]): no tail — messages array has only the user turn
      const r1Messages = capturedBodies[0]?.messages as unknown[] | undefined;
      expect(r1Messages).toBeDefined();
      if (!r1Messages) return;
      // Anthropic wire: messages = [...head, userTurn, ...rawTail] — round 1 has no rawTail
      expect(r1Messages.filter((m) => (m as Record<string, unknown>).role === 'assistant')).toHaveLength(0);

      // Round 2 (capturedBodies[1]): tail = round-1 tail (2 messages appended after user turn)
      const r2Messages = capturedBodies[1]?.messages as unknown[] | undefined;
      expect(r2Messages).toBeDefined();
      if (!r2Messages) return;
      const r2AssistantItems = r2Messages.filter((m) => (m as Record<string, unknown>).role === 'assistant');
      // 1 assistant entry (from round-1 tail)
      expect(r2AssistantItems).toHaveLength(1);

      // Round 3 (capturedBodies[2]): tail = round-1 + round-2 tail (4 messages appended after user turn)
      const r3Messages = capturedBodies[2]?.messages as unknown[] | undefined;
      expect(r3Messages).toBeDefined();
      if (!r3Messages) return;
      const r3AssistantItems = r3Messages.filter((m) => (m as Record<string, unknown>).role === 'assistant');
      // 2 assistant entries (from rounds 1+2 tails)
      expect(r3AssistantItems).toHaveLength(2);

      // Round 4 (capturedBodies[3]): tail = rounds 1+2+3 (6 messages appended after user turn)
      const r4Messages = capturedBodies[3]?.messages as unknown[] | undefined;
      expect(r4Messages).toBeDefined();
      if (!r4Messages) return;
      const r4AssistantItems = r4Messages.filter((m) => (m as Record<string, unknown>).role === 'assistant');
      // 3 assistant entries (from rounds 1+2+3 tails)
      expect(r4AssistantItems).toHaveLength(3);
    });
  });

  describe('multi-round cumulative continuation (OpenAI)', () => {
    // Verifies the seam is provider-agnostic: OpenAI function_call/function_call_output items
    // accumulate just like Anthropic role/content messages do.

    function openAiToolCallSse(itemId: string, callId: string, toolName: string, argsJson: string): string[] {
      return [
        `event: response.output_item.added\ndata: ${JSON.stringify({
          item: { type: 'function_call', id: itemId, name: toolName, call_id: callId }
        })}\n\n`,
        `event: response.function_call_arguments.delta\ndata: ${JSON.stringify({
          item_id: itemId,
          delta: argsJson
        })}\n\n`,
        `event: response.function_call_arguments.done\ndata: ${JSON.stringify({
          item_id: itemId,
          arguments: argsJson
        })}\n\n`,
        `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
      ];
    }

    function openAiDoneSse(): string[] {
      return [
        `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
      ];
    }

    test('continuation.messages accumulates function_call/function_call_output items across 3 rounds', async () => {
      const capturedBodies: Record<string, unknown>[] = [];
      const responseQueue: string[][] = [
        openAiToolCallSse('fc_r1', 'call_r1', 'recall_memory', '{"query":"r1"}'),
        openAiToolCallSse('fc_r2', 'call_r2', 'recall_memory', '{"query":"r2"}'),
        openAiToolCallSse('fc_r3', 'call_r3', 'recall_memory', '{"query":"r3"}'),
        openAiDoneSse()
      ];
      let callIndex = 0;
      const encoder = new TextEncoder();
      (global.fetch as jest.Mock).mockImplementation((...args: unknown[]) => {
        const init = args[1] as RequestInit;
        capturedBodies.push(JSON.parse(init.body as string) as Record<string, unknown>);
        const chunks = responseQueue[callIndex++] ?? openAiDoneSse();
        const body = new ReadableStream<Uint8Array>({
          start(controller: ReadableStreamDefaultController<Uint8Array>): void {
            for (const chunk of chunks) {
              controller.enqueue(encoder.encode(chunk));
            }
            controller.close();
          }
        });
        return Promise.resolve({
          ok: true,
          status: 200,
          body,
          text: jest.fn().mockResolvedValue(''),
          headers: new Map([['content-type', 'text/event-stream']])
        });
      });

      const tool = makeMemoryTool(async (args) => `res-${args.query}`);
      const descriptor = makeOpenAiDescriptor();

      // Round 1
      const r1 = executeClientToolTurn({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'gpt-4o'
      });
      expect(r1).toSucceed();
      if (r1.isFailure()) return;
      await collect(r1.value.events);
      const r1Result = await r1.value.nextTurn;

      // Round 1: function_call + function_call_output = 2 items
      expect(r1Result).toSucceedAndSatisfy((r) => {
        expect(r.continuation).toBeDefined();
        expect(r.continuation!.messages).toHaveLength(2);
        expect(r.continuation!.messages[0].type).toBe('function_call');
        expect(r.continuation!.messages[1].type).toBe('function_call_output');
      });

      const tail1 = r1Result.isSuccess() ? r1Result.value.continuation!.messages : [];

      // Round 2
      const r2 = executeClientToolTurn({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'gpt-4o',
        continuationMessages: tail1
      });
      expect(r2).toSucceed();
      if (r2.isFailure()) return;
      await collect(r2.value.events);
      const r2Result = await r2.value.nextTurn;

      // Round 2: 4 items cumulative (round-1 + round-2 exchange)
      expect(r2Result).toSucceedAndSatisfy((r) => {
        expect(r.continuation).toBeDefined();
        expect(r.continuation!.messages).toHaveLength(4);
        expect(r.continuation!.messages[0].type).toBe('function_call');
        expect(r.continuation!.messages[1].type).toBe('function_call_output');
        expect(r.continuation!.messages[2].type).toBe('function_call');
        expect(r.continuation!.messages[3].type).toBe('function_call_output');
      });

      const tail2 = r2Result.isSuccess() ? r2Result.value.continuation!.messages : [];

      // Round 3
      const r3 = executeClientToolTurn({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        clientTools: [tool] as IAiClientTool[],
        model: 'gpt-4o',
        continuationMessages: tail2
      });
      expect(r3).toSucceed();
      if (r3.isFailure()) return;
      await collect(r3.value.events);
      const r3Result = await r3.value.nextTurn;

      // Round 3: 6 items cumulative (rounds 1+2+3)
      expect(r3Result).toSucceedAndSatisfy((r) => {
        expect(r.continuation).toBeDefined();
        expect(r.continuation!.messages).toHaveLength(6);
        const funcCallItems = r.continuation!.messages.filter((m) => m.type === 'function_call');
        const outputItems = r.continuation!.messages.filter((m) => m.type === 'function_call_output');
        expect(funcCallItems).toHaveLength(3);
        expect(outputItems).toHaveLength(3);
      });

      // Wire tail verification: round 2 body should contain the round-1 tail as input items
      const r2Body = capturedBodies[1]?.input as unknown[] | undefined;
      expect(r2Body).toBeDefined();
      if (!r2Body) return;
      const r2FuncCallItems = r2Body.filter((m) => (m as Record<string, unknown>).type === 'function_call');
      // 1 function_call from round-1 tail
      expect(r2FuncCallItems).toHaveLength(1);

      // Round 3 body should contain round-1+2 tails (4 items: 2 function_call + 2 function_call_output)
      const r3Body = capturedBodies[2]?.input as unknown[] | undefined;
      expect(r3Body).toBeDefined();
      if (!r3Body) return;
      const r3FuncCallItems = r3Body.filter((m) => (m as Record<string, unknown>).type === 'function_call');
      expect(r3FuncCallItems).toHaveLength(2);
    });
  });

  describe('OpenAI provider routing', () => {
    test('routes to OpenAI Responses adapter and builds function_call continuation', async () => {
      // Live wire shape: function_call_arguments.{delta,done} carry item_id (the fc_*/output-item id),
      // NOT call_id. The adapter correlates item_id → call_id via the earlier output_item.added event.
      const openAiSse = [
        `event: response.output_item.added\ndata: ${JSON.stringify({
          item: { type: 'function_call', id: 'fc_oi1', name: 'recall_memory', call_id: 'call_oi1' }
        })}\n\n`,
        `event: response.function_call_arguments.delta\ndata: ${JSON.stringify({
          item_id: 'fc_oi1',
          delta: '{"query"'
        })}\n\n`,
        `event: response.function_call_arguments.delta\ndata: ${JSON.stringify({
          item_id: 'fc_oi1',
          delta: ':"x"}'
        })}\n\n`,
        `event: response.function_call_arguments.done\ndata: ${JSON.stringify({
          item_id: 'fc_oi1',
          arguments: '{"query":"x"}'
        })}\n\n`,
        `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
      ];
      mockSseResponse(openAiSse);
      const tool = makeMemoryTool(async (args) => `res-${args.query}`);

      const result = executeClientToolTurn({
        descriptor: makeOpenAiDescriptor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools: [{ type: 'web_search' }],
        clientTools: [tool] as IAiClientTool[],
        model: 'gpt-4o'
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;

      const events = await collect(result.value.events);
      const turnResult = await result.value.nextTurn;

      expect(events.some((e) => e.type === 'client-tool-call-done')).toBe(true);

      expect(turnResult).toSucceedAndSatisfy((r) => {
        expect(r.continuation).toBeDefined();
        const funcCallItem = r.continuation?.messages.find((m) => m.type === 'function_call');
        expect(funcCallItem).toBeDefined();
        const outputItem = r.continuation?.messages.find((m) => m.type === 'function_call_output');
        expect(outputItem).toBeDefined();
      });
    });
  });
});
