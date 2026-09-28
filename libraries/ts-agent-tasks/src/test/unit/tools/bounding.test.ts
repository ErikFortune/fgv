/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonValue } from '@fgv/ts-json-base';
import { fail, succeed } from '@fgv/ts-utils';
import {
  IBoundTaskView,
  ITaskContextBudget,
  ITaskInspectResolvedToolResult,
  ITaskProjector,
  ITaskQueryToolResult,
  ITaskToolBudget,
  TaskContextRenderer,
  defaultTaskContextBudget,
  defaultTaskProjector,
  defaultTaskToolBudget
} from '../../../index';
import { IBrokerHarness, brokerHarness, op, registerVendor, tid, track } from '../../helpers/brokerFixtures';
import { bindReader, inspect, query, shownIds, taskTools } from '../../helpers/toolFixtures';

const reserve: number = TaskContextRenderer.create().orThrow().framingReserve;

function budget(context: Partial<ITaskContextBudget>, maxDetailsChars?: number): ITaskToolBudget {
  return {
    context: { ...defaultTaskContextBudget, ...context },
    maxDetailsChars: maxDetailsChars ?? defaultTaskToolBudget.maxDetailsChars
  };
}

/** Pages through `task_query` to the end, returning every page. */
async function allPages(tools: ReturnType<typeof taskTools>, args: object): Promise<ITaskQueryToolResult[]> {
  const pages: ITaskQueryToolResult[] = [];
  let cursor: string | undefined = undefined;
  do {
    const page: ITaskQueryToolResult = (
      await query(tools, { ...args, ...(cursor !== undefined ? { cursor } : {}) })
    ).orThrow();
    pages.push(page);
    cursor = page.nextCursor;
  } while (cursor !== undefined);
  return pages;
}

describe('a page is bounded by default', () => {
  let h: IBrokerHarness;
  const ids: string[] = Array.from({ length: 25 }, (__, i) => `t${String(i).padStart(2, '0')}`);

  beforeEach(async () => {
    h = await brokerHarness();
    for (const id of ids) {
      await track(h.writer, id, { title: `task ${id} ${'x'.repeat(60)}` });
    }
  });

  test('with no limit, a page holds the context budget of tasks, and paging reaches every task once', async () => {
    const tools = taskTools({ view: bindReader(h) });
    const first = (await query(tools, {})).orThrow();
    expect(shownIds(first.context)).toHaveLength(defaultTaskContextBudget.maxItems);
    expect(first.nextCursor).toBeDefined();
    expect(first.completeness).toBe('complete');
    // A page with more after it is rendered as partial input.
    expect(first.context).toContain('"input":"partial"');
    const pages = await allPages(tools, {});
    expect(pages.flatMap((p) => shownIds(p.context))).toEqual(ids);
    expect(pages.flatMap((p) => p.omitted)).toEqual([]);
    expect(pages[pages.length - 1].context).toContain('"input":"complete"');
  });

  test('tasks the text had no room for are named, so paging skips nothing unannounced', async () => {
    // Room for a couple of records and not five.
    const tight = budget({ maxChars: reserve + 300 });
    const tools = taskTools({ view: bindReader(h), budget: tight });
    const pages = await allPages(tools, { limit: 5 });
    expect(pages).toHaveLength(5);
    for (const page of pages) {
      expect(page.context.length).toBeLessThanOrEqual(tight.context.maxChars);
      expect(page.omitted.length).toBeGreaterThan(0);
      expect(shownIds(page.context).length + page.omitted.length).toBe(5);
    }
    const seen: string[] = pages.flatMap((p) => [...shownIds(p.context), ...p.omitted]).sort();
    expect(seen).toEqual(ids);
    // Each omitted task can be read on its own.
    const roomy = taskTools({ view: bindReader(h) });
    for (const id of pages[0].omitted) {
      expect(shownIds((await inspect(roomy, { taskId: id })).orThrow().context)).toEqual([id]);
    }
  });

  test('a task shown with its prose dropped is named as abbreviated', async () => {
    (
      await h.writer.createTracked({
        taskId: tid('long'),
        operationId: op(),
        title: 'long',
        description: 'd'.repeat(3000)
      })
    ).orThrow();
    const probe = async (maxChars: number): Promise<ITaskQueryToolResult> =>
      // `long` sorts before every `tNN`, so a one-task page holds exactly it.
      (await query(taskTools({ view: bindReader(h), budget: budget({ maxChars }) }), { limit: 1 })).orThrow();
    // Walk the budget down from a full fit until the one task is abbreviated rather than whole.
    let found: ITaskQueryToolResult | undefined = undefined;
    for (let chars = reserve + 3500; chars >= reserve && found === undefined; chars -= 50) {
      const page = await probe(chars);
      found = page.abbreviated.length > 0 ? page : undefined;
    }
    expect(found).toBeDefined();
    expect(found?.abbreviated).toEqual(['long']);
    expect(found?.omitted).toEqual([]);
    expect(found?.context).not.toContain('ddddd');
  });

  test('a task below the depth budget is named as omitted', async () => {
    await track(h.writer, 'kid', { parentId: 't00' });
    const tools = taskTools({ view: bindReader(h), budget: budget({ maxDepth: 0 }) });
    const page = (await query(tools, {})).orThrow();
    // `kid` sorts after `t00`..`t18`, so page one holds both it and its parent.
    expect(shownIds(page.context)).toContain('t00');
    expect(page.omitted).toEqual(['kid']);
  });
});

