/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { AsyncControl } from '@fgv/ts-extras';
import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { TaskConverters } from '../converters';
import { TaskContextRenderer } from '../context';
import {
  IBoundTaskDelivery,
  IBoundTaskDeliveryParams,
  ICommandReceipt,
  ITaskCleanupReport,
  ITaskDispositionResult,
  IBoundTaskView,
  IBoundTaskViewParams,
  IBoundTaskWriter,
  ISourceBinding,
  ISourceObservationReport,
  ISourceReconcileReport,
  ISourceReconcileRequest,
  ISourceReplayEnvelope,
  ITaskEnvironment,
  ITaskRecoveryOutcome,
  ITaskScope,
  ITaskAuthorization,
  ITaskSource,
  ITaskSubscription,
  ITaskWriteGuard,
  TaskId,
  TaskRegistrationResult,
  TaskResult,
  taskContextLimits
} from '../types';
import { ITaskRepository } from '../storage';
import { AccessContext } from './access';
import { BoundTaskView, BoundTaskWriter } from './boundTaskView';
import { BrokerCore } from './core';
import {
  BoundTaskDelivery,
  IResolvedDeliveryDefaults,
  ITaskDeliveryDefaults,
  defaultMaxBaselineTasks,
  defaultReceiptLifetimeMs,
  setSubscriptionDrain,
  subscribe
} from './delivery';
import { abandonCommand, cleanup, closeSubscription, disposeObligations } from './disposition';
import { extendReplayEnvelope, registerExternal, resumeExternal } from './creation';
import { observeBinding, observeTask, reconcileSource, recoverTask } from './reconciliation';
import { ok, propagate as propagateTask, taskFailure } from './failures';
import { defaultTaskProjector } from './projection';

/**
 * Parameters for {@link TaskBroker.create}.
 * @public
 */
export interface ITaskBrokerCreateParams {
  /** The repository the broker mediates. One broker per repository: it owns the write ordering. */
  readonly repository: ITaskRepository;
  readonly environment: ITaskEnvironment;
  /** Converters to validate requests with. Defaults to the default field bounds. */
  readonly converters?: TaskConverters;
  /**
   * The external sources this broker reconciles and dispatches to, each under a distinct id. A task
   * whose source is not attached is left exactly as it is: its commands fail `source-unavailable`
   * recording nothing, and no pass touches it. Creating the broker calls no source.
   */
  readonly sources?: ReadonlyArray<ITaskSource>;
  /**
   * Defaults for new subscriptions and issued receipts. A subscription's policy is persisted when it
   * is created: changing these later changes only subscriptions created after. (T7.)
   */
  readonly delivery?: ITaskDeliveryDefaults;
  /**
   * A host write gate every broker write passes through — bound-writer operations, model tools,
   * source passes, deliveries, retention and `cleanup` alike. It wraps each serialized writer
   * section, inside the broker's writer queue, so a section the gate holds holds every section queued
   * behind it.
   *
   * @remarks
   * **A long hold fills the queue.** At most 64 sections wait for the writer; once that many are
   * queued behind a held one, every further broker write fails at once with `conflict`, retry
   * `safe`, until the hold ends. {@link TaskBroker.whenIdle} counts a held section as busy.
   *
   * A guard must call the section at most once, and before it answers: a call after the broker has
   * observed its answer is refused without running, and one inside the few microtasks before that
   * is awaited and classified as called. A guard that refuses without calling it, with a failure
   * carrying no valid task detail, is `storage-unavailable` (retry `after-host-action`); one that
   * answers success without calling it is `invalid`; one that fails or throws **after** calling it,
   * or whose section rejects, is `storage-unavailable` with retry `reconcile-first`, because the
   * section may have committed; a second call is refused without running.
   * `AsyncControl.WriteGate` from `@fgv/ts-extras` fits as is.
   */
  readonly writeGuard?: ITaskWriteGuard;
  /** The timer {@link TaskBroker.whenIdle} bounds its wait with. Defaults to `setTimeout`. */
  readonly schedule?: AsyncControl.ScheduleTimer;
}

/**
 * The task broker: host-bound views and writers over one repository, plus the trusted host
 * operations that are not a principal's to perform.
 *
 * @remarks
 * Every operation a bound writer performs is authorized on its subject — and on each parent it
 * affects — against the host policy, then re-verified inside one serialized writer section before
 * it commits: a policy epoch that moved, or a record that changed, refuses the commit. A bound view
 * produces only projected data. Parentage, responsibility, scope labels and authority are
 * independent: none of them grants or implies another. The broker performs no I/O of its own
 * beyond the repository, starts no work and installs no timer.
 * @public
 */
