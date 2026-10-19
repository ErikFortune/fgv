/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * The credential-free agent-tasks journey: the nine steps of the implementation plan's P1,
 * driven through `@fgv/ts-agent-tasks`' exports from outside the package.
 *
 * @remarks
 * Each step records checks ({@link StepRecorder}) — the value it observed through a public API and
 * the value the design says it should be. Branches that need a world in another state (the
 * reassignment while the child runs, the due/history cohorts, the cascade stops, recovery after a
 * reopen, the prompt) run on a fresh world seeded the same way, so every branch is deterministic.
 *
 * A failure of the journey itself (a setup call the design says succeeds) halts it as a `Failure`;
 * a behaviour that differs from the design is a failed check, reported rather than thrown.
 *
 * @packageDocumentation
 */

import { PromptId, PromptLibrary, PromptStoreFixture, ScopeKey } from '@fgv/ts-prompt-assist';
import { JsonValue } from '@fgv/ts-json-base';
import { Result, captureAsyncResult } from '@fgv/ts-utils';
import {
  ConsumerId,
  IBoundTaskDelivery,
  IBoundTaskView,
  IBoundTaskViewParams,
  IBoundTaskWriter,
  ISourceProjection,
  IStopResult,
  ITaskPromptHandoff,
  ITaskPromptRequest,
  Instant,
  StopMode,
  SubscriptionId,
  TaskContextRenderer,
  TaskId,
  TaskResult,
  TaskRevision,
  UpdateCategory,
  UpdateId,
  allUpdateCategories,
  createTaskTools,
  prepareTaskPrompt,
  taskPromptRecord,
  taskUpdateId,
  trackedTaskDetailVersion,
  trackedTaskKind
} from '@fgv/ts-agent-tasks';

import { ICapturedRequest, captureAnthropicRequest } from './outbound';
import {
  IToolAnswer,
  ResolvedInspection,
  callTool,
  codeOf,
  oneNewKey,
  refusalOf,
  requireApplied,
  resolutionsFor,
  resolvedInspection
} from './support';
import { IJourneyReport, IJourneyStep, StepRecorder, journeyReport } from './report';
import {
  IWorld,
  IWorldOptions,
  SimulatedExecutor,
  ada,
  bob,
  createWorld,
  jobKind,
  openWorld,
  personalScope,
  projectScope,
  reopenWorld,
  viewFor,
  watchKind,
  writerFor
} from './world';

// ---------------------------------------------------------------------------
// Small public-API helpers
// ---------------------------------------------------------------------------

const tid = (id: string): TaskId => id as TaskId;

/** The host-facing binding used for subscriptions and host operations. */
function hostBinding(world: IWorld): IBoundTaskViewParams {
  return { principal: 'host', scopes: [projectScope, personalScope], authorization: world.policy };
}

/** Inspects a task through a view; the journey halts if it is not a resolved task. */
async function inspect(view: IBoundTaskView, id: string): Promise<ResolvedInspection> {
  return resolvedInspection(id, (await view.inspect(tid(id))).orThrow());
}

async function revisionOf(view: IBoundTaskView, id: string): Promise<TaskRevision> {
  return (await inspect(view, id)).envelope.revision;
}

async function statusOf(view: IBoundTaskView, id: string): Promise<string> {
  return (await inspect(view, id)).envelope.lifecycle.status;
}

/** Runs a command at the task's current revision through the writer, and returns its receipt's state. */
async function execute(
  world: IWorld,
  writer: IBoundTaskWriter,
  id: string,
  command: string,
  parameters: JsonValue
): Promise<string> {
  const expectedRevision: TaskRevision = await revisionOf(writer, id);
  return (
    await writer.execute({
      taskId: tid(id),
      operationId: world.ids.op(),
      expectedRevision,
      command,
      parameters
    })
  ).orThrow().result.state;
}

/** Runs a command the journey depends on; the journey halts unless it applied. */
async function run(
  world: IWorld,
  writer: IBoundTaskWriter,
  id: string,
  command: string,
  parameters: JsonValue
): Promise<void> {
  requireApplied(`${command} on ${id}`, await execute(world, writer, id, command, parameters));
}

/** Ids of a view query, in page order. */
async function ids(
  view: IBoundTaskView,
  lifecycleClass: 'open' | 'terminal' | 'all' = 'all'
): Promise<string[]> {
  const page = (await view.query({ filter: { lifecycleClass }, limit: 200 })).orThrow();
  return page.items.map((item) => item.envelope.id);
}

/** Ids a delivery is owed and may see, sorted. */
async function owed(delivery: IBoundTaskDelivery): Promise<string[]> {
  return (await delivery.pending({ limit: 200 }))
    .orThrow()
    .updates.map((u) => u.id)
    .sort();
}

const everyCategory: ReadonlyArray<UpdateCategory> = [...allUpdateCategories].sort();

/** Subscribes a consumer over both scopes, every lifecycle class and category. */
async function subscribe(
  world: IWorld,
  id: string,
  consumer: string,
  start: 'current' | 'from-now'
): Promise<void> {
  (
    await world.broker.subscribe(hostBinding(world), {
      subscriptionId: id,
      operationId: world.ids.op(),
      consumerId: consumer,
      selection: { scopes: [projectScope, personalScope], lifecycleClass: 'all' },
      start,
      policy: { categories: everyCategory }
    })
  ).orThrow();
}

/** Binds `principal`'s delivery of a subscription. */
function deliveryOf(
  world: IWorld,
  principal: string,
  subscriptionId: string,
  consumerId: string
): IBoundTaskDelivery {
  return world.broker
    .bindDelivery({
      principal,
      scopes: [projectScope, personalScope],
      authorization: world.policy,
      subscriptionId: subscriptionId as SubscriptionId,
      consumerId: consumerId as ConsumerId
    })
    .orThrow();
}

const hostThread: { namespace: string; key: string } = { namespace: 'host-thread', key: 'thread-17' };
const reviewNote: { namespace: string; key: string } = { namespace: 'host-thread', key: 'thread-18' };

