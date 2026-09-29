/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * The tools are really offered to the model: these tests run ai-assist's own
 * `executeClientToolTurn`, capture the request body it puts on the wire, and assert what is in it.
 *
 * @remarks
 * Mocking a tool call coming *back* proves nothing about whether the tool was ever *sent* — a stream
 * once reported live success while client tools had never reached the request `tools` array
 * (`TESTING_GUIDELINES.md`, § Coverage Gap Resolution). So the load-bearing assertions here are on
 * the captured outbound body; the round trip at the end is additional, not a substitute.
 */

import '@fgv/ts-utils-jest';
import { AiAssist } from '@fgv/ts-extras';
import { JsonObject } from '@fgv/ts-json-base';
import { IBrokerHarness, brokerHarness, track } from '../../helpers/brokerFixtures';
import { ITaskToolPair, bindReader, mutatingTools, shownIds, taskTools } from '../../helpers/toolFixtures';

type Body = Record<string, unknown>;

/** Stubs `fetch`: records each request body and answers with one SSE stream per call, in turn. */
function captureRequests(streams: ReadonlyArray<string>): Body[] {
  const bodies: Body[] = [];
  const encoder = new TextEncoder();
  let call = 0;
  jest.spyOn(global, 'fetch').mockImplementation(async (__url, init) => {
    bodies.push(JSON.parse(String(init?.body)) as Body);
    const sse = streams[Math.min(call++, streams.length - 1)];
    return {
      ok: true,
      status: 200,
      body: new ReadableStream<Uint8Array>({
        start(controller: ReadableStreamDefaultController<Uint8Array>): void {
          controller.enqueue(encoder.encode(sse));
          controller.close();
        }
      }),
      text: async () => '',
      headers: new Map([['content-type', 'text/event-stream']])
    } as unknown as Response;
  });
  return bodies;
}

/** Runs one client-tool turn to completion. */
async function runTurn(
  provider: string,
  clientTools: ReadonlyArray<AiAssist.IAiClientTool>
): Promise<{ events: AiAssist.IAiStreamEvent[] }> {
  const turn = AiAssist.executeClientToolTurn({
    descriptor: AiAssist.getProviderDescriptor(provider).orThrow(),
    apiKey: 'test-key',
    messages: [{ role: 'user', content: 'what am I working on?' }],
    clientTools
  }).orThrow();
  const events: AiAssist.IAiStreamEvent[] = [];
  for await (const event of turn.events) {
    events.push(event);
  }
  await turn.nextTurn;
  return { events };
}

const anthropicStop: string = 'event: message_stop\ndata: {}\n\n';
const responsesDone: string = `event: response.completed\ndata: ${JSON.stringify({
  response: { status: 'completed' }
})}\n\n`;
const geminiDone: string = `data: ${JSON.stringify({
  candidates: [{ content: { parts: [{ text: '' }] }, finishReason: 'STOP' }]
})}\n\n`;

/** An Anthropic stream in which the model calls one tool. */
function anthropicCalls(id: string, name: string, args: object): string {
  return [
    `event: content_block_start\ndata: ${JSON.stringify({
      index: 0,
      content_block: { type: 'tool_use', id, name }
    })}\n\n`,
    `event: content_block_delta\ndata: ${JSON.stringify({
      index: 0,
      delta: { type: 'input_json_delta', partial_json: JSON.stringify(args) }
    })}\n\n`,
    `event: content_block_stop\ndata: ${JSON.stringify({ index: 0 })}\n\n`,
    `event: message_delta\ndata: ${JSON.stringify({ delta: { stop_reason: 'tool_use' } })}\n\n`,
    anthropicStop
  ].join('');
}

function toolsOf(body: Body | undefined): JsonObject[] {
  return (body?.tools ?? []) as JsonObject[];
}

