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
 * `executeClientToolTurn` never dispatches a tool once the turn's signal has aborted, and it
 * reports how long each call took.
 */

import '@fgv/ts-utils-jest';

import { succeed } from '@fgv/ts-utils';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { executeClientToolTurn } from '../../../packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiStreamEvent } from '../../../packlets/ai-assist/model';
import {
  anthropicToolUseSse,
  collect,
  makeAnthropicDescriptor,
  makeRecallTool,
  queueSse
} from './clientToolSseFixtures';

const toolEvents = (events: ReadonlyArray<IAiStreamEvent>): string[] =>
  events
    .filter((e) => e.type === 'client-tool-call-done' || e.type === 'client-tool-result')
    .map((e) => (e.type === 'client-tool-result' ? `result:${e.isError ? 'error' : 'ok'}` : 'call-done'));

describe('executeClientToolTurn — no dispatch after abort', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('a signal aborted before a call is dispatched runs neither the gate nor the tool, and reports the call as aborted', async () => {
    const execute = jest.fn(async () => succeed('found'));
    const gate = jest.fn(async () => succeed({ action: 'proceed' as const }));
    const controller = new AbortController();
    controller.abort();
    queueSse(anthropicToolUseSse([{ id: 'toolu_1', name: 'recall' }]));
    const { events, nextTurn } = executeClientToolTurn({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'k',
      messages: [{ role: 'user', content: 'hi' }],
      clientTools: [makeRecallTool(execute)],
      onBeforeToolExecute: gate,
      signal: controller.signal
    }).orThrow();
    const seen = await collect(events);
    expect(toolEvents(seen)).toEqual(['call-done', 'result:error']);
    expect(seen).toContainEqual(
      expect.objectContaining({
        type: 'client-tool-result',
        isError: true,
        result: expect.stringMatching(/aborted/)
      })
    );
    expect(gate).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
    expect(await nextTurn).toSucceedAndSatisfy((turn) => {
      expect(turn.continuation?.toolCallsSummary).toEqual([
        expect.objectContaining({
          toolName: 'recall',
          callId: 'toolu_1',
          isError: true,
          result: expect.stringMatching(/aborted/)
        })
      ]);
    });
  });

  test('a signal that aborts while the gate decides stops the tool from running', async () => {
    const execute = jest.fn(async () => succeed('found'));
    const controller = new AbortController();
    queueSse(anthropicToolUseSse([{ id: 'toolu_1', name: 'recall' }]));
    const { events, nextTurn } = executeClientToolTurn({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'k',
      messages: [{ role: 'user', content: 'hi' }],
      clientTools: [makeRecallTool(execute)],
      onBeforeToolExecute: async () => {
        controller.abort();
        return succeed({ action: 'proceed' as const });
      },
      signal: controller.signal
    }).orThrow();
    expect(toolEvents(await collect(events))).toEqual(['call-done', 'result:error']);
    expect(execute).not.toHaveBeenCalled();
    expect(await nextTurn).toSucceedAndSatisfy((turn) => {
      expect(turn.continuation?.toolCallsSummary[0]?.result).toMatch(/aborted/);
    });
  });

  test('a signal that aborts during one call stops every later call in the round from starting', async () => {
    const controller = new AbortController();
    const execute = jest.fn(async () => {
      controller.abort();
      return succeed('found');
    });
    queueSse(
      anthropicToolUseSse([
        { id: 'toolu_1', name: 'recall' },
        { id: 'toolu_2', name: 'recall' }
      ])
    );
    const { events, nextTurn } = executeClientToolTurn({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'k',
      messages: [{ role: 'user', content: 'hi' }],
      clientTools: [makeRecallTool(execute)],
      signal: controller.signal
    }).orThrow();
    expect(toolEvents(await collect(events))).toEqual([
      'call-done',
      'result:ok',
      'call-done',
      'result:error'
    ]);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(await nextTurn).toSucceedAndSatisfy((turn) => {
      expect(turn.continuation?.toolCallsSummary.map((c) => c.isError)).toEqual([false, true]);
    });
  });
});

describe('executeClientToolTurn — durationMs', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** A clock that moves only when the test advances it. */
  function manualClock(): { now: () => number; advance: (ms: number) => void } {
    let t = 1000;
    return {
      now: () => t,
      advance: (ms) => {
        t += ms;
      }
    };
  }

  test('times the gate and execute of each call, and never the consumer between events', async () => {
    const clock = manualClock();
    queueSse(
      anthropicToolUseSse([
        { id: 'toolu_1', name: 'recall' },
        { id: 'toolu_2', name: 'missing' }
      ])
    );
    const { events, nextTurn } = executeClientToolTurn({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'k',
      messages: [{ role: 'user', content: 'hi' }],
      clientTools: [
        makeRecallTool(async () => {
          clock.advance(30);
          return succeed('found');
        })
      ],
      onBeforeToolExecute: async () => {
        clock.advance(5);
        return succeed({ action: 'proceed' as const });
      },
      clock: clock.now
    }).orThrow();
    const seen: string[] = [];
    for await (const event of events) {
      // A slow consumer: every event costs it 1000 ms, none of which is a tool's.
      seen.push(event.type);
      clock.advance(1000);
    }
    expect(seen).toContain('client-tool-result');
    expect(await nextTurn).toSucceedAndSatisfy((turn) => {
      expect(turn.continuation?.toolCallsSummary.map((c) => [c.toolName, c.durationMs])).toEqual([
        ['recall', 35],
        ['missing', 0]
      ]);
    });
  });

  test('a clock that steps backwards reports zero, never a negative duration', async () => {
    const readings = [100, 40];
    queueSse(anthropicToolUseSse([{ id: 'toolu_1', name: 'recall' }]));
    const { events, nextTurn } = executeClientToolTurn({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'k',
      messages: [{ role: 'user', content: 'hi' }],
      clientTools: [makeRecallTool()],
      clock: () => readings.shift() ?? 0
    }).orThrow();
    await collect(events);
    expect(await nextTurn).toSucceedAndSatisfy((turn) => {
      expect(turn.continuation?.toolCallsSummary[0]?.durationMs).toBe(0);
    });
  });

  test('defaults to a real clock', async () => {
    queueSse(anthropicToolUseSse([{ id: 'toolu_1', name: 'recall' }]));
    const { events, nextTurn } = executeClientToolTurn({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'k',
      messages: [{ role: 'user', content: 'hi' }],
      clientTools: [makeRecallTool()]
    }).orThrow();
    await collect(events);
    expect(await nextTurn).toSucceedAndSatisfy((turn) => {
      expect(turn.continuation?.toolCallsSummary[0]?.durationMs).toBeGreaterThanOrEqual(0);
    });
  });
});
