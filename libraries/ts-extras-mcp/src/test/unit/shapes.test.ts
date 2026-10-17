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
 * correctable tool error before it reaches the server. Whether a tool with `{}` is admitted depends
 * on the wire table it is adapted against: the default (conservative) table and the OpenAI and
 * Gemini tables skip it, so it cannot fail every request; the Anthropic-tools table admits it. The provider
 * stream is a scripted SSE response (global `fetch` mocked); the MCP side is a REAL in-memory server.
 */

import '@fgv/ts-utils-jest';
import { Logging } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';
import { JsonSchema, type JsonObject } from '@fgv/ts-json-base';

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

/** A tool with the numeric enum and the const but no `{}`, which every wire can carry. */
const LEVEL_SCHEMA: JsonObject = {
  type: 'object',
  properties: { level: { type: 'integer', enum: [1, 2] }, mode: { const: 'fast' } },
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

const OPENAI: AiAssist.IAiProviderDescriptor = {
  id: 'openai',
  label: 'OpenAI',
  buttonLabel: 'OpenAI',
  needsSecret: true,
  apiFormat: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  defaultModel: 'gpt-4o',
  supportedTools: [],
  corsRestricted: false,
  streamingCorsRestricted: false,
  acceptsImageInput: false
};

const MODELS: Readonly<Record<string, string>> = {
  anthropic: 'claude-sonnet-4-6',
  'google-gemini': 'gemini-2.5-flash',
  openai: 'gpt-4o'
};

/** The SSE chunks in which the model calls `tool` with `argsJson`, in `descriptor`'s dialect. */
function toolCallChunks(descriptor: AiAssist.IAiProviderDescriptor, tool: string, argsJson: string): string[] {
  if (descriptor.apiFormat === 'gemini') {
    // A plain text reply: the Gemini case only checks what was sent.
    return [
      `data: ${JSON.stringify({
        candidates: [{ content: { role: 'model', parts: [{ text: 'ok' }] }, finishReason: 'STOP' }]
      })}\n\n`
    ];
  }
  if (descriptor.apiFormat === 'openai') {
    return [
      `event: response.output_item.added\ndata: ${JSON.stringify({
        item: { type: 'function_call', id: 'fc_1', call_id: CALL_ID, name: tool }
      })}\n\n`,
      `event: response.function_call_arguments.delta\ndata: ${JSON.stringify({
        item_id: 'fc_1',
        delta: argsJson
      })}\n\n`,
      `event: response.function_call_arguments.done\ndata: ${JSON.stringify({
        item_id: 'fc_1',
        arguments: argsJson
      })}\n\n`,
      `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
    ];
  }
  return [
    `event: content_block_start\ndata: ${JSON.stringify({
      index: 0,
      content_block: { type: 'tool_use', id: CALL_ID, name: tool }
    })}\n\n`,
    `event: content_block_delta\ndata: ${JSON.stringify({
      index: 0,
      delta: { type: 'input_json_delta', partial_json: argsJson }
    })}\n\n`,
    `event: content_block_stop\ndata: ${JSON.stringify({ index: 0 })}\n\n`,
    `event: message_delta\ndata: ${JSON.stringify({ delta: { stop_reason: 'tool_use' } })}\n\n`,
    'event: message_stop\ndata: {}\n\n'
  ];
}

/** Mocks one provider stream (later requests in the turn end it); returns the first sent body. */
function mockModelCalls(chunks: ReadonlyArray<string>): () => JsonObject | undefined {
  let sent: JsonObject | undefined;
  let requests = 0;
  jest.spyOn(global, 'fetch').mockImplementation(async (__url, init) => {
    requests += 1;
    sent = sent ?? (JSON.parse(String(init?.body)) as JsonObject);
    const body = requests === 1 ? chunks : [];
    const encoder = new TextEncoder();
    let i = 0;
    return {
      ok: true,
      status: 200,
      body: new ReadableStream<Uint8Array>({
        pull(controller: ReadableStreamDefaultController<Uint8Array>): void {
          if (i < body.length) {
            controller.enqueue(encoder.encode(body[i++]));
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

describe('numeric enum, const and {} on an adapted MCP tool', () => {
  let server: Server;
  let session: IMcpSession;
  let calls: unknown[];

  beforeEach(async () => {
    calls = [];
    server = new Server({ name: 'shapes-fixture', version: '0.0.1' }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        { name: 'configure', description: 'Configure the thing', inputSchema: CONFIGURE_SCHEMA },
        { name: 'level', description: 'Set the level', inputSchema: LEVEL_SCHEMA }
      ]
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

  /** The table a host gets for the wire it will send the tools on. */
  function tableFor(descriptor: AiAssist.IAiProviderDescriptor): JsonSchema.SchemaKeywordCapabilities {
    return AiAssist.clientToolSchemaKeywords(descriptor, { model: MODELS[descriptor.id] });
  }

  async function runTurn(
    descriptor: AiAssist.IAiProviderDescriptor,
    tool: string,
    argsJson: string
  ): Promise<{ events: AiAssist.IAiStreamEvent[]; sent: JsonObject | undefined }> {
    const adapted = (await adaptMcpTools(session, { schemaKeywords: tableFor(descriptor) })).orThrow();
    const sent = mockModelCalls(toolCallChunks(descriptor, tool, argsJson));
    const turn = AiAssist.executeClientToolTurn({
      descriptor,
      apiKey: 'test-key',
      ...new AiAssist.AiPrompt('configure it', 'system').toRequest(),
      clientTools: adapted.tools,
      model: MODELS[descriptor.id]
    }).orThrow();
    const events: AiAssist.IAiStreamEvent[] = [];
    for await (const event of turn.events) {
      events.push(event);
    }
    return { events, sent: sent() };
  }

  function toolResult(events: AiAssist.IAiStreamEvent[]): AiAssist.IAiStreamEvent | undefined {
    return events.find((e) => e.type === 'client-tool-result');
  }

  describe('admission against the target wire', () => {
    const UNTYPED_SKIP: RegExp =
      /^not sendable on the target wire: #\/properties\/payload: a schema with no 'type' \(matching any value\) cannot be sent on this wire$/;

    test('by default the conservative table skips the tool with {}, and only that tool, with a warning', async () => {
      const logger = new Logging.InMemoryLogger('all');
      expect(await adaptMcpTools(session, { logger })).toSucceedAndSatisfy((result) => {
        expect(result.tools.map((t) => t.config.name)).toEqual(['level']);
        expect(result.skipped).toEqual([
          { name: 'configure', reason: expect.stringMatching(UNTYPED_SKIP), schema: CONFIGURE_SCHEMA }
        ]);
      });
      expect(logger.logged.join('\n')).toMatch(/skipping tool 'configure': inputSchema cannot be adapted/);
    });

    test('the Anthropic-tools table passes {}, so the tool is adapted with its schema as parsed', async () => {
      expect(await adaptMcpTools(session, { schemaKeywords: tableFor(ANTHROPIC) })).toSucceedAndSatisfy(
        (result) => {
          expect(result.skipped).toEqual([]);
          const configure = result.tools.find((t) => t.config.name === 'configure');
          // Admission does not rewrite the schema: request-time adaptation runs once, on send.
          expect(configure?.config.parametersSchema.toJson()).toEqual(
            JsonSchema.fromJson(CONFIGURE_SCHEMA).orThrow().toJson()
          );
        }
      );
    });

    test.each([
      ['OpenAI', OPENAI],
      ['Gemini', GEMINI]
    ])('the %s table refuses {}, so the tool is skipped', async (__label, descriptor) => {
      expect(await adaptMcpTools(session, { schemaKeywords: tableFor(descriptor) })).toSucceedAndSatisfy(
        (result) => {
          expect(result.tools.map((t) => t.config.name)).toEqual(['level']);
          expect(result.skipped.map((s) => s.name)).toEqual(['configure']);
        }
      );
    });

    test('a Gemini turn with the skipped tool left out is sent, rather than failing', async () => {
      const { events, sent } = await runTurn(GEMINI, 'level', '{}');
      expect(events.find((e) => e.type === 'error')).toBeUndefined();
      const [{ function_declarations: declarations }] = sent?.tools as JsonObject[];
      expect((declarations as JsonObject[]).map((d) => d.name)).toEqual(['level']);
    });
  });

  describe('on Anthropic', () => {
    test('the model is shown each shape: the enum, const as enum, and {}', async () => {
      const { sent } = await runTurn(ANTHROPIC, 'configure', '{"level":1,"mode":"fast"}');
      const wireTool = (sent?.tools as JsonObject[]).find((t) => t.name === 'configure');
      expect(wireTool?.input_schema).toEqual({
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
      const { events } = await runTurn(
        ANTHROPIC,
        'configure',
        '{"level":2,"mode":"fast","payload":{"any":[1,"x",null]}}'
      );
      expect(calls).toEqual([{ level: 2, mode: 'fast', payload: { any: [1, 'x', null] } }]);
      expect(toolResult(events)).toEqual(expect.objectContaining({ isError: false }));
    });

    test.each([
      ['a level outside the numeric enum', '{"level":3,"mode":"fast"}', /Invalid enumerated value 3/],
      ['a numeric string for the integer enum', '{"level":"1","mode":"fast"}', /Invalid enumerated value "1"/],
      ['a mode other than the const', '{"level":1,"mode":"slow"}', /Invalid enumerated value "slow"/]
    ])('%s is refused before it reaches the server', async (__label, argsJson, message) => {
      const { events } = await runTurn(ANTHROPIC, 'configure', argsJson);
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
  });

  describe('on OpenAI', () => {
    test('the model is shown the numeric enum and the const, and an out-of-set call never reaches the server', async () => {
      const { events, sent } = await runTurn(OPENAI, 'level', '{"level":3,"mode":"fast"}');
      const wireTools = sent?.tools as JsonObject[];
      expect(wireTools.map((t) => t.name)).toEqual(['level']);
      expect(wireTools[0].parameters).toEqual({
        type: 'object',
        properties: {
          level: { type: 'integer', enum: [1, 2] },
          mode: { type: 'string', enum: ['fast'] }
        },
        required: ['level', 'mode']
      });
      expect(calls).toEqual([]);
      const result = toolResult(events);
      expect(result).toEqual(expect.objectContaining({ toolName: 'level', isError: true }));
      expect(result?.type === 'client-tool-result' ? result.result : '').toMatch(/Invalid enumerated value 3/);
    });

    test('an in-set call is forwarded', async () => {
      await runTurn(OPENAI, 'level', '{"level":1,"mode":"fast"}');
      expect(calls).toEqual([{ level: 1, mode: 'fast' }]);
    });
  });
});
