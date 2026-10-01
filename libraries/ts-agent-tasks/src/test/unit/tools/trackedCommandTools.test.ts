/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * `fgv.tracked@1`'s registered commands, offered as I1c's generated command tools and run against a
 * real broker: a call moves the task's lifecycle, and `task_inspect` reports the new state.
 *
 * Nothing in `packlets/tools` knows about tracked tasks. The tools here are generated purely from the
 * registrations `trackedTaskDescriptor()` makes.
 */

import '@fgv/ts-utils-jest';
import { Converters } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';
import { Converters as JsonConverters, JsonObject } from '@fgv/ts-json-base';
import {
  ITaskCommandToolSpec,
  ITaskInspectResolvedToolResult,
  TaskCommandToolResult,
  trackedTaskCommandNames,
  trackedTaskDetailVersion,
  trackedTaskKind
} from '../../../index';
import { IBrokerHarness, brokerHarness, brokerRegistry, list, track } from '../../helpers/brokerFixtures';
import { IToolSet, call, toolSet } from '../../helpers/toolFixtures';

const refusedLine = (tool: string): string =>
  `${tool}: not-found-or-denied: the task is not found or not visible, or this is not permitted on it`;

const conflictLine = (tool: string): string =>
  `${tool}: conflict: the task changed, or does not accept this change now; inspect it again before ` +
  'deciding whether to retry';

const unsupportedLine = (tool: string): string => `${tool}: unsupported: the request is not supported`;

const unknownLine = (tool: string): string =>
  `${tool}: the outcome is not known: the command may or may not have been recorded or applied, and ` +
  'the host resolves or abandons any that was — do not send it again; inspect the task later';

/** Every tracked command, offered under its default tool name. */
const trackedSpecs: ReadonlyArray<ITaskCommandToolSpec> = trackedTaskCommandNames.map((command) => ({
  kind: trackedTaskKind,
  detailVersion: trackedTaskDetailVersion,
  command
}));

/** The default tool name I1c generates for a command — tracked names need no replacement. */
const toolName = (command: string): string => `task_command_${command}`;

function trackedTools(
  h: IBrokerHarness,
  enable: ReadonlyArray<ITaskCommandToolSpec> = trackedSpecs
): IToolSet {
  return toolSet({
    view: h.writer,
    commands: { writer: h.writer, registry: brokerRegistry(), environment: h.env, enable }
  });
}

async function inspected(tools: IToolSet, taskId: string): Promise<ITaskInspectResolvedToolResult> {
  const result = (await call<ITaskInspectResolvedToolResult>(tools, 'task_inspect', { taskId })).orThrow();
  expect(result.state).toBe('resolved');
  return result;
}

/** The task's single rendered record, parsed. */
function record(inspection: ITaskInspectResolvedToolResult): JsonObject {
  const line = inspection.context.split('\n').find((l) => l.startsWith('{"task"'));
  if (line === undefined) {
    throw new Error(`no task record in ${inspection.context}`);
  }
  return JsonConverters.jsonObject.convert(JSON.parse(line)).orThrow();
}

/** Runs a command tool at the revision `task_inspect` last reported, as a model would. */
async function send(
  tools: IToolSet,
  taskId: string,
  command: string,
  parameters: unknown
): Promise<ReturnType<typeof call<TaskCommandToolResult>>> {
  const { revision } = await inspected(tools, taskId);
  return call<TaskCommandToolResult>(tools, toolName(command), {
    taskId,
    expectedRevision: revision,
    parameters
  });
}

const aReason = { code: 'blocked', summary: 'waiting on review' };

