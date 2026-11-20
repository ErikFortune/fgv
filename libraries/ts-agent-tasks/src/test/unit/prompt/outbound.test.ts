/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * What actually leaves: a checked task prompt sent through ai-assist's own request builders, with
 * `fetch` stubbed to record the body. Composition diagnostics describe a body; only the captured
 * request shows that the body and the breakpoint plan reached the wire as checked.
 */

import '@fgv/ts-utils-jest';
import { AiAssist } from '@fgv/ts-extras';
import { PromptLibrary } from '@fgv/ts-prompt-assist';
import {
  ICheckedTaskPrompt,
  ITaskContext,
  checkTaskPrompt,
  createTaskTools,
  taskDataInterpretationRules
} from '../../../index';
import {
  instructions,
  library,
  personaText,
  render,
  request,
  standardRecord,
  task
} from '../../helpers/promptFixtures';
import { bindReader } from '../../helpers/toolFixtures';
import { brokerHarness, track } from '../../helpers/brokerFixtures';

type Body = Record<string, unknown>;
interface ITextBlock {
  readonly type: string;
  readonly text: string;
  readonly cache_control?: unknown;
}

/** Stubs `fetch`: records each request body and answers with `response` as JSON or an SSE stream. */
function capture(response: unknown, sse?: string): Body[] {
  const bodies: Body[] = [];
  jest.spyOn(global, 'fetch').mockImplementation(async (__url, init) => {
    bodies.push(JSON.parse(String(init?.body)) as Body);
    if (sse !== undefined) {
      const encoder = new TextEncoder();
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
    }
    return {
      ok: true,
      status: 200,
      json: async () => response,
      text: async () => JSON.stringify(response)
    } as unknown as Response;
  });
  return bodies;
}

/** The exact breakpoint the progress-only pair shares, quoted in the stream's result. */
const PREFIX_UTF16: number = 391;

/** The standard prompt's stable prefix, built from the fixture's parts independently of any composition. */
const _expectedPrefix: string = `${[instructions, taskDataInterpretationRules, personaText].join(
  '\n\n'
)}\n\n`;

const anthropicOk: unknown = { content: [{ type: 'text', text: 'ok' }], stop_reason: 'end_turn' };

async function sendAnthropic(checked: ICheckedTaskPrompt): Promise<Body> {
  const bodies = capture(anthropicOk);
  expect(
    await AiAssist.callProviderCompletion({
      descriptor: AiAssist.getProviderDescriptor('anthropic').orThrow(),
      apiKey: 'test-key',
      system: checked.system,
      messages: [{ role: 'user', content: 'what next?' }],
      cache: checked.cacheRequest
    })
  ).toSucceed();
  expect(bodies).toHaveLength(1);
  return bodies[0];
}