describe('the task tools reach the outbound request', () => {
  let h: IBrokerHarness;
  let tools: ITaskToolPair;

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't1');
    tools = taskTools({ view: bindReader(h) });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Anthropic: both tools are in the request, each with its exact wire schema', async () => {
    const bodies = captureRequests([anthropicStop]);
    await runTurn('anthropic', [tools.query, tools.inspect]);
    expect(bodies).toHaveLength(1);
    const offered = toolsOf(bodies[0]).filter((t) => String(t.name).startsWith('task_'));
    expect(offered).toEqual([
      {
        name: 'task_query',
        description: tools.query.config.description,
        input_schema: tools.query.config.parametersSchema.toJson()
      },
      {
        name: 'task_inspect',
        description: tools.inspect.config.description,
        input_schema: tools.inspect.config.parametersSchema.toJson()
      }
    ]);
    // The annotations are host-side only and never reach the wire.
    expect(JSON.stringify(bodies[0])).not.toContain('readOnlyHint');
  });

  test('OpenAI Responses: both tools are function tools with their exact wire schemas', async () => {
    const bodies = captureRequests([responsesDone]);
    await runTurn('openai', [tools.query, tools.inspect]);
    const offered = toolsOf(bodies[0]).filter((t) => t.type === 'function');
    expect(offered).toEqual([
      {
        type: 'function',
        name: 'task_query',
        description: tools.query.config.description,
        parameters: tools.query.config.parametersSchema.toJson()
      },
      {
        type: 'function',
        name: 'task_inspect',
        description: tools.inspect.config.description,
        parameters: tools.inspect.config.parametersSchema.toJson()
      }
    ]);
  });

  test('Gemini: both tools are function declarations with their complete sanitized schemas', async () => {
    const bodies = captureRequests([geminiDone]);
    await runTurn('google-gemini', [tools.query, tools.inspect]);
    const declarations = toolsOf(bodies[0]).flatMap((t) => (t.function_declarations ?? []) as JsonObject[]);
    // Gemini's dialect drops `additionalProperties`, so on this provider a closed schema is enforced
    // by validation (the harness's, then `execute`'s), not stated on the wire. Everything else —
    // descriptions, enums, item types, required members — must arrive intact.
    expect(declarations).toEqual([
      {
        name: 'task_query',
        description: tools.query.config.description,
        parameters: {
          type: 'object',
          properties: {
            responsibility: {
              type: 'object',
              properties: {
                namespace: { type: 'string', description: 'The responsible party namespace, e.g. "agent".' },
                key: { type: 'string', description: 'The responsible party key within its namespace.' }
              },
              required: ['namespace', 'key'],
              description: 'Only tasks assigned to this responsible party.'
            },
            parentId: { type: 'string', description: 'Only direct children of this task.' },
            lifecycleClass: {
              type: 'string',
              enum: ['open', 'terminal', 'all'],
              description: 'Only open tasks, only terminal tasks, or all (the default).'
            },
            statuses: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['pending', 'running', 'waiting', 'paused', 'succeeded', 'failed', 'cancelled'],
                description: 'A lifecycle status.'
              },
              description: 'Only tasks in one of these lifecycle statuses.'
            },
            limit: {
              type: 'integer',
              description: 'The most tasks to return, from 1 to 20. Defaults to 20.'
            },
            cursor: {
              type: 'string',
              description: 'The nextCursor of a previous task_query, to continue after it.'
            }
          }
        }
      },
      {
        name: 'task_inspect',
        description: tools.inspect.config.description,
        parameters: {
          type: 'object',
          properties: { taskId: { type: 'string', description: 'The id of the task to inspect.' } },
          required: ['taskId']
        }
      }
    ]);
  });

  test('control: the same capture without the tools finds none, so the assertions above discriminate', async () => {
    const bodies = captureRequests([anthropicStop]);
    await runTurn('anthropic', []);
    expect(bodies).toHaveLength(1);
    expect(toolsOf(bodies[0]).some((t) => String(t.name).startsWith('task_'))).toBe(false);
  });

  test('round trip: a call the harness accepts runs through the view and returns rendered context', async () => {
    const bodies = captureRequests([
      anthropicCalls('toolu_1', 'task_inspect', { taskId: 't1' }),
      anthropicStop
    ]);
    const { events } = await runTurn('anthropic', [tools.query, tools.inspect]);
    const result = events.find((e) => e.type === 'client-tool-result');
    expect(result).toEqual(expect.objectContaining({ toolName: 'task_inspect', isError: false }));
    const payload = JSON.parse((result as AiAssist.IAiStreamToolUseComplete).result) as { context: string };
    expect(shownIds(payload.context)).toEqual(['t1']);
    expect(toolsOf(bodies[0]).map((t) => t.name)).toEqual(['task_query', 'task_inspect']);
  });

  test('round trip: a call naming a principal is refused before it runs', async () => {
    captureRequests([
      anthropicCalls('toolu_1', 'task_inspect', { taskId: 't1', principal: 'bob' }),
      anthropicStop
    ]);
    const { events } = await runTurn('anthropic', [tools.query, tools.inspect]);
    const result = events.find((e) => e.type === 'client-tool-result');
    expect(result).toEqual(expect.objectContaining({ toolName: 'task_inspect', isError: true }));
    const message: string = (result as AiAssist.IAiStreamToolUseComplete).result;
    // Refused by the harness's own validation against the tool's schema, naming the surplus field.
    expect(message).toMatch(/principal/);
    expect(message).not.toContain('task-context');
  });
});

