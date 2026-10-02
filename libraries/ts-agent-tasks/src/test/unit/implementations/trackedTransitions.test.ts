/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  ITaskEnvelope,
  TaskLifecycle,
  TaskLifecycleStatus,
  TrackedCommand,
  allTaskStatuses,
  availableTrackedCommands,
  evaluateTrackedCommand,
  applyTrackedPatch,
  trackedTaskCommandNames
} from '../../../index';
import { envelope } from '../../helpers/storageFixtures';

const reason = { code: 'blocked', summary: 'waiting on review' };
const otherReason = { code: 'blocked', summary: 'waiting on a different review' };
const outcome = { summary: 'done', artifacts: [{ namespace: 'doc', key: 'report' }] };

/** A representative lifecycle for each status. */
const lifecycles: Readonly<Record<TaskLifecycleStatus, TaskLifecycle>> = {
  pending: { status: 'pending' },
  running: { status: 'running' },
  waiting: { status: 'waiting', reason },
  paused: { status: 'paused', reason },
  succeeded: { status: 'succeeded', outcome },
  failed: { status: 'failed', reason },
  cancelled: { status: 'cancelled', reason }
};

/** A representative command for each name. */
const commands: Readonly<Record<TrackedCommand['command'], TrackedCommand>> = {
  start: { command: 'start', parameters: {} },
  resume: { command: 'resume', parameters: {} },
  wait: { command: 'wait', parameters: { reason: otherReason } },
  pause: { command: 'pause', parameters: { reason: otherReason } },
  succeed: { command: 'succeed', parameters: { outcome } },
  fail: { command: 'fail', parameters: { reason: otherReason } },
  cancel: { command: 'cancel', parameters: { reason: otherReason, outcome } },
  'set-title': { command: 'set-title', parameters: { title: 'renamed' } },
  'set-description': { command: 'set-description', parameters: { description: 'described' } },
  'set-progress': { command: 'set-progress', parameters: { progress: { completed: 1, total: 2 } } },
  'set-attention': { command: 'set-attention', parameters: { attention: [{ namespace: 'q', key: '1' }] } }
};

type Expected = TaskLifecycleStatus | 'unchanged' | 'invalid-transition';

/**
 * The whole table: for every (current status, command), what happens. Each cell was written from
 * design §5's transition table, not from the implementation. `set-*` change a field, not the
 * status, so an open cell names the status the task stays in.
 */
const table: Readonly<Record<TaskLifecycleStatus, Readonly<Record<TrackedCommand['command'], Expected>>>> = {
  pending: {
    start: 'running',
    resume: 'invalid-transition',
    wait: 'waiting',
    pause: 'paused',
    succeed: 'succeeded',
    fail: 'failed',
    cancel: 'cancelled',
    'set-title': 'pending',
    'set-description': 'pending',
    'set-progress': 'pending',
    'set-attention': 'pending'
  },
  running: {
    start: 'unchanged',
    resume: 'unchanged',
    wait: 'waiting',
    pause: 'paused',
    succeed: 'succeeded',
    fail: 'failed',
    cancel: 'cancelled',
    'set-title': 'running',
    'set-description': 'running',
    'set-progress': 'running',
    'set-attention': 'running'
  },
  waiting: {
    start: 'invalid-transition',
    resume: 'running',
    // A different reason is a change even without a status change.
    wait: 'waiting',
    pause: 'paused',
    succeed: 'succeeded',
    fail: 'failed',
    cancel: 'cancelled',
    'set-title': 'waiting',
    'set-description': 'waiting',
    'set-progress': 'waiting',
    'set-attention': 'waiting'
  },
  paused: {
    start: 'invalid-transition',
    resume: 'running',
    wait: 'waiting',
    pause: 'paused',
    succeed: 'succeeded',
    fail: 'failed',
    cancel: 'cancelled',
    'set-title': 'paused',
    'set-description': 'paused',
    'set-progress': 'paused',
    'set-attention': 'paused'
  },
  // The representative `succeed` restates this task's own outcome exactly: a no-op, not a refusal.
  succeeded: { ..._terminalRow(), succeed: 'unchanged' },
  failed: _terminalRow(),
  cancelled: _terminalRow()
};