export class TaskBroker {
  private readonly _core: BrokerCore;

  private constructor(core: BrokerCore) {
    this._core = core;
  }

  /**
   * Creates a broker over a repository. Updates are owed to the repository's subscriptions: every
   * commit names exactly the audience the repository computes, and the repository verifies it.
   */
  public static create(params: ITaskBrokerCreateParams): Result<TaskBroker> {
    const converters: Result<TaskConverters> =
      params.converters !== undefined ? succeed(params.converters) : TaskConverters.create();
    const sources: Map<string, ITaskSource> = new Map<string, ITaskSource>();
    for (const source of params.sources ?? []) {
      if (sources.has(source.id)) {
        return fail(`TaskBroker.create: two sources share the id '${source.id}'`);
      }
      sources.set(source.id, source);
    }
    return converters.onSuccess((c) =>
      _deliveryDefaults(c, params.delivery).onSuccess((delivery) =>
        TaskContextRenderer.create({ converters: c, projection: (summary) => succeed(summary) }).onSuccess(
          (renderer) =>
            captureResult(
              () =>
                new TaskBroker(
                  new BrokerCore({
                    repository: params.repository,
                    environment: params.environment,
                    converters: c,
                    delivery,
                    renderer,
                    sources,
                    ...(params.writeGuard !== undefined ? { writeGuard: params.writeGuard } : {}),
                    ...(params.schedule !== undefined ? { schedule: params.schedule } : {})
                  })
                )
            )
        )
      )
    );
  }

  /**
   * Creates a subscription — a trusted host operation, recorded under `binding`'s principal, whose
   * `current` baseline holds only what that principal may see. See {@link ISubscribeRequest}.
   *
   * The subscription records the principals that may bind its delivery (`drainPrincipals`, default
   * the registering principal alone) and, optionally, the identity of the consumer's own policy that
   * `disposeWithheld` requires. A retry must repeat both exactly.
   *
   * A retry is compared with the subscription **as it stands**: once its drain principals or identity
   * have been changed through {@link TaskBroker.setSubscriptionDrain}, re-running the original
   * request is `conflict`. A host that re-runs `subscribe` at boot treats drain changes as made through
   * `setSubscriptionDrain` alone, and either retries with the current list or reads the subscription
   * (`repository.subscription`) instead. A subscription recorded before drain principals existed is
   * the same registration as a retry naming its registrant alone.
   *
   * @remarks
   * The baseline is captured and authorized, then one writer section re-proves that no selected task
   * moved or appeared and that the policy epoch is unchanged before it writes the record and activates
   * the subscription — so no commit falls between the baseline and the first update owed. A
   * `current` selection larger than the baseline bound is refused, never truncated.
   */
  public async subscribe(
    binding: IBoundTaskViewParams,
    request: unknown
  ): Promise<TaskResult<ITaskSubscription>> {
    const access: TaskResult<AccessContext> = this._access(binding);
    return access.isFailure() ? propagateTask(access) : subscribe(this._core, access.value, request);
  }

  /**
   * Ends obligations of one subscription without acknowledgement — a trusted host operation, recorded
   * with its reason in the subscription's exact history. See {@link IDisposeObligationsRequest}.
   *
   * @remarks
   * `binding`'s principal must be one of the subscription's drain principals — the consumer the
   * obligations are owed to, so one consumer's binding cannot end another's — its policy must allow
   * `dispose-obligation` on every task the ids name, and the subscription's selection must lie within
   * its selectors; otherwise the answer is `not-found-or-denied`, the answer a missing subscription
   * gets. The drain rule is decided again inside the writing section, on the record written. Every
   * id must be owed now or already discharged; an id an unacknowledged issued receipt names is refused until that receipt is acknowledged or abandoned. The obligation
   * ends for this subscription alone and consumes the evidence slot it already reserved.
   */
  public async dispose(
    binding: IBoundTaskViewParams,
    request: unknown
  ): Promise<TaskResult<ITaskDispositionResult>> {
    const access: TaskResult<AccessContext> = this._access(binding);
    return access.isFailure() ? propagateTask(access) : disposeObligations(this._core, access.value, request);
  }

