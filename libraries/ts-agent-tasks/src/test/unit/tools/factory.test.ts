/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonValue } from '@fgv/ts-json-base';
import { fail } from '@fgv/ts-utils';
import {
  IBoundTaskView,
  IBoundTaskWriter,
  ITaskEnvironment,
  ITaskToolBudget,
  TaskMutationToolGroup,
  TaskContextRenderer,
  createTaskTools,
  defaultTaskContextBudget,
  defaultTaskToolBudget
} from '../../../index';
import { IBrokerHarness, brokerHarness, track } from '../../helpers/brokerFixtures';
import { bindReader, inspect, query, taskTools, toolSet } from '../../helpers/toolFixtures';

/** A view that fails the test on any use at all. */
const untouchableHandler: ProxyHandler<IBoundTaskView> = {
  get(target: IBoundTaskView, property: string | symbol): never {
    throw new Error(`the view was touched: ${String(property)}`);
  }
};
const untouchable: IBoundTaskView = new Proxy({} as IBoundTaskView, untouchableHandler);

/** A writer that fails the test on any use at all; the factory must not touch it. */
const untouchableWriter: IBoundTaskWriter = untouchable as IBoundTaskWriter;

/** An id factory that fails the test on any use: building the tools mints nothing. */
const untouchableIds: Pick<ITaskEnvironment, 'newTaskId' | 'newOperationId'> = {
  newTaskId: () => {
    throw new Error('minted a task id at build time');
  },
  newOperationId: () => {
    throw new Error('minted an operation id at build time');
  }
};

/** The tools with mutations opted in over the untouchable writer. */
function withMutations(enable: ReadonlyArray<TaskMutationToolGroup>): ReturnType<typeof toolSet> {
  return toolSet({
    view: untouchableWriter,
    mutations: { writer: untouchableWriter, environment: untouchableIds, enable }
  });
}

/** Every key anywhere in a JSON value. */
function allKeys(value: JsonValue, into: Set<string> = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((v) => allKeys(v, into));
  } else if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      into.add(k);
      allKeys(v as JsonValue, into);
    }
  }
  return into;
}

