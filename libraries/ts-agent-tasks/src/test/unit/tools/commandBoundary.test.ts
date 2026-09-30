/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * The command tools' boundary: what the model may send, and what a writer's answer may make the tool
 * say. The writer here is scripted — any `IBoundTaskWriter` may be passed — so every shape a receipt
 * or a failure can take is driven directly.
 */

import '@fgv/ts-utils-jest';
import { JsonSchema, JsonValue } from '@fgv/ts-json-base';
import { Logging, Result, fail, failWithDetail, succeed, succeedWithDetail } from '@fgv/ts-utils';
import {
  CommandRejectionReason,
  CommandState,
  ExternalTaskSource,
  FileTreeTaskRepository,
  IBoundTaskWriter,
  ICommandReceipt,
  ICommandRequest,
  ITaskEnvironment,
  ITaskFailure,
  TaskInspection,
  TaskKind,
  TaskKindRegistry,
  trackedTaskDescriptor
} from '../../../index';
import { converters } from '../../helpers/fixtures';
import {
  IJobDetails,
  ISourceHarness,
  SimulatedExecutor,
  harnessWith,
  jobDescriptor,
  registerJob,
  sourceHarness
} from '../../helpers/sourceFixtures';
import { environment, memoryRoot } from '../../helpers/storageFixtures';
import { IToolSet, call, commandingTools } from '../../helpers/toolFixtures';

const unknownLine =
  'task_command_pause: the outcome is not known: the command may or may not have been recorded or ' +
  'applied, and the host resolves or abandons any that was — do not send it again; inspect the task later';

/** A writer whose `execute` records its request and answers with whatever the test scripts. */
function scriptedWriter(
  real: IBoundTaskWriter,
  answer: (request: ICommandRequest) => unknown
): { writer: IBoundTaskWriter; sent: ICommandRequest[] } {
  const sent: ICommandRequest[] = [];
  const writer = new Proxy(real, {
    get(target: IBoundTaskWriter, property: string | symbol): unknown {
      if (property === 'execute') {
        return async (request: ICommandRequest): Promise<unknown> => {
          sent.push(request);
          return answer(request);
        };
      }
      const value: unknown = Reflect.get(target, property, target);
      return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
    }
  });
  return { writer, sent };
}

/** A receipt answering `request` with `result`, as a correct writer would. */
function receipt(request: ICommandRequest, result: CommandState, extra?: object): unknown {
  return succeedWithDetail<ICommandReceipt, ITaskFailure>({
    taskId: request.taskId,
    operationId: request.operationId,
    command: request.command,
    result,
    ...extra
  } as ICommandReceipt);
}

const pause = { taskId: 'j1', expectedRevision: 1, parameters: { reason: 'hold' } };