async function checked(lib: PromptLibrary, context: ITaskContext): Promise<ICheckedTaskPrompt> {
  return (await checkTaskPrompt({ library: lib, request, context })).orThrow();
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('the outbound system body is the analyzed body, with its breakpoint where the plan put it', () => {
  test('Anthropic: the system blocks are the checked body, split at the task slot, the prefix marked for caching', async () => {
    const lib = await library([standardRecord()]);
    const context = render([task('t1', 3, 4, 'survey sources')]);
    const prompt = await checked(lib, context);
    const body = await sendAnthropic(prompt);
    const blocks = body.system as ITextBlock[];
    expect(blocks).toEqual([
      {
        type: 'text',
        text: prompt.system.slice(0, prompt.taskSlot.start),
        cache_control: { type: 'ephemeral' }
      },
      { type: 'text', text: context.text }
    ]);
    expect(blocks.map((b) => b.text).join('')).toBe(prompt.system);
    // The task context is on the wire exactly once, and nowhere but the trailing block.
    expect(JSON.stringify(body).split(JSON.stringify(context.text).slice(1, -1))).toHaveLength(2);
  });

  test('OpenAI: the leading system content parts are the checked body, with the breakpoint on the prefix', async () => {
    const lib = await library([standardRecord()]);
    const context = render([task('t1', 3, 4)]);
    const prompt = await checked(lib, context);
    const bodies = capture({ choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] });
    await AiAssist.callProviderCompletion({
      descriptor: AiAssist.getProviderDescriptor('openai').orThrow(),
      apiKey: 'test-key',
      system: prompt.system,
      messages: [{ role: 'user', content: 'what next?' }],
      cache: prompt.cacheRequest
    });
    expect(bodies).toHaveLength(1);
    const serialized: string = JSON.stringify(bodies[0]);
    const parts = _systemParts(bodies[0]);
    expect(parts.map((p) => p.text).join('')).toBe(prompt.system);
    expect(parts[0].text).toBe(prompt.system.slice(0, prompt.taskSlot.start));
    expect(parts[parts.length - 1].text).toBe(context.text);
    expect(serialized).toContain('prompt_cache_breakpoint');
  });

  test('a tool-use turn carries the checked body and plan beside the task tools', async () => {
    const h = await brokerHarness();
    await track(h.writer, 't1');
    const lib = await library([standardRecord()]);
    const context = render([task('t1', 3, 4)]);
    const prompt = await checked(lib, context);
    const bodies = capture(undefined, 'event: message_stop\ndata: {}\n\n');
    const turn = AiAssist.executeClientToolTurn({
      descriptor: AiAssist.getProviderDescriptor('anthropic').orThrow(),
      apiKey: 'test-key',
      system: prompt.system,
      cache: prompt.cacheRequest,
      messages: [{ role: 'user', content: 'what next?' }],
      clientTools: createTaskTools({ view: bindReader(h) }).orThrow()
    }).orThrow();
    const events: AiAssist.IAiStreamEvent[] = [];
    for await (const event of turn.events) {
      events.push(event);
    }
    await turn.nextTurn;
    const blocks = bodies[0].system as ITextBlock[];
    expect(blocks.map((b) => b.text).join('')).toBe(prompt.system);
    expect(blocks[0].cache_control).toEqual({ type: 'ephemeral' });
    expect((bodies[0].tools as Array<{ name: string }>).map((t) => t.name)).toEqual([
      'task_query',
      'task_inspect'
    ]);
  });

  test('a host that mutates the body after the check sends what the plan does not describe — and gets no receipt', async () => {
    const lib = await library([standardRecord()]);
    const context = render([task('t1', 3, 4)], 'delivery-1');
    const prompt = await checked(lib, context);
    const mutated: string = `Today is Tuesday.\n${prompt.system}`;
    const bodies = capture(anthropicOk);
    await AiAssist.callProviderCompletion({
      descriptor: AiAssist.getProviderDescriptor('anthropic').orThrow(),
      apiKey: 'test-key',
      system: mutated,
      messages: [{ role: 'user', content: 'what next?' }],
      cache: prompt.cacheRequest
    });
    const blocks = bodies[0].system as ITextBlock[];
    // The old offset now cuts the body in the wrong place: the "stable prefix" on the wire is not
    // the checked one, and its last characters spill into the task block.
    expect(blocks[0].text).not.toBe(prompt.system.slice(0, prompt.taskSlot.start));
    expect(blocks[1].text).not.toBe(context.text);
    expect(prompt.receiptFor(mutated)).toFailWith(/not the checked body/);
    expect(prompt.receiptFor(blocks.map((b) => b.text).join(''))).toFailWith(/not the checked body/);
  });
});

