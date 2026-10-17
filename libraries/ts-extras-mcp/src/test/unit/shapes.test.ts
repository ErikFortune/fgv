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
 * The three MCP shapes `fromJson` used to skip — a numeric `enum` (pydantic `Literal[1, 2]`), a
 * scalar `const` and `{}` (pydantic `Any`) — end to end: the tool is adapted, the model is shown
 * each shape as the wire carries it, and a call outside the declared set is refused as a
 * correctable tool error before it reaches the server. On a wire that cannot carry `{}` (Gemini),
 * the request is refused loudly, naming the tool and the path, and nothing is sent. The provider
 * stream is a scripted SSE response (global `fetch` mocked); the MCP side is a REAL in-memory server.
 */

import '@fgv/ts-utils-jest';
import { AiAssist } from '@fgv/ts-extras';
import { type JsonObject } from '@fgv/ts-json-base';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import {
  type IMcpSession,
  adaptMcpTools,
  closeMcpSession,
  connectMcpSession,
  createCustomTransport
} from '../../packlets/mcp';

const CALL_ID = 'toolu_mcp_shapes';

/** The server's own declaration, verbatim: pydantic's spellings of the three shapes. */
const CONFIGURE_SCHEMA: JsonObject = {
  type: 'object',
  properties: {
    level: { type: 'integer', enum: [1, 2], title: 'Level' },
    mode: { const: 'fast', type: 'string' },
    payload: { title: 'Payload' }
  },
  required: ['level', 'mode']
};

const ANTHROPIC: AiAssist.IAiProviderDescriptor = {
  id: 'anthropic',
  label: 'Anthropic',
  buttonLabel: 'Anthropic',
  needsSecret: true,
  apiFormat: 'anthropic',
  baseUrl: 'https://api.anthropic.com/v1',
  defaultModel: 'claude-sonnet-4-6',
  supportedTools: [],
  corsRestricted: false,
  streamingCorsRestricted: false,
  acceptsImageInput: false
};

const GEMINI: AiAssist.IAiProviderDescriptor = {
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
};

/** Mocks an Anthropic stream in which the model calls `configure` with `argsJson`. */
function mockModelCalls(argsJson: string): { sent: () => JsonObject | undefined; fetch: jest.SpyInstance } {
  const chunks = [
    `event: content_block_start\ndata: ${JSON.stringify({
      index: 0,
      content_block: { type: 'tool_use', id: CALL_ID, name: 'configure' }
    })}\n\n`,
    `event: content_block_delta\ndata: ${JSON.stringify({
      index: 0,
      delta: { type: 'input_json_delta', partial_json: argsJson }
    })}\n\n`,
    `event: content_block_stop\ndata: ${JSON.stringify({ index: 0 })}\n\n`,
    `event: message_delta\ndata: ${JSON.stringify({ delta: { stop_reason: 'tool_use' } })}\n\n`,
    'event: message_stop\ndata: {}\n\n'
  ];
  let sent: JsonObject | undefined;
  const fetch = jest.spyOn(global, 'fetch').mockImplementation(async (__url, init) => {
    sent = JSON.parse(String(init?.body)) as JsonObject;
    const encoder = new TextEncoder();
    let i = 0;
    return {
      ok: true,
      status: 200,
      body: new ReadableStream<Uint8Array>({
        pull(controller: ReadableStreamDefaultController<Uint8Array>): void {
          if (i < chunks.length) {
            controller.enqueue(encoder.encode(chunks[i++]));
          } else {
            controller.close();
          }
        }
      }),
      text: async () => '',
      headers: new Headers({ 'content-type': 'text/event-stream' })
    } as unknown as Response;
  });
  return { sent: () => sent, fetch };
}

