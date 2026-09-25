/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  ICommandRequest,
  IResolvedTaskCommitRecord,
  ITaskCapacityProfile,
  OperationId,
  TaskId,
  TaskRevision,
  defaultTaskCapacityProfile,
  allUpdateCategories,
  baselineUpdateId,
  maxUpdateIdSuffixLength,
  taskUpdateId
} from '../../../index';
import { converters } from '../../helpers/fixtures';
import {
  catalogOp,
  envelope,
  registration,
  unresolvedRegistration,
  update
} from '../../helpers/storageFixtures';

const storage = converters.storage;

function resolvedRecord(): IResolvedTaskCommitRecord {
  const draft = registration('t1').record;
  if (draft.recordType !== 'resolved') {
    throw new Error('expected resolved');
  }
  return { ...draft, formatVersion: 1, recordRevision: 1, capacityClaims: [] };
}

describe('taskUpdateId', () => {
  test('encodes (task, revision, category ordinal), read from the right', () => {
    expect(taskUpdateId('t1' as TaskId, 3 as TaskRevision, 'lifecycle')).toBe('t1:3:0');
    expect(taskUpdateId('t1' as TaskId, 3 as TaskRevision, 'relationship')).toBe('t1:3:6');
  });

  test('is collision-free even when a task id contains the separator', () => {
    // 'a:1' at revision 2 and 'a' at revision 12 would collide under a naive left-to-right read.
    const ids = new Set<string>([
      taskUpdateId('a:1' as TaskId, 2 as TaskRevision, 'lifecycle'),
      taskUpdateId('a' as TaskId, 12 as TaskRevision, 'lifecycle'),
      taskUpdateId('a:1:2' as TaskId, 1 as TaskRevision, 'lifecycle'),
      taskUpdateId('a' as TaskId, 1 as TaskRevision, 'progress')
    ]);
    expect(ids.size).toBe(4);
  });

  test('a maximum-length task id at the maximum revision still has a valid update and baseline id', () => {
    const longest = 'x'.repeat(converters.bounds.maxIdLength) as TaskId;
    const id = taskUpdateId(longest, Number.MAX_SAFE_INTEGER as TaskRevision, 'relationship');
    expect(converters.ids.updateId.convert(id)).toSucceedWith(id);
    // The baseline suffix is the longest one (T7): it fits exactly, and one more character does not.
    const baseline = baselineUpdateId(longest, Number.MAX_SAFE_INTEGER as TaskRevision);
    expect(baseline).toHaveLength(converters.bounds.maxIdLength + maxUpdateIdSuffixLength);
    expect(converters.ids.updateId.convert(baseline)).toSucceedWith(baseline);
    expect(converters.ids.updateId.convert(`${baseline}0`)).toFailWith(/exceeds the maximum/i);
  });

  test('a baseline id never equals a task update id of the same task and revision', () => {
    const baseline = baselineUpdateId('t' as TaskId, 3 as TaskRevision);
    for (const category of allUpdateCategories) {
      expect(taskUpdateId('t' as TaskId, 3 as TaskRevision, category)).not.toBe(baseline);
    }
  });
});