describe('createTaskTools', () => {
  test('builds exactly task_query and task_inspect, read-only, without touching the view', () => {
    // Default construction — no `mutations` — offers no mutation tool; so does an empty opt-in.
    expect(withMutations([]).names).toEqual(['task_query', 'task_inspect']);
    expect(createTaskTools({ view: untouchable })).toSucceedAndSatisfy((tools) => {
      expect(tools.map((t) => t.config.name)).toEqual(['task_query', 'task_inspect']);
      for (const tool of tools) {
        expect(tool.config.type).toBe('client_tool');
        expect(tool.config.description.length).toBeGreaterThan(0);
        expect(tool.config.annotations).toEqual({
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false
        });
      }
    });
  });

  test('offers each opted-in mutation group, and only those, without touching the writer or minting', () => {
    expect(withMutations(['tracked', 'reassign']).names).toEqual([
      'task_query',
      'task_inspect',
      'task_create',
      'task_update',
      'task_reassign'
    ]);
    expect(withMutations(['tracked']).names).toEqual([
      'task_query',
      'task_inspect',
      'task_create',
      'task_update'
    ]);
    expect(withMutations(['reassign']).names).toEqual(['task_query', 'task_inspect', 'task_reassign']);
    // Order and repetition in the opt-in change nothing.
    expect(withMutations(['reassign', 'tracked', 'reassign']).names).toEqual(
      withMutations(['tracked', 'reassign']).names
    );
  });

  test('mutation tools are annotated as writes', () => {
    const tools = withMutations(['tracked', 'reassign']);
    expect(tools.get('task_create').config.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    });
    for (const name of ['task_update', 'task_reassign']) {
      expect(tools.get(name).config.annotations).toEqual({
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false
      });
    }
  });

  test('refuses a mutation opt-in whose writer is not the view, or that names an unknown group', () => {
    const otherView: IBoundTaskView = new Proxy({} as IBoundTaskView, untouchableHandler);
    expect(
      createTaskTools({
        view: otherView,
        mutations: { writer: untouchableWriter, environment: untouchableIds, enable: ['tracked'] }
      })
    ).toFailWith(/mutations\.writer must be the view/);
    // Even with nothing enabled: a mismatched binding is a host error, not a no-op.
    expect(
      createTaskTools({
        view: otherView,
        mutations: { writer: untouchableWriter, environment: untouchableIds, enable: [] }
      })
    ).toFailWith(/mutations\.writer must be the view/);
    for (const enable of [['execute'], ['stop'], ['changeScopes'], 'tracked']) {
      expect(
        createTaskTools({
          view: untouchableWriter,
          mutations: {
            writer: untouchableWriter,
            environment: untouchableIds,
            enable: enable as unknown as ReadonlyArray<TaskMutationToolGroup>
          }
        })
      ).toFailWith(/invalid mutations\.enable/);
    }
  });

  test('every fixed tool name is distinct — the namespace generated command tools must avoid', () => {
    const names = withMutations(['tracked', 'reassign']).names;
    expect(new Set(names).size).toBe(names.length);
    expect(names.every((n) => /^task_[a-z]+$/.test(n))).toBe(true);
  });

  test('refuses a budget that could never render, before the model ever calls', () => {
    const reserve: number = TaskContextRenderer.create().orThrow().framingReserve;
    const cases: ReadonlyArray<[unknown, RegExp]> = [
      [
        { ...defaultTaskToolBudget, context: { ...defaultTaskContextBudget, maxChars: reserve - 1 } },
        /reserve/
      ],
      [{ ...defaultTaskToolBudget, context: { ...defaultTaskContextBudget, maxItems: 201 } }, /maxItems/],
      [{ ...defaultTaskToolBudget, context: { ...defaultTaskContextBudget, maxItems: 0 } }, /maxItems/],
      [{ ...defaultTaskToolBudget, maxDetailsChars: 0 }, /maxDetailsChars/],
      [{ ...defaultTaskToolBudget, maxDetailsChars: 1.5 }, /maxDetailsChars/],
      [{ ...defaultTaskToolBudget, extra: true }, /extra/]
    ];
    for (const [budget, pattern] of cases) {
      expect(createTaskTools({ view: untouchable, budget: budget as ITaskToolBudget })).toFailWith(pattern);
    }
    // The reserve itself is a usable budget.
    expect(
      createTaskTools({
        view: untouchable,
        budget: { ...defaultTaskToolBudget, context: { ...defaultTaskContextBudget, maxChars: reserve } }
      })
    ).toSucceed();
  });

  test('propagates a failure to build the default renderer', () => {
    const spy = jest.spyOn(TaskContextRenderer, 'create').mockReturnValueOnce(fail('renderer unavailable'));
    expect(createTaskTools({ view: untouchable })).toFailWith(/renderer unavailable/);
    spy.mockRestore();
  });
});

