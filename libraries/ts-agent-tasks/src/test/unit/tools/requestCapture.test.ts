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
import { ITaskToolPair, bindReader, shownIds, taskTools } from '../../helpers/toolFixtures';

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

  test('Gemini: both tools are function declarations carrying their parameters', async () => {
    const bodies = captureRequests([geminiDone]);
    await runTurn('google-gemini', [tools.query, tools.inspect]);
    const declarations = toolsOf(bodies[0]).flatMap((t) => (t.function_declarations ?? []) as JsonObject[]);
    expect(declarations.map((d) => d.name)).toEqual(['task_query', 'task_inspect']);
    expect(declarations[1]).toEqual({
      name: 'task_inspect',
      description: tools.inspect.config.description,
      parameters: expect.objectContaining({
        type: 'object',
        properties: { taskId: expect.objectContaining({ type: 'string' }) },
        required: ['taskId']
      })
    });
    expect(Object.keys((declarations[0].parameters as JsonObject).properties as JsonObject)).toEqual([
      'responsibility',
      'parentId',
      'lifecycleClass',
      'statuses',
      'limit',
      'cursor'
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
