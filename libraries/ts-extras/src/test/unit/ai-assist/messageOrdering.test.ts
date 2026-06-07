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
 * The load-bearing structural guard for the `ai-assist-message-ordering` stream.
 *
 * Both turn entry points (`callProviderCompletion` and `executeClientToolTurn`)
 * now take the unified `{ system?, messages }` shape and own the
 * system/history/current-turn split internally. This test proves the footgun is
 * dead: given the **same** ordered `messages[]`, the completion path and the
 * client-tool turn path linearize history to the **identical** position relative
 * to the current user turn — for Anthropic, an OpenAI-shaped provider, and
 * Gemini. If the head/tail asymmetry ever returns, the symmetry assertion below
 * fails.
 */

import '@fgv/ts-utils-jest';

import { succeed, type Result } from '@fgv/ts-utils';
import { JsonSchema } from '@fgv/ts-json-base';

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiProviderDescriptor, IChatMessage, IAiStreamEvent } from '../../../packlets/ai-assist/model';

// ============================================================================
// Shared fixtures — the SAME ordered conversation fed through both paths
// ============================================================================

const SYSTEM: string = 'You are a helpful assistant.';

/** Ordered conversation: two history turns then the current user turn (last). */
const MESSAGES: ReadonlyArray<IChatMessage> = [
  { role: 'user', content: 'h1' },
  { role: 'assistant', content: 'h2' },
  { role: 'user', content: 'current' }
];

/** A normalized conversation turn extracted from a captured wire body. */
interface IConvTurn {
  readonly role: string;
  readonly text: string;
}

const recallSchema = JsonSchema.object({ query: JsonSchema.string() });

/** A trivial client tool so `executeClientToolTurn` has something to send. */
const clientTool: AiAssist.IAiClientTool = {
  config: {
    type: 'client_tool',
    name: 'recall_memory',
    description: 'Recall stored context',
    parametersSchema: recallSchema
  },
  execute: async (): Promise<Result<unknown>> => succeed('ok')
};

// ============================================================================
// fetch mocks (completion → JSON; tool turn → SSE)
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

function mockJsonResponse(body: unknown): void {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body))
  });
}

function mockSseResponse(sseLine: string): void {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      body: makeReadable([sseLine]),
      text: jest.fn().mockResolvedValue(''),
      headers: new Map([['content-type', 'text/event-stream']])
    })
  );
}

function capturedBody(): Record<string, unknown> {
  return JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body as string) as Record<string, unknown>;
}

async function drain(iter: AsyncIterable<IAiStreamEvent>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const _event of iter) {
    /* exhaust the stream so the request body is issued */
  }
}

// ============================================================================
// Per-provider configuration
// ============================================================================

type WirePath = 'completion' | 'tool';

interface IProviderCase {
  readonly descriptor: IAiProviderDescriptor;
  readonly model: string;
  /** A minimal valid non-streaming response for the completion path. */
  readonly completionResponse: unknown;
  /** A minimal SSE line that closes the client-tool stream cleanly. */
  readonly sseLine: string;
  /** Extracts the ordered conversation (excluding system) from a captured body. */
  readonly extract: (body: Record<string, unknown>, path: WirePath) => IConvTurn[];
}

function base(overrides: Partial<IAiProviderDescriptor>): IAiProviderDescriptor {
  return {
    id: 'anthropic',
    label: 'l',
    buttonLabel: 'b',
    needsSecret: true,
    apiFormat: 'anthropic',
    baseUrl: 'https://example.test/v1',
    defaultModel: 'm',
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    thinkingMode: 'optional',
    ...overrides
  };
}

/** Extracts `{ role, content }` messages (Anthropic / OpenAI), filtering system. */
function extractRoleContent(messages: unknown): IConvTurn[] {
  return (messages as Array<{ role: string; content: unknown }>)
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, text: m.content as string }));
}