  /**
   * Closes a subscription — a trusted host operation. It joins no audience again; `retain` keeps what
   * it is owed and drainable through its bound delivery, `dispose` ends all of it with the
   * reason. The record and its history are retained, and its id is never reused.
   *
   * @remarks
   * `binding`'s policy must allow `dispose-obligation` over the subscription's scopes, and — for
   * `dispose` — on every task it is owed an update of. Its principal must be one of the
   * subscription's drain principals; a close that `retain`s may also be made by the registering
   * principal, since it ends nothing owed. Anything else is `not-found-or-denied`, the answer a missing
   * subscription gets, decided again inside the writing section on the record written. A host that
   * registered on an agent's behalf and must dispose names itself among the drain principals
   * ({@link TaskBroker.setSubscriptionDrain}).
   */
  public async closeSubscription(
    binding: IBoundTaskViewParams,
    request: unknown
  ): Promise<TaskResult<ITaskSubscription>> {
    const access: TaskResult<AccessContext> = this._access(binding);
    return access.isFailure() ? propagateTask(access) : closeSubscription(this._core, access.value, request);
  }

  /**
   * Abandons one external command whose outcome is not known — never sent, sent with an uncertain
   * outcome and held, or awaiting a feed revision — a trusted host operation. The receipt becomes
   * `abandoned`, naming what was known; it never claims the command was or was not applied. Its
   * settlement reservation is released and the task can be archived.
   *
   * @remarks
   * `binding`'s policy must allow `dispose-obligation` on the task. A command already abandoned
   * returns its receipt; any other settled command is `conflict`.
   */
  public async abandonCommand(
    binding: IBoundTaskViewParams,
    request: unknown
  ): Promise<TaskResult<ICommandReceipt>> {
    const access: TaskResult<AccessContext> = this._access(binding);
    return access.isFailure() ? propagateTask(access) : abandonCommand(this._core, access.value, request);
  }

  /**
   * One cleanup pass — a trusted host operation: prunes the update payloads every audience member has
   * acknowledged or disposed, by each one's durable checkpoint, on up to `limit` candidate tasks.
   * Ends no obligation and needs no authority beyond the evidence already committed.
   */
  public async cleanup(request: unknown): Promise<TaskResult<ITaskCleanupReport>> {
    return cleanup(this._core, request);
  }

  /**
   * Binds a subscription's delivery to one principal. The subscription must exist, belong to
   * `consumerId`, and name `principal` among its drain principals; otherwise the answer is
   * `not-found-or-denied`, the same for all three, so a refusal says nothing about which failed.
   *
   * @remarks
   * A binding **drains** its subscription: what it acknowledges is no longer owed to `consumerId`,
   * whoever reads it next. So only the principals the subscription names may bind it — by default its
   * registering principal alone; a host that subscribes on an agent's behalf names the agent
   * (`ISubscribeRequest.drainPrincipals`), and may change the list later with
   * {@link TaskBroker.setSubscriptionDrain}. A subscription recorded before drain principals existed
   * is drained by its registering principal alone.
   *
   * The rule is applied again by every operation of the bound delivery, against the subscription as
   * it stands, so a principal removed after binding is refused from then on with the same answer.
   * Disclosure and acknowledgement are still decided under the binding's own authority: a drain
   * principal is shown only what its policy lets it see.
   */
  public bindDelivery(params: IBoundTaskDeliveryParams): TaskResult<IBoundTaskDelivery> {
    const ids = this._core.converters.ids;
    const denied = (): TaskResult<IBoundTaskDelivery> =>
      taskFailure(
        `bindDelivery: no subscription ${params.subscriptionId} for this consumer`,
        'not-found-or-denied',
        'after-host-action'
      );
    // The binding itself is decided before the subscription is read, so a malformed binding gets the
    // same answer whether or not the subscription exists; existence, consumer and drain membership
    // are then decided together, with one answer.
    return this._access(params).onSuccess((access) =>
      this._core.repository
        .subscription(params.subscriptionId)
        .onSuccess((found) =>
          found !== undefined &&
          ids.consumerId.convert(params.consumerId).orDefault() === found.consumerId &&
          found.drainPrincipals.includes(access.principal)
            ? ok<IBoundTaskDelivery>(new BoundTaskDelivery(this._core, access, found.id))
            : denied()
        )
    );
  }