/** A job's projection as the JSON a registration carries. */
function initialObservation(executor: SimulatedExecutor, job: string): ISourceProjection {
  const projection = executor.projectionOf(job).orThrow();
  return { ...projection, details: { step: projection.details.step, ref: projection.details.ref } };
}

/** Registers an executor job as an external child of the plan. */
async function registerJob(world: IWorld, executor: SimulatedExecutor, job: string): Promise<void> {
  executor.addJob(job);
  (
    await world.broker.registerExternal('host', {
      taskId: tid(job),
      operationId: world.ids.op(),
      kind: executor === world.watcher ? watchKind : jobKind,
      detailVersion: 1,
      title: `Job ${job}`,
      parentId: tid('plan'),
      responsibility: ada,
      scopes: [projectScope],
      binding: executor.binding(job),
      recovery: 'reattach',
      initialObservation: initialObservation(executor, job)
    })
  ).orThrow();
}

/** The keys an executor has seen, in first-dispatch order. */
function keysSeen(executor: SimulatedExecutor): string[] {
  return Array.from(executor.dispatches.keys());
}

/** The single key dispatched since `before` keys had been seen; the journey halts if not exactly one. */
function newKey(executor: SimulatedExecutor, before: number): string {
  return oneNewKey(before, keysSeen(executor));
}

// ---------------------------------------------------------------------------
// Seeding: step 1's world, reused by every branch
// ---------------------------------------------------------------------------

interface ISeeded {
  readonly world: IWorld;
  readonly writerA: IBoundTaskWriter;
}

/**
 * The research plan Ada owns, a waiting tracked child holding an opaque host attention reference,
 * and a running external child with typed details.
 */
async function seed(world: IWorld): Promise<ISeeded> {
  const writerA = writerFor(world, 'agent:ada').orThrow();
  (
    await writerA.createTracked({
      taskId: tid('plan'),
      operationId: world.ids.op(),
      title: 'Research plan: river gauge survey',
      responsibility: ada,
      stopPolicy: 'cascade-cancel'
    })
  ).orThrow();
  (
    await writerA.createTracked({
      taskId: tid('review'),
      operationId: world.ids.op(),
      title: 'Reviewer sign-off',
      parentId: tid('plan'),
      responsibility: ada
    })
  ).orThrow();
  await run(world, writerA, 'review', 'wait', {
    reason: { code: 'awaiting-review', summary: 'Held for reviewer sign-off', attention: [hostThread] }
  });
  await registerJob(world, world.executor, 'crawl');
  return { world, writerA };
}

async function seededWorld(options?: IWorldOptions): Promise<ISeeded> {
  return seed((await createWorld(options)).orThrow());
}

// ---------------------------------------------------------------------------
// Steps 1–4: one world, in order
// ---------------------------------------------------------------------------

interface IMainState extends ISeeded {
  readonly deliveryA: IBoundTaskDelivery;
}

async function step1(seeded: ISeeded): Promise<IJourneyStep> {
  const { world, writerA } = seeded;
  const s = new StepRecorder('1', 'Create tracked and external work; overlapping scopes deduplicate');
  const both = viewFor(world, 'agent:ada', [projectScope, personalScope]).orThrow();
  const project = viewFor(world, 'agent:ada', [projectScope]).orThrow();
  const personal = viewFor(world, 'agent:ada', [personalScope]).orThrow();
  s.check('project view', await ids(project), ['crawl', 'plan', 'review']);
  s.check('personal view', await ids(personal), ['plan', 'review']);
  s.check('union view lists each task once', await ids(both), ['crawl', 'plan', 'review']);
  s.check('plan carries both scopes', (await inspect(writerA, 'plan')).envelope.scopes.length, 2);
  s.check(
    'review waits, holding the host attention reference',
    (await inspect(writerA, 'review')).envelope.lifecycle,
    {
      status: 'waiting',
      reason: { code: 'awaiting-review', summary: 'Held for reviewer sign-off', attention: [hostThread] }
    }
  );
  const crawl = await inspect(writerA, 'crawl');
  s.check('crawl runs', crawl.envelope.lifecycle.status, 'running');
  s.check('crawl details, typed through the kind handle', crawl.details, { step: 0, ref: 'sim/crawl' });
  s.check('a view emits no source binding', 'binding' in crawl.envelope, false);
  return s.finish();
}

async function step2(seeded: ISeeded): Promise<{ step: IJourneyStep; state: IMainState }> {
  const { world, writerA } = seeded;
  const s = new StepRecorder(
    '2',
    'Two subscriptions; broker and snapshot-only rendering acknowledge nothing'
  );
  await subscribe(world, 'sub-ada', 'ada-context', 'current');
  await subscribe(world, 'sub-audit', 'audit-log', 'current');
  const deliveryA = deliveryOf(world, 'agent:ada', 'sub-ada', 'ada-context');
  const deliveryAudit = deliveryOf(world, 'host', 'sub-audit', 'audit-log');
  const owedA: string[] = await owed(deliveryA);
  const owedAudit: string[] = await owed(deliveryAudit);
  s.check(
    'each subscription is owed its baseline',
    [owedA, owedAudit],
    [
      ['crawl:1:initial', 'plan:1:initial', 'review:2:initial'],
      ['crawl:1:initial', 'plan:1:initial', 'review:2:initial']
    ]
  );

  const prepared = (await deliveryA.prepare()).orThrow();
  const brokerReceipt = prepared.context.receipt;
  const page = (await writerA.query({ limit: 200 })).orThrow();
  const renderer = TaskContextRenderer.create().orThrow();
  const snapshot = renderer.render({ tasks: page.items, completeness: 'complete' }).orThrow();
  const again = renderer.render({ tasks: page.items, completeness: 'complete' }).orThrow();
  s.check(
    'the broker receipt names its delivery and the baseline update ids',
    [
      brokerReceipt.deliveryId === prepared.deliveryId,
      brokerReceipt.included.flatMap((e) => e.updateIds).sort()
    ],
    [true, owedA]
  );
  s.check(
    'the snapshot receipt names revisions only — no delivery, no update ids',
    [snapshot.receipt.deliveryId, snapshot.receipt.included.flatMap((e) => e.updateIds)],
    [undefined, []]
  );
  s.check('rendering a snapshot again gives the identical receipt', again.receipt, snapshot.receipt);
  s.check(
    'both receipts cover the same tasks',
    [...new Set(snapshot.receipt.included.map((e) => e.taskId))].sort(),
    [...new Set(brokerReceipt.included.map((e) => e.taskId))].sort()
  );
  s.check('preparing acknowledged nothing (ada)', await owed(deliveryA), owedA);
  s.check('preparing acknowledged nothing (audit)', await owed(deliveryAudit), owedAudit);
  (await deliveryA.abandon(prepared.deliveryId)).orThrow();
  return { step: s.finish(), state: { ...seeded, deliveryA } };
}