describe('wire schemas', () => {
  const tools = taskTools({ view: untouchable });

  test('task_query emits a closed schema of narrowing filters and paging, and nothing else', () => {
    expect(tools.query.config.parametersSchema.toJson()).toEqual({
      type: 'object',
      properties: {
        responsibility: {
          type: 'object',
          description: 'Only tasks assigned to this responsible party.',
          properties: {
            namespace: { type: 'string', description: 'The responsible party namespace, e.g. "agent".' },
            key: { type: 'string', description: 'The responsible party key within its namespace.' }
          },
          required: ['namespace', 'key'],
          additionalProperties: false
        },
        parentId: { type: 'string', description: 'Only direct children of this task.' },
        lifecycleClass: {
          type: 'string',
          enum: ['open', 'terminal', 'all'],
          description: 'Only open tasks, only terminal tasks, or all (the default).'
        },
        statuses: {
          type: 'array',
          description: 'Only tasks in one of these lifecycle statuses.',
          items: {
            type: 'string',
            enum: ['pending', 'running', 'waiting', 'paused', 'succeeded', 'failed', 'cancelled'],
            description: 'A lifecycle status.'
          }
        },
        limit: { type: 'integer', description: 'The most tasks to return, from 1 to 20. Defaults to 20.' },
        cursor: {
          type: 'string',
          description: 'The nextCursor of a previous task_query, to continue after it.'
        }
      },
      additionalProperties: false
    });
  });

  test('task_query states the page bound the tool enforces', () => {
    const small = taskTools({
      view: untouchable,
      budget: { ...defaultTaskToolBudget, context: { ...defaultTaskContextBudget, maxItems: 5 } }
    });
    expect(small.query.config.parametersSchema.toJson()).toMatchObject({
      properties: { limit: { description: 'The most tasks to return, from 1 to 5. Defaults to 5.' } }
    });
  });

  test('task_inspect emits a closed schema with one required task id', () => {
    expect(tools.inspect.config.parametersSchema.toJson()).toEqual({
      type: 'object',
      properties: { taskId: { type: 'string', description: 'The id of the task to inspect.' } },
      required: ['taskId'],
      additionalProperties: false
    });
  });

  test('no schema can name a principal, scope, consumer, actor, operation, binding or lifecycle', () => {
    const all = withMutations(['tracked', 'reassign']);
    for (const name of all.names) {
      const keys: Set<string> = allKeys(all.get(name).config.parametersSchema.toJson() as JsonValue);
      for (const forbidden of [
        'principal',
        'scope',
        'scopes',
        'consumer',
        'subscription',
        'actor',
        'binding',
        'operationId',
        'kind',
        'recovery',
        'initialObservation',
        'lifecycle',
        'status',
        'stopPolicy',
        'attention'
      ]) {
        expect(keys.has(forbidden)).toBe(false);
      }
    }
    // Only an existing task is named by id; a new task's id is never the model's.
    expect(allKeys(all.get('task_create').config.parametersSchema.toJson() as JsonValue).has('taskId')).toBe(
      false
    );
  });
});

describe('mutation wire schemas', () => {
  const tools = withMutations(['tracked', 'reassign']);
  const responsibility = {
    namespace: { type: 'string', description: 'The responsible party namespace, e.g. "agent".' },
    key: { type: 'string', description: 'The responsible party key within its namespace.' }
  };
  const identity = {
    taskId: { type: 'string', description: 'The id of the task to change.' },
    expectedRevision: {
      type: 'integer',
      description:
        'The revision task_inspect last returned for this task. The change is refused if the task has ' +
        'changed since; inspect it again and decide afresh.'
    }
  };

  test('task_create emits a closed schema with a required title and no ids', () => {
    expect(tools.get('task_create').config.parametersSchema.toJson()).toEqual({
      type: 'object',
      properties: {
        title: { type: 'string', description: 'A one-line title for the new task.' },
        description: { type: 'string', description: 'A longer description of the task.' },
        parentId: { type: 'string', description: 'Create the task as a child of this open task.' },
        responsibility: {
          type: 'object',
          description: 'The party responsible for the new task.',
          properties: responsibility,
          required: ['namespace', 'key'],
          additionalProperties: false
        }
      },
      required: ['title'],
      additionalProperties: false
    });
  });

  test('task_update emits a closed schema: identity, presentable fields and clears', () => {
    expect(tools.get('task_update').config.parametersSchema.toJson()).toEqual({
      type: 'object',
      properties: {
        ...identity,
        title: { type: 'string', description: 'A new one-line title.' },
        description: { type: 'string', description: 'A new description.' },
        progress: {
          type: 'object',
          description: 'The progress to report, replacing any reported before.',
          properties: {
            phase: { type: 'string', description: 'The current phase.' },
            completed: { type: 'number', description: 'How much is done.' },
            total: { type: 'number', description: 'How much there is in all.' },
            unit: { type: 'string', description: 'What completed and total count.' },
            summary: { type: 'string', description: 'A short progress note.' }
          },
          additionalProperties: false
        },
        clear: {
          type: 'array',
          description: 'Fields to remove. A field cleared here may not also be set.',
          items: { type: 'string', enum: ['description', 'progress'], description: 'A field to remove.' }
        }
      },
      required: ['taskId', 'expectedRevision'],
      additionalProperties: false
    });
  });

  test('task_reassign emits a closed schema whose party is required and nullable', () => {
    expect(tools.get('task_reassign').config.parametersSchema.toJson()).toEqual({
      type: 'object',
      properties: {
        ...identity,
        responsibility: {
          type: ['object', 'null'],
          description: 'The party to make responsible, or null to unassign the task.',
          properties: responsibility,
          required: ['namespace', 'key'],
          additionalProperties: false
        }
      },
      required: ['taskId', 'expectedRevision', 'responsibility'],
      additionalProperties: false
    });
  });
});

