/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { ITaskInspectResolvedToolResult } from '../../../index';
import {
  IBrokerHarness,
  ada,
  alpha,
  beta,
  bindWriter,
  bob,
  brokerHarness,
  command,
  registerVendor,
  succeedTask,
  track
} from '../../helpers/brokerFixtures';
import { bindReader, inspect, query, recordingView, shownIds, taskTools } from '../../helpers/toolFixtures';

describe('task tools read through the bound view', () => {
  let h: IBrokerHarness;

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 'root', { responsibility: ada });
    await track(h.writer, 'child', { parentId: 'root', responsibility: bob });
    await track(h.writer, 'hidden');
    await succeedTask(h, h.writer, 'child');
    await track(bindWriter(h, { scopes: [beta] }), 'b1');
    h.policy.hide('hidden');
  });

  test('a query shows exactly the tasks the view may read, in the view scopes', async () => {
    // `b1` lives only in beta; `hidden` is in alpha, but its read is denied.
    const alphaOnly = taskTools({ view: bindReader(h, { scopes: [alpha] }) });
    const wide = taskTools({ view: bindReader(h, { scopes: [alpha, beta] }) });
    expect(await query(alphaOnly, {})).toSucceedAndSatisfy((page) => {
      expect(shownIds(page.context).sort()).toEqual(['child', 'root']);
      expect(page.omitted).toEqual([]);
      expect(page.context).not.toContain('"hidden"');
      expect(page.context).not.toContain('"b1"');
    });
    expect(await query(wide, {})).toSucceedAndSatisfy((page) => {
      expect(shownIds(page.context).sort()).toEqual(['b1', 'child', 'root']);
    });
  });

  test('filters only narrow', async () => {
    const tools = taskTools({ view: bindReader(h, { scopes: [alpha, beta] }) });
    const ids = async (args: object): Promise<string[]> =>
      shownIds((await query(tools, args)).orThrow().context).sort();
    expect(await ids({ parentId: 'root' })).toEqual(['child']);
    expect(await ids({ responsibility: { namespace: 'agent', key: 'ada' } })).toEqual(['root']);
    expect(await ids({ lifecycleClass: 'terminal' })).toEqual(['child']);
    expect(await ids({ lifecycleClass: 'open' })).toEqual(['b1', 'root']);
    expect(await ids({ statuses: ['succeeded'] })).toEqual(['child']);
    // A filter naming the hidden task's parentage still cannot reach it.
    expect(await ids({ parentId: 'hidden' })).toEqual([]);
  });

  test('an inspection shows the task, its current commands and whether it is archived', async () => {
    const tools = taskTools({ view: bindReader(h) });
    expect(await inspect(tools, { taskId: 'root' })).toSucceedAndSatisfy((result) => {
      expect(result.state).toBe('resolved');
      const resolved = result as ITaskInspectResolvedToolResult;
      expect(shownIds(resolved.context)).toEqual(['root']);
      expect(resolved.presentation).toBe('complete');
      expect(resolved.archived).toBe(false);
      expect(resolved.commands).toContain('start');
      expect(resolved.details).toBeUndefined();
      expect(resolved.detailsOmitted).toBeUndefined();
      expect(Object.keys(resolved).sort()).toEqual([
        'archived',
        'commands',
        'context',
        'presentation',
        'state'
      ]);
    });
  });

  test('a hidden task and a foreign id fail identically', async () => {
    const tools = taskTools({ view: bindReader(h) });
    const hidden = await inspect(tools, { taskId: 'hidden' });
    const foreign = await inspect(tools, { taskId: 'nosuch' });
    expect(hidden).toFailWith(/^task_inspect: not-found-or-denied: /);
    expect(hidden.isFailure() && hidden.message.split('hidden').join('<id>')).toEqual(
      foreign.isFailure() && foreign.message.split('nosuch').join('<id>')
    );
  });

  test('an unresolved registration is shown as a diagnostic, and no source binding ever leaves', async () => {
    await registerVendor(h, 'job1');
    await registerVendor(h, 'job2', { unresolved: true });
    const tools = taskTools({ view: bindReader(h) });
    const page = (await query(tools, {})).orThrow();
    expect(shownIds(page.context)).toEqual(expect.arrayContaining(['job1', 'job2']));
    expect(page.freshness).toBe('source-projection');
    const unresolved = (await inspect(tools, { taskId: 'job2' })).orThrow();
    expect(unresolved).toEqual({
      state: 'unresolved',
      context: expect.any(String),
      presentation: 'complete'
    });
    expect(shownIds(unresolved.context)).toEqual(['job2']);
    const resolved = (await inspect(tools, { taskId: 'job1' })).orThrow();
    // The vendor binding's source id and reference fields.
    for (const output of [page, unresolved, resolved]) {
      const text = JSON.stringify(output);
      expect(text).not.toContain('acme-local');
      expect(text).not.toContain('actor-a');
    }
  });
});

describe('authority is asked at each call, never cached by the tools', () => {
  let h: IBrokerHarness;

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't1');
  });

  test('revoking read between two calls on the same tools hides the task', async () => {
    const tools = taskTools({ view: bindReader(h) });
    expect(await inspect(tools, { taskId: 't1' })).toSucceed();
    expect(shownIds((await query(tools, {})).orThrow().context)).toEqual(['t1']);
    h.policy.hide('t1');
    expect(await inspect(tools, { taskId: 't1' })).toFailWith(/not-found-or-denied/);
    expect(shownIds((await query(tools, {})).orThrow().context)).toEqual([]);
  });

  test('the command list follows the current policy and the current lifecycle', async () => {
    const tools = taskTools({ view: bindReader(h) });
    const commands = async (): Promise<ReadonlyArray<string>> =>
      ((await inspect(tools, { taskId: 't1' })).orThrow() as ITaskInspectResolvedToolResult).commands;
    expect(await commands()).toContain('start');
    await command(h, h.writer, 't1', 'start');
    expect(await commands()).not.toContain('start');
    h.policy.denyOn('command', 't1');
    expect(await commands()).toEqual([]);
  });

  test('a policy change during a page fails the call rather than mixing two policies', async () => {
    const tools = taskTools({ view: bindReader(h) });
    h.policy.afterDecision = () => {
      h.policy.epoch = 'epoch-2';
    };
    expect(await query(tools, {})).toFailWith(/^task_query: conflict: /);
  });

  test('the tools use the view for query and inspect and for nothing else', async () => {
    const { view, touched } = recordingView(bindReader(h));
    const tools = taskTools({ view });
    expect(touched.size).toBe(0);
    await query(tools, {});
    await query(tools, { limit: 0 });
    await inspect(tools, { taskId: 't1' });
    await inspect(tools, { taskId: 'nosuch' });
    await inspect(tools, {});
    expect([...touched].sort()).toEqual(['inspect', 'query']);
  });
});
