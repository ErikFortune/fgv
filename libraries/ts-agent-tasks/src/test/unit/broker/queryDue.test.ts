/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { IBoundTaskWriter, Instant, TaskRevision } from '../../../index';
import {
  IBrokerHarness,
  beta,
  bindWriter,
  brokerHarness,
  op,
  tid,
  track
} from '../../helpers/brokerFixtures';
import { at } from '../../helpers/storageFixtures';

const later = (seconds: number): Instant =>
  new Date(Date.parse(at) + seconds * 1000).toISOString() as Instant;

async function waitUntil(writer: IBoundTaskWriter, id: string, seconds: number): Promise<void> {
  (
    await writer.execute({
      taskId: tid(id),
      operationId: op(`wait-${id}`),
      expectedRevision: 1 as TaskRevision,
      command: 'wait',
      parameters: { reason: { code: 'w', summary: 'w', notBefore: later(seconds) } }
    })
  ).orThrow();
}

describe('IBoundTaskView.queryDue', () => {
  let h: IBrokerHarness;

  beforeEach(async () => {
    h = await brokerHarness();
    for (const [id, seconds] of [
      ['a', 60],
      ['b', 5],
      ['c', 600]
    ] as const) {
      await track(h.writer, id);
      await waitUntil(h.writer, id, seconds);
    }
    await track(h.writer, 'open');
  });

  test('answers the waiting tasks due at the cutoff, oldest notBefore first, from the due index', async () => {
    const query = jest.spyOn(h.repository, 'query');
    const due = jest.spyOn(h.repository, 'queryDue');
    expect(await h.writer.queryDue({ cutoff: later(60) })).toSucceedAndSatisfy((page) => {
      expect(page.items.map((i) => i.envelope.id)).toEqual(['b', 'a']);
      expect(page.completeness).toBe('complete');
    });
    expect(due).toHaveBeenCalledTimes(1);
    expect(query).not.toHaveBeenCalled();
  });

  test('drops what the principal may not read, and stays within the view', async () => {
    h.policy.hide('b');
    expect(await h.writer.queryDue({ cutoff: later(60) })).toSucceedAndSatisfy((page) => {
      expect(page.items.map((i) => i.envelope.id)).toEqual(['a']);
    });
    const narrow = bindWriter(h, { scopes: [beta] });
    expect(await narrow.queryDue({ cutoff: later(600) })).toSucceedAndSatisfy((page) => {
      expect(page.items).toEqual([]);
    });
  });

  test('pages with a cursor bound to the view', async () => {
    const first = (await h.writer.queryDue({ cutoff: later(600), limit: 1 })).orThrow();
    expect(first.items.map((i) => i.envelope.id)).toEqual(['b']);
    expect(first.nextCursor).toBeDefined();
    const second = (
      await h.writer.queryDue({ cutoff: later(600), limit: 1, cursor: first.nextCursor })
    ).orThrow();
    expect(second.items.map((i) => i.envelope.id)).toEqual(['a']);
    const other = bindWriter(h, {});
    expect(await other.queryDue({ cutoff: later(600), limit: 1, cursor: first.nextCursor })).toFail();
  });

  test('refuses malformed requests and selections that exclude waiting tasks', async () => {
    expect(await h.writer.queryDue({ cutoff: 'not-an-instant' as Instant })).toFailWith(/^queryDue:/);
    expect(await h.writer.queryDue({ cutoff: later(60), scopes: [beta] } as never)).toFailWith(/^queryDue:/);
    expect(await h.writer.queryDue({ cutoff: later(60), filter: { lifecycleClass: 'terminal' } })).toFailWith(
      /selects waiting tasks/
    );
    expect(
      await h.writer.queryDue({
        cutoff: later(60),
        filter: { lifecycleClass: 'open', statuses: ['pending'] }
      })
    ).toFailWith(/selects waiting tasks/);
  });
});
