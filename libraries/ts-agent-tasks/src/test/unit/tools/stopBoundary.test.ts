/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * The stop tools' boundary: what the model may send, and what a writer's or view's answer may make
 * the tool say. The writer here is scripted — any `IBoundTaskWriter` may be passed — so every shape a
 * stop result or a failure can take is driven directly.
 */

import '@fgv/ts-utils-jest';
import { Logging, fail, failWithDetail, succeed, succeedWithDetail } from '@fgv/ts-utils';
import {
  IBoundTaskWriter,
  IStopInspectRequest,
  IStopRequest,
  IStopResult,
  ITaskEnvironment,
  ITaskFailure,
  ITaskStopToolResult,
  OperationId,
  TaskFailureCode,
  TaskId
} from '../../../index';
import { IBrokerHarness, brokerHarness } from '../../helpers/brokerFixtures';
import { node } from '../../helpers/stopFixtures';
import { IToolSet, call, stoppingTools } from '../../helpers/toolFixtures';

type Answer = (request: IStopRequest & IStopInspectRequest) => unknown;

/**
 * A writer whose `requestStop` and `inspectStop` record their request and answer with whatever the
 * test scripts. Everything else is the real writer.
 */
function scriptedWriter(
  real: IBoundTaskWriter,
  answer: Answer
): { writer: IBoundTaskWriter; sent: Array<IStopRequest | IStopInspectRequest> } {
  const sent: Array<IStopRequest | IStopInspectRequest> = [];
  const writer = new Proxy(real, {
    get(target: IBoundTaskWriter, property: string | symbol): unknown {
      if (property === 'requestStop' || property === 'inspectStop') {
        return async (request: IStopRequest & IStopInspectRequest): Promise<unknown> => {
          sent.push({ ...request });
          return answer(request);
        };
      }
      const value: unknown = Reflect.get(target, property, target);
      return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
    }
  });
  return { writer, sent };
}

/** A result answering `request` as a correct writer would, with `extra` laid over it. */
function result(
  request: { taskId: TaskId; operationId?: OperationId; intentId?: OperationId; mode?: string },
  extra?: object
): unknown {
  return succeedWithDetail<IStopResult, ITaskFailure>({
    intentId: request.operationId ?? request.intentId!,
    rootId: request.taskId,
    mode: request.mode ?? 'pause',
    state: 'pending',
    targets: [
      { taskId: request.taskId, attempt: 1, operationId: 'key-1' as OperationId, state: 'unexamined' },
      {
        taskId: 'a' as TaskId,
        attempt: 3,
        operationId: 'key-2' as OperationId,
        state: 'confirmed',
        confirmedRevision: 4
      }
    ],
    restrictedWorkRemains: false,
    ...extra
  } as IStopResult);
}

function failure(
  code: TaskFailureCode | undefined,
  message: string = 'host text: /srv/tasks/secret.json'
): unknown {
  return failWithDetail<IStopResult, ITaskFailure>(message, {
    code: code as TaskFailureCode,
    retry: 'after-host-action'
  });
}

const stopArgs = { taskId: 'root', expectedRevision: 1, mode: 'pause' };

/** The tail a stop failure carries when the stop may have been accepted. */
function unknownNote(intentId: string): string {
  return (
    `; the stop may or may not have been accepted — if it was, its intentId is ${intentId}: ` +
    'inspect it with task_stop_inspect before requesting it again'
  );
}

interface IScripted {
  readonly h: IBrokerHarness;
  readonly tools: IToolSet;
  readonly sent: Array<IStopRequest | IStopInspectRequest>;
  readonly logger: Logging.InMemoryLogger;
}

async function scripted(answer: Answer, options?: { readonly logger?: boolean }): Promise<IScripted> {
  const h = await brokerHarness();
  await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
  await node(h.writer, 'a', { parentId: 'root' });
  const s = scriptedWriter(h.writer, answer);
  const logger = new Logging.InMemoryLogger('detail');
  const tools = stoppingTools(h, s.writer, options?.logger === false ? {} : { logger });
  return { h, tools, sent: s.sent, logger };
}