describe('a model drives a tracked task through the generated command tools', () => {
  let h: IBrokerHarness;
  let tools: IToolSet;

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't1');
    tools = trackedTools(h);
  });

  test('every tracked command is generated as a tool, with no change to the tool packlet', () => {
    expect(tools.names).toEqual(['task_query', 'task_inspect', ...trackedTaskCommandNames.map(toolName)]);
    expect(tools.get('task_command_set-attention').config.parametersSchema.toJson()).toEqual(
      expect.objectContaining({
        properties: expect.objectContaining({
          parameters: expect.objectContaining({ required: ['attention'] })
        })
      })
    );
  });

  test('start → wait → resume → pause → succeed: each call moves the lifecycle, and inspect shows it', async () => {
    let inspection = await inspected(tools, 't1');
    expect(record(inspection)).toEqual(expect.objectContaining({ status: 'pending' }));
    expect(inspection.commands).toContain('start');

    expect(await send(tools, 't1', 'start', {})).toSucceedWith({
      taskId: 't1' as never,
      state: 'applied',
      revision: 2 as never
    });
    inspection = await inspected(tools, 't1');
    expect(record(inspection)).toEqual(expect.objectContaining({ status: 'running' }));
    expect(inspection.revision).toBe(2);
    expect(inspection.commands).not.toContain('start');
    expect(inspection.commands).not.toContain('resume');

    expect(
      await send(tools, 't1', 'wait', { reason: { ...aReason, notBefore: '2026-10-02T09:00:00.000Z' } })
    ).toSucceedWith({ taskId: 't1' as never, state: 'applied', revision: 3 as never });
    inspection = await inspected(tools, 't1');
    expect(record(inspection)).toEqual(expect.objectContaining({ status: 'waiting' }));
    expect(inspection.commands).toContain('resume');

    expect(await send(tools, 't1', 'resume', {})).toSucceed();
    expect(record(await inspected(tools, 't1'))).toEqual(expect.objectContaining({ status: 'running' }));

    expect(await send(tools, 't1', 'pause', { reason: aReason })).toSucceed();
    expect(record(await inspected(tools, 't1'))).toEqual(expect.objectContaining({ status: 'paused' }));

    expect(
      await send(tools, 't1', 'succeed', { outcome: { summary: 'shipped', artifacts: [] } })
    ).toSucceedWith({ taskId: 't1' as never, state: 'applied', revision: 6 as never });
    inspection = await inspected(tools, 't1');
    expect(record(inspection)).toEqual(expect.objectContaining({ status: 'succeeded' }));
    expect(inspection.commands).toEqual([]);
  });

  test('fail and cancel are terminal, with or without an outcome', async () => {
    await track(h.writer, 't2');
    expect(await send(tools, 't1', 'fail', { reason: aReason })).toSucceed();
    expect(
      await send(tools, 't2', 'cancel', { reason: aReason, outcome: { summary: 'half', artifacts: [] } })
    ).toSucceed();
    expect(record(await inspected(tools, 't1'))).toEqual(expect.objectContaining({ status: 'failed' }));
    expect(record(await inspected(tools, 't2'))).toEqual(expect.objectContaining({ status: 'cancelled' }));
  });

  test('the set-* commands change the field and leave the lifecycle where it was', async () => {
    expect(await send(tools, 't1', 'set-title', { title: 'renamed' })).toSucceed();
    expect(await send(tools, 't1', 'set-description', { description: 'more' })).toSucceed();
    expect(await send(tools, 't1', 'set-progress', { progress: { completed: 1, total: 4 } })).toSucceed();
    expect(
      await send(tools, 't1', 'set-attention', { attention: [{ namespace: 'ticket', key: 'T-1' }] })
    ).toSucceed();
    const task = (await h.repository.readCommit('t1' as never)).orThrow();
    expect(task?.recordType === 'resolved' && task.task.envelope).toEqual(
      expect.objectContaining({
        title: 'renamed',
        description: 'more',
        progress: { completed: 1, total: 4 },
        attention: [{ namespace: 'ticket', key: 'T-1' }],
        lifecycle: { status: 'pending' }
      })
    );

    // Omitting the optional value clears the field.
    expect(await send(tools, 't1', 'set-description', {})).toSucceed();
    expect(await send(tools, 't1', 'set-progress', {})).toSucceed();
    const cleared = (await h.repository.readCommit('t1' as never)).orThrow();
    expect(cleared?.recordType === 'resolved' && cleared.task.envelope.description).toBeUndefined();
    expect(cleared?.recordType === 'resolved' && cleared.task.envelope.progress).toBeUndefined();
  });

  test('restating the current state is applied at the current revision, without advancing it', async () => {
    expect(await send(tools, 't1', 'set-title', { title: 'task t1' })).toSucceedWith({
      taskId: 't1' as never,
      state: 'applied',
      revision: 1 as never
    });
  });
});

