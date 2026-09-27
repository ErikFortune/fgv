/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  IStopResult,
  ITaskCapacityProfile,
  OperationId,
  defaultMaxStopTargets,
  defaultTaskCapacityProfile
} from '../../../index';
import {
  IBrokerHarness,
  alpha,
  beta,
  bindWriter,
  brokerHarness,
  op,
  registerVendor,
  revisionOf,
  tid
} from '../../helpers/brokerFixtures';
import { node, persisted, release, stop } from '../../helpers/stopFixtures';

/**
 * A profile that admits a thousand-task tree: the default admits 536 plain registrations, bound by
 * logical bytes (T8b), so a target-bound test needs the ceilings raised.
 */
const roomy: ITaskCapacityProfile = {
  ...defaultTaskCapacityProfile,
  limits: {
    ...defaultTaskCapacityProfile.limits,
    'non-archived-tasks': 4000,
    'logical-bytes': 8 * 1024 * 1024 * 1024,
    'resident-payload-bytes': 8 * 1024 * 1024 * 1024,
    'audience-links': 2000000,
    'acknowledgement-ids': 2000000,
    updates: 200000
  }
};

/** root ─┬─ b ── d
 *         └─ a ─┬─ c
 *               └─ e (list)  */
async function tree(h: IBrokerHarness): Promise<void> {
  await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
  await node(h.writer, 'b', { parentId: 'root' });
  await node(h.writer, 'a', { parentId: 'root' });
  await node(h.writer, 'd', { parentId: 'b' });
  await node(h.writer, 'c', { parentId: 'a' });
  await node(h.writer, 'e', { parentId: 'a', list: true });
}