async function step3(state: IMainState): Promise<IJourneyStep> {
  const { world, writerA } = state;
  const executor: SimulatedExecutor = world.executor;
  const s = new StepRecorder('3', 'Typed command tools: applied, rejected, accepted, indeterminate');
  const tools = createTaskTools({
    view: writerA,
    commands: {
      writer: writerA,
      registry: world.registry,
      environment: world.env,
      enable: [
        { kind: trackedTaskKind, detailVersion: trackedTaskDetailVersion, command: 'start' },
        { kind: jobKind, detailVersion: 1, command: 'pause', name: 'job_pause' },
        { kind: jobKind, detailVersion: 1, command: 'resume', name: 'job_resume' },
        { kind: jobKind, detailVersion: 1, command: 'advance', name: 'job_advance' }
      ]
    }
  }).orThrow();
  const call = async (name: string, id: string): Promise<IToolAnswer | string> =>
    callTool(tools, name, { taskId: id, expectedRevision: await revisionOf(writerA, id), parameters: {} });
  s.check(
    'tools offered',
    tools.map((t) => t.config.name),
    ['task_query', 'task_inspect', 'task_command_start', 'job_pause', 'job_resume', 'job_advance']
  );

  // Applied: a native transition.
  const planBefore: number = await revisionOf(writerA, 'plan');
  s.check('start plan: applied', await call('task_command_start', 'plan'), {
    taskId: 'plan',
    state: 'applied',
    revision: planBefore + 1
  });

  // Rejected by the broker: start on a waiting task is not a transition the table allows.
  const reviewBefore: number = await revisionOf(writerA, 'review');
  s.check(
    'start review (waiting): rejected, read as conflict',
    await call('task_command_start', 'review'),
    'conflict'
  );
  s.check(
    'review unchanged by the rejection',
    [await statusOf(writerA, 'review'), await revisionOf(writerA, 'review')],
    ['waiting', reviewBefore]
  );

  // Rejected by the source: the executor refuses, and nothing changes on either side.
  const crawlBefore: number = await revisionOf(writerA, 'crawl');
  executor.rejectNext = 'invalid-transition';
  s.check(
    'advance crawl, the executor refuses: read as conflict',
    await call('job_advance', 'crawl'),
    'conflict'
  );
  executor.rejectNext = 'conflict';
  s.check(
    'the same refusal, as the host sees the receipt',
    await execute(world, writerA, 'crawl', 'advance', {}),
    'rejected'
  );
  s.check(
    'crawl unchanged by the refusals',
    [executor.stepOf('crawl'), await revisionOf(writerA, 'crawl')],
    [0, crawlBefore]
  );

  // Accepted: the executor records the command and applies it later. Accepted is not applied.
  executor.answer = 'accept';
  const beforeAccept: number = keysSeen(executor).length;
  s.check('advance crawl: accepted', await call('job_advance', 'crawl'), {
    taskId: 'crawl',
    state: 'accepted'
  });
  const acceptedKey: string = newKey(executor, beforeAccept);
  s.check('accepted is not applied: the executor has not advanced', executor.stepOf('crawl'), 0);
  executor.answer = 'apply';
  executor.settleAccepted();
  (await world.broker.observe(tid('crawl'))).orThrow();
  s.check(
    'after the executor applies it, the observation shows it',
    (await inspect(writerA, 'crawl')).details,
    {
      step: 1,
      ref: 'sim/crawl'
    }
  );
  s.check('the accepted command reached the executor once', executor.dispatches.get(acceptedKey), 1);

  // Indeterminate, source-key: the response is lost; the host pump resends under the same key.
  executor.loseNextResponse = true;
  const beforePause: number = keysSeen(executor).length;
  s.check(
    'pause crawl, response lost: the model is told the outcome is unknown',
    await call('job_pause', 'crawl'),
    'the outcome is not known'
  );
  const pauseKey: string = newKey(executor, beforePause);
  const pumped = (await writerA.resolveCommands({ limit: 10 })).orThrow();
  s.check(
    'the pump settles it by resending under the same key',
    resolutionsFor(pumped.resolutions, pauseKey),
    ['resolved:applied']
  );
  s.check('the executor saw the key twice', executor.dispatches.get(pauseKey), 2);
  s.check(
    'and applied it once (source-key duplicate suppression)',
    executor.appliedTo('crawl').filter((a) => a.startsWith('pause:')),
    [`pause:${pauseKey}`]
  );
  s.check('crawl is paused', await statusOf(writerA, 'crawl'), 'paused');
  const pausedAt: number = await revisionOf(writerA, 'crawl');
  s.check('resume crawl: applied', await call('job_resume', 'crawl'), {
    taskId: 'crawl',
    state: 'applied',
    revision: pausedAt + 1
  });

  // Indeterminate, none: the pump never resends; it holds the command until the host decides.
  executor.loseNextResponse = true;
  const beforeAdvance: number = keysSeen(executor).length;
  s.check(
    'advance crawl, response lost: unknown',
    await call('job_advance', 'crawl'),
    'the outcome is not known'
  );
  const advanceKey: string = newKey(executor, beforeAdvance);
  const held1 = (await writerA.resolveCommands({ limit: 10 })).orThrow();
  const held2 = (await writerA.resolveCommands({ limit: 10 })).orThrow();
  s.check(
    'the pump refuses to resend an uncertain non-idempotent command',
    [...resolutionsFor(held1.resolutions, advanceKey), ...resolutionsFor(held2.resolutions, advanceKey)],
    ['held:indeterminate', 'held:indeterminate']
  );
  s.check('the executor saw that key once', executor.dispatches.get(advanceKey), 1);
  const abandoned = (
    await world.broker.abandonCommand(hostBinding(world), {
      taskId: 'crawl',
      operationId: advanceKey,
      reason: 'operator checked the executor by hand'
    })
  ).orThrow();
  s.check('the host abandons it; the receipt claims neither outcome', abandoned.result.state, 'abandoned');
  (await world.broker.observe(tid('crawl'))).orThrow();
  return s.finish();
}

