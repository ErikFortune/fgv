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
 * A server-declared constraint, end to end: the model is shown it, and a call that breaks it is
 * refused as a correctable tool error before it reaches the server. The provider stream is a
 * scripted Anthropic SSE response (global `fetch` mocked); the MCP side is a REAL in-memory server.
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

const CALL_ID = 'toolu_mcp_range';

/** The server's own declaration, verbatim. */
const PICK_SCHEMA: JsonObject = {
  type: 'object',
  properties: { n: { type: 'integer', minimum: 1, maximum: 10, default: 3 } },
  required: ['n']
};

const DESCRIPTOR: AiAssist.IAiProviderDescriptor = {
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

/** Mocks an Anthropic stream in which the model calls `pick` with `argsJson`; returns the sent body. */
function mockModelCalls(argsJson: string): () => JsonObject | undefined {
  const chunks = [
    `event: content_block_start\ndata: ${JSON.stringify({
      index: 0,
      content_block: { type: 'tool_use', id: CALL_ID, name: 'pick' }
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
  jest.spyOn(global, 'fetch').mockImplementation(async (__url, init) => {
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
  return () => sent;
}

describe('a server-declared constraint on an adapted MCP tool', () => {
  let server: Server;
  let session: IMcpSession;
  let calls: unknown[];

  beforeEach(async () => {
    calls = [];
    server = new Server({ name: 'range-fixture', version: '0.0.1' }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [{ name: 'pick', description: 'Pick a number', inputSchema: PICK_SCHEMA }]
    }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      calls.push(request.params.arguments);
      return { content: [{ type: 'text', text: 'picked' }] };
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

  async function runTurn(argsJson: string): Promise<{
    result: AiAssist.IAiStreamEvent | undefined;
    sent: JsonObject | undefined;
  }> {
    const tools = (await adaptMcpTools(session)).orThrow().tools;
    const sent = mockModelCalls(argsJson);
    const turn = AiAssist.executeClientToolTurn({
      descriptor: DESCRIPTOR,
      apiKey: 'test-key',
      ...new AiAssist.AiPrompt('pick one', 'system').toRequest(),
      clientTools: tools,
      model: 'claude-sonnet-4-6'
    }).orThrow();
    const events: AiAssist.IAiStreamEvent[] = [];
    for await (const event of turn.events) {
      events.push(event);
    }
    return { result: events.find((e) => e.type === 'client-tool-result'), sent: sent() };
  }

  test('the model is shown the declared range, and an out-of-range call never reaches the server', async () => {
    const { result, sent } = await runTurn('{"n":0}');

    // Anthropic tools take every keyword, so the model sees what the server declared.
    const [wireTool] = sent?.tools as JsonObject[];
    expect(wireTool.input_schema).toEqual(PICK_SCHEMA);

    expect(calls).toEqual([]);
    expect(result).toEqual(
      expect.objectContaining({
        type: 'client-tool-result',
        toolName: 'pick',
        callId: CALL_ID,
        isError: true
      })
    );
    expect(result?.type === 'client-tool-result' ? result.result : '').toMatch(/>= 1 \(minimum\), got 0/);
  });

  test('an in-range call is forwarded unchanged', async () => {
    const { result } = await runTurn('{"n":10}');
    expect(calls).toEqual([{ n: 10 }]);
    expect(result).toEqual(expect.objectContaining({ isError: false }));
  });
});