describe('numeric enum, const and {} on an adapted MCP tool', () => {
  let server: Server;
  let session: IMcpSession;
  let calls: unknown[];

  beforeEach(async () => {
    calls = [];
    server = new Server({ name: 'shapes-fixture', version: '0.0.1' }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [{ name: 'configure', description: 'Configure the thing', inputSchema: CONFIGURE_SCHEMA }]
    }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      calls.push(request.params.arguments);
      return { content: [{ type: 'text', text: 'configured' }] };
    });
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await server.connect(serverSide);
    session = (await connectMcpSession({ transport: createCustomTransport(clientSide).orThrow() })).orThrow();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await closeMcpSession(session);
    await server.close();
  });

  async function runTurn(
    descriptor: AiAssist.IAiProviderDescriptor,
    argsJson: string
  ): Promise<{ events: AiAssist.IAiStreamEvent[]; sent: JsonObject | undefined; fetched: number }> {
    const adapted = (await adaptMcpTools(session)).orThrow();
    expect(adapted.skipped).toEqual([]);
    const mock = mockModelCalls(argsJson);
    const turn = AiAssist.executeClientToolTurn({
      descriptor,
      apiKey: 'test-key',
      ...new AiAssist.AiPrompt('configure it', 'system').toRequest(),
      clientTools: adapted.tools,
      model: descriptor.id === 'anthropic' ? 'claude-sonnet-4-6' : 'gemini-2.5-flash'
    }).orThrow();
    const events: AiAssist.IAiStreamEvent[] = [];
    for await (const event of turn.events) {
      events.push(event);
    }
    return { events, sent: mock.sent(), fetched: mock.fetch.mock.calls.length };
  }

  function toolResult(events: AiAssist.IAiStreamEvent[]): AiAssist.IAiStreamEvent | undefined {
    return events.find((e) => e.type === 'client-tool-result');
  }

  test('the tool is adapted, and Anthropic is shown each shape: the enum, const as enum, and {}', async () => {
    const { sent } = await runTurn(ANTHROPIC, '{"level":1,"mode":"fast"}');
    const [wireTool] = sent?.tools as JsonObject[];
    expect(wireTool.input_schema).toEqual({
      type: 'object',
      properties: {
        level: { type: 'integer', enum: [1, 2], title: 'Level' },
        mode: { type: 'string', enum: ['fast'] },
        payload: { title: 'Payload' }
      },
      required: ['level', 'mode']
    });
  });

  test('an in-set call is forwarded unchanged, payload and all', async () => {
    const { events } = await runTurn(ANTHROPIC, '{"level":2,"mode":"fast","payload":{"any":[1,"x",null]}}');
    expect(calls).toEqual([{ level: 2, mode: 'fast', payload: { any: [1, 'x', null] } }]);
    expect(toolResult(events)).toEqual(expect.objectContaining({ isError: false }));
  });

  test.each([
    ['a level outside the numeric enum', '{"level":3,"mode":"fast"}', /Invalid enumerated value 3/],
    ['a numeric string for the integer enum', '{"level":"1","mode":"fast"}', /Invalid enumerated value "1"/],
    ['a mode other than the const', '{"level":1,"mode":"slow"}', /Invalid enumerated value "slow"/]
  ])('%s is refused before it reaches the server', async (__label, argsJson, message) => {
    const { events } = await runTurn(ANTHROPIC, argsJson);
    expect(calls).toEqual([]);
    const result = toolResult(events);
    expect(result).toEqual(
      expect.objectContaining({
        type: 'client-tool-result',
        toolName: 'configure',
        callId: CALL_ID,
        isError: true
      })
    );
    expect(result?.type === 'client-tool-result' ? result.result : '').toMatch(message);
  });

  test('Gemini cannot carry {}: the request is refused naming the tool and the path, and nothing is sent', async () => {
    const { events, fetched } = await runTurn(GEMINI, '{}');
    expect(fetched).toBe(0);
    expect(calls).toEqual([]);
    const error = events.find((e) => e.type === 'error');
    expect(error?.type === 'error' ? error.message : '').toMatch(
      /tool 'configure': #\/properties\/payload: a schema with no 'type' \(matching any value\) cannot be sent on this wire \(Gemini\)/
    );
  });
});