async function step4(state: IMainState): Promise<IJourneyStep> {
  const { world, writerA, deliveryA } = state;
  const s = new StepRecorder('4', 'Acknowledge exactly what a context included, while work moves underneath');

  // An attention revision whose long description cannot be delivered whole, then a short one.
  (
    await writerA.updateTracked({
      taskId: tid('review'),
      operationId: world.ids.op(),
      expectedRevision: await revisionOf(writerA, 'review'),
      patch: { attention: [hostThread, reviewNote], description: `Field notes: ${'n'.repeat(3600)}` }
    })
  ).orThrow();
  const attentionRevision: TaskRevision = await revisionOf(writerA, 'review');
  (
    await writerA.updateTracked({
      taskId: tid('review'),
      operationId: world.ids.op(),
      expectedRevision: attentionRevision,
      patch: { progress: { completed: 1, total: 3 }, clear: ['description'] }
    })
  ).orThrow();
  const attentionId: UpdateId = taskUpdateId(tid('review'), attentionRevision, 'attention');
  s.check('the attention update is owed', (await owed(deliveryA)).includes(attentionId), true);

  const prepared = (await deliveryA.prepare({ maxItems: 20, maxDepth: 3, maxChars: 3000 })).orThrow();
  const included: string[] = prepared.context.receipt.included.flatMap((e) => e.updateIds).sort();
  s.check('the context omitted the attention update', included.includes(attentionId), false);
  const crawlEntries = prepared.context.entries.filter((e) => e.summary.envelope.id === tid('crawl'));
  s.check(
    'the context included crawl, and only while it was open',
    [crawlEntries.length > 0, crawlEntries.some((e) => e.summary.envelope.lifecycle.status === 'succeeded')],
    [true, false]
  );

  // While the context is in flight, the external child reports progress and then completes.
  world.executor
    .change('crawl', (j) => {
      j.progress = { completed: 9, total: 10 };
    })
    .orThrow();
  (await world.broker.observe(tid('crawl'))).orThrow();
  world.executor
    .change('crawl', (j) => {
      j.lifecycle = { status: 'succeeded', outcome: { summary: 'archive crawled', artifacts: [] } };
    })
    .orThrow();
  (await world.broker.observe(tid('crawl'))).orThrow();
  const terminalRevision: TaskRevision = await revisionOf(writerA, 'crawl');

  const ack = (await deliveryA.acknowledge(prepared.context.receipt)).orThrow();
  s.check(
    'the acknowledgement cleared exactly the included ids',
    [...ack.newlyAcknowledged].sort(),
    included
  );
  const after: string[] = await owed(deliveryA);
  s.check(
    'nothing included is still owed',
    after.filter((id) => included.includes(id)),
    []
  );
  s.check('crawl left open work', (await ids(writerA, 'open')).includes('crawl'), false);
  s.check(
    'its newer terminal updates are still owed',
    [
      after.includes(taskUpdateId(tid('crawl'), terminalRevision, 'lifecycle')),
      after.includes(taskUpdateId(tid('crawl'), terminalRevision, 'result'))
    ],
    [true, true]
  );
  s.check('the omitted earlier attention update is still owed', after.includes(attentionId), true);
  return s.finish();
}

// ---------------------------------------------------------------------------
// Step 5: reassignment, while the external child still runs
// ---------------------------------------------------------------------------

/** The names of the files at the repository root, sorted. */
function rootFiles(world: IWorld): string[] {
  return world.root
    .getChildren()
    .orThrow()
    .map((item) => item.name)
    .sort();
}