describe('execute re-validates its arguments with no harness in front', () => {
  test('task_stop: the model cannot name an operation id, an intent, a principal, a scope or a policy', async () => {
    const s = await scripted((r) => result(r));
    const surplus: ReadonlyArray<Record<string, unknown>> = [
      { operationId: 'op-mine' },
      { intentId: 'op-mine' },
      { principal: 'bob' },
      { scopes: [{ namespace: 'project', key: 'beta' }] },
      { consumer: 'watcher' },
      { actor: 'bob' },
      { stopPolicy: 'cascade-cancel' },
      { limit: 1000 }
    ];
    for (const extra of surplus) {
      expect(await call(s.tools, 'task_stop', { ...stopArgs, ...extra })).toFailWith(
        /^task_stop: invalid arguments/
      );
    }
    expect(s.sent).toEqual([]);
  });

  test('task_stop: malformed values are the model’s to fix, and reach nothing', async () => {
    const s = await scripted((r) => result(r));
    const malformed: ReadonlyArray<unknown> = [
      undefined,
      null,
      'root',
      {},
      { taskId: 'root', expectedRevision: 1 },
      { ...stopArgs, mode: 'halt' },
      { ...stopArgs, mode: 'PAUSE' },
      { ...stopArgs, expectedRevision: '1' },
      { ...stopArgs, expectedRevision: 1.5 },
      { ...stopArgs, expectedRevision: 0 },
      { ...stopArgs, taskId: '' },
      { ...stopArgs, taskId: '../root' }
    ];
    for (const args of malformed) {
      expect(await call(s.tools, 'task_stop', args)).toFailWith(/^task_stop: invalid arguments/);
    }
    expect(s.sent).toEqual([]);
  });

  test('task_stop_inspect: surplus fields and malformed ids fail, and reach nothing', async () => {
    const s = await scripted((r) => result(r));
    const malformed: ReadonlyArray<unknown> = [
      undefined,
      {},
      { taskId: 'root' },
      { intentId: 'op-1' },
      { taskId: 'root', intentId: 'op-1', principal: 'bob' },
      { taskId: 'root', intentId: 'op-1', limit: 5 },
      { taskId: 'root', intentId: 'op-1', operationId: 'op-2' },
      { taskId: 'root', intentId: 7 },
      { taskId: 'root', intentId: '' },
      { taskId: 'root', intentId: 'op-1', after: '../a' },
      { taskId: '../root', intentId: 'op-1' }
    ];
    for (const args of malformed) {
      expect(await call(s.tools, 'task_stop_inspect', args)).toFailWith(
        /^task_stop_inspect: invalid arguments/
      );
    }
    expect(s.sent).toEqual([]);
  });

  test('the request the writer is handed is built from the minted id and the model’s three values only', async () => {
    const s = await scripted((r) => result(r));
    const told = (await call<ITaskStopToolResult>(s.tools, 'task_stop', stopArgs)).orThrow();
    expect(s.sent).toEqual([
      { taskId: 'root', expectedRevision: 1, operationId: told.intentId, mode: 'pause' }
    ]);
  });
});

describe('what the model is told of a stop result', () => {
  test('never a target’s attempt or command key; the targets keep their state and confirmed revision', async () => {
    const s = await scripted((r) => result(r));
    expect(await call<ITaskStopToolResult>(s.tools, 'task_stop', stopArgs)).toSucceedAndSatisfy((told) => {
      expect(told.targets).toEqual([
        { taskId: 'root', state: 'unexamined' },
        { taskId: 'a', state: 'confirmed', confirmedRevision: 4 }
      ]);
      expect(told.counts).toEqual({ unexamined: 1, confirmed: 1 });
      expect(JSON.stringify(told)).not.toMatch(/key-1|key-2|attempt|operationId/);
    });
  });

  test('a violation is shown as recorded', async () => {
    const violation = { observedRevision: 5, observedStatus: 'running' };
    const s = await scripted((r) =>
      result(r, {
        state: 'blocked',
        targets: [{ taskId: r.taskId, attempt: 1, operationId: 'key-1', state: 'indeterminate', violation }]
      })
    );
    expect(await call<ITaskStopToolResult>(s.tools, 'task_stop', stopArgs)).toSucceedAndSatisfy((told) => {
      expect(told.state).toBe('blocked');
      expect(told.targets).toEqual([{ taskId: 'root', state: 'indeterminate', violation }]);
    });
  });

  test('a capacity refusal is never told: the model sees the target states; the host gets the dimension', async () => {
    const capacity = {
      reason: 'capacity-exhausted',
      dimension: 'logical-bytes',
      used: 0,
      reserved: 0,
      requested: 643625,
      limit: 1000,
      reclaimableByCleanup: true
    };
    const s = await scripted((r) =>
      result(r, {
        state: 'blocked',
        targets: [{ taskId: r.taskId, attempt: 2, operationId: 'key-1', state: 'unavailable' }],
        capacity
      })
    );
    for (const tool of ['task_stop', 'task_stop_inspect']) {
      const args = tool === 'task_stop' ? stopArgs : { taskId: 'root', intentId: 'op-9' };
      expect(await call<ITaskStopToolResult>(s.tools, tool, args)).toSucceedAndSatisfy((told) => {
        expect(told.targets).toEqual([{ taskId: 'root', state: 'unavailable' }]);
        expect(JSON.stringify(told)).not.toMatch(/capacity|logical-bytes|643625|reclaimable/);
      });
    }
    expect(s.logger.logged.filter((m) => /capacity refusal on 'logical-bytes'/.test(m))).toHaveLength(2);
    // Without a logger the refusal is simply dropped.
    const quiet = await scripted((r) => result(r, { capacity }), { logger: false });
    expect(await call(quiet.tools, 'task_stop', stopArgs)).toSucceed();
  });
});

