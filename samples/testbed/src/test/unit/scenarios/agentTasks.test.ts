/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * The agent-tasks scenario: its core's structured report, its determinism, fault injection that
 * shows its checks bite, and a CLI smoke test through the real registry.
 *
 * Every assertion below is on a value the journey **observed** through `@fgv/ts-agent-tasks`' public
 * API, compared with a literal written here — never on the core's own `passed` flag alone, and
 * never on printed text except in the CLI smoke test, which is about the printing.
 */

import '@fgv/ts-utils-jest';
import { JsonValue } from '@fgv/ts-json-base';
import { Logging, Result, fail, failWithDetail, succeed, succeedWithDetail } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';
import {
  ExternalRecovery,
  ISourceBinding,
  ITaskFailure,
  TaskId,
  TaskRevision,
  taskUpdateId
} from '@fgv/ts-agent-tasks';

import { runTestbedCli } from '../../../cli';
import { scenarios } from '../../../scenarios';
import { agentTasksScenario, runAgentTasksScenario } from '../../../scenarios/agentTasks';
import { runAgentTasksJourney } from '../../../scenarios/agentTasks/journey';
import { captureAnthropicRequest } from '../../../scenarios/agentTasks/outbound';
import {
  IJourneyReport,
  IJourneyStep,
  StepRecorder,
  formatReport
} from '../../../scenarios/agentTasks/report';
import {
  answerOf,
  callTool,
  codeOf,
  oneNewKey,
  refusalOf,
  requireApplied,
  resolutionsFor,
  resolvedInspection
} from '../../../scenarios/agentTasks/support';
import {
  CountingTreeAccessors,
  IJobDetails,
  SimulatedExecutor,
  createWorld,
  observationOnlySource,
  openWorld,
  reopenWorld
} from '../../../scenarios/agentTasks/world';
import type { IScenarioContext } from '../../../shell';

function context(): { context: IScenarioContext; logger: Logging.InMemoryLogger } {
  const logger = new Logging.InMemoryLogger('detail');
  return {
    context: { logger: new Logging.LogReporter<unknown>({ logger }) } as unknown as IScenarioContext,
    logger
  };
}

function stepOf(report: IJourneyReport, step: string): IJourneyStep {
  const found = report.steps.find((s) => s.step === step);
  if (found === undefined) {
    throw new Error(`no step ${step}`);
  }
  return found;
}

/** The value a step observed for a named check. */
function observed(report: IJourneyReport, step: string, name: string): JsonValue {
  const check = stepOf(report, step).checks.find((c) => c.name === name);
  if (check === undefined) {
    throw new Error(`step ${step} has no check '${name}'`);
  }
  return check.observed;
}

function failedChecks(report: IJourneyReport): string[] {
  return report.steps.flatMap((s) => s.checks.filter((c) => !c.passed).map((c) => `${s.step}: ${c.name}`));
}

// The journey runs once. A journey that halts fails only the tests that read its report — never the
// suite — so a regression shows as the checks it breaks, beside the simulation tests that still pass.
let outcome: Result<IJourneyReport>;
let report: IJourneyReport;

beforeAll(async () => {
  outcome = await runAgentTasksJourney();
  report = outcome.orDefault({ steps: [], passed: false });
});