describe('execute re-validates its arguments with no harness in front', () => {
  let h: IBrokerHarness;
  let calls: string[];
  let tools: ReturnType<typeof taskTools>;

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't1');
    const view = bindReader(h);
    calls = [];
    // Records every call into the view: a malformed call must be refused before reaching it.
    const counting: IBoundTaskView = {
      principal: view.principal,
      query: async (request) => {
        calls.push('query');
        return view.query(request);
      },
      inspect: async (id) => {
        calls.push('inspect');
        return view.inspect(id);
      },
      inspectStop: async (request) => view.inspectStop(request)
    };
    tools = taskTools({ view: counting });
  });

  test('task_query refuses surplus fields — a principal, scope or consumer above all', async () => {
    const surplus: ReadonlyArray<Record<string, unknown>> = [
      { principal: 'bob' },
      { scopes: [{ namespace: 'project', key: 'beta' }] },
      { scope: 'beta' },
      { consumer: 'watcher' },
      { filter: { parentId: 't1' } },
      { responsibility: { namespace: 'agent', key: 'ada', principal: 'bob' } }
    ];
    for (const args of surplus) {
      expect(await query(tools, args)).toFailWith(/^task_query: invalid arguments/);
    }
    expect(calls).toEqual([]);
  });

  test('task_query refuses malformed values and out-of-range limits', async () => {
    const malformed: ReadonlyArray<unknown> = [
      undefined,
      null,
      'all',
      [],
      { limit: '5' },
      { limit: 1.5 },
      { limit: 0 },
      { limit: -1 },
      { limit: 21 },
      { lifecycleClass: 'finished' },
      { statuses: ['done'] },
      { statuses: 'running' },
      { parentId: 7 },
      { parentId: '../t1' },
      { responsibility: { namespace: 'agent' } },
      { cursor: 12 }
    ];
    for (const args of malformed) {
      expect(await query(tools, args)).toFailWith(/^task_query: invalid arguments/);
    }
    expect(calls).toEqual([]);
    expect(await query(tools, { limit: 21 })).toFailWith(/limit must be an integer from 1 to 20; got 21/);
  });

  test('task_inspect refuses surplus fields and malformed ids', async () => {
    const malformed: ReadonlyArray<unknown> = [
      undefined,
      null,
      't1',
      {},
      { taskId: 't1', principal: 'bob' },
      { taskId: 't1', scope: 'beta' },
      { taskId: 7 },
      { taskId: '' },
      { taskId: '../t1' }
    ];
    for (const args of malformed) {
      expect(await inspect(tools, args)).toFailWith(/^task_inspect: invalid arguments/);
    }
    expect(calls).toEqual([]);
  });

  test('well-formed calls do reach the view', async () => {
    expect(await query(tools, {})).toSucceed();
    expect(await query(tools, { limit: 20 })).toSucceed();
    expect(await inspect(tools, { taskId: 't1' })).toSucceed();
    expect(calls).toEqual(['query', 'query', 'inspect']);
  });
});