describe('a writer’s or view’s answer is checked, and says no more than a fixed line', () => {
  test('a result for another stop, root or mode — or malformed — is an unknown outcome for a request', async () => {
    const malformed: ReadonlyArray<Answer> = [
      (r) => result(r, { intentId: 'op-other' }),
      (r) => result(r, { rootId: 'a' }),
      (r) => result(r, { mode: 'cancel' }),
      (r) => result(r, { state: 'finished' }),
      (r) => result(r, { requestedBy: 'alice' }),
      (r) => result(r, { restrictedWorkRemains: 'no' }),
      (r) =>
        result(r, {
          targets: [
            { taskId: 'a', attempt: 1, operationId: 'key-1', state: 'unexamined' },
            { taskId: 'a', attempt: 1, operationId: 'key-2', state: 'unexamined' }
          ]
        }),
      (r) =>
        result(r, {
          targets: [
            {
              taskId: 'a',
              attempt: 1,
              operationId: 'key-1',
              state: 'confirmed',
              stableSourceEvidence: {
                sourceId: 'exec',
                contractVersion: 'v1',
                sourceRevision: { epoch: 'e', token: '1' }
              }
            }
          ]
        }),
      (r) =>
        result(r, {
          targets: Array.from({ length: 1001 }, (__, i) => ({
            taskId: `t${i}`,
            attempt: 1,
            operationId: `key-${i}`,
            state: 'unexamined'
          }))
        }),
      () => succeedWithDetail(undefined)
    ];
    for (const answer of malformed) {
      const s = await scripted(answer);
      const told = await call(s.tools, 'task_stop', stopArgs);
      const intentId = (s.sent[0] as IStopRequest).operationId;
      expect(told).toFailWith(
        `task_stop: commit-indeterminate: the outcome is not known: a change may or may not have been applied${unknownNote(
          intentId
        )}`
      );
    }
    // An answer that is not a result at all reads as a writer that failed — an unknown outcome too.
    const s = await scripted(() => 'not a result');
    const told = await call(s.tools, 'task_stop', stopArgs);
    expect(told).toFailWith(
      `task_stop: the task writer failed${unknownNote((s.sent[0] as IStopRequest).operationId)}`
    );
  });

  test('a result for another stop or root is a malformed answer for an inspection', async () => {
    for (const answer of [
      (r: IStopInspectRequest) => result(r, { intentId: 'op-other' }),
      (r: IStopInspectRequest) => result(r, { rootId: 'a' })
    ]) {
      const s = await scripted(answer as Answer);
      expect(await call(s.tools, 'task_stop_inspect', { taskId: 'root', intentId: 'op-9' })).toFailWith(
        'task_stop_inspect: invalid: the request was refused, or a task could not be presented'
      );
    }
    // An inspection may name a stop of either mode.
    const s = await scripted((r) => result(r, { mode: 'cancel' }));
    expect(
      await call<ITaskStopToolResult>(s.tools, 'task_stop_inspect', { taskId: 'root', intentId: 'op-9' })
    ).toSucceedAndSatisfy((told) => expect(told.mode).toBe('cancel'));
  });

  test('a writer that rewrites the request in place cannot move what its result is checked against', async () => {
    // Each answer lists only the rewritten root, so the identity check is the only thing that can fail.
    const rewrites: ReadonlyArray<(r: { -readonly [K in keyof IStopRequest]: IStopRequest[K] }) => void> = [
      (r) => (r.taskId = 'a' as TaskId),
      (r) => (r.operationId = 'op-rewritten' as OperationId),
      (r) => (r.mode = 'cancel')
    ];
    for (const rewrite of rewrites) {
      let original: string = '';
      const s = await scripted((r) => {
        original = r.operationId;
        rewrite(r as never);
        // Answers honestly — for the rewritten request.
        return result(r, {
          targets: [{ taskId: r.taskId, attempt: 1, operationId: 'key-1', state: 'unexamined' }]
        });
      });
      expect(await call(s.tools, 'task_stop', stopArgs)).toFailWith(
        `task_stop: commit-indeterminate: the outcome is not known: a change may or may not have been applied${unknownNote(
          original
        )}`
      );
    }
  });

  test('only a refusal of the stop itself is a known outcome — a denial can follow the commit', async () => {
    const lines: Record<string, string> = {
      unsupported: 'task_stop: unsupported: the request is not supported'
    };
    const codes: ReadonlyArray<TaskFailureCode> = [
      'not-found-or-denied',
      'unsupported',
      'invalid',
      'conflict',
      'backpressure',
      'storage-unavailable',
      'commit-indeterminate'
    ];
    for (const code of codes) {
      const s = await scripted(() => failure(code));
      const told = await call(s.tools, 'task_stop', stopArgs);
      const intentId = (s.sent[0] as IStopRequest).operationId;
      if (lines[code] !== undefined) {
        expect(told).toFailWith(lines[code]);
      } else {
        expect(told).toFail();
        expect(told.message!.startsWith(`task_stop: ${code}: `)).toBe(true);
        expect(told.message!.endsWith(unknownNote(intentId))).toBe(true);
      }
      expect(told.message).not.toContain('secret');
      expect(s.logger.logged.some((m) => m.includes('/srv/tasks/secret.json'))).toBe(true);
    }
    // A failure with no known code is unclassified, and an unknown outcome too.
    const s = await scripted(() => failure('made-up' as TaskFailureCode));
    const intentId = (): string => (s.sent[0] as IStopRequest).operationId;
    const told = await call(s.tools, 'task_stop', stopArgs);
    expect(told).toFailWith(`task_stop: the request failed${unknownNote(intentId())}`);
  });

  test('a writer that throws or rejects is an unknown outcome, and what it threw goes to the host', async () => {
    for (const answer of [
      () => {
        throw new Error('host text: connection string');
      },
      () => Promise.reject(new Error('host text: connection string'))
    ]) {
      const s = await scripted(answer as Answer);
      const told = await call(s.tools, 'task_stop', stopArgs);
      const intentId = (s.sent[0] as IStopRequest).operationId;
      expect(told).toFailWith(`task_stop: the task writer failed${unknownNote(intentId)}`);
      expect(s.logger.logged.some((m) => m.includes('connection string'))).toBe(true);
    }
  });

  test('a view that fails an inspection says a code, never its text', async () => {
    const s = await scripted(() => failure('storage-unavailable'));
    expect(await call(s.tools, 'task_stop_inspect', { taskId: 'root', intentId: 'op-9' })).toFailWith(
      'task_stop_inspect: storage-unavailable: task storage is unavailable; retry later'
    );
    const thrown = await scripted(() => {
      throw new Error('host text');
    });
    expect(await call(thrown.tools, 'task_stop_inspect', { taskId: 'root', intentId: 'op-9' })).toFailWith(
      'task_stop_inspect: the task view failed'
    );
  });

  test('every intent and target state converts; the model is told each as a closed value', async () => {
    const states = [
      'unexamined',
      'pending',
      'confirmed',
      'unsupported',
      'denied',
      'unavailable',
      'refused',
      'indeterminate'
    ];
    const s = await scripted((r) =>
      result(r, {
        state: 'blocked',
        targets: states.map((state, i) => ({
          taskId: i === 0 ? r.taskId : `t${i}`,
          attempt: 1,
          operationId: `key-${i}`,
          state
        }))
      })
    );
    expect(await call<ITaskStopToolResult>(s.tools, 'task_stop', stopArgs)).toSucceedAndSatisfy((told) => {
      expect(Object.keys(told.counts).sort()).toEqual([...states].sort());
    });
  });
});

describe('what the host supplies fails as the host’s, and names nothing', () => {
  test('an environment that fails, throws or mints a malformed id fails the call before anything is sent', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
    const environments: ReadonlyArray<Pick<ITaskEnvironment, 'newOperationId'>> = [
      { newOperationId: () => fail('host text: entropy pool') },
      {
        newOperationId: () => {
          throw new Error('host text: entropy pool');
        }
      },
      { newOperationId: () => succeed('../bad' as OperationId) }
    ];
    for (const environment of environments) {
      const logger = new Logging.InMemoryLogger('detail');
      const s = scriptedWriter(h.writer, (r) => result(r));
      const tools = stoppingTools({ writer: s.writer, env: environment }, s.writer, { logger });
      expect(await call(tools, 'task_stop', stopArgs)).toFailWith('task_stop: the request failed');
      expect(s.sent).toEqual([]);
      expect(logger.logged.some((m) => /could not mint an operation id/.test(m))).toBe(true);
    }
  });
});