describe('the journey report', () => {
  test('covers the nine steps and the stop branches, every check as designed', () => {
    expect(outcome).toSucceed();
    expect(report.steps.map((s) => s.step)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '7-cancel',
      '7-uncertain',
      '8',
      '9'
    ]);
    expect(failedChecks(report)).toEqual([]);
    expect(report.passed).toBe(true);
  });

  test('1: overlapping scopes are deduplicated; waiting and external children carry their own data', () => {
    expect(observed(report, '1', 'project view')).toEqual(['crawl', 'plan', 'review']);
    expect(observed(report, '1', 'personal view')).toEqual(['plan', 'review']);
    expect(observed(report, '1', 'union view lists each task once')).toEqual(['crawl', 'plan', 'review']);
    expect(observed(report, '1', 'review waits, holding the host attention reference')).toEqual({
      status: 'waiting',
      reason: {
        code: 'awaiting-review',
        summary: 'Held for reviewer sign-off',
        attention: [{ namespace: 'host-thread', key: 'thread-17' }]
      }
    });
    expect(observed(report, '1', 'crawl details, typed through the kind handle')).toEqual({
      step: 0,
      ref: 'sim/crawl'
    });
    expect(observed(report, '1', 'a view emits no source binding')).toBe(false);
  });

  test('2: both rendering paths produce pure receipts and acknowledge nothing', () => {
    const baseline = ['crawl:1:initial', 'plan:1:initial', 'review:2:initial'];
    expect(observed(report, '2', 'each subscription is owed its baseline')).toEqual([baseline, baseline]);
    expect(
      observed(report, '2', 'the broker receipt names its delivery and the baseline update ids')
    ).toEqual([true, baseline]);
    expect(
      observed(report, '2', 'the snapshot receipt names revisions only — no delivery, no update ids')
    ).toEqual([null, []]);
    expect(observed(report, '2', 'rendering a snapshot again gives the identical receipt')).toEqual({
      version: 1,
      included: [
        { taskId: 'crawl', revision: 1, updateIds: [] },
        { taskId: 'plan', revision: 1, updateIds: [] },
        { taskId: 'review', revision: 2, updateIds: [] }
      ]
    });
    expect(observed(report, '2', 'preparing acknowledged nothing (ada)')).toEqual(baseline);
    expect(observed(report, '2', 'preparing acknowledged nothing (audit)')).toEqual(baseline);
  });

  test('3: every receipt state, source-key duplicate suppression, and no resend of an uncertain none command', () => {
    expect(observed(report, '3', 'start plan: applied')).toEqual({
      taskId: 'plan',
      state: 'applied',
      revision: 2
    });
    expect(observed(report, '3', 'start review (waiting): rejected, read as conflict')).toBe('conflict');
    expect(observed(report, '3', 'advance crawl, the executor refuses: read as conflict')).toBe('conflict');
    expect(observed(report, '3', 'the same refusal, as the host sees the receipt')).toBe('rejected');
    expect(observed(report, '3', 'crawl unchanged by the refusals')).toEqual([0, 1]);
    expect(observed(report, '3', 'the accepted command reached the executor once')).toBe(1);
    expect(observed(report, '3', 'advance crawl: accepted')).toEqual({ taskId: 'crawl', state: 'accepted' });
    expect(observed(report, '3', 'accepted is not applied: the executor has not advanced')).toBe(0);
    expect(
      observed(report, '3', 'pause crawl, response lost: the model is told the outcome is unknown')
    ).toBe('the outcome is not known');
    expect(observed(report, '3', 'the executor saw the key twice')).toBe(2);
    expect(observed(report, '3', 'the pump settles it by resending under the same key')).toEqual([
      'resolved:applied'
    ]);
    expect(observed(report, '3', 'and applied it once (source-key duplicate suppression)')).toHaveLength(1);
    expect(observed(report, '3', 'the pump refuses to resend an uncertain non-idempotent command')).toEqual([
      'held:indeterminate',
      'held:indeterminate'
    ]);
    expect(observed(report, '3', 'the executor saw that key once')).toBe(1);
    expect(observed(report, '3', 'the host abandons it; the receipt claims neither outcome')).toBe(
      'abandoned'
    );
  });

  test('4: exact acknowledgement while work moves; newer and omitted obligations stay owed', () => {
    const included = observed(
      report,
      '4',
      'the acknowledgement cleared exactly the included ids'
    ) as string[];
    expect(included.length).toBeGreaterThan(0);
    expect(included).not.toContain('review:3:attention');
    expect(observed(report, '4', 'nothing included is still owed')).toEqual([]);
    expect(observed(report, '4', 'the context omitted the attention update')).toBe(false);
    expect(observed(report, '4', 'the context included crawl, and only while it was open')).toEqual([
      true,
      false
    ]);
    expect(observed(report, '4', 'crawl left open work')).toBe(false);
    expect(observed(report, '4', 'its newer terminal updates are still owed')).toEqual([true, true]);
    expect(observed(report, '4', 'the omitted earlier attention update is still owed')).toBe(true);
  });

  test('5: reassignment keeps identity, children and checkpoints; the stale write conflicts', () => {
    const adaRef = { namespace: 'agent', key: 'ada' };
    const bobRef = { namespace: 'agent', key: 'bob' };
    const project = { namespace: 'project', key: 'atlas' };
    expect(observed(report, '5', 'the plan is now B’s')).toEqual([adaRef, bobRef]);
    expect(observed(report, '5', 'same id and scopes')).toEqual([
      'plan',
      [project, { namespace: 'personal', key: 'ada' }]
    ]);
    expect(observed(report, '5', 'no record was added, renamed or removed')).toEqual(
      expect.arrayContaining(['task-plan.json', 'task-review.json', 'task-crawl.json'])
    );
    expect(observed(report, '5', 'A’s write at the old revision conflicts')).toBe('conflict');
    expect(observed(report, '5', 'children keep their responsibility, scopes and parent')).toEqual([
      [adaRef, [project], 'plan'],
      [adaRef, [project, { namespace: 'personal', key: 'ada' }], 'plan']
    ]);
    expect(observed(report, '5', 'crawl still runs, and moved on')).toEqual([
      'running',
      { completed: 4, total: 10 }
    ]);
    expect(observed(report, '5', 'B’s starting context holds the plan as reassigned')).toEqual([[3, bobRef]]);
    expect(observed(report, '5', 'A still owes the reassignment')).toBe(true);
    expect(observed(report, '5', 'after reopen, the original binding resolves to the same task')).toBe(
      'crawl'
    );
    const [afterA, afterB] = observed(report, '5', 'after reopen, both checkpoints are as they were') as [
      string[],
      string[]
    ];
    expect(afterA).toEqual(observed(report, '5', 'B’s acknowledgement leaves A’s obligations alone'));
    expect(afterA).toContain(taskUpdateId('plan' as TaskId, 3 as TaskRevision, 'assignment'));
    expect(afterB).toEqual([]);
  });

  test('6: due candidates straddle the cutoff; query work does not grow with terminal history', () => {
    expect(observed(report, '6', 'due at the cutoff')).toEqual(['due-soon']);
    expect(observed(report, '6', 'due at a later cutoff')).toEqual(['due-soon', 'due-later']);
    expect(observed(report, '6', 'querying changed nothing')).toEqual(['waiting', 'waiting', 2, 2]);
    expect(observed(report, '6', 'task records read by those queries')).toEqual([0, 0, 0]);
    expect(observed(report, '6', 'control: reading one record counts one read')).toBe(1);
    expect(observed(report, '6', 'the history is really there')).toBe(180);
  });

  test('7: pause, cancel and uncertainty', () => {
    expect(observed(report, '7', 'one pass: partial effects, the observation-only child blocks')).toEqual([
      'blocked',
      { plan: 'confirmed', review: 'confirmed', crawl: 'confirmed', gauge: 'unsupported' }
    ]);
    expect(observed(report, '7', 'a new child is refused while the stop latches')).toBe('conflict');
    expect(observed(report, '7', 'after reopen the blocked intent is still there')).toBe('blocked');
    expect(observed(report, '7', 'after reopen a new child is still refused')).toBe('conflict');
    expect(observed(report, '7', 'with stop authority withdrawn, the pass is refused')).toBe(
      'not-found-or-denied'
    );
    expect(observed(report, '7', 'reauthorized, the pass runs and is still blocked')).toBe('blocked');
    expect(observed(report, '7', 'with the blocker resolved the pause is satisfied')).toEqual([
      'satisfied',
      'confirmed'
    ]);
    expect(observed(report, '7', 'release resumed nothing')).toEqual(['paused', 'paused']);
    expect(observed(report, '7', 'resume is its own operation per task')).toEqual([
      'applied',
      'applied',
      'running'
    ]);
    expect(observed(report, '7-cancel', 'every target is terminal, the executor included')).toEqual([
      'cancelled',
      'cancelled',
      'cancelled'
    ]);
    expect(observed(report, '7-cancel', 'a cancel whose root is terminal cannot be released')).toEqual([
      'conflict',
      'after-host-action'
    ]);
    expect(observed(report, '7-uncertain', 'the uncertain target blocks')).toEqual([
      'blocked',
      'indeterminate'
    ]);
    const [keys, applied] = observed(report, '7-uncertain', 'under the same key, applied once') as [
      string[],
      string[]
    ];
    expect(keys).toHaveLength(1);
    expect(applied).toEqual([`pause:${keys[0]}`]);
  });

  test('8: recovery after reopen covers four outcomes and sends nothing twice', () => {
    expect(observed(report, '8', 'an advance whose response is lost')).toBe('indeterminate');
    expect(observed(report, '8', 'opening called no source')).toBe(0);
    expect(observed(report, '8', 'recovery outcomes')).toEqual({
      crawl: 'reattached',
      'j-done': 'completed',
      'j-away': 'unavailable',
      'j-lost': 'unrecoverable'
    });
    expect(observed(report, '8', 'lifecycles after recovery')).toEqual([
      'running',
      'succeeded',
      'running',
      'failed'
    ]);
    expect(observed(report, '8', 'the unreachable job changed only its observation health')).toBe(
      'unavailable'
    );
    expect(observed(report, '8', 'reachable again, it reattaches')).toEqual(['reattached', 'current']);
    expect(observed(report, '8', 'a full reconciliation pass completes, with nothing left to apply')).toEqual(
      [true, null, []]
    );
    expect(observed(report, '8', 'the missed terminal outcomes are owed')).toEqual([true, true]);
    expect(observed(report, '8', 'the uncertain advance is held, not resent')).toEqual([
      'held:indeterminate'
    ]);
    const [keys, dispatches, applied] = observed(
      report,
      '8',
      'no duplicate execution: one dispatch, one effect, nothing else sent'
    ) as [string[], number, string[]];
    expect([keys.length, dispatches, applied]).toEqual([1, 1, [`advance:${keys[0]}`]]);
  });

  test('9: the captured request, the stable prefix, and exact receipts', () => {
    const [prefix, task] = observed(
      report,
      '9',
      'the request carries the checked body, split at the task slot'
    ) as [{ text: string; cached: boolean }, { text: string; cached: boolean }];
    expect([prefix.cached, task.cached]).toEqual([true, false]);
    expect(prefix.text).toMatch(/^You coordinate a small research team\./);
    expect(task.text).toContain('Research plan: river gauge survey');
    expect(observed(report, '9', 'one request per send')).toEqual([1, 1]);
    expect(observed(report, '9', 'the task context is on the wire exactly once')).toBe(1);
    expect(observed(report, '9', 'the stable prefix is byte-identical')).toEqual([prefix]);
    expect(observed(report, '9', 'the breakpoints are identical')).toEqual([prefix.text.length]);
    expect(observed(report, '9', 'only the task block differs')).toEqual([2, true]);
    expect(observed(report, '9', 'a foreign receipt is refused')).toBe('invalid-receipt');
    expect(observed(report, '9', 'a modified send is refused')).toBe('invalid-receipt');
    expect(observed(report, '9', 'and the exact text no longer acknowledges it')).toBe('invalid-receipt');
    const progress = taskUpdateId('plan' as TaskId, 3 as TaskRevision, 'progress');
    expect(observed(report, '9', 'its obligations stay owed')).toEqual([progress]);
    expect(observed(report, '9', 'a valid acknowledgement replays idempotently')).toEqual([
      [progress],
      [],
      [progress]
    ]);
    expect(observed(report, '9', 'the first acknowledgement had discharged the baseline')).toEqual([
      'crawl:1:initial',
      'plan:2:initial',
      'review:2:initial'
    ]);
  });

  test('every check is pinned: those not asserted above, by value', () => {
    const open = ['crawl', 'due-later', 'due-soon', 'plan', 'review'];
    const pinned: ReadonlyArray<[string, string, unknown]> = [
      ['1', 'plan carries both scopes', 2],
      ['1', 'crawl runs', 'running'],
      ['2', 'both receipts cover the same tasks', ['crawl', 'plan', 'review']],
      [
        '3',
        'tools offered',
        ['task_query', 'task_inspect', 'task_command_start', 'job_pause', 'job_resume', 'job_advance']
      ],
      ['3', 'review unchanged by the rejection', ['waiting', 2]],
      ['3', 'after the executor applies it, the observation shows it', { step: 1, ref: 'sim/crawl' }],
      ['3', 'crawl is paused', 'paused'],
      ['3', 'resume crawl: applied', { taskId: 'crawl', state: 'applied', revision: 4 }],
      ['3', 'advance crawl, response lost: unknown', 'the outcome is not known'],
      ['4', 'the attention update is owed', true],
      ['5', 'after reopen, the source answers for the child', 'unchanged'],
      ['6', 'open results are the same set at 0, 60 and 180 terminal tasks', [open, open, open]],
      ['6', 'due results likewise', [['due-soon'], ['due-soon'], ['due-soon']]],
      ['7', 'accepted, nothing dispatched', ['pending', 0]],
      ['7', 'the controllable child really paused', 'paused'],
      ['7', 'released', 'released'],
      ['7', 'admission is ordinary again', 'succeeded'],
      ['7-uncertain', 'the next pass resolves it', ['satisfied', 'confirmed']]
    ];
    for (const [step, name, value] of pinned) {
      expect([step, name, observed(report, step, name)]).toEqual([step, name, value]);
    }
    // A check added to the journey without a pin here changes this count, and must be pinned.
    expect(report.steps.reduce((n, s) => n + s.checks.length, 0)).toBe(105);
  });

  test('is deterministic: a second run observes exactly the same values', async () => {
    expect(await runAgentTasksJourney()).toSucceedWith(report);
  });
});

