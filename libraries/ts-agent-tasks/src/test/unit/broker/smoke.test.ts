/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { alpha, brokerHarness, command, list, succeedTask, tid, track } from '../../helpers/brokerFixtures';

describe('broker smoke', () => {
  test('create, command, query, inspect, list completion', async () => {
    const h = await brokerHarness();
    await list(h.writer, 'l1');
    await track(h.writer, 'c1', { parentId: 'l1' });
    await track(h.writer, 'c2', { parentId: 'l1' });
    expect((await command(h, h.writer, 'c1', 'start')).result).toEqual({
      state: 'applied',
      appliedRevision: 2
    });
    await succeedTask(h, h.writer, 'c1');
    expect(await h.writer.reconcileListCompletions({ limit: 10 })).toSucceedWith({ completed: [] });
    await succeedTask(h, h.writer, 'c2');
    expect(await h.repository.listCompletionCandidates({ limit: 10 })).toSucceedWith([tid('l1')]);
    expect(await h.writer.reconcileListCompletions({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.completed.map((c) => c.taskId)).toEqual(['l1']);
    });
    expect(await h.writer.inspect(tid('l1'))).toSucceedAndSatisfy((inspection) => {
      expect(inspection.state).toBe('resolved');
      if (inspection.state === 'resolved') {
        expect(inspection.envelope.lifecycle.status).toBe('succeeded');
      }
    });
    expect(await h.writer.query({})).toSucceedAndSatisfy((page) => {
      expect(page.items.map((i) => i.envelope.id)).toEqual(['c1', 'c2', 'l1']);
      expect(page.items[0].envelope.scopes).toEqual([alpha]);
    });
  });
});