function _terminalRow(): Record<TrackedCommand['command'], Expected> {
  const row = {} as Record<TrackedCommand['command'], Expected>;
  for (const name of trackedTaskCommandNames) {
    row[name] = 'invalid-transition';
  }
  return row;
}

function at(status: TaskLifecycleStatus): ITaskEnvelope {
  return envelope('t', 3, { lifecycle: lifecycles[status] });
}

describe('tracked transition table', () => {
  test('the table covers every status and every command', () => {
    expect(Object.keys(table).sort()).toEqual([...allTaskStatuses].sort());
    for (const status of allTaskStatuses) {
      expect(Object.keys(table[status]).sort()).toEqual([...trackedTaskCommandNames].sort());
    }
  });

  describe.each(allTaskStatuses)('from %s', (status) => {
    test.each(trackedTaskCommandNames)('%s', (name) => {
      const expected: Expected = table[status][name];
      const outcome = evaluateTrackedCommand(at(status), commands[name], { list: false });
      if (expected === 'unchanged') {
        expect(outcome).toEqual({ disposition: 'unchanged' });
      } else if (expected === 'invalid-transition') {
        expect(outcome).toEqual({ disposition: 'rejected', reason: 'invalid-transition' });
      } else {
        expect(outcome.disposition).toBe('changed');
        if (outcome.disposition === 'changed') {
          expect(outcome.envelope.lifecycle.status).toBe(expected);
          // Nothing but the command's own field moves; the caller advances revision and time.
          expect(outcome.envelope.revision).toBe(3);
          expect(outcome.envelope.id).toBe('t');
        }
      }
    });
  });

  test('restating the current state exactly is a no-op, never a revision', () => {
    for (const status of ['waiting', 'paused'] as const) {
      const same: TrackedCommand =
        status === 'waiting'
          ? { command: 'wait', parameters: { reason } }
          : { command: 'pause', parameters: { reason } };
      expect(evaluateTrackedCommand(at(status), same, { list: false })).toEqual({ disposition: 'unchanged' });
    }
    // A terminal task restated identically is a no-op; any other terminal command is refused.
    expect(
      evaluateTrackedCommand(
        at('succeeded'),
        { command: 'succeed', parameters: { outcome } },
        { list: false }
      )
    ).toEqual({ disposition: 'unchanged' });
    expect(
      evaluateTrackedCommand(at('failed'), { command: 'fail', parameters: { reason } }, { list: false })
    ).toEqual({ disposition: 'unchanged' });
    expect(
      evaluateTrackedCommand(
        at('succeeded'),
        { command: 'succeed', parameters: { outcome: { summary: 'other', artifacts: [] } } },
        { list: false }
      )
    ).toEqual({ disposition: 'rejected', reason: 'invalid-transition' });
  });

  test('a terminal transition carries its outcome and touches the result category', () => {
    expect(evaluateTrackedCommand(at('running'), commands.succeed, { list: false })).toEqual({
      disposition: 'changed',
      envelope: expect.objectContaining({ lifecycle: { status: 'succeeded', outcome } }),
      categories: ['lifecycle', 'result']
    });
    // fail without an outcome is a lifecycle change only
    expect(evaluateTrackedCommand(at('running'), commands.fail, { list: false })).toEqual({
      disposition: 'changed',
      envelope: expect.objectContaining({ lifecycle: { status: 'failed', reason: otherReason } }),
      categories: ['lifecycle']
    });
    expect(evaluateTrackedCommand(at('running'), commands.cancel, { list: false })).toEqual({
      disposition: 'changed',
      envelope: expect.objectContaining({ lifecycle: { status: 'cancelled', reason: otherReason, outcome } }),
      categories: ['lifecycle', 'result']
    });
  });

  test('a task list refuses the commands of own work as unsupported', () => {
    for (const name of ['start', 'wait', 'pause', 'resume', 'succeed'] as const) {
      expect(evaluateTrackedCommand(at('pending'), commands[name], { list: true })).toEqual({
        disposition: 'rejected',
        reason: 'unsupported'
      });
    }
    expect(evaluateTrackedCommand(at('pending'), commands.cancel, { list: true }).disposition).toBe(
      'changed'
    );
    expect(evaluateTrackedCommand(at('pending'), commands['set-title'], { list: true }).disposition).toBe(
      'changed'
    );
  });
});