async function step5(options?: IWorldOptions): Promise<IJourneyStep> {
  const { world, writerA } = await seededWorld(options);
  const s = new StepRecorder('5', 'Reassign the plan A→B while the external child runs');
  await run(world, writerA, 'plan', 'start', {});
  await subscribe(world, 'sub-ada', 'ada-context', 'current');
  const deliveryA = deliveryOf(world, 'agent:ada', 'sub-ada', 'ada-context');
  const crawlBefore = await inspect(writerA, 'crawl');
  const reviewBefore = await inspect(writerA, 'review');
  const filesBefore: string[] = rootFiles(world);
  const stale: TaskRevision = await revisionOf(writerA, 'plan');

  const reassigned = (
    await writerA.reassign({
      taskId: tid('plan'),
      operationId: world.ids.op(),
      expectedRevision: stale,
      responsibility: bob
    })
  ).orThrow();
  s.check('the plan is now B’s', [reassigned.previous, reassigned.current], [ada, bob]);
  const after = await inspect(writerA, 'plan');
  s.check(
    'same id and scopes',
    [after.envelope.id, after.envelope.scopes],
    ['plan', [projectScope, personalScope]]
  );
  s.check('no record was added, renamed or removed', rootFiles(world), filesBefore);
  const stalePatch = await writerA.updateTracked({
    taskId: tid('plan'),
    operationId: world.ids.op(),
    expectedRevision: stale,
    patch: { title: 'A edits from a stale revision' }
  });
  s.check('A’s write at the old revision conflicts', codeOf(stalePatch), 'conflict');

  // The external child keeps running, untouched by its parent's reassignment.
  world.executor
    .change('crawl', (j) => {
      j.progress = { completed: 4, total: 10 };
    })
    .orThrow();
  (await world.broker.observe(tid('crawl'))).orThrow();
  const crawlAfter = await inspect(writerA, 'crawl');
  const reviewAfter = await inspect(writerA, 'review');
  s.check(
    'children keep their responsibility, scopes and parent',
    [
      [crawlAfter.envelope.responsibility, crawlAfter.envelope.scopes, crawlAfter.envelope.parentId],
      [reviewAfter.envelope.responsibility, reviewAfter.envelope.scopes, reviewAfter.envelope.parentId]
    ],
    [
      [ada, crawlBefore.envelope.scopes, 'plan'],
      [ada, reviewBefore.envelope.scopes, 'plan']
    ]
  );
  s.check(
    'crawl still runs, and moved on',
    [crawlAfter.envelope.lifecycle.status, crawlAfter.envelope.progress],
    ['running', { completed: 4, total: 10 }]
  );

  // B starts explicitly: a subscription baselined at the current state.
  await subscribe(world, 'sub-bob', 'bob-context', 'current');
  const deliveryB = deliveryOf(world, 'agent:bob', 'sub-bob', 'bob-context');
  const preparedB = (await deliveryB.prepare()).orThrow();
  s.check(
    'B’s starting context holds the plan as reassigned',
    preparedB.context.entries
      .filter((e) => e.summary.envelope.id === tid('plan'))
      .map((e) => [e.summary.envelope.revision, e.summary.envelope.responsibility]),
    [[after.envelope.revision, bob]]
  );
  const owedA: string[] = await owed(deliveryA);
  (await deliveryB.acknowledge(preparedB.context.receipt)).orThrow();
  s.check('B’s acknowledgement leaves A’s obligations alone', await owed(deliveryA), owedA);
  s.check(
    'A still owes the reassignment',
    owedA.includes(taskUpdateId(tid('plan'), after.envelope.revision, 'assignment')),
    true
  );
  const owedB: string[] = await owed(deliveryB);

  // Reopen: the same files, binding and checkpoints, and the original source reference resolves.
  const reopened = (await reopenWorld(world)).orThrow();
  s.check(
    'after reopen, the original binding resolves to the same task',
    (await reopened.repository.lookupSource(world.executor.binding('crawl'))).orThrow(),
    'crawl'
  );
  s.check(
    'after reopen, both checkpoints are as they were',
    [
      await owed(deliveryOf(reopened, 'agent:ada', 'sub-ada', 'ada-context')),
      await owed(deliveryOf(reopened, 'agent:bob', 'sub-bob', 'bob-context'))
    ],
    [owedA, owedB]
  );
  s.check(
    'after reopen, the source answers for the child',
    (await reopened.broker.observe(tid('crawl'))).orThrow().outcome,
    'unchanged'
  );
  return s.finish();
}

// ---------------------------------------------------------------------------
// Step 6: due candidates, and query work as terminal history grows
// ---------------------------------------------------------------------------

async function step6(options?: IWorldOptions): Promise<IJourneyStep> {
  const { world, writerA } = await seededWorld(options);
  const s = new StepRecorder('6', 'Due candidates around a cutoff; query work as terminal history grows');
  const cutoff: Instant = world.clock.after(60);
  for (const [id, minutes] of [
    ['due-soon', 30],
    ['due-later', 120]
  ] as const) {
    (
      await writerA.createTracked({ taskId: tid(id), operationId: world.ids.op(), title: `Follow up ${id}` })
    ).orThrow();
    await run(world, writerA, id, 'wait', {
      reason: { code: 'scheduled', summary: 'Check back later', notBefore: world.clock.after(minutes) }
    });
  }
  const selection = { scopes: [projectScope, personalScope], lifecycleClass: 'open' as const };
  const due = async (at: Instant): Promise<string[]> =>
    (await world.repository.queryDue({ selection, cutoff: at })).orThrow().items.map((i) => i.envelope.id);
  const revisions: number[] = [await revisionOf(writerA, 'due-soon'), await revisionOf(writerA, 'due-later')];
  s.check('due at the cutoff', await due(cutoff), ['due-soon']);
  s.check('due at a later cutoff', await due(world.clock.after(180)), ['due-soon', 'due-later']);
  s.check(
    'querying changed nothing',
    [
      await statusOf(writerA, 'due-soon'),
      await statusOf(writerA, 'due-later'),
      await revisionOf(writerA, 'due-soon'),
      await revisionOf(writerA, 'due-later')
    ],
    ['waiting', 'waiting', ...revisions]
  );

  // Grow retained terminal history in the same scopes and measure the same queries each time.
  const work: Array<{ open: string[]; due: string[]; taskReads: number }> = [];
  let history: number = 0;
  for (const size of [0, 60, 180]) {
    for (; history < size; history++) {
      const id: string = `done-${String(history).padStart(3, '0')}`;
      (
        await writerA.createTracked({ taskId: tid(id), operationId: world.ids.op(), title: `Finished ${id}` })
      ).orThrow();
      await run(world, writerA, id, 'succeed', { outcome: { summary: 'done', artifacts: [] } });
    }
    const readsBefore: number = world.accessors.taskReads;
    const open: string[] = (await world.repository.query({ selection, limit: 200 }))
      .orThrow()
      .items.map((i) => i.envelope.id);
    const dueNow: string[] = await due(cutoff);
    work.push({ open, due: dueNow, taskReads: world.accessors.taskReads - readsBefore });
  }
  s.check(
    'open results are the same set at 0, 60 and 180 terminal tasks',
    work.map((w) => w.open),
    work.map(() => ['crawl', 'due-later', 'due-soon', 'plan', 'review'])
  );
  s.check(
    'due results likewise',
    work.map((w) => w.due),
    work.map(() => ['due-soon'])
  );
  s.check(
    'task records read by those queries',
    work.map((w) => w.taskReads),
    [0, 0, 0]
  );
  // The control: the counter does see a task-record read, so the zeros above are not a blind spot.
  const controlBefore: number = world.accessors.taskReads;
  (await world.repository.readCommit(tid('plan'))).orThrow();
  s.check('control: reading one record counts one read', world.accessors.taskReads - controlBefore, 1);
  s.check(
    'the history is really there',
    (
      await world.repository.query({ selection: { ...selection, lifecycleClass: 'terminal' }, limit: 200 })
    ).orThrow().items.length,
    180
  );
  return s.finish();
}