describe('the journey’s checks bite', () => {
  test('an executor that does not deduplicate keys fails the source-key check, and only the checks that depend on it', async () => {
    const forgetful = (): SimulatedExecutor => {
      const executor = new SimulatedExecutor('sim');
      executor.deduplicates = false;
      return executor;
    };
    expect(await runAgentTasksJourney({ executor: forgetful })).toSucceedAndSatisfy(
      (broken: IJourneyReport) => {
        expect(broken.passed).toBe(false);
        expect(failedChecks(broken)).toContain('3: and applied it once (source-key duplicate suppression)');
        expect(failedChecks(broken)).toEqual(['3: and applied it once (source-key duplicate suppression)']);
      }
    );
  });

  test('an executor that claims every lost job is reattached fails the recovery check', async () => {
    class OptimisticExecutor extends SimulatedExecutor {
      public recover(binding: ISourceBinding): Result<ExternalRecovery<IJobDetails>> {
        const answer = super.recover(binding).orThrow();
        return answer.state === 'unrecoverable'
          ? succeed({ state: 'reattached', value: answer.value })
          : succeed(answer);
      }
    }
    expect(await runAgentTasksJourney({ executor: () => new OptimisticExecutor('sim') })).toSucceedAndSatisfy(
      (broken: IJourneyReport) => {
        // The lifecycle is still right: a 'reattached' answer commits the failed projection it carries.
        expect(failedChecks(broken)).toEqual(['8: recovery outcomes']);
      }
    );
  });

  test('a journey that cannot run is a failure, not a report', async () => {
    // An executor whose bindings are not valid source bindings fails registration; the journey halts.
    const executor = new SimulatedExecutor('sim');
    jest.spyOn(executor, 'binding').mockReturnValue({ sourceId: '', referenceVersion: 1, reference: {} });
    expect(await runAgentTasksJourney({ executor: () => executor })).toFail();
  });
});