  /**
   * Replaces a subscription's drain principals and its recorded policy identity — a trusted host
   * operation. See {@link ISubscriptionDrainRequest}.
   *
   * @remarks
   * Made through the **registering** principal's binding: its selectors must cover the
   * subscription's selection and its policy must grant `subscribe` for the selection's scopes — what
   * registering the subscription required. Anything else is `not-found-or-denied`. Active and closed
   * subscriptions alike; a request that changes nothing writes nothing.
   *
   * Takes effect for bindings already made, too: every bound-delivery operation re-applies the drain
   * rule to the subscription as it stands. A change makes a retry of the original `subscribe`
   * `conflict`: the retry is compared with the subscription as it now stands (see
   * {@link TaskBroker.subscribe}). A receipt a removed principal prepared stays issued until
   * it is acknowledged by a principal still named, abandoned, or expires.
   */
  public async setSubscriptionDrain(
    binding: IBoundTaskViewParams,
    request: unknown
  ): Promise<TaskResult<ITaskSubscription>> {
    const access: TaskResult<AccessContext> = this._access(binding);
    return access.isFailure()
      ? propagateTask(access)
      : setSubscriptionDrain(this._core, access.value, request);
  }

  /** Binds a read-only view to one principal. The returned object has no mutation method. */
  public bindView(params: IBoundTaskViewParams): TaskResult<IBoundTaskView> {
    return this._access(params).onSuccess((access) =>
      ok<IBoundTaskView>(new BoundTaskView(this._core, access))
    );
  }

  /** Binds a writer to one principal. */
  public bind(params: IBoundTaskViewParams): TaskResult<IBoundTaskWriter> {
    return this._access(params).onSuccess((access) =>
      ok<IBoundTaskWriter>(new BoundTaskWriter(this._core, access))
    );
  }

  /**
   * Registers an externally executed task — a trusted host operation with host-supplied scopes,
   * binding and recovery declaration, recorded under `principal`. See {@link IRegisterExternalTask}.
   */
  public registerExternal(principal: string, request: unknown): Promise<TaskResult<TaskRegistrationResult>> {
    return registerExternal(this._core, principal, request);
  }

  /**
   * Resumes an external registration left pending — accepted into the inventory and not yet marked
   * live; its first record may or may not have landed — from the canonical request the repository
   * stored with it, under the principal it was accepted for. A trusted host operation, as
   * {@link TaskBroker.registerExternal} is.
   *
   * @remarks
   * Every check registration makes is made again now: the request is converted, its parent re-read
   * and re-checked inside the writer, and the source's committed history compared. A native pending
   * registration resumes through a bound writer (`IBoundTaskWriter.resumePendingRegistration`), which
   * authorizes it, and is `invalid` here. A live task that an external registration created — a
   * resume whose response was lost — replays that registration (without its parent checks, which
   * decided the original); any other id is `not-found-or-denied`.
   */
  public resumePendingRegistration(taskId: TaskId): Promise<TaskResult<TaskRegistrationResult>> {
    return resumeExternal(this._core, taskId);
  }

  /**
   * Resolves once no broker write is waiting for the writer or holding it, or fails — `conflict`,
   * retry `safe` — when that has not happened within `timeoutMs`.
   *
   * @remarks
   * **It describes a moment, not a hold — and a moment between sections, not between operations.**
   * It observes the broker's writer queue and never takes a turn in it, so it never takes the writer
   * and never delays a write; a write enqueued the instant after it resolves runs as usual. One
   * broker operation can be several gated sections with work between them — `acknowledge` and
   * `prepare` match then commit, a creation authorizes before it queues, source passes and `cleanup`
   * take one section per step — so it can resolve in the middle of an operation. **To quiesce before
   * a shutdown or snapshot, pause the `writeGuard` first, then wait for idle**: it resolves once the
   * sections already past the guard have finished. A write held *at* the guard during the pause is a
   * queued section and keeps the broker busy until the pause lifts. A host that needs the quiet to last holds its writes first — with
   * the `writeGuard` it gave {@link TaskBroker.create} — and a section that guard is holding counts as
   * busy. It sees only the broker's own queue: a caller using the repository's `withWriter` directly is
   * invisible to it. The wait is bounded by the `schedule` given to {@link TaskBroker.create}. A
   * `timeoutMs` that is not a non-negative safe integer is `invalid`.
   */
  public whenIdle(timeoutMs: number): Promise<TaskResult<true>> {
    return this._core.whenIdle(timeoutMs);
  }

  /**
   * Reads one task's binding from its source and applies it — a trusted host operation. For a
   * `source-replay` source nothing is read: the outcome is `deferred`, and only
   * {@link TaskBroker.reconcile} moves the task.
   */
  public observe(taskId: TaskId): Promise<TaskResult<ISourceObservationReport>> {
    return observeTask(this._core, taskId);
  }