describe('an inspection is bounded', () => {
  let h: IBrokerHarness;

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't1');
    await registerVendor(h, 'job', { unresolved: true });
  });

  test('a task with no room at all is reported omitted, never returned raw', async () => {
    const tools = taskTools({ view: bindReader(h), budget: budget({ maxChars: reserve }) });
    expect(await inspect(tools, { taskId: 't1' })).toSucceedAndSatisfy((result) => {
      expect(result.presentation).toBe('omitted');
      expect(shownIds(result.context)).toEqual([]);
      expect(JSON.stringify(result)).not.toContain('task t1');
    });
    expect(await inspect(tools, { taskId: 'job' })).toSucceedAndSatisfy((result) => {
      expect(result).toEqual({ state: 'unresolved', context: expect.any(String), presentation: 'omitted' });
      expect(JSON.stringify(result)).not.toContain('vendor job');
    });
  });

  test('a task too long to show whole is reported abbreviated', async () => {
    (
      await h.writer.createTracked({
        taskId: tid('long'),
        operationId: op(),
        title: 'long',
        description: 'd'.repeat(3000)
      })
    ).orThrow();
    const tools = taskTools({ view: bindReader(h), budget: budget({ maxChars: reserve + 200 }) });
    expect(await inspect(tools, { taskId: 'long' })).toSucceedAndSatisfy((result) => {
      expect(result.presentation).toBe('abbreviated');
      expect(result.context).not.toContain('ddddd');
    });
  });

  describe('details are returned only when the host exposes them and they fit', () => {
    const details: JsonValue = { note: 'n'.repeat(100) };
    const size: number = JSON.stringify(details).length;
    const exposing: ITaskProjector = {
      envelope: defaultTaskProjector.envelope,
      details: () => succeed(details)
    };

    test('exactly at the bound they are returned', async () => {
      const tools = taskTools({ view: bindReader(h, { projector: exposing }), budget: budget({}, size) });
      expect(await inspect(tools, { taskId: 't1' })).toSucceedAndSatisfy((result) => {
        expect((result as ITaskInspectResolvedToolResult).details).toEqual(details);
        expect((result as ITaskInspectResolvedToolResult).detailsOmitted).toBeUndefined();
      });
    });

    test('one character over, none of them is returned and the omission is said', async () => {
      const tools = taskTools({ view: bindReader(h, { projector: exposing }), budget: budget({}, size - 1) });
      expect(await inspect(tools, { taskId: 't1' })).toSucceedAndSatisfy((result) => {
        const resolved = result as ITaskInspectResolvedToolResult;
        expect(resolved.detailsOmitted).toBe('too-large');
        expect('details' in resolved).toBe(false);
        expect(JSON.stringify(resolved)).not.toContain('nnnnn');
      });
    });
  });
});

describe('a failing projector fails the call — it never yields more', () => {
  let h: IBrokerHarness;

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't1', { title: 'secret title' });
  });

  test("the view's envelope projector throwing or failing fails query and inspect", async () => {
    const projectors: ReadonlyArray<ITaskProjector> = [
      {
        envelope: () => {
          throw new Error('projector down');
        }
      },
      { envelope: () => fail('projector refused') },
      // Returning the unprojected envelope, binding member and all, is refused as well.
      { envelope: (e) => succeed({ ...e, extra: true } as never) }
    ];
    for (const projector of projectors) {
      const tools = taskTools({ view: bindReader(h, { projector }) });
      for (const result of [await query(tools, {}), await inspect(tools, { taskId: 't1' })]) {
        expect(result).toFailWith(/projection failed/);
        expect(result.isFailure() && result.message).not.toContain('secret title');
      }
    }
  });

  test("the view's details projector failing fails the inspection", async () => {
    const projector: ITaskProjector = {
      envelope: defaultTaskProjector.envelope,
      details: () => {
        throw new Error('details down');
      }
    };
    const tools = taskTools({ view: bindReader(h, { projector }) });
    expect(await inspect(tools, { taskId: 't1' })).toFailWith(/^task_inspect: invalid: .*projection failed/);
  });

  test("the renderer's projection failing fails the call, with no partial page", async () => {
    const renderers: ReadonlyArray<TaskContextRenderer> = [
      TaskContextRenderer.create({ projection: () => fail('redaction unavailable') }).orThrow(),
      TaskContextRenderer.create({
        projection: () => {
          throw new Error('redaction threw');
        }
      }).orThrow()
    ];
    for (const renderer of renderers) {
      const tools = taskTools({ view: bindReader(h), renderer });
      expect(await query(tools, {})).toFailWith(/^task_query: invalid: .*projection failed/);
      expect(await inspect(tools, { taskId: 't1' })).toFailWith(
        /^task_inspect: invalid: .*projection failed/
      );
    }
  });

  test("a supplied renderer's projection is the one applied", async () => {
    const renderer = TaskContextRenderer.create({
      projection: (s) => succeed({ envelope: { ...s.envelope, title: 'withheld' } })
    }).orThrow();
    const tools = taskTools({ view: bindReader(h), renderer });
    const page = (await query(tools, {})).orThrow();
    expect(page.context).toContain('"title":"withheld"');
    expect(page.context).not.toContain('secret title');
  });
});