describe('the simulation', () => {
  test('the counting tree counts every way a task record can be read, and nothing else', () => {
    const accessors = CountingTreeAccessors.createEmpty();
    accessors.saveFileContents('/task-a.json', '{}').orThrow();
    accessors.saveFileContents('/repository.json', '{}').orThrow();
    expect(accessors.getFileContents('/task-a.json')).toSucceedWith('{}');
    expect(accessors.getFileBytes('/task-a.json')).toSucceed();
    // The in-memory store refuses a strict decode of text it holds decoded; the read still counts.
    expect(accessors.getFileTextStrict('/task-a.json')).toFail();
    expect(accessors.getFileContents('/repository.json')).toSucceed();
    expect(accessors.taskReads).toBe(3);
  });

  test('the executor rejects a command for a job it does not have, and a terminal job', async () => {
    const executor = new SimulatedExecutor('sim');
    const request = {
      taskId: 't',
      operationId: 'k1',
      expectedRevision: 1,
      command: 'advance',
      parameters: {}
    };
    expect(executor.dispatch(executor.binding('none'), request as never, false, undefined)).toSucceedWith({
      state: 'rejected',
      reason: 'unsupported'
    });
    executor.addJob('done', { status: 'succeeded', outcome: { summary: 'x', artifacts: [] } });
    expect(
      executor.dispatch(
        executor.binding('done'),
        { ...request, operationId: 'k2' } as never,
        false,
        undefined
      )
    ).toSucceedWith({ state: 'rejected', reason: 'invalid-transition' });
    expect(executor.recover(executor.binding('none'))).toSucceedWith({
      state: 'unresolved',
      reason: 'no such job'
    });
    expect(executor.change('none', () => undefined)).toFailWith(/no job none/);
    expect(executor.projectionOf('none')).toFailWith(/no job none/);
    expect([executor.statusOf('none'), executor.stepOf('none'), executor.appliedTo('none')]).toEqual([
      'absent',
      -1,
      []
    ]);
    expect(executor.read({ sourceId: 'sim', referenceVersion: 1, reference: 'not an object' })).toSucceedWith(
      {
        state: 'missing',
        reason: 'no such job'
      }
    );
    expect(executor.read(executor.binding('none'))).toSucceedWith({
      state: 'missing',
      reason: 'no such job'
    });
    executor.addJob('far');
    executor.unreachable.add('far');
    expect(executor.read(executor.binding('far'))).toFailWith(/unreachable/);
    expect(executor.page()).toSucceedAndSatisfy((page) => {
      expect(page.completeness).toBe('partial');
      expect(page.observations.map((o) => (o.binding.reference as { job: string }).job)).toEqual(['done']);
    });
    expect(
      [
        executor.compare({ epoch: 'e1', token: '1' }, { epoch: 'e2', token: '1' }),
        executor.compare({ epoch: 'e1', token: '1' }, { epoch: 'e1', token: '2' }),
        executor.compare({ epoch: 'e1', token: '2' }, { epoch: 'e1', token: '1' }),
        executor.compare({ epoch: 'e1', token: '2' }, { epoch: 'e1', token: '2' })
      ].map((r) => r.orThrow())
    ).toEqual(['incomparable', 'older', 'newer', 'same']);
  });

  test('a conditional command against a moved job is refused, never applied optimistically', () => {
    const executor = new SimulatedExecutor('sim');
    executor.addJob('j');
    const request = { taskId: 't', operationId: 'k', expectedRevision: 1, command: 'cancel', parameters: {} };
    expect(
      executor.dispatch(executor.binding('j'), request as never, false, { epoch: 'e1', token: '0' })
    ).toSucceedWith({
      state: 'rejected',
      reason: 'conflict'
    });
    expect(executor.appliedTo('j')).toEqual([]);
  });

  test('reopening refuses a world whose repository cannot be closed', async () => {
    const world = (await createWorld()).orThrow();
    // A close is refused while a writer callback is active.
    (
      await world.repository.withWriter(async () => {
        expect(await reopenWorld(world)).toFailWith(/close failed/);
        return world.repository.capacityStatus();
      })
    ).orThrow();
  });

  test('an observation-only source answers reads, listings and recovery, and refuses every command', async () => {
    const executor = new SimulatedExecutor('watch');
    executor.addJob('g');
    const source = observationOnlySource(executor);
    expect(await source.recover(executor.binding('g'))).toSucceedAndSatisfy((r) => {
      expect(r.state).toBe('reattached');
    });
    expect(await source.reconcile()).toSucceedAndSatisfy((page) => {
      expect(page.observations).toHaveLength(1);
    });
    expect(source.commandHandles).toEqual([]);
  });

  test('a world whose records do not reopen cleanly is a failure, not a world', async () => {
    const world = (await createWorld()).orThrow();
    world.repository.close().orThrow();
    world.accessors.saveFileContents('/task-intruder.json', '{').orThrow();
    world.accessors.saveFileContents('/repository.json', '{').orThrow();
    expect(await openWorld(world)).toFail();
  });

  test('a capture leaves no fetch behind when there was none before', async () => {
    const before = globalThis.fetch;
    delete (globalThis as { fetch?: unknown }).fetch;
    try {
      expect(await captureAnthropicRequest('plain', { systemBreakpoints: [] })).toSucceed();
      expect('fetch' in globalThis).toBe(false);
    } finally {
      Object.assign(globalThis, before === undefined ? {} : { fetch: before });
    }
  });

  test('the capture fails, and restores the fetch it replaced, when the completion call cannot be built', async () => {
    const original = globalThis.fetch;
    const sentinel = (async () => {
      throw new Error('the real network must never be reached');
    }) as unknown as typeof globalThis.fetch;
    globalThis.fetch = sentinel;
    try {
      expect(await captureAnthropicRequest('short', { systemBreakpoints: [999] })).toFailWith(
        /capture: the completion call failed/
      );
      expect(globalThis.fetch).toBe(sentinel);
    } finally {
      globalThis.fetch = original;
    }
  });

  test('a capture without breakpoints sends a plain system string', async () => {
    const cache: AiAssist.IAiCacheRequest = { systemBreakpoints: [] };
    expect(await captureAnthropicRequest('plain', cache)).toSucceedAndSatisfy((captured) => {
      expect(captured.system).toEqual([{ text: 'plain', cached: false }]);
    });
  });
});