describe('presentation patches', () => {
  const base: ITaskEnvelope = envelope('t', 2, {
    description: 'old',
    progress: { completed: 1 },
    attention: [{ namespace: 'q', key: '1' }]
  });

  test('clearing removes the fields; it does not leave them undefined', () => {
    const cleared = applyTrackedPatch(base, { clear: ['description', 'progress'] });
    expect(cleared.disposition).toBe('changed');
    if (cleared.disposition === 'changed') {
      expect('description' in cleared.envelope).toBe(false);
      expect('progress' in cleared.envelope).toBe(false);
      expect(cleared.categories).toEqual(['progress']);
    }
  });

  test('setting fields reports the categories they belong to', () => {
    expect(applyTrackedPatch(base, { title: 'new', attention: [] })).toEqual({
      disposition: 'changed',
      envelope: expect.objectContaining({ title: 'new', attention: [] }),
      categories: ['progress', 'attention']
    });
    expect(applyTrackedPatch(base, { description: 'new' })).toEqual({
      disposition: 'changed',
      envelope: expect.objectContaining({ description: 'new' }),
      categories: ['progress']
    });
    expect(applyTrackedPatch(base, { progress: { completed: 2 } })).toEqual({
      disposition: 'changed',
      envelope: expect.objectContaining({ progress: { completed: 2 } }),
      categories: ['progress']
    });
  });

  test('values equal to the current ones are no change', () => {
    expect(
      applyTrackedPatch(base, {
        title: base.title,
        description: 'old',
        progress: { completed: 1 },
        attention: [{ namespace: 'q', key: '1' }]
      })
    ).toEqual({ disposition: 'unchanged' });
    expect(applyTrackedPatch(envelope('t', 2), { clear: ['description', 'progress'] })).toEqual({
      disposition: 'unchanged'
    });
    expect(applyTrackedPatch(base, {})).toEqual({ disposition: 'unchanged' });
  });

  test('a terminal task takes no presentation change', () => {
    expect(applyTrackedPatch(at('failed'), { title: 'x' })).toEqual({
      disposition: 'rejected',
      reason: 'invalid-transition'
    });
  });

  test('set-description and set-progress without a value clear the field', () => {
    const d = evaluateTrackedCommand(base, { command: 'set-description', parameters: {} }, { list: false });
    const p = evaluateTrackedCommand(base, { command: 'set-progress', parameters: {} }, { list: false });
    expect(d.disposition === 'changed' && 'description' in d.envelope).toBe(false);
    expect(p.disposition === 'changed' && 'progress' in p.envelope).toBe(false);
    expect(d.disposition).toBe('changed');
    expect(p.disposition).toBe('changed');
  });
});

describe('available commands', () => {
  test('follow the table for a tracked task and a list', () => {
    expect(availableTrackedCommands('pending', { list: false })).toEqual([
      'start',
      'wait',
      'pause',
      'succeed',
      'fail',
      'cancel',
      'set-title',
      'set-description',
      'set-progress',
      'set-attention'
    ]);
    expect(availableTrackedCommands('waiting', { list: false }).slice(0, 3)).toEqual([
      'wait',
      'pause',
      'resume'
    ]);
    expect(availableTrackedCommands('running', { list: false })).not.toContain('start');
    expect(availableTrackedCommands('succeeded', { list: false })).toEqual([]);
    expect(availableTrackedCommands('pending', { list: true })).toEqual([
      'fail',
      'cancel',
      'set-title',
      'set-description',
      'set-progress',
      'set-attention'
    ]);
  });

  test('every available command is one the table does not refuse from that status', () => {
    for (const status of allTaskStatuses) {
      for (const name of availableTrackedCommands(status, { list: false })) {
        expect(evaluateTrackedCommand(at(status), commands[name], { list: false }).disposition).not.toBe(
          'rejected'
        );
      }
    }
  });
});
