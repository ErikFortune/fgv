/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonValue } from '@fgv/ts-json-base';
import { Logging, fail, failWithDetail, succeed, succeedWithDetail } from '@fgv/ts-utils';
import {
  IBoundTaskPage,
  IBoundTaskView,
  ITaskFailure,
  ITaskContextBudget,
  ITaskInspectResolvedToolResult,
  ITaskProjector,
  ITaskQueryToolResult,
  ITaskToolBudget,
  PageCursor,
  TaskContextRenderer,
  TaskFailureCode,
  TaskInspection,
  TaskResult,
  defaultTaskContextBudget,
  defaultTaskProjector,
  defaultTaskToolBudget
} from '../../../index';
import { IBrokerHarness, brokerHarness, op, registerVendor, tid, track } from '../../helpers/brokerFixtures';
import { bindReader, inspect, query, shownIds, taskTools } from '../../helpers/toolFixtures';

/** What the model is told when a projector fails: the code and its fixed description, nothing more. */
const REFUSED_QUERY: RegExp =
  /^task_query: invalid: the request was refused, or a task could not be presented$/;
const REFUSED_INSPECT: RegExp =
  /^task_inspect: invalid: the request was refused, or a task could not be presented$/;

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
      const logger = new Logging.InMemoryLogger('detail');
      const tools = taskTools({ view: bindReader(h, { projector }), logger });
      expect(await query(tools, {})).toFailWith(REFUSED_QUERY);
      expect(await inspect(tools, { taskId: 't1' })).toFailWith(REFUSED_INSPECT);
      // The projector's own message is the host's, never the model's.
      expect(logger.logged.filter((line) => /projection failed/.test(line))).toHaveLength(2);
    }
  });

  test("the view's details projector failing fails the inspection", async () => {
    const projector: ITaskProjector = {
      envelope: defaultTaskProjector.envelope,
      details: () => {
        throw new Error('details down');
      }
    };
    const logger = new Logging.InMemoryLogger('detail');
    const tools = taskTools({ view: bindReader(h, { projector }), logger });
    expect(await inspect(tools, { taskId: 't1' })).toFailWith(REFUSED_INSPECT);
    expect(logger.logged.some((line) => /details down/.test(line))).toBe(true);
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
      expect(await query(tools, {})).toFailWith(REFUSED_QUERY);
      expect(await inspect(tools, { taskId: 't1' })).toFailWith(REFUSED_INSPECT);
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

describe('a failure tells the model a code, never host text', () => {
  const internals: string = `connection string postgres://secret ${'z'.repeat(5000)}`;

  test.each([
    ['rejects', (): Promise<never> => Promise.reject(new Error(internals))],
    [
      'throws synchronously',
      (): Promise<never> => {
        throw new Error(internals);
      }
    ]
  ])('when the view %s, the model is told only that it failed', async (__how, misbehave) => {
    const view: IBoundTaskView = {
      principal: 'alice',
      query: misbehave,
      inspect: misbehave,
      inspectStop: misbehave
    };
    const logger = new Logging.InMemoryLogger('detail');
    const tools = taskTools({ view, logger });
    expect(await query(tools, {})).toFailWith(/^task_query: the task view failed$/);
    expect(await inspect(tools, { taskId: 't1' })).toFailWith(/^task_inspect: the task view failed$/);
    // What the view threw is the host's to see.
    expect(logger.logged.filter((line) => line.includes('postgres://secret'))).toHaveLength(2);
    // Without a logger the text is discarded, and the model is told the same thing.
    const quiet = taskTools({ view });
    expect(await query(quiet, {})).toFailWith(/^task_query: the task view failed$/);
  });

  test('a classified failure is its code and a fixed description; its message goes to the host', async () => {
    const leaky =
      (code: TaskFailureCode): (() => Promise<TaskResult<never>>) =>
      async (): Promise<TaskResult<never>> =>
        failWithDetail<never, ITaskFailure>(`storage at /srv/secret/tasks refused: ${code}`, {
          code,
          retry: 'safe'
        });
    for (const code of ['storage-corrupt', 'conflict', 'cursor-stale'] as const) {
      const logger = new Logging.InMemoryLogger('detail');
      const view: IBoundTaskView = {
        principal: 'alice',
        query: leaky(code),
        inspect: leaky(code),
        inspectStop: leaky(code)
      };
      const tools = taskTools({ view, logger });
      for (const result of [await query(tools, {}), await inspect(tools, { taskId: 't1' })]) {
        expect(result.isFailure() && result.message.includes(`: ${code}: `)).toBe(true);
        expect(result.isFailure() && result.message).not.toContain('/srv/secret');
      }
      expect(logger.logged.filter((line) => line.includes('/srv/secret'))).toHaveLength(2);
    }
  });

  test('an unclassified failure says only that the request failed', async () => {
    const view: IBoundTaskView = {
      principal: 'alice',
      query: async () => fail<never>('at /srv/secret') as TaskResult<never>,
      inspect: async () => fail<never>('at /srv/secret') as TaskResult<never>,
      inspectStop: async () => fail<never>('at /srv/secret') as TaskResult<never>
    };
    const tools = taskTools({ view });
    expect(await query(tools, {})).toFailWith(/^task_query: the request failed$/);
    expect(await inspect(tools, { taskId: 't1' })).toFailWith(/^task_inspect: the request failed$/);
  });
});

describe('what a page carries besides the rendered text is checked, not trusted', () => {
  /** A view whose query answers with the given page, whatever view wrote it. */
  function pageView(page: IBoundTaskPage): IBoundTaskView {
    const unused = async (): Promise<never> => {
      throw new Error('not used');
    };
    return {
      principal: 'alice',
      query: async () => succeedWithDetail(page),
      inspect: unused,
      inspectStop: unused
    };
  }
  const empty: IBoundTaskPage = {
    items: [],
    unresolved: [],
    completeness: 'complete',
    freshness: 'native-current',
    issues: []
  };

  test("a view's issue text reaches the host, and the model is told one fixed line", async () => {
    const logger = new Logging.InMemoryLogger('detail');
    const tools = taskTools({
      view: pageView({ ...empty, issues: [`record /srv/secret/t1.json unreadable ${'x'.repeat(10000)}`] }),
      logger
    });
    expect(await query(tools, {})).toSucceedAndSatisfy((page) => {
      expect(page.issues).toEqual([
        'some tasks within this view could not be read; the page may be incomplete'
      ]);
    });
    expect(logger.logged.some((line) => line.includes('/srv/secret/t1.json'))).toBe(true);
    // Without a logger the view's text is discarded, and the model is told the same line.
    const quiet = taskTools({ view: pageView({ ...empty, issues: ['/srv/secret'] }) });
    expect((await query(quiet, {})).orThrow().issues).toEqual([
      'some tasks within this view could not be read; the page may be incomplete'
    ]);
    // A page with no issues says none.
    expect((await query(taskTools({ view: pageView(empty) }), {})).orThrow().issues).toEqual([]);
  });

  test('a malformed cursor from the view fails the call rather than reaching the model', async () => {
    const logger = new Logging.InMemoryLogger('detail');
    const bogus = `../${'c'.repeat(5000)}` as PageCursor;
    const tools = taskTools({ view: pageView({ ...empty, nextCursor: bogus }), logger });
    expect(await query(tools, {})).toFailWith(REFUSED_QUERY);
    expect(logger.logged.some((line) => /malformed page cursor/.test(line))).toBe(true);
  });
});

describe('a view is any IBoundTaskView: every field it returns to the model is checked', () => {
  const secret: string = 'postgres://secret';

  test('a failure code outside the known set is treated as no code at all', async () => {
    const forged = async (): Promise<TaskResult<never>> =>
      failWithDetail<never, ITaskFailure>('boom', {
        code: secret as unknown as TaskFailureCode,
        retry: 'safe'
      });
    const view: IBoundTaskView = { principal: 'alice', query: forged, inspect: forged, inspectStop: forged };
    const tools = taskTools({ view });
    expect(await query(tools, {})).toFailWith(/^task_query: the request failed$/);
    expect(await inspect(tools, { taskId: 't1' })).toFailWith(/^task_inspect: the request failed$/);
  });

  test('a page whose completeness or freshness is not a known value fails the call', async () => {
    const base: IBoundTaskPage = {
      items: [],
      unresolved: [],
      completeness: 'complete',
      freshness: 'native-current',
      issues: []
    };
    const unused = async (): Promise<never> => {
      throw new Error('not used');
    };
    for (const page of [
      { ...base, completeness: secret as unknown as IBoundTaskPage['completeness'] },
      { ...base, freshness: secret as unknown as IBoundTaskPage['freshness'] }
    ]) {
      const view: IBoundTaskView = {
        principal: 'alice',
        query: async () => succeedWithDetail(page),
        inspect: unused,
        inspectStop: unused
      };
      const result = await query(taskTools({ view }), {});
      expect(result).toFailWith(REFUSED_QUERY);
    }
  });

  test('an inspection whose commands or archived flag are malformed fails the call', async () => {
    const h = await brokerHarness();
    await track(h.writer, 't1');
    const real = (await bindReader(h).inspect(tid('t1'))).orThrow();
    const inspections: ReadonlyArray<TaskInspection> = [
      { ...real, commands: [secret] } as TaskInspection,
      { ...real, commands: Array.from({ length: 101 }, (__, i) => `c${i}`) } as TaskInspection,
      { ...real, archived: secret as unknown as boolean } as TaskInspection
    ];
    for (const inspection of inspections) {
      const unused = async (): Promise<never> => {
        throw new Error('not used');
      };
      const view: IBoundTaskView = {
        principal: 'alice',
        query: unused,
        inspect: async () => succeedWithDetail(inspection),
        inspectStop: unused
      };
      const result = await inspect(taskTools({ view }), { taskId: 't1' });
      expect(result).toFailWith(REFUSED_INSPECT);
    }
    // A real inspection passes the same checks, at the cap exactly.
    const atCap = { ...real, commands: Array.from({ length: 100 }, (__, i) => `c${i}`) } as TaskInspection;
    const unused = async (): Promise<never> => {
      throw new Error('not used');
    };
    const view: IBoundTaskView = {
      principal: 'alice',
      query: unused,
      inspect: async () => succeedWithDetail(atCap),
      inspectStop: unused
    };
    expect(await inspect(taskTools({ view }), { taskId: 't1' })).toSucceed();
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