describe('two requests changing progress only', () => {
  test('the stable prefix and its exact UTF-16 breakpoint are unchanged; the task block and receipt change', async () => {
    const lib = await library([standardRecord()]);
    const before = render([task('t1', 3, 4, 'survey sources'), task('t2', 5, 1, 'draft summary')]);
    const after = render([task('t1', 4, 7, 'survey sources'), task('t2', 5, 1, 'draft summary')]);
    const a = await checked(lib, before);
    const b = await checked(lib, after);
    const wireA = await sendAnthropic(a);
    const wireB = await sendAnthropic(b);

    expect(a.cacheRequest.systemBreakpoints).toEqual([a.taskSlot.start]);
    expect(b.cacheRequest).toEqual(a.cacheRequest);
    expect(a.system.slice(0, a.taskSlot.start)).toBe(_expectedPrefix);
    expect(a.taskSlot.start).toBe(PREFIX_UTF16);
    const blocksA = wireA.system as ITextBlock[];
    const blocksB = wireB.system as ITextBlock[];
    expect(blocksB[0]).toEqual(blocksA[0]);
    expect(blocksA[1].text).not.toBe(blocksB[1].text);
    expect(blocksA[1].text).toContain('"completed":4');
    expect(blocksB[1].text).toContain('"completed":7');
    expect(a.receiptFor(a.system).orThrow().included).toEqual([
      { taskId: 't1', revision: 3, updateIds: [] },
      { taskId: 't2', revision: 5, updateIds: [] }
    ]);
    expect(b.receiptFor(b.system).orThrow().included[0]).toEqual({
      taskId: 't1',
      revision: 4,
      updateIds: []
    });
  });

  test('the same holds for an empty task set, which is not the same text as a dropped slot', async () => {
    const lib = await library([standardRecord()]);
    const empty = render([]);
    const one = render([task('t1', 3, 4)]);
    const a = await checked(lib, empty);
    const b = await checked(lib, one);
    expect(a.cacheRequest).toEqual(b.cacheRequest);
    expect(a.system.slice(0, a.taskSlot.start)).toBe(b.system.slice(0, b.taskSlot.start));
    // An empty set still renders its framing and its omission report: a present-but-empty slot.
    expect(empty.text).toMatch(/^<task-context version="1">/);
    expect(a.taskSlot.chars).toBe(empty.text.length);
    expect(a.receiptFor(a.system).orThrow().included).toEqual([]);
  });

  test('Unicode and astral text: offsets are UTF-16 code units, not bytes or code points', async () => {
    const lib = await library([
      standardRecord({ instructions: 'Coordinate the équipe 𝒜 research — carefully.' })
    ]);
    const a = await checked(lib, render([task('t1', 3, 4, 'résumé 🧪 sources')]));
    const b = await checked(lib, render([task('t1', 4, 5, 'résumé 🧪 sources')]));
    const prefix: string = a.system.slice(0, a.taskSlot.start);
    expect(a.taskSlot.start).toBe(prefix.length);
    expect(Buffer.byteLength(prefix, 'utf8')).not.toBe(prefix.length);
    expect([...prefix].length).not.toBe(prefix.length);
    expect(b.cacheRequest).toEqual(a.cacheRequest);
    const wire = (await sendAnthropic(a)).system as ITextBlock[];
    expect(wire[0].text).toBe(prefix);
    expect(wire[1].text).toContain('🧪');
  });

  test('repeated text: identical task titles and a host slot echoing a title do not move the slot', async () => {
    const lib = await library([standardRecord()]);
    const context = render([task('t1', 3, 4, 'same'), task('t2', 3, 4, 'same')]);
    const prompt = (
      await checkTaskPrompt({
        library: lib,
        request: { ...request, substitutions: { persona: 'task t1 same' } },
        context
      })
    ).orThrow();
    expect(prompt.system.slice(prompt.taskSlot.start)).toBe(context.text);
  });
});

function _systemParts(body: Body): ReadonlyArray<{ text: string }> {
  const messages = (body.messages ?? body.input) as Array<{ role: string; content: unknown }>;
  const system = messages.find((m) => m.role === 'system' || m.role === 'developer');
  return system!.content as ReadonlyArray<{ text: string }>;
}