describe('requestStop — acceptance is not completion', () => {
  test('persists the whole authoritative subtree, root first then breadth-first by id, and dispatches nothing', async () => {
    const h = await brokerHarness();
    await tree(h);
    const before = await revisionOf(h.repository, 'root');
    expect(await stop(h, h.writer, 'root', 'pause')).toSucceedAndSatisfy((result: IStopResult) => {
      expect(result.state).toBe('pending');
      expect(result.targets.map((t) => t.taskId)).toEqual(['root', 'a', 'b', 'c', 'e', 'd']);
      expect(result.targets.every((t) => t.state === 'unexamined' && t.attempt === 1)).toBe(true);
      expect(new Set(result.targets.map((t) => t.operationId)).size).toBe(6);
      expect(result.restrictedWorkRemains).toBe(false);
    });
    // Nothing moved: acceptance changes no lifecycle, and not even the root's semantic revision.
    expect(await revisionOf(h.repository, 'root')).toBe(before);
    for (const id of ['root', 'a', 'b', 'c', 'd']) {
      const record = (await h.repository.readCommit(tid(id))).orThrow()!;
      expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('pending');
    }
  });

  test('a target the caller cannot see is still a target; the result says only that restricted work remains', async () => {
    const h = await brokerHarness();
    await tree(h);
    h.policy.hide('c');
    const result = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(result.targets.map((t) => t.taskId)).toEqual(['root', 'a', 'b', 'e', 'd']);
    expect(result.restrictedWorkRemains).toBe(true);
    // The intent itself is not filtered.
    expect((await persisted(h, result)).targets.map((t) => t.taskId)).toEqual([
      'root',
      'a',
      'b',
      'c',
      'e',
      'd'
    ]);
  });

  test("a descendant's stop policy 'none' does not block traversal: it governs only stops rooted there", async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await node(h.writer, 'mid', { parentId: 'root', stopPolicy: 'none' });
    await node(h.writer, 'leaf', { parentId: 'mid' });
    const result = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(result.targets.map((t) => t.taskId)).toEqual(['root', 'mid', 'leaf']);
    expect(await stop(h, h.writer, 'mid', 'pause')).toFailWith(/stop policy 'none' does not permit/);
  });

  test('archived, unresolved and external descendants are targets too', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await registerVendor(h, 'v', { parentId: 'root' });
    await registerVendor(h, 'u', { parentId: 'root', unresolved: true });
    const result = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(result.targets.map((t) => t.taskId)).toEqual(['root', 'u', 'v']);
  });

  test('the root policy decides the modes: pause needs a cascade policy, cancel needs cascade-cancel', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'none');
    await node(h.writer, 'pausing', { stopPolicy: 'cascade-pause' });
    await node(h.writer, 'cancelling', { stopPolicy: 'cascade-cancel' });
    expect(await stop(h, h.writer, 'none', 'pause')).toFailWith(/stop policy 'none'/);
    expect(await stop(h, h.writer, 'pausing', 'cancel')).toFailWith(
      /'cascade-pause' does not permit a cascade cancel/
    );
    expect(await stop(h, h.writer, 'pausing', 'pause')).toSucceed();
    expect(await stop(h, h.writer, 'cancelling', 'pause')).toSucceed();
    expect(await stop(h, h.writer, 'cancelling', 'cancel')).toSucceed();
  });

  test('only a broker-managed task can be a root: an external task owns no tree membership', async () => {
    const h = await brokerHarness();
    await registerVendor(h, 'v');
    expect(await stop(h, h.writer, 'v', 'pause')).toFailWith(/only a broker-managed tracked task or list/);
    await registerVendor(h, 'u', { unresolved: true });
    expect(await stop(h, h.writer, 'u', 'pause')).toFailWith(/only a broker-managed/);
  });

  test('accepts exactly the target bound; one more is refused before anything is written — never truncated', async () => {
    const h = await brokerHarness({ profile: roomy });
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    for (let i = 1; i < defaultMaxStopTargets; i++) {
      await node(h.writer, `c${String(i).padStart(4, '0')}`, { parentId: 'root' });
    }
    const full = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(full.targets).toHaveLength(defaultMaxStopTargets);
    (await release(h, h.writer, full)).orThrow();
    await node(h.writer, 'c9999', { parentId: 'root' });
    const before = (await h.repository.readCommit(tid('root'))).orThrow()!;
    expect(await stop(h, h.writer, 'root', 'pause')).toFailWith(
      /more than 1000 tasks; the stop is refused rather than truncated/
    );
    const after = (await h.repository.readCommit(tid('root'))).orThrow()!;
    expect(after.recordRevision).toBe(before.recordRevision);
  }, 180000);

  test('traverses a deep chain to its leaf', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    let parent = 'root';
    for (let i = 0; i < 60; i++) {
      await node(h.writer, `d${i}`, { parentId: parent });
      parent = `d${i}`;
    }
    const result = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(result.targets).toHaveLength(61);
    expect(result.targets[60].taskId).toBe('d59');
  }, 60000);

  test('one latching intent per mode per root; a pause and a cancel overlap independently', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
    const pause = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(await stop(h, h.writer, 'root', 'pause')).toFailWith(
      new RegExp(`stop ${pause.intentId} already holds a pause`)
    );
    const cancel = (await stop(h, h.writer, 'root', 'cancel')).orThrow();
    expect(cancel.intentId).not.toBe(pause.intentId);
    const record = (await h.repository.readCommit(tid('root'))).orThrow()!;
    expect(record.recordType === 'resolved' && record.stops!.map((s) => s.mode)).toEqual(['pause', 'cancel']);
  });

  test('the same key replays the evolving result; a different request under it conflicts', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
    const key: OperationId = op('stop');
    const first = (await stop(h, h.writer, 'root', 'pause', key)).orThrow();
    expect(await stop(h, h.writer, 'root', 'pause', key)).toSucceedWith(first);
    expect(await stop(h, h.writer, 'root', 'cancel', key)).toFailWith(
      /already recorded with a different request/
    );
    const other = bindWriter(h, { principal: 'bob' });
    expect(await stop(h, other, 'root', 'pause', key)).toFailWith(
      /already recorded with a different request/
    );
  });

  test('authority: invisible is not-found, visible without stop is denied, a stale revision conflicts', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await node(h.writer, 'other', { stopPolicy: 'cascade-pause' });
    h.policy.hide('other');
    expect(await stop(h, h.writer, 'other', 'pause')).toFailWith(/not found or not visible/);
    h.policy.denyOn('stop', 'root');
    expect(await stop(h, h.writer, 'root', 'pause')).toFailWith(/'stop' is not permitted/);
    h.policy.deny.length = 0;
    expect(
      await h.writer.requestStop({
        taskId: tid('root'),
        expectedRevision: 7 as never,
        operationId: op(),
        mode: 'pause'
      })
    ).toFailWith(/expected revision 7/);
    expect(await h.writer.requestStop({ taskId: tid('root'), mode: 'halt' } as never)).toFailWith(
      /requestStop/
    );
  });

  test('a policy change between authorization and commit refuses the commit', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    h.policy.afterDecision = (request) => {
      if (request.action === 'stop') {
        h.policy.epoch = 'epoch-2';
      }
    };
    expect(await stop(h, h.writer, 'root', 'pause')).toFailWith(/authorization policy changed/);
    const record = (await h.repository.readCommit(tid('root'))).orThrow()!;
    expect(record.recordType === 'resolved' && record.stops).toBeUndefined();
  });

  test('a child attached after the stop is refused; one attached before is a target', async () => {
    const h = await brokerHarness({ scopes: [alpha, beta] });
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await node(h.writer, 'early', { parentId: 'root' });
    const result = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(result.targets.map((t) => t.taskId)).toEqual(['root', 'early']);
    expect(
      await h.writer.createTracked({
        taskId: tid('late'),
        operationId: op(),
        title: 'late',
        parentId: tid('early')
      })
    ).toFailWith(/stop-active/);
  });
});