describe('the journey helpers', () => {
  test('halting helpers halt; observing helpers observe', () => {
    expect(() => resolvedInspection('t', { state: 'unresolved', reference: {} as never })).toThrow(
      /t is unresolved/
    );
    expect(() => requireApplied('start on t', 'rejected')).toThrow(/start on t: rejected/);
    expect(() => oneNewKey(0, [])).toThrow(/saw 0/);
    expect(oneNewKey(1, ['a', 'b'])).toBe('b');
    expect(codeOf(failWithDetail<number, ITaskFailure>('x', undefined as never))).toBe('uncoded');
    expect(refusalOf(succeedWithDetail<number, ITaskFailure>(1, undefined as never))).toEqual(['succeeded']);
    expect(refusalOf(failWithDetail<number, ITaskFailure>('x', undefined as never))).toEqual([
      'uncoded',
      'unknown'
    ]);
    expect(answerOf(succeed({ unexpected: true }))).toBe('malformed answer');
    expect(answerOf(fail('no separator'))).toBe('no separator');
    expect(
      resolutionsFor([{ taskId: 't' as TaskId, operationId: 'k' as never, action: 'unavailable' }], 'k')
    ).toEqual(['unavailable:-']);
  });

  test('calling a tool that was not offered says so', async () => {
    expect(await callTool([], 'task_query', {})).toBe('no tool task_query');
  });

  test('a check records undefined as null, and a value with no JSON form never passes', () => {
    const recorder = new StepRecorder('x', 'x');
    recorder.check('absent', undefined, null);
    recorder.check('a function', () => 1, 'x');
    recorder.check(
      'two functions never match',
      () => 1,
      () => 2
    );
    recorder.check('NaN is not null', Number.NaN, null);
    recorder.check('a nested Infinity is not null', [1, { r: Number.POSITIVE_INFINITY }], [1, { r: null }]);
    recorder.check('the display marker is an ordinary string', '<not JSON>', '<not JSON>');
    expect(recorder.finish().checks.map((c) => [c.observed, c.passed])).toEqual([
      [null, true],
      ['<not JSON>', false],
      ['<not JSON>', false],
      ['<not JSON>', false],
      ['<not JSON>', false],
      ['<not JSON>', true]
    ]);
  });
});