describe('execute re-validates its arguments with no harness in front', () => {
  let h: ISourceHarness;
  let tools: IToolSet;
  let sent: ICommandRequest[];

  beforeEach(async () => {
    h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    const scripted = scriptedWriter(h.writer, (request) =>
      receipt(request, { state: 'applied', appliedRevision: 2 as never })
    );
    sent = scripted.sent;
    tools = commandingTools(h, scripted.writer);
  });

  test('the model cannot name an operation id, the command, a principal, a scope or a precondition', async () => {
    const surplus: ReadonlyArray<Record<string, unknown>> = [
      { operationId: 'complete-list-r1' },
      { command: 'cancel' },
      { principal: 'bob' },
      { scopes: [{ namespace: 'project', key: 'beta' }] },
      { consumer: 'watcher' },
      { kind: 'sim.job' },
      { expectedSourceRevision: { epoch: 'e1', token: '1' } },
      { precondition: { epoch: 'e1', token: '1' } },
      { binding: { sourceId: 'exec' } },
      { stop: { rootId: 'j1' } }
    ];
    for (const extra of surplus) {
      expect(await call(tools, 'task_command_pause', { ...pause, ...extra })).toFailWith(
        /^task_command_pause: invalid arguments/
      );
    }
    expect(sent).toEqual([]);
  });

  test('parameters are checked by the registered schema, closed as registered', async () => {
    const bad: ReadonlyArray<unknown> = [
      undefined,
      null,
      'j1',
      {},
      { taskId: 'j1', expectedRevision: 1 },
      { ...pause, parameters: {} },
      { ...pause, parameters: { reason: 7 } },
      { ...pause, parameters: { reason: 'x', operationId: 'mine' } },
      { ...pause, taskId: 7 },
      { ...pause, taskId: 'not a task id' },
      { ...pause, expectedRevision: 'one' },
      { ...pause, expectedRevision: 1.5 }
    ];
    for (const args of bad) {
      expect(await call(tools, 'task_command_pause', args)).toFailWith(
        /^task_command_pause: invalid arguments/
      );
    }
    expect(
      await call(tools, 'task_command_advance', {
        taskId: 'j1',
        expectedRevision: 1,
        parameters: { steps: 'x' }
      })
    ).toFailWith(/^task_command_advance: invalid arguments/);
    expect(sent).toEqual([]);
  });

  test('a revision the writer would refuse is described as the argument it is, and never sent', async () => {
    expect(await call(tools, 'task_command_pause', { ...pause, expectedRevision: 0 })).toFailWith(
      /^task_command_pause: invalid arguments/
    );
    expect(sent).toEqual([]);
  });

  test('a well-formed call sends exactly the command, the minted key, and the canonical parameters', async () => {
    expect(await call(tools, 'task_command_pause', pause)).toSucceed();
    expect(await call(tools, 'task_command_pause', pause)).toSucceed();
    expect(sent).toHaveLength(2);
    expect(sent[0]).toEqual({
      taskId: 'j1',
      operationId: expect.stringMatching(/^s-\d+$/),
      expectedRevision: 1,
      command: 'pause',
      parameters: { reason: 'hold' }
    });
    // Every call is a new operation.
    expect(sent[0].operationId).not.toEqual(sent[1].operationId);
  });
});