const cases: ReadonlyArray<[string, IProviderCase]> = [
  [
    'anthropic',
    {
      descriptor: base({ id: 'anthropic', apiFormat: 'anthropic' }),
      model: 'claude-sonnet-4-6',
      completionResponse: { content: [{ type: 'text', text: 'x' }], stop_reason: 'end_turn' },
      sseLine: 'event: message_stop\ndata: {}\n\n',
      // Anthropic uses body.messages on both paths; system is the top-level field.
      extract: (body) => extractRoleContent(body.messages)
    }
  ],
  [
    'openai',
    {
      descriptor: base({ id: 'openai', apiFormat: 'openai', baseUrl: 'https://api.openai.test/v1' }),
      model: 'gpt-4o',
      completionResponse: { choices: [{ message: { content: 'x' }, finish_reason: 'stop' }] },
      sseLine: `event: response.completed\ndata: ${JSON.stringify({
        response: { status: 'completed' }
      })}\n\n`,
      // Completion (no tools) → Chat Completions `messages`; tool turn → Responses `input`.
      extract: (body, path) => extractRoleContent(path === 'completion' ? body.messages : body.input)
    }
  ],
  [
    'gemini',
    {
      descriptor: base({ id: 'google-gemini', apiFormat: 'gemini', baseUrl: 'https://gemini.test/v1beta' }),
      model: 'gemini-2.5-flash',
      completionResponse: {
        candidates: [{ content: { parts: [{ text: 'x' }] }, finishReason: 'STOP' }]
      },
      sseLine: `data: ${JSON.stringify({
        candidates: [{ content: { parts: [{ text: '' }] }, finishReason: 'STOP' }]
      })}\n\n`,
      // Gemini uses body.contents on both paths; system is body.systemInstruction.
      extract: (body) =>
        (body.contents as Array<{ role: string; parts: Array<{ text: string }> }>).map((c) => ({
          role: c.role,
          text: c.parts[0].text
        }))
    }
  ]
];

// ============================================================================
// The symmetry guard
// ============================================================================

describe('message ordering symmetry (completion path vs client-tool turn path)', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe.each(cases)('%s', (providerName, cfg) => {
    test(`[${providerName}] same ordered messages linearize history identically vs the current turn`, async () => {
      // --- completion path ---
      mockJsonResponse(cfg.completionResponse);
      await AiAssist.callProviderCompletion({
        descriptor: cfg.descriptor,
        apiKey: 'k',
        system: SYSTEM,
        messages: MESSAGES,
        modelOverride: cfg.model
      });
      const completionConv = cfg.extract(capturedBody(), 'completion');

      // --- client-tool turn path (same ordered messages) ---
      mockSseResponse(cfg.sseLine);
      const turn = AiAssist.executeClientToolTurn({
        descriptor: cfg.descriptor,
        apiKey: 'k',
        system: SYSTEM,
        messages: MESSAGES,
        clientTools: [clientTool],
        model: cfg.model
      });
      expect(turn).toSucceed();
      if (turn.isFailure()) return;
      await drain(turn.value.events);
      const toolConv = cfg.extract(capturedBody(), 'tool');

      // History (h1, h2) precedes the current user turn in the completion path.
      expect(completionConv.map((t) => t.text)).toEqual(['h1', 'h2', 'current']);
      expect(completionConv[completionConv.length - 1].role).toBe('user');

      // THE guard: the tool-turn path linearizes the identical conversation —
      // history at the same position relative to the current user turn. If the
      // head/tail asymmetry returns, these two arrays diverge.
      expect(toolConv).toEqual(completionConv);
    });
  });
});

// ============================================================================
// splitChatRequest contract — enforced at every entry point
// ============================================================================

describe('unified request validation', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  const descriptor = base({ id: 'anthropic', apiFormat: 'anthropic' });

  test('callProviderCompletion fails when messages is empty', async () => {
    const result = await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'k',
      messages: []
    });
    expect(result).toFailWith(/at least one entry/i);
  });

  test('callProviderCompletion fails when the last message is not a user turn', async () => {
    const result = await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'k',
      messages: [
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'trailing assistant' }
      ]
    });
    expect(result).toFailWith(/last message must be the current user turn/i);
  });

  test('callProviderCompletionStream fails when the last message is not a user turn', async () => {
    const result = await AiAssist.callProviderCompletionStream({
      descriptor,
      apiKey: 'k',
      messages: [{ role: 'assistant', content: 'oops' }]
    });
    expect(result).toFailWith(/last message must be the current user turn/i);
  });

  test('executeClientToolTurn fails when messages is empty', () => {
    const result = AiAssist.executeClientToolTurn({
      descriptor,
      apiKey: 'k',
      messages: [],
      clientTools: [clientTool],
      model: 'claude-sonnet-4-6'
    });
    expect(result).toFailWith(/at least one entry/i);
  });

  test('omitting system defaults the wire system field to an empty string', async () => {
    mockJsonResponse({ content: [{ type: 'text', text: 'x' }], stop_reason: 'end_turn' });
    const result = await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'k',
      messages: [{ role: 'user', content: 'no system here' }]
    });
    expect(result).toSucceed();
    const body = capturedBody();
    expect(body.system).toBe('');
  });
});
