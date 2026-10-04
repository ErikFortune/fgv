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
 * The two model-facing guarantees, proven at the `executeClientToolTurn` level rather than at
 * `callMcpTool`: an adapted MCP tool's `isError` text reaches the model unchanged, and aborting
 * the turn cancels the in-flight MCP request on the server. The provider stream is a scripted
 * Anthropic SSE response (global `fetch` mocked); the MCP side is a REAL in-memory server.
 */

import '@fgv/ts-utils-jest';
import { AiAssist } from '@fgv/ts-extras';

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

/** Deliberately carries characters a reformatter would touch: quotes, a newline, a colon. */
const TOOL_ERROR_TEXT = 'refused: "project 42" is over quota\nretry after 2026-10-05';
const CALL_ID = 'toolu_mcp_01';

function sseBody(chunks: ReadonlyArray<string>): ReadableStream<Uint8Array> {
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

/** An Anthropic stream in which the model calls `toolName` once with `{}`. */
function mockModelCallsTool(toolName: string): void {
  const chunks = [
    `event: content_block_start\ndata: ${JSON.stringify({
      index: 0,
      content_block: { type: 'tool_use', id: CALL_ID, name: toolName }
    })}\n\n`,
    `event: content_block_delta\ndata: ${JSON.stringify({
      index: 0,
      delta: { type: 'input_json_delta', partial_json: '{}' }
    })}\n\n`,
    `event: content_block_stop\ndata: ${JSON.stringify({ index: 0 })}\n\n`,
    `event: message_delta\ndata: ${JSON.stringify({ delta: { stop_reason: 'tool_use' } })}\n\n`,
    'event: message_stop\ndata: {}\n\n'
  ];
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    status: 200,
    body: sseBody(chunks),
    text: async () => '',
    headers: new Headers({ 'content-type': 'text/event-stream' })
  } as unknown as Response);
}

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

const EMPTY_SCHEMA = { type: 'object', properties: {} };

describe('adapted MCP tools inside executeClientToolTurn', () => {
  let server: Server;
  let session: IMcpSession;
  let entered: Promise<void>;
  let serverCancelled: Promise<unknown>;

  beforeEach(async () => {
    let markEntered: () => void = () => undefined;
    let markCancelled: (reason: unknown) => void = () => undefined;
    entered = new Promise<void>((resolve) => {
      markEntered = resolve;
    });
    serverCancelled = new Promise<unknown>((resolve) => {
      markCancelled = resolve;
    });

    server = new Server({ name: 'turn-fixture', version: '0.0.1' }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        { name: 'refuses', inputSchema: EMPTY_SCHEMA },
        { name: 'hang', inputSchema: EMPTY_SCHEMA }
      ]
    }));
    server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      if (request.params.name === 'refuses') {
        return { content: [{ type: 'text', text: TOOL_ERROR_TEXT }], isError: true };
      }
      markEntered();
      await new Promise<void>((resolve) => {
        extra.signal.addEventListener('abort', () => {
          markCancelled(extra.signal.reason);
          resolve();
        });
      });
      return { content: [{ type: 'text', text: 'ran to completion' }] };
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
    toolName: string,
    signal?: AbortSignal,
    duringTurn?: () => Promise<void>
  ): Promise<ReadonlyArray<AiAssist.IAiStreamEvent>> {
    const tools = (await adaptMcpTools(session)).orThrow().tools;
    mockModelCallsTool(toolName);
    const turn = AiAssist.executeClientToolTurn({
      descriptor: DESCRIPTOR,
      apiKey: 'test-key',
      ...new AiAssist.AiPrompt('use the tool', 'system').toRequest(),
      clientTools: tools,
      model: 'claude-sonnet-4-6',
      signal
    }).orThrow();
    const events: AiAssist.IAiStreamEvent[] = [];
    const draining = (async (): Promise<void> => {
      for await (const event of turn.events) {
        events.push(event);
      }
    })();
    await duringTurn?.();
    await draining;
    return events;
  }

  function toolResult(events: ReadonlyArray<AiAssist.IAiStreamEvent>): AiAssist.IAiStreamEvent | undefined {
    return events.find((e) => e.type === 'client-tool-result');
  }

  test("a tool's isError text reaches the model verbatim — classification does not touch it", async () => {
    const events = await runTurn('refuses');
    // The builder's own `<tool> (callId=<id>): ` frame, then the server's words, byte for byte:
    // no `callMcpTool` prefix, no kind, no reformatting.
    expect(toolResult(events)).toEqual({
      type: 'client-tool-result',
      toolName: 'refuses',
      callId: CALL_ID,
      result: `refuses (callId=${CALL_ID}): ${TOOL_ERROR_TEXT}`,
      isError: true
    });
  });

  test('aborting the turn cancels the in-flight MCP request on the server', async () => {
    const controller = new AbortController();
    const started = Date.now();
    const events = await runTurn('hang', controller.signal, async () => {
      await entered;
      controller.abort();
    });

    // The server's handler was told to stop; it did not run on to the SDK's 60 s default.
    expect(String(await serverCancelled)).toMatch(/request aborted by the caller/);
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(toolResult(events)).toEqual(
      expect.objectContaining({
        result: `hang (callId=${CALL_ID}): callMcpTool 'hang': aborted by the caller`,
        isError: true
      })
    );
  });
});