  /**
   * A push hint from a source: never itself a delivery record. Triggers a fresh read of the binding
   * (never an overwrite from the push), exactly as {@link TaskBroker.observe}.
   */
  public hint(binding: ISourceBinding): Promise<TaskResult<ISourceObservationReport>> {
    return observeBinding(this._core, binding);
  }

  /**
   * One reconciliation pass over a source, from its committed cursor — a trusted host operation.
   * The cursor advances only past pages whose every observation committed.
   */
  public reconcile(request: ISourceReconcileRequest): Promise<TaskResult<ISourceReconcileReport>> {
    const converted = this._core.converters.broker.reconcile.convert(request);
    return converted.isSuccess()
      ? reconcileSource(this._core, converted.value)
      : Promise.resolve(taskFailure(`reconcile: ${converted.message}`, 'invalid', 'after-host-action'));
  }

  /**
   * Explicit recovery of one task after a restart — a trusted host operation. Repository open and
   * broker creation never do this.
   */
  public recover(taskId: TaskId): Promise<TaskResult<ITaskRecoveryOutcome>> {
    return recoverTask(this._core, taskId);
  }

  /**
   * Extends a `source-replay` task's finite envelope — new admission, charged now, before the source
   * relies on it. Completion of work already admitted never depends on this.
   */
  public extendReplayEnvelope(
    taskId: TaskId,
    add: ISourceReplayEnvelope
  ): Promise<TaskResult<ISourceReplayEnvelope>> {
    return extendReplayEnvelope(this._core, taskId, add);
  }

  /**
   * A policy's identity, read once and converted. A policy whose identity cannot be read or is not
   * one line fails the binding rather than binding without it.
   */
  private _policyIdentity(authorization: ITaskAuthorization): Result<string | undefined> {
    return captureResult(() => authorization.policyIdentity).onSuccess((identity) =>
      identity === undefined
        ? succeed(undefined)
        : this._core.converters.delivery.policyIdentity.convert(identity)
    );
  }

  private _access(params: IBoundTaskViewParams): TaskResult<AccessContext> {
    const broker = this._core.converters.broker;
    const values = this._core.converters.values;
    const checked: Result<AccessContext> = broker.principalKey
      .convert(params.principal)
      .onSuccess((principal) =>
        values.scopes.convert(params.scopes).onSuccess((scopes) =>
          values.scopes.convert(params.creationScopes ?? scopes).onSuccess((creationScopes) =>
            this._policyIdentity(params.authorization).onSuccess((policyIdentity) => {
              const access: AccessContext = new AccessContext({
                view: this._core.nextView(),
                principal,
                scopes,
                creationScopes,
                authorization: params.authorization,
                projector: params.projector ?? defaultTaskProjector,
                ...(policyIdentity !== undefined ? { policyIdentity } : {}),
                logger: this._core.environment.logger
              });
              const outside: ITaskScope | undefined = creationScopes.find((scope) => !access.selects(scope));
              return outside === undefined
                ? succeed(access)
                : fail<AccessContext>(
                    `creation scope ${outside.namespace}/${outside.key} is outside the view's selectors`
                  );
            })
          )
        )
      );
    return checked.isSuccess()
      ? ok(checked.value)
      : taskFailure(`bind: ${checked.message}`, 'invalid', 'after-host-action');
  }
}

/** Resolves and validates delivery defaults. */
function _deliveryDefaults(
  converters: TaskConverters,
  defaults: ITaskDeliveryDefaults | undefined
): Result<IResolvedDeliveryDefaults> {
  const lifetime: number = defaults?.receiptLifetimeMs ?? defaultReceiptLifetimeMs;
  const baseline: number = defaults?.maxBaselineTasks ?? defaultMaxBaselineTasks;
  if (!Number.isSafeInteger(lifetime) || lifetime < 1) {
    return fail(`TaskBroker.create: receiptLifetimeMs must be a positive safe integer`);
  }
  if (!Number.isSafeInteger(baseline) || baseline < 1 || baseline > taskContextLimits.maxInputEntries) {
    return fail(
      `TaskBroker.create: maxBaselineTasks must be a positive safe integer no greater than ${taskContextLimits.maxInputEntries}`
    );
  }
  return converters.delivery.policyOverrides
    .convert(defaults?.policy ?? {})
    .withErrorFormat((msg) => `TaskBroker.create: delivery policy: ${msg}`)
    .onSuccess((policy) => succeed({ policy, receiptLifetimeMs: lifetime, maxBaselineTasks: baseline }));
}