describe('storage record converters', () => {
  test('a valid resolved record round-trips', () => {
    const record = resolvedRecord();
    expect(storage.record.convert(JSON.parse(JSON.stringify(record)))).toSucceedWith(record);
  });

  test('an update whose id disagrees with its content is an integrity failure', () => {
    const record = resolvedRecord();
    const wrong = { ...record.updates[0], id: taskUpdateId('t1' as TaskId, 1 as TaskRevision, 'progress') };
    expect(storage.record.convert({ ...record, updates: [wrong] })).toFailWith(
      /identity disagrees with its content/i
    );
  });

  test('an update for another task, or a future revision, is refused', () => {
    const record = resolvedRecord();
    const foreign = update(envelope('t2', 1), 'lifecycle');
    expect(storage.record.convert({ ...record, updates: [foreign] })).toFailWith(/belongs to t2, not t1/i);
    const future = update(envelope('t1', 5), 'lifecycle');
    expect(storage.record.convert({ ...record, updates: [future] })).toFailWith(/newer than the task's 1/i);
  });

  test('a repeated update or operation identity is refused — a duplicate is a corrupt ledger', () => {
    const record = resolvedRecord();
    expect(storage.record.convert({ ...record, updates: [record.updates[0], record.updates[0]] })).toFailWith(
      /updates: duplicate 't1:1:0'/i
    );
    expect(
      storage.record.convert({ ...record, operations: [record.operations[0], record.operations[0]] })
    ).toFailWith(/operations: duplicate 'op-create-t1'/i);
  });

  test("a command's request and receipt must name its operation and its task", () => {
    const request: ICommandRequest = {
      taskId: 't1' as TaskId,
      operationId: 'op-cmd' as OperationId,
      expectedRevision: 1 as TaskRevision,
      command: 'start',
      parameters: {}
    };
    const command = {
      type: 'command',
      operationId: 'op-cmd',
      request,
      principalKey: 'actor:1',
      dispatch: 'settled',
      receipt: {
        taskId: 't1',
        operationId: 'op-cmd',
        command: 'start',
        result: { state: 'applied', appliedRevision: 1 }
      }
    };
    const record = resolvedRecord();
    expect(storage.record.convert({ ...record, operations: [...record.operations, command] })).toSucceed();
    expect(
      storage.record.convert({
        ...record,
        operations: [...record.operations, { ...command, operationId: 'op-other' }]
      })
    ).toFailWith(/request or receipt names a different operation/i);
    expect(
      storage.record.convert({
        ...record,
        operations: [
          ...record.operations,
          { ...command, request: { ...request, taskId: 't9' }, receipt: { ...command.receipt, taskId: 't9' } }
        ]
      })
    ).toFailWith(/names a task other than t1/i);
  });

  test('an unknown catalog operation, dispatch state or extra field is refused', () => {
    const record = resolvedRecord();
    expect(
      storage.record.convert({
        ...record,
        operations: [{ ...catalogOp('x', 'archive', {}), operation: 'teleport' }]
      })
    ).toFail();
    expect(storage.record.convert({ ...record, capacityClaims: undefined })).toFail();
    expect(storage.record.convert({ ...record, extra: 1 })).toFailWith(/extra/i);
  });

  test('only a terminal task can be archived', () => {
    expect(storage.record.convert({ ...resolvedRecord(), archived: true })).toFailWith(
      /only a terminal task can be archived/i
    );
  });

  test('an unresolved record carries its registration operation', () => {
    const draft = unresolvedRegistration('u1').record;
    const record = { ...draft, formatVersion: 1, recordRevision: 1, capacityClaims: [] };
    expect(storage.record.convert(record)).toSucceed();
    expect(
      storage.record.convert({ ...record, operations: [...record.operations, ...record.operations] })
    ).toFailWith(/carries exactly its registration operation/i);
    expect(storage.record.convert({ ...record, operations: [] })).toFailWith(
      /carries exactly its registration operation/i
    );
  });

  test('drafts carry no repository-owned field', () => {
    const draft = registration('t1').record;
    expect(storage.draft.convert(draft)).toSucceed();
    expect(storage.draft.convert({ ...draft, capacityClaims: [] })).toFailWith(/capacityClaims/);
    expect(storage.draft.convert({ ...draft, recordRevision: 1 })).toFailWith(/recordRevision/);
    expect(storage.draft.convert({ ...draft, formatVersion: 1 })).toFailWith(/formatVersion/);
  });
});

describe('manifest and inventory converters', () => {
  const manifest = {
    formatVersion: 1,
    repositoryId: 'repo-1',
    manifestRevision: 1,
    profile: defaultTaskCapacityProfile,
    tasks: [{ id: 't1', state: 'live' }],
    consumers: [],
    sources: []
  };

  test('a valid manifest converts', () => {
    expect(storage.manifest.convert(manifest)).toSucceed();
  });

  test('an identity named twice in one inventory is refused', () => {
    expect(
      storage.manifest.convert({
        ...manifest,
        tasks: [
          { id: 't1', state: 'live' },
          { id: 't1', state: 'live' }
        ]
      })
    ).toFailWith(/task inventory: duplicate 't1'/i);
  });

  test('a pending entry carries its operation, request and claims; a live one carries nothing else', () => {
    expect(
      storage.inventoryEntry.convert({
        id: 't1',
        state: 'pending',
        operationId: 'op-1',
        operation: 'create-tracked',
        principalKey: 'host',
        recordType: 'resolved',
        request: { a: 1 },
        capacityClaims: []
      })
    ).toSucceed();
    expect(storage.inventoryEntry.convert({ id: 't1', state: 'live', request: {} })).toFailWith(/request/i);
  });

  test('a stored profile that cannot hold an unresolved registration is refused', () => {
    const tight: ITaskCapacityProfile = {
      ...defaultTaskCapacityProfile,
      limits: { ...defaultTaskCapacityProfile.limits, updates: 13 }
    };
    expect(storage.manifest.convert({ ...manifest, profile: tight })).toFailWith(
      /unresolved registration \(resolution \+ closeout\)/i
    );
  });

  test('a stored profile whose per-task operation limit cannot hold creation plus closeout is refused', () => {
    // Below three, every registration would be refused forever: one creation operation plus the
    // two operation slots the closeout reserves.
    for (const maxOperationsPerTask of [1, 2]) {
      const profile: ITaskCapacityProfile = {
        ...defaultTaskCapacityProfile,
        perOwner: { ...defaultTaskCapacityProfile.perOwner, maxOperationsPerTask }
      };
      expect(converters.capacity.profile.convert(profile)).toFailWith(
        /cannot hold a creation operation plus the 2 operation slots closeout reserves/i
      );
    }
    expect(
      converters.capacity.profile.convert({
        ...defaultTaskCapacityProfile,
        perOwner: { ...defaultTaskCapacityProfile.perOwner, maxOperationsPerTask: 3 }
      })
    ).toSucceed();
  });

  test('the format-version reader reads only the version', () => {
    expect(storage.formatVersion.convert({ formatVersion: 7, whatever: 1 })).toSucceedWith(7);
    expect(storage.formatVersion.convert({ nothing: true })).toFail();
  });
});

describe('the first-resolution claim (T3)', () => {
  test('converts, and carries the task it resolves', () => {
    expect(
      converters.capacity.claim.convert({
        claimVersion: 1,
        claimId: 'c-1',
        owner: { owner: 'task', taskId: 'u1' },
        ownership: 'live',
        disposition: 'reserved',
        charges: [{ dimension: 'updates', amount: 7 }],
        purpose: 'first-resolution',
        taskId: 'u1'
      })
    ).toSucceedAndSatisfy((claim) => {
      expect(claim.purpose === 'first-resolution' && claim.taskId).toBe('u1');
    });
  });
});