describe('the scenario and its CLI', () => {
  test('is registered as a CLI-only scenario', () => {
    expect(scenarios).toContain(agentTasksScenario);
    expect(agentTasksScenario.id).toBe('agent-tasks');
    expect(agentTasksScenario.cli).toBeDefined();
    expect(agentTasksScenario.cli?.webRunnable).toBeUndefined();
    expect(agentTasksScenario.web).toBeUndefined();
    expect(agentTasksScenario.requiredSecrets).toBeUndefined();
  });

  test('runs through the real CLI: the summary on stdout, one line per check on stderr', async () => {
    const out: string[] = [];
    const err: string[] = [];
    const code = await runTestbedCli(['node', 'testbed', '--scenario', 'agent-tasks'], {
      stdout: { write: (c: string) => out.push(c) },
      stderr: { write: (c: string) => err.push(c) }
    });
    expect(code).toBe(0);
    const total = report.steps.reduce((n, s) => n + s.checks.length, 0);
    expect(out.join('')).toBe(`agent-tasks journey: ${total} of ${total} checks as designed\n`);
    expect(err.join('')).toContain('Step 9: The final prompt');
    expect(
      err
        .join('')
        .split('\n')
        .filter((l) => l.includes('[ok  ]'))
    ).toHaveLength(total);
  });

  test('a report with a failed check fails the run, and says which check failed', async () => {
    const { context: ctx, logger } = context();
    const failing: IJourneyReport = {
      passed: false,
      steps: [
        {
          step: '1',
          title: 't',
          checks: [{ name: 'c', observed: 1, expected: 2, passed: false }]
        }
      ]
    };
    expect(await runAgentTasksScenario(ctx, async () => succeed(failing))).toFailWith(
      /0 of 1 checks as designed/
    );
    expect(logger.logged.join('\n')).toContain('[FAIL] c: observed 1, expected 2');
    expect(formatReport(failing)).toHaveLength(3);
  });

  test('a journey that cannot run fails the run with its message', async () => {
    expect(await runAgentTasksScenario(context().context, async () => fail('no world'))).toFailWith(
      'no world'
    );
  });
});
