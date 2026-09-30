/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonObject, JsonSchema, JsonValue } from '@fgv/ts-json-base';
import { fail, succeed } from '@fgv/ts-utils';
import {
  IBoundTaskView,
  IBoundTaskWriter,
  ITaskCommandToolSpec,
  ITaskEnvironment,
  ITaskKindDescriptor,
  ITaskKindRegistry,
  TaskKind,
  TaskKindRegistry,
  allTaskMutationToolGroups,
  createTaskCommandHandle,
  ITaskToolBudget,
  TaskMutationToolGroup,
  TaskContextRenderer,
  createTaskTools,
  defaultTaskContextBudget,
  defaultTaskToolBudget
} from '../../../index';
import { IBrokerHarness, brokerHarness, track } from '../../helpers/brokerFixtures';
// eslint-disable-next-line @rushstack/packlets/mechanics -- the reserved list is internal; it is tested against what the factory builds
import { fixedTaskToolNames } from '../../../packlets/tools/commandTools';
import { converters } from '../../helpers/fixtures';
import { SimulatedExecutor, controllableSource, jobDescriptor } from '../../helpers/sourceFixtures';
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

describe('command tools', () => {
  const executor = new SimulatedExecutor('exec', 'observed-state');
  const source = controllableSource(executor);
  const job = 'sim.job' as TaskKind;
  const other = 'sim.other' as TaskKind;

  /** A registry with the job kind, and — unless told otherwise — a second kind with the same commands. */
  function registry(extra?: ReadonlyArray<ITaskKindDescriptor<unknown>>): TaskKindRegistry {
    const reg = TaskKindRegistry.create(converters.envelopes.snapshot).orThrow();
    reg.register(jobDescriptor(source)).orThrow();
    reg.register(jobDescriptor(source, other)).orThrow();
    for (const descriptor of extra ?? []) {
      reg.register(descriptor).orThrow();
    }
    return reg;
  }

  function spec(command: string, extra?: Partial<ITaskCommandToolSpec>): ITaskCommandToolSpec {
    return { kind: job, detailVersion: 1, command, ...extra };
  }

  function build(
    enable: ReadonlyArray<ITaskCommandToolSpec>,
    over: ITaskKindRegistry = registry(),
    extra?: Partial<Parameters<typeof createTaskTools>[0]>
  ): ReturnType<typeof createTaskTools> {
    return createTaskTools({
      view: untouchableWriter,
      commands: { writer: untouchableWriter, registry: over, environment: untouchableIds, enable },
      ...extra
    });
  }

  /** A kind whose commands are named as given, each with an empty parameter schema. */
  function named(kind: string, ...names: string[]): ITaskKindDescriptor<unknown> {
    return {
      ...jobDescriptor(source, kind as TaskKind),
      commands: names.map((name) =>
        createTaskCommandHandle({
          name,
          parameters: JsonSchema.object({}),
          encode: () => succeed({}),
          idempotency: 'none',
          conditional: false
        })
      )
    } as ITaskKindDescriptor<unknown>;
  }

  test('absent or empty, no command tool is offered', () => {
    expect(build([])).toSucceedAndSatisfy((tools) => {
      expect(tools.map((t) => t.config.name)).toEqual(['task_query', 'task_inspect']);
    });
  });

  test('offers one tool per named command, in the order named, without touching the writer, minting or asking the policy', () => {
    expect(build([spec('resume'), spec('pause'), spec('advance')])).toSucceedAndSatisfy((tools) => {
      expect(tools.map((t) => t.config.name)).toEqual([
        'task_query',
        'task_inspect',
        'task_command_resume',
        'task_command_pause',
        'task_command_advance'
      ]);
    });
    // Beside the mutation tools, after them, and every name distinct.
    expect(
      build([spec('pause')], registry(), {
        mutations: { writer: untouchableWriter, environment: untouchableIds, enable: ['tracked', 'reassign'] }
      })
    ).toSucceedAndSatisfy((tools) => {
      const names = tools.map((t) => t.config.name);
      expect(names).toEqual([
        'task_query',
        'task_inspect',
        'task_create',
        'task_update',
        'task_reassign',
        'task_command_pause'
      ]);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  test('generation asks the registry, and only for the commands named', () => {
    const asked: string[] = [];
    const base = registry();
    const recording: ITaskKindRegistry = new Proxy(base, {
      get(target: ITaskKindRegistry, property: string | symbol): unknown {
        if (property === 'getCommand') {
          return (kind: TaskKind, version: number, name: string) => {
            asked.push(`${kind}@${version}:${name}`);
            return target.getCommand(kind, version, name);
          };
        }
        return Reflect.get(target, property, target);
      }
    });
    expect(
      build([spec('pause'), spec('cancel', { kind: other, name: 'other_cancel' })], recording)
    ).toSucceed();
    expect(asked).toEqual(['sim.job@1:pause', 'sim.other@1:cancel']);
  });

  test('refuses a command the registry does not hold — an undeclared command, kind or version', () => {
    expect(build([spec('teleport')])).toFailWith(
      /invalid commands\.enable: sim\.job@1 'teleport': .*no command/
    );
    expect(build([spec('pause', { kind: 'sim.none' as TaskKind })])).toFailWith(/sim\.none@1 'pause'/);
    expect(build([spec('pause', { detailVersion: 2 })])).toFailWith(/sim\.job@2 'pause'/);
  });

  test('refuses a malformed offer, and a writer that is not the view', () => {
    for (const enable of [
      'pause',
      [{ ...spec('pause'), principal: 'bob' }],
      [spec('pause', { detailVersion: 0 })],
      [spec('pause', { detailVersion: 1.5 })],
      [spec('pause', { kind: 'not a kind' as TaskKind })],
      [spec('not a command')],
      [spec('pause', { name: 7 as unknown as string })],
      [spec('pause', { description: 7 as unknown as string })],
      [undefined]
    ]) {
      expect(build(enable as unknown as ReadonlyArray<ITaskCommandToolSpec>)).toFailWith(
        /invalid commands\.enable/
      );
    }
    const otherView: IBoundTaskView = new Proxy({} as IBoundTaskView, untouchableHandler);
    expect(
      createTaskTools({
        view: otherView,
        commands: { writer: untouchableWriter, registry: registry(), environment: untouchableIds, enable: [] }
      })
    ).toFailWith(/commands\.writer must be the view/);
  });

  test('the reserved names are exactly the fixed tools the factory builds — a renamed or added tool cannot go stale', () => {
    const fixed = withMutations(allTaskMutationToolGroups).names;
    expect([...fixedTaskToolNames].sort()).toEqual([...fixed].sort());
  });

  test('a generated name may not be a fixed tool’s, whether or not that tool is offered', () => {
    for (const name of ['task_query', 'task_inspect', 'task_create', 'task_update', 'task_reassign']) {
      expect(build([spec('pause', { name })])).toFailWith(
        `task tools: invalid commands.enable: sim.job@1 'pause': tool name '${name}' is a fixed task tool's`
      );
    }
  });

  test('a generated name must be one every provider accepts', () => {
    for (const name of ['', 'has space', '7starts_with_digit', 'task.dot', `t${'x'.repeat(64)}`]) {
      expect(build([spec('pause', { name })])).toFailWith(/is not one every provider accepts/);
    }
    expect(build([spec('pause', { name: `t${'x'.repeat(63)}` })])).toSucceed();
    expect(build([spec('pause', { name: '_pause-now' })])).toSucceed();
  });

  test('two commands under one name refuse the whole set — including two kinds registering the same command', () => {
    expect(build([spec('pause'), spec('pause')])).toFailWith(
      /'task_command_pause' is taken by both sim\.job@1 'pause' and sim\.job@1 'pause'; name one of them/
    );
    expect(build([spec('pause'), spec('pause', { kind: other })])).toFailWith(
      /'task_command_pause' is taken by both sim\.job@1 'pause' and sim\.other@1 'pause'/
    );
    expect(build([spec('pause'), spec('resume', { name: 'task_command_pause' })])).toFailWith(
      /is taken by both/
    );
    // Naming one of them resolves it.
    expect(build([spec('pause'), spec('pause', { kind: other, name: 'other_pause' })])).toSucceedAndSatisfy(
      (tools) => {
        expect(tools.map((t) => t.config.name).slice(2)).toEqual(['task_command_pause', 'other_pause']);
      }
    );
  });

  test('a default name replaces what a provider would refuse, and a clash that makes is refused too', () => {
    const reg = registry([named('sim.dotted', 'ops.retry:now', 'a.b', 'a_b')]);
    const dotted = (command: string): ITaskCommandToolSpec =>
      spec(command, { kind: 'sim.dotted' as TaskKind });
    expect(build([dotted('ops.retry:now')], reg)).toSucceedAndSatisfy((tools) => {
      expect(tools[2].config.name).toBe('task_command_ops_retry_now');
    });
    expect(build([dotted('a.b'), dotted('a_b')], reg)).toFailWith(/'task_command_a_b' is taken by both/);
  });

  test('a registry that throws refuses the set', () => {
    const throwing = new Proxy(registry(), {
      get(): never {
        throw new Error('registry down');
      }
    });
    expect(build([spec('pause')], throwing)).toFailWith(/sim\.job@1 'pause': registry down/);
  });

  test('a command tool carries the registered parameter schema on the wire, closed as registered', () => {
    const tools = build([spec('pause'), spec('resume')]).orThrow();
    const envelope = {
      taskId: { type: 'string', description: 'The id of the task to send the command to.' },
      expectedRevision: {
        type: 'integer',
        description:
          'The revision task_inspect last returned for this task. The change is refused if the task has ' +
          'changed since; inspect it again and decide afresh.'
      }
    };
    expect(tools[2].config.parametersSchema.toJson()).toEqual({
      type: 'object',
      properties: {
        ...envelope,
        parameters: {
          type: 'object',
          properties: { reason: { type: 'string' } },
          required: ['reason'],
          additionalProperties: false
        }
      },
      required: ['taskId', 'expectedRevision', 'parameters'],
      additionalProperties: false
    });
    expect(tools[3].config.parametersSchema.toJson()).toEqual({
      type: 'object',
      properties: {
        ...envelope,
        parameters: { type: 'object', properties: {}, additionalProperties: false }
      },
      required: ['taskId', 'expectedRevision', 'parameters'],
      additionalProperties: false
    });
    // The parameters are the registry's own schema, not a copy of it.
    const handle = registry().getCommand(job, 1, 'pause').orThrow();
    expect((tools[2].config.parametersSchema.toJson().properties as JsonObject).parameters).toEqual(
      handle.parameters.toJson()
    );
  });

  test('command tools are annotated as open-world writes, and describe what their result means', () => {
    const tools = build([
      spec('pause'),
      spec('cancel', { description: 'Cancel a simulated job.' })
    ]).orThrow();
    for (const tool of tools.slice(2)) {
      expect(tool.config.annotations).toEqual({
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      });
    }
    const tail =
      "Pass the revision task_inspect returned. 'accepted' means the command is recorded for the task's " +
      "executor, not that it has taken effect; 'applied' means it has. If the outcome is not known, do " +
      'not send it again.';
    expect(tools[2].config.description).toBe(
      `Send the 'pause' command to a task of kind sim.job that you can see. ${tail}`
    );
    expect(tools[3].config.description).toBe(`Cancel a simulated job. ${tail}`);
  });
});