describe('what a refused tracked command tells the model — no new disclosure channel', () => {
  let h: IBrokerHarness;
  let tools: IToolSet;

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't1');
    tools = trackedTools(h);
  });

  test('a stale expectedRevision is refused as conflict, and the task does not move', async () => {
    await send(tools, 't1', 'start', {});
    expect(
      await call(tools, 'task_command_pause', {
        taskId: 't1',
        expectedRevision: 1,
        parameters: { reason: aReason }
      })
    ).toFailWith(conflictLine('task_command_pause'));
    expect(record(await inspected(tools, 't1'))).toEqual(expect.objectContaining({ status: 'running' }));
  });

  test('a transition unavailable from the current status is the fixed conflict line, naming no status', async () => {
    // resume is available only from waiting or paused; t1 is pending, and inspect did not offer it.
    expect((await inspected(tools, 't1')).commands).not.toContain('resume');
    const resumed = await send(tools, 't1', 'resume', {});
    expect(resumed).toFailWith(conflictLine('task_command_resume'));
    expect(resumed.isFailure() && resumed.message).not.toMatch(/waiting|paused|pending|invalid-transition/);

    await send(tools, 't1', 'succeed', { outcome: { summary: 'done', artifacts: [] } });
    // A terminal task accepts nothing, and says only the same line.
    const late = await send(tools, 't1', 'start', {});
    expect(late).toFailWith(conflictLine('task_command_start'));
    expect(late.isFailure() && late.message).not.toMatch(/succeeded|terminal/);
  });

  test('a command the policy denies reads exactly as a hidden task and a missing id', async () => {
    h.policy.deny.push((r) => r.action === 'command' && r.command === 'succeed');
    const denied = await send(tools, 't1', 'succeed', { outcome: { summary: 'done', artifacts: [] } });
    expect(denied).toFailWith(refusedLine('task_command_succeed'));
    // ...and inspect no longer lists it.
    expect((await inspected(tools, 't1')).commands).not.toContain('succeed');

    await track(h.writer, 't2');
    h.policy.hide('t2');
    expect(
      await call(tools, 'task_command_succeed', {
        taskId: 't2',
        expectedRevision: 1,
        parameters: { outcome: { summary: 'done', artifacts: [] } }
      })
    ).toFailWith(refusedLine('task_command_succeed'));
    expect(
      await call(tools, 'task_command_succeed', {
        taskId: 'nope',
        expectedRevision: 1,
        parameters: { outcome: { summary: 'done', artifacts: [] } }
      })
    ).toFailWith(refusedLine('task_command_succeed'));
  });

  test('a tracked tool refuses a task list as unsupported, and sends nothing', async () => {
    await list(h.writer, 'l1');
    expect(
      await call(tools, 'task_command_cancel', {
        taskId: 'l1',
        expectedRevision: 1,
        parameters: { reason: aReason }
      })
    ).toFailWith(unsupportedLine('task_command_cancel'));
    const listRecord = (await h.repository.readCommit('l1' as never)).orThrow();
    expect(listRecord?.recordType === 'resolved' && listRecord.task.envelope.lifecycle.status).toBe(
      'pending'
    );
  });

  test('a shape the schema refuses never reaches the writer', async () => {
    expect(
      await call(tools, 'task_command_start', {
        taskId: 't1',
        expectedRevision: 1,
        parameters: { force: true }
      })
    ).toFailWith(/task_command_start: invalid arguments/);
    expect(record(await inspected(tools, 't1'))).toEqual(expect.objectContaining({ status: 'pending' }));
  });

  test('a value only the converter refuses (a two-line title) reads as the unknown line, and records nothing', async () => {
    // A known-wrong pin. The wire subset cannot state the converter's bounds; the broker refuses the
    // value as `invalid` before anything is recorded, but I1c reads every writer failure other than a
    // refusal of the task as an unknown outcome. docs/TECH_DEBT.md: "A command tool tells the model
    // 'do not send it again' for a native command the broker refused before recording anything" —
    // its fix must change this expectation.
    expect(await send(tools, 't1', 'set-title', { title: 'one\ntwo' })).toFailWith(
      unknownLine('task_command_set-title')
    );
    const unchanged = await inspected(tools, 't1');
    expect(unchanged.revision).toBe(1);
  });

  test('a host offers a subset by naming it: a withheld command is no tool at all', async () => {
    const some = trackedTools(
      h,
      trackedSpecs.filter((s) => s.command === 'set-title')
    );
    expect(some.names).toEqual(['task_query', 'task_inspect', 'task_command_set-title']);
  });
});

// ------------------------------------------------------------------------------------------
// Through a model turn
// ------------------------------------------------------------------------------------------

type Body = JsonObject;

/** A captured value as a JSON object — converted, never asserted. */
function obj(value: unknown): JsonObject {
  return JsonConverters.jsonObject.convert(value).orThrow();
}

/** A captured array of JSON objects (absent reads as empty) — converted, never asserted. */
function objects(value: unknown): JsonObject[] {
  return value === undefined ? [] : Converters.arrayOf(JsonConverters.jsonObject).convert(value).orThrow();
}

/** The captured tool or declaration named `name`, failing loudly when it was not sent. */
function named(items: ReadonlyArray<JsonObject>, name: string): JsonObject {
  const found = items.find((item) => item.name === name);
  if (found === undefined) {
    throw new Error(`nothing named ${name} was sent`);
  }
  return found;
}

