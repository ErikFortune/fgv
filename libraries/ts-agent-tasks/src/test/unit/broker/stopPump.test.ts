/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { IStopResult } from '../../../index';
import {
  IBrokerHarness,
  bindWriter,
  brokerHarness,
  command,
  registerVendor,
  revisionOf,
  tid
} from '../../helpers/brokerFixtures';
import { node, persisted, pump, states, statusOf, stop } from '../../helpers/stopFixtures';

async function family(
  h: IBrokerHarness,
  policy: 'cascade-pause' | 'cascade-cancel' = 'cascade-cancel'
): Promise<void> {
  await node(h.writer, 'root', { stopPolicy: policy });
  await node(h.writer, 'a', { parentId: 'root' });
  await node(h.writer, 'b', { parentId: 'root' });
  await node(h.writer, 'c', { parentId: 'a' });
}

describe('reconcileStop — native targets', () => {
  test('pauses the root and every descendant, confirms each, and only then is satisfied', async () => {
    const h = await brokerHarness();
    await family(h);
    await command(h, h.writer, 'a', 'start');
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(accepted.state).toBe('pending');
    const done = (await pump(h.writer, accepted)).orThrow();
    expect(done.state).toBe('satisfied');
    expect(states(done)).toEqual({ root: 'confirmed', a: 'confirmed', b: 'confirmed', c: 'confirmed' });
    for (const id of ['root', 'a', 'b', 'c']) {
      expect(await statusOf(h, id)).toBe('paused');
    }
    // Each effect is the target's own command, in its own record, under the attempt's key.
    const intent = await persisted(h, done);
    expect(intent.state).toBe('satisfied');
    for (const target of intent.targets) {
      const record = (await h.repository.readCommit(target.taskId)).orThrow()!;
      const command = record.operations.find((o) => o.operationId === target.operationId);
      expect(command).toMatchObject({ type: 'command', stop: { rootId: 'root', intentId: done.intentId } });
      expect(target.confirmedRevision).toBe(await revisionOf(h.repository, target.taskId));
    }
  });

  test('a cancel cancels every target; a list is cancelled, and paused only in name', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-cancel', list: true });
    await node(h.writer, 'x', { parentId: 'root' });
    const pause = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const paused = (await pump(h.writer, pause)).orThrow();
    // A list has no own work: as a pause target it is confirmed without a command, and stays pending.
    expect(states(paused)).toEqual({ root: 'confirmed', x: 'confirmed' });
    expect(await statusOf(h, 'root')).toBe('pending');
    const cancel = (await stop(h, h.writer, 'root', 'cancel')).orThrow();
    const cancelled = (await pump(h.writer, cancel)).orThrow();
    expect(cancelled.state).toBe('satisfied');
    expect(await statusOf(h, 'root')).toBe('cancelled');
    expect(await statusOf(h, 'x')).toBe('cancelled');
    // Cancellation is the stronger condition: the pause over the same tree stays satisfied.
    expect((await pump(h.writer, paused)).orThrow().state).toBe('satisfied');
  });

  test('a target already stopped needs no command, but still needs coordination authority', async () => {
    const h = await brokerHarness();
    await family(h, 'cascade-pause');
    await command(h, h.writer, 'b', 'pause', { reason: { code: 'manual', summary: 'paused earlier' } });
    await command(h, h.writer, 'c', 'succeed', { outcome: { summary: 'done', artifacts: [] } });
    const before = await revisionOf(h.repository, 'b');
    h.policy.denyOn('stop', 'c');
    const result = (await pump(h.writer, (await stop(h, h.writer, 'root', 'pause')).orThrow())).orThrow();
    expect(await revisionOf(h.repository, 'b')).toBe(before);
    expect(states(result)).toEqual({ root: 'confirmed', a: 'confirmed', b: 'confirmed', c: 'denied' });
    expect(result.state).toBe('blocked');
  });

  test('a hidden but delegated target is stopped; the caller learns only that nothing restricted remains', async () => {
    const h = await brokerHarness();
    await family(h);
    h.policy.hide('c');
    const result = (await pump(h.writer, (await stop(h, h.writer, 'root', 'pause')).orThrow())).orThrow();
    expect(await statusOf(h, 'c')).toBe('paused');
    expect(result.targets.map((t) => t.taskId)).not.toContain('c');
    expect(result.state).toBe('satisfied');
    expect(result.restrictedWorkRemains).toBe(false);
  });

  test('a hidden target that cannot be stopped keeps restricted work, without counts or identities', async () => {
    const h = await brokerHarness();
    await family(h);
    h.policy.hide('c');
    h.policy.denyOn('stop', 'c');
    const result = (await pump(h.writer, (await stop(h, h.writer, 'root', 'pause')).orThrow())).orThrow();
    expect(result.state).toBe('blocked');
    expect(result.restrictedWorkRemains).toBe(true);
    expect(JSON.stringify(result)).not.toContain('"c"');
  });

  test('a pump whose stop authority on the root was revoked does nothing', async () => {
    const h = await brokerHarness();
    await family(h);
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    h.policy.denyOn('stop', 'root');
    expect(await pump(h.writer, accepted)).toFailWith(/'stop' is not permitted/);
    for (const id of ['root', 'a', 'b', 'c']) {
      expect(await statusOf(h, id)).toBe('pending');
    }
  });

  test('a bounded pass stops at its limit, and cannot be satisfied until one visits every target', async () => {
    const h = await brokerHarness();
    await family(h);
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const first = (await pump(h.writer, accepted, 2)).orThrow();
    expect(first.state).toBe('pending');
    expect(states(first)).toEqual({ root: 'confirmed', a: 'confirmed', b: 'unexamined', c: 'unexamined' });
    expect(await statusOf(h, 'b')).toBe('pending');
    const second = (await pump(h.writer, accepted, 2)).orThrow();
    expect(second.state).toBe('satisfied');
  });

  test('the pump starts no work and installs no timer: it only stops', async () => {
    const h = await brokerHarness();
    await family(h);
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    jest.useFakeTimers();
    try {
      const pending = pump(h.writer, accepted);
      await jest.runOnlyPendingTimersAsync();
      expect((await pending).orThrow().state).toBe('satisfied');
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
    for (const id of ['root', 'a', 'b', 'c']) {
      expect(await statusOf(h, id)).not.toBe('running');
    }
  });

  test('an external child without a stop declaration blocks; the native effects stand, with no rollback', async () => {
    const h = await brokerHarness();
    await family(h);
    await registerVendor(h, 'v', { parentId: 'root' });
    await registerVendor(h, 'u', { parentId: 'a', unresolved: true });
    const result = (await pump(h.writer, (await stop(h, h.writer, 'root', 'pause')).orThrow())).orThrow();
    expect(result.state).toBe('blocked');
    // The vendor source is not attached to this broker; the unresolved one has no lifecycle at all.
    expect(states(result)).toEqual({
      root: 'confirmed',
      a: 'confirmed',
      b: 'confirmed',
      v: 'unavailable',
      c: 'confirmed',
      u: 'unavailable'
    });
    for (const id of ['root', 'a', 'b', 'c']) {
      expect(await statusOf(h, id)).toBe('paused');
    }
  });

  test('reconciling a released stop reports it and does nothing', async () => {
    const h = await brokerHarness();
    await family(h);
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const record = (await h.repository.readCommit(tid('root'))).orThrow()!;
    (
      await h.writer.releaseStop({
        taskId: tid('root'),
        expectedRevision: record.recordType === 'resolved' ? record.task.envelope.revision : (0 as never),
        operationId: 'release-1' as never,
        intentId: accepted.intentId
      })
    ).orThrow();
    const again = (await pump(h.writer, accepted)).orThrow();
    expect(again.state).toBe('released');
    expect(await statusOf(h, 'a')).toBe('pending');
  });

  test('refuses an unknown intent and an invisible root', async () => {
    const h = await brokerHarness();
    await family(h);
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(await pump(h.writer, { ...accepted, intentId: 'nope' as never })).toFailWith(/holds no stop nope/);
    const viewer = bindWriter(h, { principal: 'bob' });
    h.policy.hide('root');
    expect(await pump(viewer, accepted)).toFailWith(/not found or not visible/);
    expect(await h.writer.reconcileStop({ taskId: tid('root') } as never)).toFailWith(/reconcileStop/);
    expect(
      await h.writer.reconcileStop({ taskId: tid('root'), intentId: accepted.intentId, limit: 1000000 })
    ).toFailWith(/over the maximum/);
  });

  test('inspectStop reads without effects; the root must be visible', async () => {
    const h = await brokerHarness();
    await family(h);
    const accepted: IStopResult = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(await h.writer.inspectStop({ taskId: tid('root'), intentId: accepted.intentId })).toSucceedWith(
      accepted
    );
    expect(await statusOf(h, 'a')).toBe('pending');
    expect(await h.writer.inspectStop({ taskId: tid('root'), intentId: 'x' as never })).toFailWith(
      /holds no stop/
    );
    h.policy.hide('root');
    expect(await h.writer.inspectStop({ taskId: tid('root'), intentId: accepted.intentId })).toFailWith(
      /not found or not visible/
    );
  });
});