// ---------------------------------------------------------------------------
// Step 7: cascade stops
// ---------------------------------------------------------------------------

async function requestStop(world: IWorld, writer: IBoundTaskWriter, mode: StopMode): Promise<IStopResult> {
  return (
    await writer.requestStop({
      taskId: tid('plan'),
      expectedRevision: await revisionOf(writer, 'plan'),
      operationId: world.ids.op(),
      mode
    })
  ).orThrow();
}

function targetStates(result: IStopResult): Record<string, string> {
  const out: Record<string, string> = {};
  for (const target of result.targets) {
    out[target.taskId] = target.state;
  }
  return out;
}

async function pumpStop(writer: IBoundTaskWriter, stop: IStopResult): Promise<TaskResult<IStopResult>> {
  return writer.reconcileStop({ taskId: stop.rootId, intentId: stop.intentId });
}

async function addChild(world: IWorld, writer: IBoundTaskWriter): Promise<string> {
  return codeOf(
    await writer.createTracked({
      taskId: tid(`late-${world.ids.op()}`),
      operationId: world.ids.op(),
      title: 'Late addition',
      parentId: tid('plan')
    })
  );
}

async function step7Pause(options?: IWorldOptions): Promise<IJourneyStep> {
  const { world, writerA } = await seededWorld(options);
  const s = new StepRecorder(
    '7',
    'Cascade pause: partial effects, a durable blocked intent, separate release and resume'
  );
  await run(world, writerA, 'plan', 'start', {});
  await registerJob(world, world.watcher, 'gauge');
  const accepted = await requestStop(world, writerA, 'pause');
  s.check('accepted, nothing dispatched', [accepted.state, world.executor.dispatches.size], ['pending', 0]);
  const first = (await pumpStop(writerA, accepted)).orThrow();
  s.check(
    'one pass: partial effects, the observation-only child blocks',
    [first.state, targetStates(first)],
    ['blocked', { plan: 'confirmed', review: 'confirmed', crawl: 'confirmed', gauge: 'unsupported' }]
  );
  s.check('the controllable child really paused', world.executor.statusOf('crawl'), 'paused');
  s.check('a new child is refused while the stop latches', await addChild(world, writerA), 'conflict');

  // Reopen: the intent is durable, the freeze holds, and reconciliation is authorized afresh.
  const reopened = (await reopenWorld(world)).orThrow();
  const writer = writerFor(reopened, 'agent:ada').orThrow();
  s.check(
    'after reopen the blocked intent is still there',
    (await writer.inspectStop({ taskId: tid('plan'), intentId: accepted.intentId })).orThrow().state,
    'blocked'
  );
  s.check('after reopen a new child is still refused', await addChild(reopened, writer), 'conflict');
  reopened.policy.deny('stop');
  s.check(
    'with stop authority withdrawn, the pass is refused',
    codeOf(await pumpStop(writer, accepted)),
    'not-found-or-denied'
  );
  reopened.policy.allow('stop');
  s.check(
    'reauthorized, the pass runs and is still blocked',
    (await pumpStop(writer, accepted)).orThrow().state,
    'blocked'
  );

  // Explicit host action resolves the blocker: the observed work finishes, and the host observes it.
  reopened.watcher
    .change('gauge', (j) => {
      j.lifecycle = { status: 'succeeded', outcome: { summary: 'telemetry window closed', artifacts: [] } };
    })
    .orThrow();
  (await reopened.broker.observe(tid('gauge'))).orThrow();
  const satisfied = (await pumpStop(writer, accepted)).orThrow();
  s.check(
    'with the blocker resolved the pause is satisfied',
    [satisfied.state, targetStates(satisfied).gauge],
    ['satisfied', 'confirmed']
  );

  // Release ends the latch and resumes nothing; resuming is a separate command per task.
  const released = (
    await writer.releaseStop({
      taskId: tid('plan'),
      expectedRevision: await revisionOf(writer, 'plan'),
      operationId: reopened.ids.op(),
      intentId: accepted.intentId
    })
  ).orThrow();
  s.check('released', released.state, 'released');
  s.check(
    'release resumed nothing',
    [await statusOf(writer, 'plan'), reopened.executor.statusOf('crawl')],
    ['paused', 'paused']
  );
  s.check(
    'resume is its own operation per task',
    [
      await execute(reopened, writer, 'plan', 'resume', {}),
      await execute(reopened, writer, 'crawl', 'resume', {}),
      reopened.executor.statusOf('crawl')
    ],
    ['applied', 'applied', 'running']
  );
  s.check('admission is ordinary again', await addChild(reopened, writer), 'succeeded');
  return s.finish();
}