describe('mutation tools reach the outbound request only when opted into', () => {
  let h: IBrokerHarness;

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't1');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mutating = ['task_query', 'task_inspect', 'task_create', 'task_update', 'task_reassign'];

  test('disabled: a writer passed as the view still offers exactly the two read tools', async () => {
    const tools = taskTools({ view: h.writer });
    const bodies = captureRequests([anthropicStop, responsesDone]);
    await runTurn('anthropic', [tools.query, tools.inspect]);
    await runTurn('openai', [tools.query, tools.inspect]);
    expect(toolsOf(bodies[0]).map((t) => t.name)).toEqual(['task_query', 'task_inspect']);
    expect(toolsOf(bodies[1]).map((t) => t.name)).toEqual(['task_query', 'task_inspect']);
  });

  test('enabled — Anthropic: all five are in the request, each with its exact wire schema', async () => {
    const tools = mutatingTools(h);
    const bodies = captureRequests([anthropicStop]);
    await runTurn(
      'anthropic',
      mutating.map((name) => tools.get(name))
    );
    expect(toolsOf(bodies[0])).toEqual(
      mutating.map((name) => ({
        name,
        description: tools.get(name).config.description,
        input_schema: tools.get(name).config.parametersSchema.toJson()
      }))
    );
  });

  test('enabled — OpenAI Responses: all five are function tools with their exact wire schemas', async () => {
    const tools = mutatingTools(h);
    const bodies = captureRequests([responsesDone]);
    await runTurn(
      'openai',
      mutating.map((name) => tools.get(name))
    );
    expect(toolsOf(bodies[0]).filter((t) => t.type === 'function')).toEqual(
      mutating.map((name) => ({
        type: 'function',
        name,
        description: tools.get(name).config.description,
        parameters: tools.get(name).config.parametersSchema.toJson()
      }))
    );
  });

  test('enabled — Gemini: all five are function declarations', async () => {
    const tools = mutatingTools(h);
    const bodies = captureRequests([geminiDone]);
    await runTurn(
      'google-gemini',
      mutating.map((name) => tools.get(name))
    );
    const declarations = toolsOf(bodies[0]).flatMap((t) => (t.function_declarations ?? []) as JsonObject[]);
    expect(declarations.map((d) => d.name)).toEqual(mutating);
  });

  test('round trip: an update at the inspected revision runs through the writer', async () => {
    const tools = mutatingTools(h);
    captureRequests([
      anthropicCalls('toolu_1', 'task_update', { taskId: 't1', expectedRevision: 1, title: 'renamed' }),
      anthropicStop
    ]);
    const { events } = await runTurn(
      'anthropic',
      mutating.map((name) => tools.get(name))
    );
    const result = events.find((e) => e.type === 'client-tool-result');
    expect(result).toEqual(expect.objectContaining({ toolName: 'task_update', isError: false }));
    expect(JSON.parse((result as AiAssist.IAiStreamToolUseComplete).result)).toEqual({
      taskId: 't1',
      revision: 2,
      disposition: 'changed'
    });
  });

  test('round trip: a call naming its own operation id is refused before it runs', async () => {
    const tools = mutatingTools(h);
    captureRequests([
      anthropicCalls('toolu_1', 'task_update', {
        taskId: 't1',
        expectedRevision: 1,
        title: 'renamed',
        operationId: 'complete-list-r1'
      }),
      anthropicStop
    ]);
    const { events } = await runTurn(
      'anthropic',
      mutating.map((name) => tools.get(name))
    );
    const result = events.find((e) => e.type === 'client-tool-result');
    expect(result).toEqual(expect.objectContaining({ toolName: 'task_update', isError: true }));
    expect((result as AiAssist.IAiStreamToolUseComplete).result).toMatch(/operationId/);
    expect((await h.writer.inspect('t1' as never)).orThrow()).toEqual(
      expect.objectContaining({ envelope: expect.objectContaining({ revision: 1 }) })
    );
  });
});