describe('failure messages are bounded', () => {
  // Every call here fails on its arguments, so it never reaches a view.
  const tools = taskTools({ view: {} as IBoundTaskView });
  const suffix: string = '… (truncated)';

  test('a message echoing a huge argument is cut to the bound', async () => {
    const args = { lifecycleClass: 'x'.repeat(100000) };
    const raw = tools.query.config.parametersSchema.validate(args);
    // The untruncated message really is long: the bound is doing work here.
    expect(raw.isFailure() && raw.message.length).toBeGreaterThan(1000);
    const result = await query(tools, args);
    expect(result).toFailWith(/^task_query: invalid arguments: /);
    expect(result.isFailure() && result.message.length).toBe(500 + suffix.length);
    expect(result.isFailure() && result.message.endsWith(suffix)).toBe(true);
  });

  test('the cut never splits a surrogate pair', async () => {
    const prefix: string = 'task_query: invalid arguments: ';
    const probe = tools.query.config.parametersSchema.validate({ lifecycleClass: 'aaaa' });
    const offset: number = prefix.length + (probe.isFailure() ? probe.message.indexOf('aaaa') : -1);
    expect(offset).toBeGreaterThan(prefix.length - 1);
    // Places a high surrogate at 499 and its low surrogate at 500, where the cut falls.
    const value: string = 'a'.repeat(499 - offset) + '\u{1f600}'.repeat(400);
    const result = await query(tools, { lifecycleClass: value });
    const message: string = result.isFailure() ? result.message : '';
    expect(message.endsWith(suffix)).toBe(true);
    const body: string = message.slice(0, -suffix.length);
    expect(body).toHaveLength(499);
    expect(body.endsWith('a')).toBe(true);
  });

  test('a short message is returned whole', async () => {
    const result = await query(tools, { limit: 0 });
    expect(result).toFailWith(/limit must be an integer from 1 to 20; got 0$/);
  });
});

describe('a view that rejects or throws fails the call through the same bounded message', () => {
  const suffix: string = '… (truncated)';
  const internals: string = `connection string postgres://secret ${'z'.repeat(5000)}`;

  test.each([
    ['rejects', (): Promise<never> => Promise.reject(new Error(internals))],
    [
      'throws synchronously',
      (): Promise<never> => {
        throw new Error(internals);
      }
    ]
  ])('when the view %s', async (__how, misbehave) => {
    const view: IBoundTaskView = {
      principal: 'alice',
      query: misbehave,
      inspect: misbehave,
      inspectStop: misbehave
    };
    const tools = taskTools({ view });
    const results = [
      [/^task_query: connection string/, await query(tools, {})],
      [/^task_inspect: connection string/, await inspect(tools, { taskId: 't1' })]
    ] as const;
    for (const [pattern, result] of results) {
      expect(result).toFailWith(pattern);
      expect(result.isFailure() && result.message.length).toBe(500 + suffix.length);
    }
  });
});

describe('the details budget is independent of the context budget', () => {
  test('details that fit are returned even for a task whose text had no room', async () => {
    const h = await brokerHarness();
    await track(h.writer, 't1');
    const projector: ITaskProjector = {
      envelope: defaultTaskProjector.envelope,
      details: () => succeed({ note: 'small' })
    };
    const tools = taskTools({ view: bindReader(h, { projector }), budget: budget({ maxChars: reserve }) });
    expect(await inspect(tools, { taskId: 't1' })).toSucceedAndSatisfy((result) => {
      expect(result.presentation).toBe('omitted');
      expect((result as ITaskInspectResolvedToolResult).details).toEqual({ note: 'small' });
    });
  });
});
