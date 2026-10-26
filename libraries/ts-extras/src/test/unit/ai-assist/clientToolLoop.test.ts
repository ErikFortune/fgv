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
 * `runClientToolLoop` against the real `executeClientToolTurn`, with `fetch` mocked one provider
 * round at a time.
 */

import '@fgv/ts-utils-jest';

import { Logging, type Result, succeed } from '@fgv/ts-utils';
import { type JsonObject } from '@fgv/ts-json-base';
import { AiAssist, AsyncControl } from '../../..';
import {
  anthropicTextSse,
  anthropicToolUseSse,
  geminiToolCallsSse,
  makeAnthropicDescriptor,
  makeGeminiDescriptor,
  makeReadable,
  makeRecallTool,
  queueSse,
  queueStalledSse,
  sseResponse
} from './clientToolSseFixtures';

const { runClientToolLoop } = AiAssist;

/** A promise that never settles. */
function never<T>(): Promise<T> {
  return new Promise<T>(() => undefined);
}

/** Yields to the event loop until `cond` holds (bounded; never a wall-clock wait). */
async function until(cond: () => boolean): Promise<void> {
  for (let i = 0; i < 500 && !cond(); i++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
  expect(cond()).toBe(true);
}

/** A timer seam the test fires by hand. Its cancel cannot stop a fire already in hand. */
interface IManualTimer {
  readonly schedule: AsyncControl.ScheduleTimer;
  readonly fire: () => void;
  readonly armed: () => number;
  readonly cancelled: () => number;
}

function manualTimer(): IManualTimer {
  let fn: (() => void) | undefined;
  let armed = 0;
  let cancelled = 0;
  return {
    schedule: (callback) => {
      fn = callback;
      armed += 1;
      return () => {
        cancelled += 1;
      };
    },
    fire: () => fn?.(),
    armed: () => armed,
    cancelled: () => cancelled
  };
}

function fetchMock(): jest.Mock {
  return global.fetch as jest.Mock;
}

interface IFetchInit {
  readonly body: string;
  readonly signal?: AbortSignal;
}

function fetchInit(call: number): IFetchInit {
  return fetchMock().mock.calls[call][1] as IFetchInit;
}

function fetchBody(call: number): JsonObject {
  return JSON.parse(fetchInit(call).body) as JsonObject;
}

/** How many times `needle` appears in the request body of fetch call `call`. */
function occurrences(call: number, needle: string): number {
  return fetchInit(call).body.split(needle).length - 1;
}

function baseParams(extra?: Partial<AiAssist.IClientToolLoopParams>): AiAssist.IClientToolLoopParams {
  return {
    descriptor: makeAnthropicDescriptor(),
    apiKey: 'k',
    system: 'You are a helpful agent.',
    messages: [{ role: 'user', content: 'Look it up.' }],
    clientTools: [makeRecallTool()],
    maxRounds: 8,
    ...extra
  };
}

describe('runClientToolLoop', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('rounds and the continuation', () => {
    test('replaces the cumulative continuation each round, so every exchange is sent exactly once', async () => {
      queueSse(anthropicToolUseSse([{ id: 'toolu_r1', name: 'recall' }], 'one'));
      queueSse(anthropicToolUseSse([{ id: 'toolu_r2', name: 'recall' }], 'two'));
      queueSse(anthropicToolUseSse([{ id: 'toolu_r3', name: 'recall' }], 'three'));
      queueSse(anthropicTextSse('done'));
      expect(await runClientToolLoop(baseParams())).toSucceedAndSatisfy((outcome) => {
        expect(outcome.state).toBe('completed');
        expect(outcome.rounds.map((r) => [r.round, r.fullText])).toEqual([
          [1, 'one'],
          [2, 'two'],
          [3, 'three'],
          [4, 'done']
        ]);
        expect(outcome.rounds[0]?.calls.map((c) => c.callId)).toEqual(['toolu_r1']);
        expect(outcome.rounds[3]?.calls).toEqual([]);
        // The final tail is the one round 4 was sent: three exchanges, two messages each.
        expect(outcome.continuationMessages).toHaveLength(6);
      });
      expect(fetchMock()).toHaveBeenCalledTimes(4);
      expect(occurrences(0, 'toolu_')).toBe(0);
      // Each id appears twice per send (tool_use + tool_result) and is sent once per later round.
      expect(['toolu_r1', 'toolu_r2', 'toolu_r3'].map((id) => occurrences(3, id))).toEqual([2, 2, 2]);
      expect(['toolu_r1', 'toolu_r2'].map((id) => occurrences(2, id))).toEqual([2, 2]);
      expect(occurrences(1, 'toolu_r1')).toBe(2);
    });

    test('every round carries the same parameters and a signal of the loop own, never the caller', async () => {
      const caller = new AbortController();
      queueSse(anthropicToolUseSse([{ id: 'toolu_1', name: 'recall' }]));
      queueSse(anthropicTextSse('done'));
      expect(
        await runClientToolLoop(baseParams({ maxTokens: 512, temperature: 0.3, signal: caller.signal }))
      ).toSucceed();
      for (const call of [0, 1]) {
        expect(fetchBody(call)).toMatchObject({ max_tokens: 512, temperature: 0.3 });
        expect(fetchInit(call).body).toContain('You are a helpful agent.');
        expect(fetchInit(call).signal).toBeDefined();
        expect(fetchInit(call).signal).not.toBe(caller.signal);
        expect(fetchInit(call).signal?.aborted).toBe(false);
      }
    });

    test('reports truncation per round and applies no policy to it', async () => {
      queueSse(anthropicTextSse('cut', { stopReason: 'max_tokens' }));
      expect(await runClientToolLoop(baseParams())).toSucceedAndSatisfy((outcome) => {
        expect(outcome.state).toBe('completed');
        expect(outcome.rounds.map((r) => r.truncated)).toEqual([true]);
        expect(outcome.continuationMessages).toBeUndefined();
      });
    });

    test('carries the round usage, never fabricating one', async () => {
      queueSse(anthropicToolUseSse([{ id: 'toolu_1', name: 'recall' }]));
      queueSse(anthropicTextSse('done', { usage: { input_tokens: 200, output_tokens: 15 } }));
      expect(await runClientToolLoop(baseParams())).toSucceedAndSatisfy((outcome) => {
        expect('usage' in outcome.rounds[0]!).toBe(false);
        expect(outcome.rounds[1]?.usage).toMatchObject({ outputTokens: 15 });
        expect(outcome.rounds[1]?.toolConflicts).toEqual({
          policy: 'drop-server-tools',
          droppedServerTools: [],
          droppedClientTools: []
        });
      });
    });

    test('charges the provider only the part of a round no tool spent', async () => {
      let t = 1000;
      const clock = (): number => t;
      fetchMock().mockImplementationOnce(async () => {
        t += 7;
        return sseResponse(makeReadable(anthropicToolUseSse([{ id: 'toolu_1', name: 'recall' }])));
      });
      fetchMock().mockImplementationOnce(async () => {
        t += 4;
        return sseResponse(makeReadable(anthropicTextSse('done')));
      });
      const slow = makeRecallTool(async () => {
        t += 30;
        return succeed('found');
      });
      expect(await runClientToolLoop(baseParams({ clientTools: [slow], clock }))).toSucceedAndSatisfy(
        (outcome) => {
          expect(outcome.rounds[0]?.calls.map((c) => c.durationMs)).toEqual([30]);
          expect(outcome.rounds.map((r) => r.providerDurationMs)).toEqual([7, 4]);
        }
      );
    });

    test('defaults to the real clock and timer', async () => {
      queueSse(anthropicTextSse('done'));
      expect(await runClientToolLoop(baseParams({ deadlineMs: 60000 }))).toSucceedAndSatisfy((outcome) => {
        expect(outcome.rounds[0]?.providerDurationMs).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('the round cap', () => {
    test('maxRounds exactly hit with the model still asking for tools is round-limit, with the tail to resume from', async () => {
      queueSse(anthropicToolUseSse([{ id: 'toolu_1', name: 'recall' }]));
      queueSse(anthropicToolUseSse([{ id: 'toolu_2', name: 'recall' }]));
      queueSse(anthropicTextSse('never sent'));
      expect(await runClientToolLoop(baseParams({ maxRounds: 2 }))).toSucceedAndSatisfy((outcome) => {
        expect(outcome.state).toBe('round-limit');
        expect(outcome.rounds.map((r) => r.round)).toEqual([1, 2]);
        expect(outcome.continuationMessages).toHaveLength(4);
      });
      expect(fetchMock()).toHaveBeenCalledTimes(2);
    });

    test('maxRounds exactly hit by a completing round is completed, not round-limit', async () => {
      queueSse(anthropicToolUseSse([{ id: 'toolu_1', name: 'recall' }]));
      queueSse(anthropicTextSse('done'));
      expect(await runClientToolLoop(baseParams({ maxRounds: 2 }))).toSucceedAndSatisfy((outcome) => {
        expect(outcome.state).toBe('completed');
        expect(outcome.continuationMessages).toHaveLength(2);
      });
    });

    test.each([0, -1, 1.5, Number.NaN])('refuses a maxRounds of %p before any round', async (maxRounds) => {
      const result = await runClientToolLoop(baseParams({ maxRounds }));
      expect(result).toFailWithDetail(/maxRounds must be a positive integer/, { rounds: [] });
      expect(fetchMock()).not.toHaveBeenCalled();
    });

    test('refuses an invalid deadlineMs before any round', async () => {
      const timer = manualTimer();
      const result = await runClientToolLoop(
        baseParams({ deadlineMs: Number.POSITIVE_INFINITY, schedule: timer.schedule })
      );
      expect(result).toFailWithDetail(/deadlineMs must be an integer/, { rounds: [] });
      expect(timer.armed()).toBe(0);
      expect(fetchMock()).not.toHaveBeenCalled();
    });
  });

  describe('failures', () => {
    test('a round that fails ends the loop, carrying the rounds before it, with no retry', async () => {
      queueSse(anthropicToolUseSse([{ id: 'toolu_1', name: 'recall' }], 'a'));
      fetchMock().mockResolvedValueOnce({
        ok: false,
        status: 500,
        body: null,
        text: jest.fn().mockResolvedValue('upstream broke'),
        headers: new Map()
      });
      const result = await runClientToolLoop(baseParams());
      expect(result).toFailWithDetail(/500/, { rounds: [expect.objectContaining({ fullText: 'a' })] });
      expect(fetchMock()).toHaveBeenCalledTimes(2);
    });

    test('duplicate tool names are refused by round 1, with no rounds', async () => {
      const result = await runClientToolLoop(
        baseParams({ clientTools: [makeRecallTool(), makeRecallTool()] })
      );
      expect(result).toFailWithDetail(/duplicate client tool name 'recall'/, { rounds: [] });
      expect(fetchMock()).not.toHaveBeenCalled();
    });
  });

  describe('stops', () => {
    test('an already-aborted caller signal starts no round', async () => {
      const caller = new AbortController();
      caller.abort();
      expect(await runClientToolLoop(baseParams({ signal: caller.signal }))).toSucceedAndSatisfy(
        (outcome) => {
          expect(outcome).toEqual({ state: 'aborted', rounds: [], unsettledCalls: [] });
        }
      );
      expect(fetchMock()).not.toHaveBeenCalled();
    });

    test('a caller abort mid-round returns aborted at once although the tool never settles, and starts no further round', async () => {
      const caller = new AbortController();
      const stuck = makeRecallTool(() => {
        caller.abort();
        return never<Result<unknown>>();
      });
      queueSse(anthropicToolUseSse([{ id: 'toolu_1', name: 'recall' }]));
      queueSse(anthropicTextSse('never sent'));
      expect(
        await runClientToolLoop(baseParams({ clientTools: [stuck], signal: caller.signal }))
      ).toSucceedAndSatisfy((outcome) => {
        expect(outcome).toEqual({
          state: 'aborted',
          rounds: [],
          unsettledCalls: [{ toolName: 'recall', callId: 'toolu_1', args: { query: 'q' } }]
        });
      });
      expect(fetchMock()).toHaveBeenCalledTimes(1);
      expect(fetchInit(0).signal?.aborted).toBe(true);
    });

    test('the deadline returns with the completed rounds and their tail while a round stalls, aborting that round', async () => {
      const timer = manualTimer();
      queueSse(anthropicToolUseSse([{ id: 'toolu_1', name: 'recall' }], 'a'));
      queueStalledSse([]);
      const pending = runClientToolLoop(baseParams({ deadlineMs: 1000, schedule: timer.schedule }));
      await until(() => fetchMock().mock.calls.length === 2);
      timer.fire();
      expect(await pending).toSucceedAndSatisfy((outcome) => {
        expect(outcome.state).toBe('deadline');
        expect(outcome.rounds.map((r) => r.fullText)).toEqual(['a']);
        expect(outcome.continuationMessages).toHaveLength(2);
      });
      expect(fetchInit(1).signal?.aborted).toBe(true);
    });

    test('a stop during the drain stops forwarding events and dispatching tools, and never awaits the round', async () => {
      const caller = new AbortController();
      const seen: string[] = [];
      const second = jest.fn(async () => succeed('second'));
      const first = makeRecallTool(async () => {
        caller.abort();
        return succeed('first');
      }, 'first');
      queueSse(
        anthropicToolUseSse([
          { id: 'toolu_1', name: 'first' },
          { id: 'toolu_2', name: 'recall' }
        ])
      );
      const observer: AiAssist.IClientToolLoopObserver = {
        event: (round, e) => {
          seen.push(`${round}:${e.type}`);
        },
        round: () => {
          seen.push('round');
        }
      };
      expect(
        await runClientToolLoop(
          baseParams({ clientTools: [first, makeRecallTool(second)], signal: caller.signal, observer })
        )
      ).toSucceedAndSatisfy((outcome) => {
        expect(outcome.state).toBe('aborted');
      });
      // Let the orphaned round run on as far as it would.
      for (let i = 0; i < 20; i++) {
        await new Promise((resolve) => setImmediate(resolve));
      }
      expect(seen).toEqual(['1:client-tool-call-start', '1:client-tool-call-done']);
      expect(second).not.toHaveBeenCalled();
    });

    test('a deadline that fires as the final round delivers its last event discards that round', async () => {
      const timer = manualTimer();
      queueSse(anthropicTextSse('done'));
      const observer: AiAssist.IClientToolLoopObserver = {
        event: (__round, e) => {
          if (e.type === 'done') {
            timer.fire();
          }
        }
      };
      expect(
        await runClientToolLoop(baseParams({ deadlineMs: 1000, schedule: timer.schedule, observer }))
      ).toSucceedAndSatisfy((outcome) => {
        expect(outcome).toEqual({ state: 'deadline', rounds: [], unsettledCalls: [] });
      });
    });

    test('a deadline that fires after a round was recorded, before the loop returned, keeps that round', async () => {
      const timer = manualTimer();
      queueSse(anthropicTextSse('done'));
      const observer: AiAssist.IClientToolLoopObserver = {
        round: () => timer.fire()
      };
      expect(
        await runClientToolLoop(baseParams({ deadlineMs: 1000, schedule: timer.schedule, observer }))
      ).toSucceedAndSatisfy((outcome) => {
        expect(outcome.state).toBe('deadline');
        expect(outcome.rounds.map((r) => r.fullText)).toEqual(['done']);
      });
    });

    test.each([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])(
      'a deadline that fires %p microtasks after a round settles is never followed by that round reaching the observer',
      async (depth) => {
        const timer = manualTimer();
        const log: string[] = [];
        let reads = 0;
        const clock = (): number => {
          reads += 1;
          if (reads === 2) {
            // The round's last clock read, just before its work settles.
            let hop = (): void => {
              log.push('stop');
              timer.fire();
            };
            for (let i = 0; i < depth; i++) {
              const next = hop;
              hop = (): void => queueMicrotask(next);
            }
            queueMicrotask(hop);
          }
          return reads;
        };
        queueSse(anthropicTextSse('done'));
        const result = await runClientToolLoop(
          baseParams({
            clock,
            deadlineMs: 1000,
            schedule: timer.schedule,
            observer: { round: () => log.push('round') }
          })
        );
        expect(result).toSucceedAndSatisfy((outcome) => {
          // Whichever was observed first, the outcome agrees with the observer.
          if (log[0] === 'round') {
            expect(outcome.rounds).toHaveLength(1);
          } else {
            expect(outcome).toEqual({ state: 'deadline', rounds: [], unsettledCalls: [] });
          }
        });
        for (let i = 0; i < 20; i++) {
          await Promise.resolve();
        }
        // Nothing reaches the observer once the stop has fired.
        expect(log.slice(log.indexOf('stop'))).not.toContain('round');
      }
    );

    test('a deadline that fires after the loop settled changes nothing', async () => {
      const timer = manualTimer();
      const rounds: number[] = [];
      queueSse(anthropicTextSse('done'));
      expect(
        await runClientToolLoop(
          baseParams({
            deadlineMs: 1000,
            schedule: timer.schedule,
            observer: { round: (r) => rounds.push(r.round) }
          })
        )
      ).toSucceedAndSatisfy((outcome) => expect(outcome.state).toBe('completed'));
      timer.fire();
      expect(rounds).toEqual([1]);
    });
  });

  describe('unsettled calls', () => {
    test('a stop reports the calls the orphaned round handed off whose result the runner never saw', async () => {
      const caller = new AbortController();
      const writes: string[] = [];
      let release: () => void = () => undefined;
      const writer = makeRecallTool(async (args) => {
        caller.abort();
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        writes.push(args.query);
        return succeed('written');
      });
      const seen: string[] = [];
      queueSse(anthropicToolUseSse([{ id: 'toolu_w', name: 'recall', args: '{"query":"w1"}' }], 'a'));
      const result = await runClientToolLoop(
        baseParams({
          clientTools: [writer],
          signal: caller.signal,
          observer: { event: (__round, e) => seen.push(e.type) }
        })
      );
      // The write lands after the stop.
      release();
      for (let i = 0; i < 20; i++) {
        await new Promise((resolve) => setImmediate(resolve));
      }
      expect(writes).toEqual(['w1']);
      expect(seen).not.toContain('client-tool-result');
      expect(result).toSucceedAndSatisfy((outcome) => {
        expect(outcome.state).toBe('aborted');
        expect(outcome.rounds).toEqual([]);
        expect(outcome.continuationMessages).toBeUndefined();
        expect(outcome.unsettledCalls).toEqual([
          { toolName: 'recall', callId: 'toolu_w', args: { query: 'w1' } }
        ]);
      });
    });

    test('a call whose result the runner saw is not unsettled; pairing is by name when there are no call ids', async () => {
      const caller = new AbortController();
      let calls = 0;
      const tool = makeRecallTool(async () => {
        calls += 1;
        if (calls === 2) {
          caller.abort();
          return never<Result<unknown>>();
        }
        return succeed('found');
      });
      queueSse(geminiToolCallsSse(['recall', 'recall']));
      expect(
        await runClientToolLoop(
          baseParams({ descriptor: makeGeminiDescriptor(), clientTools: [tool], signal: caller.signal })
        )
      ).toSucceedAndSatisfy((outcome) => {
        expect(outcome.state).toBe('aborted');
        expect(outcome.unsettledCalls).toEqual([{ toolName: 'recall', args: { query: 'q' } }]);
      });
    });

    test('a stop before the in-flight round makes any call leaves no unsettled calls, and recorded calls are not listed', async () => {
      const timer = manualTimer();
      queueSse(geminiToolCallsSse(['other']));
      queueStalledSse([]);
      const pending = runClientToolLoop(
        baseParams({ descriptor: makeGeminiDescriptor(), deadlineMs: 1000, schedule: timer.schedule })
      );
      await until(() => fetchMock().mock.calls.length === 2);
      timer.fire();
      expect(await pending).toSucceedAndSatisfy((outcome) => {
        expect(outcome.state).toBe('deadline');
        // Round 1's unknown-tool call settled and was recorded; round 2 had made no call.
        expect(outcome.rounds.map((r) => r.calls.map((c) => c.toolName))).toEqual([['other']]);
        expect(outcome.unsettledCalls).toEqual([]);
      });
    });

    test('completed and round-limit outcomes carry no unsettledCalls', async () => {
      queueSse(anthropicToolUseSse([{ id: 'toolu_1', name: 'recall' }]));
      expect(await runClientToolLoop(baseParams({ maxRounds: 1 }))).toSucceedAndSatisfy((outcome) => {
        expect(outcome.state).toBe('round-limit');
        expect('unsettledCalls' in outcome).toBe(false);
      });
    });
  });

  describe('cleanup', () => {
    type Path = 'completed' | 'round-limit' | 'failed' | 'aborted' | 'deadline';
    test.each<Path>(['completed', 'round-limit', 'failed', 'aborted', 'deadline'])(
      'releases the deadline timer and the caller listener on the %s path',
      async (path) => {
        const timer = manualTimer();
        const caller = new AbortController();
        const removed = jest.spyOn(caller.signal, 'removeEventListener');
        if (path === 'completed') {
          queueSse(anthropicTextSse('done'));
        } else if (path === 'round-limit') {
          queueSse(anthropicToolUseSse([{ id: 'toolu_1', name: 'recall' }]));
        } else if (path === 'failed') {
          fetchMock().mockRejectedValueOnce(new Error('network down'));
        } else {
          queueStalledSse([]);
        }
        const pending = runClientToolLoop(
          baseParams({ maxRounds: 1, deadlineMs: 1000, schedule: timer.schedule, signal: caller.signal })
        );
        if (path === 'aborted' || path === 'deadline') {
          await until(() => fetchMock().mock.calls.length === 1);
          if (path === 'aborted') {
            caller.abort();
          } else {
            timer.fire();
          }
        }
        const result = await pending;
        if (path === 'failed') {
          expect(result).toFail();
        } else {
          expect(result).toSucceedAndSatisfy((outcome) => expect(outcome.state).toBe(path));
        }
        expect(timer.armed()).toBe(1);
        expect(timer.cancelled()).toBe(1);
        expect(removed).toHaveBeenCalledWith('abort', expect.any(Function));
      }
    );
  });

  describe('the observer', () => {
    test('sees every round and every event, in order', async () => {
      const seen: string[] = [];
      queueSse(anthropicToolUseSse([{ id: 'toolu_1', name: 'recall' }]));
      queueSse(anthropicTextSse('done'));
      expect(
        await runClientToolLoop(
          baseParams({
            observer: {
              event: (round, e) => {
                if (e.type === 'done' || e.type === 'client-tool-result') {
                  seen.push(`${round}:${e.type}`);
                }
              },
              round: (r) => {
                seen.push(`round ${r.round}`);
              }
            }
          })
        )
      ).toSucceed();
      expect(seen).toEqual(['1:client-tool-result', '1:done', 'round 1', '2:done', 'round 2']);
    });

    test('a throwing observer cannot change the outcome; each throw is logged as a warning', async () => {
      const logger = new Logging.InMemoryLogger('detail');
      queueSse(anthropicToolUseSse([{ id: 'toolu_1', name: 'recall' }]));
      queueSse(anthropicTextSse('done'));
      expect(
        await runClientToolLoop(
          baseParams({
            logger,
            observer: {
              event: () => {
                throw new Error('event hook exploded');
              },
              round: () => {
                throw new Error('round hook exploded');
              }
            }
          })
        )
      ).toSucceedAndSatisfy((outcome) => {
        expect(outcome.state).toBe('completed');
        expect(outcome.rounds).toHaveLength(2);
      });
      const warnings = logger.logged.filter((m) => /observer\./.test(m));
      expect(warnings).toContainEqual(expect.stringMatching(/observer\.event threw.*event hook exploded/));
      expect(warnings).toContainEqual(expect.stringMatching(/observer\.round threw.*round hook exploded/));
    });

    test('a throwing observer with no logger is still isolated', async () => {
      queueSse(anthropicTextSse('done'));
      expect(
        await runClientToolLoop(
          baseParams({
            observer: {
              round: () => {
                throw new Error('round hook exploded');
              }
            }
          })
        )
      ).toSucceedAndSatisfy((outcome) => expect(outcome.state).toBe('completed'));
    });
  });
});