async function step7Cancel(options?: IWorldOptions): Promise<IJourneyStep> {
  const { world, writerA } = await seededWorld(options);
  const s = new StepRecorder('7-cancel', 'Cascade cancel: terminal, absorbing, and never released');
  await run(world, writerA, 'plan', 'start', {});
  const accepted = await requestStop(world, writerA, 'cancel');
  const done = (await pumpStop(writerA, accepted)).orThrow();
  s.check(
    'satisfied',
    [done.state, targetStates(done)],
    ['satisfied', { plan: 'confirmed', review: 'confirmed', crawl: 'confirmed' }]
  );
  s.check(
    'every target is terminal, the executor included',
    [await statusOf(writerA, 'plan'), await statusOf(writerA, 'review'), world.executor.statusOf('crawl')],
    ['cancelled', 'cancelled', 'cancelled']
  );
  const release = await writerA.releaseStop({
    taskId: tid('plan'),
    expectedRevision: await revisionOf(writerA, 'plan'),
    operationId: world.ids.op(),
    intentId: accepted.intentId
  });
  // Not a stale write (that is `conflict` with `retry: 'safe'`): a refusal only a host could change.
  s.check('a cancel whose root is terminal cannot be released', refusalOf(release), [
    'conflict',
    'after-host-action'
  ]);
  return s.finish();
}

async function step7Uncertain(options?: IWorldOptions): Promise<IJourneyStep> {
  const { world, writerA } = await seededWorld(options);
  const executor: SimulatedExecutor = world.executor;
  const s = new StepRecorder(
    '7-uncertain',
    'Cascade pause with an uncertain dispatch: resolved by its own key'
  );
  await run(world, writerA, 'plan', 'start', {});
  executor.answer = 'indeterminate';
  const accepted = await requestStop(world, writerA, 'pause');
  const first = (await pumpStop(writerA, accepted)).orThrow();
  s.check(
    'the uncertain target blocks',
    [first.state, targetStates(first).crawl],
    ['blocked', 'indeterminate']
  );
  const key: string = newKey(executor, 0);
  executor.answer = 'apply';
  const second = (await pumpStop(writerA, accepted)).orThrow();
  s.check(
    'the next pass resolves it',
    [second.state, targetStates(second).crawl],
    ['satisfied', 'confirmed']
  );
  s.check(
    'under the same key, applied once',
    [keysSeen(executor), executor.appliedTo('crawl')],
    [[key], [`pause:${key}`]]
  );
  return s.finish();
}

// ---------------------------------------------------------------------------
// Step 8: reopen and recover external work
// ---------------------------------------------------------------------------

async function step8(options?: IWorldOptions): Promise<IJourneyStep> {
  const { world, writerA } = await seededWorld(options);
  const executor: SimulatedExecutor = world.executor;
  const s = new StepRecorder(
    '8',
    'Reopen and recover running, completed, unavailable and unrecoverable work'
  );
  for (const job of ['j-done', 'j-away', 'j-lost']) {
    await registerJob(world, executor, job);
  }
  await subscribe(world, 'sub-ada', 'ada-context', 'from-now');

  // Before the host stops, one command's outcome is lost: a non-idempotent advance on crawl.
  executor.loseNextResponse = true;
  s.check(
    'an advance whose response is lost',
    await execute(world, writerA, 'crawl', 'advance', {}),
    'indeterminate'
  );
  const lostKey: string = newKey(executor, 0);

  // The host process stops. While it is down, the executor's work moves on.
  world.repository.close().orThrow();
  executor
    .change('j-done', (j) => {
      j.lifecycle = {
        status: 'succeeded',
        outcome: { summary: 'finished while the host was down', artifacts: [] }
      };
    })
    .orThrow();
  executor
    .change('j-lost', (j) => {
      j.lifecycle = { status: 'failed', reason: { code: 'lost', summary: 'the executor lost its state' } };
    })
    .orThrow();
  executor.unreachable.add('j-away');
  const callsBefore: number = executor.calls;

  const reopened = (await openWorld(world)).orThrow();
  s.check('opening called no source', executor.calls - callsBefore, 0);
  const recover = async (job: string): Promise<string> =>
    (await reopened.broker.recover(tid(job))).orThrow().result;
  const outcomes: Record<string, string> = {};
  for (const job of ['crawl', 'j-done', 'j-away', 'j-lost']) {
    outcomes[job] = await recover(job);
  }
  s.check('recovery outcomes', outcomes, {
    crawl: 'reattached',
    'j-done': 'completed',
    'j-away': 'unavailable',
    'j-lost': 'unrecoverable'
  });
  const view = viewFor(reopened, 'agent:ada', [projectScope, personalScope]).orThrow();
  s.check(
    'lifecycles after recovery',
    [
      await statusOf(view, 'crawl'),
      await statusOf(view, 'j-done'),
      await statusOf(view, 'j-away'),
      await statusOf(view, 'j-lost')
    ],
    ['running', 'succeeded', 'running', 'failed']
  );
  s.check(
    'the unreachable job changed only its observation health',
    (await inspect(view, 'j-away')).envelope.observation.state,
    'unavailable'
  );

  // Temporarily: once the executor is reachable again, the same job reattaches.
  executor.unreachable.delete('j-away');
  s.check(
    'reachable again, it reattaches',
    [await recover('j-away'), (await inspect(view, 'j-away')).envelope.observation.state],
    ['reattached', 'current']
  );

  // A full reconciliation pass over the source: terminal discovery, every binding.
  const pass = (await reopened.broker.reconcile({ sourceId: 'sim' })).orThrow();
  s.check(
    'a full reconciliation pass completes, with nothing left to apply',
    [pass.complete, pass.stopped, pass.issues],
    [true, undefined, []]
  );

  const delivery = deliveryOf(reopened, 'agent:ada', 'sub-ada', 'ada-context');
  const pending: string[] = await owed(delivery);
  s.check(
    'the missed terminal outcomes are owed',
    [
      pending.includes(taskUpdateId(tid('j-done'), await revisionOf(view, 'j-done'), 'result')),
      pending.includes(taskUpdateId(tid('j-lost'), await revisionOf(view, 'j-lost'), 'lifecycle'))
    ],
    [true, true]
  );
  const writer = writerFor(reopened, 'agent:ada').orThrow();
  const pumped = (await writer.resolveCommands({ limit: 50 })).orThrow();
  s.check('the uncertain advance is held, not resent', resolutionsFor(pumped.resolutions, lostKey), [
    'held:indeterminate'
  ]);
  s.check(
    'no duplicate execution: one dispatch, one effect, nothing else sent',
    [keysSeen(executor), executor.dispatches.get(lostKey), executor.appliedTo('crawl')],
    [[lostKey], 1, [`advance:${lostKey}`]]
  );
  return s.finish();
}