describe('a writer’s answer is checked, and says no more than a fixed line', () => {
  let h: ISourceHarness;
  let logger: Logging.InMemoryLogger;

  beforeEach(async () => {
    h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    logger = new Logging.InMemoryLogger('detail');
  });

  function over(answer: (request: ICommandRequest) => unknown): IToolSet {
    return commandingTools(h, scriptedWriter(h.writer, answer).writer, { logger });
  }

  test('every rejection reason is a fixed code line; denied reads as a missing task, stop-active as conflict', async () => {
    const expected: Record<CommandRejectionReason, string> = {
      denied:
        'task_command_pause: not-found-or-denied: the task is not found or not visible, or this is not permitted on it',
      unsupported: 'task_command_pause: unsupported: the request is not supported',
      conflict:
        'task_command_pause: conflict: the task changed, or does not accept this change now; inspect it again ' +
        'before deciding whether to retry',
      'invalid-transition':
        'task_command_pause: conflict: the task changed, or does not accept this change now; inspect it again ' +
        'before deciding whether to retry',
      'stop-active':
        'task_command_pause: conflict: the task changed, or does not accept this change now; inspect it again ' +
        'before deciding whether to retry',
      'idempotency-conflict':
        'task_command_pause: conflict: the task changed, or does not accept this change now; inspect it again ' +
        'before deciding whether to retry'
    };
    for (const [reason, line] of Object.entries(expected)) {
      const tools = over((request) =>
        receipt(request, { state: 'rejected', reason: reason as CommandRejectionReason })
      );
      const result = await call(tools, 'task_command_pause', pause);
      expect(result).toFailWith(line);
      expect(String(result.message)).not.toMatch(/stop|transition|idempotency|: denied/);
    }
  });

  test('the free text a receipt carries — a source receipt, a reason — never reaches the model', async () => {
    const secret = 'postgres://ops:hunter2@db/jobs';
    const accepted = await call(
      over((request) => receipt(request, { state: 'accepted', sourceReceipt: 'rcpt-9' })),
      'task_command_pause',
      pause
    );
    expect(accepted).toSucceedWith({ taskId: 'j1', state: 'accepted' });
    const indeterminate = await call(
      over((request) => receipt(request, { state: 'indeterminate', reason: secret })),
      'task_command_pause',
      pause
    );
    expect(indeterminate).toFailWith(unknownLine);
    const abandoned = await call(
      over((request) => receipt(request, { state: 'abandoned', reason: secret, from: 'possibly-sent' })),
      'task_command_pause',
      pause
    );
    expect(abandoned).toFailWith(unknownLine);
    expect(logger.logged.some((line) => line.includes('rcpt-9'))).toBe(true);
    expect(logger.logged.filter((line) => line.includes(secret))).toHaveLength(2);
    expect(logger.logged.some((line) => line.includes('possibly-sent'))).toBe(true);
  });

  test("with no logger, a receipt's free text is simply dropped", async () => {
    for (const result of [
      { state: 'abandoned', reason: 'x', from: 'not-sent' },
      { state: 'indeterminate', reason: 'x' },
      { state: 'rejected', reason: 'denied' },
      { state: 'accepted', sourceReceipt: 'r' }
    ] as ReadonlyArray<CommandState>) {
      const quiet = commandingTools(
        h,
        scriptedWriter(h.writer, (request) => receipt(request, result)).writer
      );
      const told = await call(quiet, 'task_command_pause', pause);
      expect(JSON.stringify(told)).not.toMatch(/"x"|"r"/);
    }
  });

  test('a receipt for another task, operation or command, or with a surplus field, is an unknown outcome', async () => {
    const wrong: ReadonlyArray<(request: ICommandRequest) => unknown> = [
      (r) => receipt({ ...r, taskId: 'j2' as never }, { state: 'applied', appliedRevision: 2 as never }),
      (r) =>
        receipt({ ...r, operationId: 'other' as never }, { state: 'applied', appliedRevision: 2 as never }),
      (r) => receipt({ ...r, command: 'cancel' }, { state: 'applied', appliedRevision: 2 as never }),
      (r) => receipt(r, { state: 'applied', appliedRevision: 2 as never }, { updateIds: [] }),
      (r) => receipt(r, { state: 'rejected', reason: 'forbidden' as never }),
      (r) => receipt(r, { state: 'done' } as never),
      () => succeedWithDetail<unknown, ITaskFailure>('applied')
    ];
    for (const answer of wrong) {
      expect(await call(over(answer), 'task_command_pause', pause)).toFailWith(unknownLine);
    }
    expect(logger.logged.some((line) => /malformed writer's receipt/.test(line))).toBe(true);
  });

  test('an applied receipt at a revision before the one asked against is an unknown outcome; at or after, a result', async () => {
    const at = (appliedRevision: number): IToolSet =>
      over((request) => receipt(request, { state: 'applied', appliedRevision: appliedRevision as never }));
    expect(await call(at(3), 'task_command_pause', { ...pause, expectedRevision: 4 })).toFailWith(
      unknownLine
    );
    expect(await call(at(4), 'task_command_pause', { ...pause, expectedRevision: 4 })).toSucceedWith({
      taskId: 'j1',
      state: 'applied',
      revision: 4
    });
    expect(await call(at(9), 'task_command_pause', { ...pause, expectedRevision: 4 })).toSucceedWith({
      taskId: 'j1',
      state: 'applied',
      revision: 9
    });
  });

  test('every writer failure but a refusal of the task is an unknown outcome — a command may already be recorded', async () => {
    const failed = (code?: string): unknown =>
      failWithDetail<ICommandReceipt, ITaskFailure>(
        `intent recorded; not sent: ${code}`,
        code !== undefined ? ({ code, retry: 'safe' } as ITaskFailure) : (undefined as never)
      );
    // `conflict` after the intent committed, `invalid` for an unreadable epoch at the dispatch boundary:
    // the broker's own codes for failures after something was recorded.
    for (const code of [
      'conflict',
      'invalid',
      'storage-unavailable',
      'backpressure',
      'commit-indeterminate'
    ]) {
      expect(
        await call(
          over(() => failed(code)),
          'task_command_pause',
          pause
        )
      ).toFailWith(unknownLine);
    }
    expect(
      await call(
        over(() => failed()),
        'task_command_pause',
        pause
      )
    ).toFailWith(unknownLine);
    expect(
      await call(
        over(() => fail('bare')),
        'task_command_pause',
        pause
      )
    ).toFailWith(unknownLine);
    expect(
      await call(
        over(() => failed('not-found-or-denied')),
        'task_command_pause',
        pause
      )
    ).toFailWith(
      'task_command_pause: not-found-or-denied: the task is not found or not visible, or this is not permitted on it'
    );
    expect(logger.logged.some((line) => line.includes('intent recorded; not sent'))).toBe(true);
  });

  test('a writer that throws or rejects is an unknown outcome, and what it threw goes to the host', async () => {
    const throwing = over(() => {
      throw new Error('socket /run/exec.sock closed');
    });
    const rejecting = over(() => Promise.reject(new Error('socket /run/exec.sock closed')));
    expect(await call(throwing, 'task_command_pause', pause)).toFailWith(unknownLine);
    expect(await call(rejecting, 'task_command_pause', pause)).toFailWith(unknownLine);
    expect(logger.logged.filter((line) => line.includes('/run/exec.sock'))).toHaveLength(2);
  });
});

describe('what the tool reads before it sends', () => {
  let h: ISourceHarness;

  beforeEach(async () => {
    h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
  });

  /** A writer whose `inspect` answers with what the test scripts. */
  function inspecting(answer: () => unknown): { writer: IBoundTaskWriter; executed: string[] } {
    const executed: string[] = [];
    const writer = new Proxy(h.writer, {
      get(target: IBoundTaskWriter, property: string | symbol): unknown {
        if (property === 'inspect') {
          return async () => answer();
        }
        if (property === 'execute') {
          return async (request: ICommandRequest) => {
            executed.push(request.command);
            return target.execute(request);
          };
        }
        const value: unknown = Reflect.get(target, property, target);
        return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
      }
    });
    return { writer, executed };
  }

  test('a task of the command’s kind at another detail version is refused, and nothing is sent', async () => {
    const real = (await h.writer.inspect('j1' as never)).orThrow() as Extract<
      TaskInspection,
      { state: 'resolved' }
    >;
    const { writer, executed } = inspecting(() =>
      succeedWithDetail<TaskInspection, ITaskFailure>({
        ...real,
        envelope: { ...real.envelope, detailVersion: 2 }
      })
    );
    expect(await call(commandingTools(h, writer), 'task_command_pause', pause)).toFailWith(
      'task_command_pause: unsupported: the request is not supported'
    );
    expect(executed).toEqual([]);
  });

  test('an inspection of another task is a malformed answer, and nothing is sent', async () => {
    h.executor.addJob('j2');
    await registerJob(h, 'j2');
    const j2 = (await h.writer.inspect('j2' as never)).orThrow();
    const { writer, executed } = inspecting(() => succeedWithDetail<TaskInspection, ITaskFailure>(j2));
    expect(await call(commandingTools(h, writer), 'task_command_pause', pause)).toFailWith(
      /^task_command_pause: invalid: /
    );
    expect(executed).toEqual([]);
  });

  test('an inspection that fails, or does not convert, fails the call as a read and sends nothing', async () => {
    const hidden = inspecting(() =>
      failWithDetail<TaskInspection, ITaskFailure>('hidden', {
        code: 'not-found-or-denied',
        retry: 'after-host-action'
      })
    );
    expect(await call(commandingTools(h, hidden.writer), 'task_command_pause', pause)).toFailWith(
      /^task_command_pause: not-found-or-denied: /
    );
    const malformed = inspecting(() => succeedWithDetail<unknown, ITaskFailure>({ state: 'resolved' }));
    expect(await call(commandingTools(h, malformed.writer), 'task_command_pause', pause)).toFailWith(
      /^task_command_pause: invalid: /
    );
    expect([...hidden.executed, ...malformed.executed]).toEqual([]);
  });
});

describe('what the host supplies fails as the host’s, and names nothing', () => {
  test('an environment that fails, throws or mints a malformed id fails the call before anything is sent', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    const environments: ReadonlyArray<Pick<ITaskEnvironment, 'newOperationId'>> = [
      { newOperationId: () => fail('id service at /srv/ids is down') },
      {
        newOperationId: () => {
          throw new Error('id service at /srv/ids threw');
        }
      },
      { newOperationId: () => succeed('not an id /srv/ids' as never) }
    ];
    for (const environment of environments) {
      const logger = new Logging.InMemoryLogger('detail');
      const tools = commandingTools({ ...h, env: environment as never }, h.writer, { logger });
      expect(await call(tools, 'task_command_pause', pause)).toFailWith(
        'task_command_pause: the request failed'
      );
      expect(logger.logged.some((line) => line.includes('/srv/ids'))).toBe(true);
    }
    expect(h.executor.dispatches.size).toBe(0);
  });

  let tagged: JsonValue[] = [];

  /**
   * A broker over a real repository whose job kind's `tag` command runs `encode` — prefixing, so not
   * idempotent — or failing, as `encode` says.
   */
  async function tagging(encode: (label: string) => Result<JsonValue>): Promise<ISourceHarness> {
    const executor = new SimulatedExecutor('exec', 'observed-state');
    const received: JsonValue[] = [];
    const source = ExternalTaskSource.create<IJobDetails>({
      id: executor.sourceId,
      history: executor.history,
      encodeDetails: (d) => succeed({ step: d.step, ref: d.ref }),
      compare: (a, b) => executor.compare(a, b),
      read: async (binding) => executor.read(binding),
      feed: async (cursor) => executor.page(cursor),
      recover: async (binding) => executor.recover(binding),
      commands: [
        ExternalTaskSource.command<IJobDetails, { readonly label: string }>(
          {
            name: 'tag',
            parameters: JsonSchema.object({ label: JsonSchema.string() }),
            encode: (p) => encode(p.label),
            idempotency: 'none',
            conditional: false
          },
          async (binding, parameters, request) => {
            received.push({ ...parameters });
            return executor.dispatch(binding, request, { ...parameters }, false);
          }
        )
      ]
    }).orThrow();
    const registry = TaskKindRegistry.create(converters.envelopes.snapshot).orThrow();
    registry.register(trackedTaskDescriptor()).orThrow();
    registry.register(jobDescriptor(source)).orThrow();
    const root = memoryRoot();
    const { env, logger } = environment('e');
    const repository = (
      await FileTreeTaskRepository.initialize({ root, mode: 'session', environment: env, registry })
    ).orThrow();
    const h = harnessWith(repository, env, root, logger, executor, source, registry);
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    tagged = received;
    return h;
  }
  const tagSpec = { kind: 'sim.job' as TaskKind, detailVersion: 1, command: 'tag' };

  test('the registered encoder runs exactly once, in the writer — the tool sends what the schema accepted', async () => {
    const h = await tagging((label) => succeed({ label: `prefix:${label}` }));
    const tools = commandingTools(h, h.writer, undefined, [tagSpec]);
    expect(
      await call(tools, 'task_command_tag', { taskId: 'j1', expectedRevision: 1, parameters: { label: 'x' } })
    ).toSucceedWith({ taskId: 'j1', state: 'applied', revision: 2 });
    // Once: a tool that also encoded would have sent `prefix:prefix:x`.
    expect(tagged).toEqual([{ label: 'prefix:x' }]);
  });

  test('a registered encoder that fails is refused by the writer, before anything is recorded or sent', async () => {
    const h = await tagging(() => fail('encoder at /srv/enc refused'));
    const logger = new Logging.InMemoryLogger('detail');
    const tools = commandingTools(h, h.writer, { logger }, [tagSpec]);
    // The writer's `invalid` cannot be told from one after an intent was recorded, so the model hears
    // the unknown line — the safe direction — and never the host's text.
    expect(
      await call(tools, 'task_command_tag', { taskId: 'j1', expectedRevision: 1, parameters: { label: 'x' } })
    ).toFailWith(unknownLine.replace('task_command_pause', 'task_command_tag'));
    expect(logger.logged.some((line) => line.includes('/srv/enc'))).toBe(true);
    expect(tagged).toEqual([]);
    expect(h.executor.dispatches.size).toBe(0);
  });
});