/** Stubs `fetch`: records each request body and answers with one SSE stream per call, in turn. */
function captureRequests(streams: ReadonlyArray<string>): Body[] {
  const bodies: Body[] = [];
  const encoder = new TextEncoder();
  let n = 0;
  jest.spyOn(global, 'fetch').mockImplementation(async (__url, init) => {
    bodies.push(obj(JSON.parse(String(init?.body))));
    const sse = streams[Math.min(n++, streams.length - 1)];
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

async function runTurn(
  provider: string,
  clientTools: ReadonlyArray<AiAssist.IAiClientTool>
): Promise<AiAssist.IAiStreamEvent[]> {
  const turn = AiAssist.executeClientToolTurn({
    descriptor: AiAssist.getProviderDescriptor(provider).orThrow(),
    apiKey: 'test-key',
    messages: [{ role: 'user', content: 'start my task' }],
    clientTools
  }).orThrow();
  const events: AiAssist.IAiStreamEvent[] = [];
  for await (const event of turn.events) {
    events.push(event);
  }
  await turn.nextTurn;
  return events;
}

const anthropicStop: string = 'event: message_stop\ndata: {}\n\n';
const responsesDone: string = `event: response.completed\ndata: ${JSON.stringify({
  response: { status: 'completed' }
})}\n\n`;
const geminiDone: string = `data: ${JSON.stringify({
  candidates: [{ content: { parts: [{ text: '' }] }, finishReason: 'STOP' }]
})}\n\n`;

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
  return objects(body?.tools);
}

describe('through a model turn', () => {
  let h: IBrokerHarness;
  let tools: IToolSet;
  const offered = ['task_inspect', 'task_command_start', 'task_command_resume', 'task_command_pause'];

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't1');
    tools = trackedTools(h);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('a streamed call to task_command_start moves the task, and task_inspect reports running', async () => {
    captureRequests([
      anthropicCalls('toolu_1', 'task_command_start', { taskId: 't1', expectedRevision: 1, parameters: {} }),
      anthropicStop
    ]);
    const events = await runTurn(
      'anthropic',
      offered.map((name) => tools.get(name))
    );
    const result = events.find(
      (e): e is AiAssist.IAiStreamToolUseComplete => e.type === 'client-tool-result'
    );
    if (result === undefined) {
      throw new Error('the turn produced no client-tool-result');
    }
    expect(result).toEqual(expect.objectContaining({ toolName: 'task_command_start', isError: false }));
    expect(JSON.parse(result.result)).toEqual({ taskId: 't1', state: 'applied', revision: 2 });
    expect(record(await inspected(tools, 't1'))).toEqual(expect.objectContaining({ status: 'running' }));
  });

  test('Anthropic and OpenAI receive the empty-parameter commands as an empty closed object', async () => {
    const emptyParameters = {
      type: 'object',
      properties: {},
      additionalProperties: false,
      description: 'No parameters: start a pending task.'
    };
    let bodies = captureRequests([anthropicStop]);
    await runTurn(
      'anthropic',
      offered.map((name) => tools.get(name))
    );
    const anthropicSchema = obj(named(toolsOf(bodies[0]), 'task_command_start').input_schema);
    expect(anthropicSchema.properties).toEqual(expect.objectContaining({ parameters: emptyParameters }));
    expect(anthropicSchema.required).toEqual(['taskId', 'expectedRevision', 'parameters']);

    jest.restoreAllMocks();
    bodies = captureRequests([responsesDone]);
    await runTurn(
      'openai',
      offered.map((name) => tools.get(name))
    );
    const openaiSchema = obj(named(toolsOf(bodies[0]), 'task_command_start').parameters);
    expect(openaiSchema.properties).toEqual(expect.objectContaining({ parameters: emptyParameters }));
  });

  test('Gemini receives the empty-parameter commands as an object with no properties — sanitized, not live-verified', async () => {
    const bodies = captureRequests([geminiDone]);
    await runTurn(
      'google-gemini',
      offered.map((name) => tools.get(name))
    );
    const declarations = toolsOf(bodies[0]).flatMap((t) => objects(t.function_declarations));
    const start = named(declarations, 'task_command_start');
    // Gemini's dialect drops `additionalProperties`; what remains is an OBJECT with empty properties.
    // Whether Gemini's API accepts a nested OBJECT with no properties is not established here
    // (docs/TECH_DEBT.md).
    expect(obj(obj(start.parameters).properties).parameters).toEqual({
      type: 'object',
      properties: {},
      description: 'No parameters: start a pending task.'
    });
  });
});