// ---------------------------------------------------------------------------
// Step 9: the final prompt
// ---------------------------------------------------------------------------

const promptId: PromptId = 'coordinator' as PromptId;
const promptScope: ScopeKey = 'global' as ScopeKey;
const promptRequest: ITaskPromptRequest = {
  id: promptId,
  chain: [promptScope],
  qualifiers: {},
  substitutions: {}
};

async function promptLibrary(): Promise<PromptLibrary> {
  const record = taskPromptRecord({
    scope: promptScope,
    id: promptId,
    title: 'research coordinator',
    instructions: 'You coordinate a small research team. Decide what should happen next.'
  }).orThrow();
  const store = (await PromptStoreFixture.build({ records: [record] })).orThrow();
  return (await PromptLibrary.create({ store, qualifiers: [] })).orThrow();
}

async function handoff(delivery: IBoundTaskDelivery, library: PromptLibrary): Promise<ITaskPromptHandoff> {
  return (await prepareTaskPrompt({ delivery, library, request: promptRequest })).orThrow();
}

async function step9(options?: IWorldOptions): Promise<IJourneyStep> {
  const { world, writerA } = await seededWorld(options);
  const s = new StepRecorder('9', 'The final prompt: real composition, a captured request, exact receipts');
  await run(world, writerA, 'plan', 'set-progress', { progress: { completed: 2, total: 10 } });
  await subscribe(world, 'sub-ada', 'ada-context', 'current');
  await subscribe(world, 'sub-audit', 'audit-log', 'current');
  const deliveryA = deliveryOf(world, 'agent:ada', 'sub-ada', 'ada-context');
  const deliveryAudit = deliveryOf(world, 'host', 'sub-audit', 'audit-log');
  const library = await promptLibrary();

  const first = await handoff(deliveryA, library);
  const firstSent: ICapturedRequest = (
    await captureAnthropicRequest(first.prompt.system, first.prompt.cacheRequest)
  ).orThrow();
  s.check('the request carries the checked body, split at the task slot', firstSent.system, [
    { text: first.prompt.system.slice(0, first.prompt.taskSlot.start), cached: true },
    { text: first.context.text, cached: false }
  ]);
  s.check(
    'the task context is on the wire exactly once',
    firstSent.body.split(JSON.stringify(first.context.text).slice(1, -1)).length - 1,
    1
  );
  const firstAck = (await first.acknowledge(first.prompt.system)).orThrow();

  // Only progress changes; the stable prefix and its breakpoint do not.
  await run(world, writerA, 'plan', 'set-progress', { progress: { completed: 3, total: 10 } });
  const second = await handoff(deliveryA, library);
  const secondSent: ICapturedRequest = (
    await captureAnthropicRequest(second.prompt.system, second.prompt.cacheRequest)
  ).orThrow();
  s.check('one request per send', [firstSent.requests, secondSent.requests], [1, 1]);
  s.check('the stable prefix is byte-identical', secondSent.system.slice(0, 1), firstSent.system.slice(0, 1));
  s.check(
    'the breakpoints are identical',
    second.prompt.cacheRequest.systemBreakpoints,
    first.prompt.cacheRequest.systemBreakpoints
  );
  s.check(
    'only the task block differs',
    [
      secondSent.system.length,
      JSON.stringify(secondSent.system.slice(1)) !== JSON.stringify(firstSent.system.slice(1))
    ],
    [2, true]
  );

  // A foreign receipt: another subscription's issuance, presented here.
  const foreign = (await deliveryAudit.prepare()).orThrow();
  s.check(
    'a foreign receipt is refused',
    codeOf(await deliveryA.acknowledge(foreign.context.receipt)),
    'invalid-receipt'
  );
  const owedBefore: string[] = await owed(deliveryA);

  // A modified send: the receipt dies with it, and its obligations stay owed.
  s.check(
    'a modified send is refused',
    codeOf(await second.acknowledge(`${second.prompt.system}\nDate: today`)),
    'invalid-receipt'
  );
  s.check(
    'and the exact text no longer acknowledges it',
    codeOf(await second.acknowledge(second.prompt.system)),
    'invalid-receipt'
  );
  s.check('its obligations stay owed', await owed(deliveryA), owedBefore);

  // The normal path, replayed.
  const third = await handoff(deliveryA, library);
  const ack = (await third.acknowledge(third.prompt.system)).orThrow();
  const replay = (await third.acknowledge(third.prompt.system)).orThrow();
  s.check(
    'a valid acknowledgement replays idempotently',
    [ack.newlyAcknowledged, replay.newlyAcknowledged, replay.alreadyAcknowledged],
    [owedBefore, [], owedBefore]
  );
  s.check('the first acknowledgement had discharged the baseline', [...firstAck.newlyAcknowledged].sort(), [
    'crawl:1:initial',
    'plan:2:initial',
    'review:2:initial'
  ]);
  return s.finish();
}

// ---------------------------------------------------------------------------
// The journey
// ---------------------------------------------------------------------------

/**
 * Runs the whole journey. Fails only if the journey could not run; a behaviour that differs from
 * the design is a failed check in the report.
 */
export async function runAgentTasksJourney(options?: IWorldOptions): Promise<Result<IJourneyReport>> {
  return captureAsyncResult(async () => {
    const seeded = await seededWorld(options);
    const steps: IJourneyStep[] = [await step1(seeded)];
    const second = await step2(seeded);
    steps.push(second.step, await step3(second.state), await step4(second.state));
    steps.push(await step5(options), await step6(options));
    steps.push(await step7Pause(options), await step7Cancel(options), await step7Uncertain(options));
    steps.push(await step8(options), await step9(options));
    return journeyReport(steps);
  });
}
