/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

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
  ITaskSource,
  ITaskSubscription,
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
  subscribe
} from './delivery';
import { abandonCommand, cleanup, closeSubscription, disposeObligations } from './disposition';
import { extendReplayEnvelope, registerExternal } from './creation';
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
                    sources
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
   * `binding`'s policy must allow `dispose-obligation` on every task the ids name, and the
   * subscription's selection must lie within its selectors; otherwise the answer is
   * `not-found-or-denied`. Every id must be owed now or already discharged; an id an unacknowledged
   * issued receipt names is refused until that receipt is acknowledged or abandoned. The obligation
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
   * it is owed owed and drainable through its bound delivery, `dispose` ends all of it with the
   * reason. The record and its history are retained, and its id is never reused.
   *
   * @remarks
   * `binding`'s policy must allow `dispose-obligation` over the subscription's scopes, and — for
   * `dispose` — on every task it is owed an update of.
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
   * Binds a subscription's delivery to one principal. The subscription must exist and belong to
   * `consumerId`; otherwise the answer is `not-found-or-denied`, the same for both.
   */
  public bindDelivery(params: IBoundTaskDeliveryParams): TaskResult<IBoundTaskDelivery> {
    const ids = this._core.converters.ids;
    const subscription: TaskResult<ITaskSubscription | undefined> = this._core.repository.subscription(
      params.subscriptionId
    );
    const consumer = ids.consumerId.convert(params.consumerId);
    if (subscription.isFailure()) {
      return propagateTask(subscription);
    }
    if (
      subscription.value === undefined ||
      consumer.isFailure() ||
      subscription.value.consumerId !== consumer.value
    ) {
      return taskFailure(
        `bindDelivery: no subscription ${params.subscriptionId} for this consumer`,
        'not-found-or-denied',
        'after-host-action'
      );
    }
    const found: ITaskSubscription = subscription.value;
    return this._access(params).onSuccess((access) =>
      ok<IBoundTaskDelivery>(new BoundTaskDelivery(this._core, access, found.id))
    );
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

  private _access(params: IBoundTaskViewParams): TaskResult<AccessContext> {
    const broker = this._core.converters.broker;
    const values = this._core.converters.values;
    const checked: Result<AccessContext> = broker.principalKey
      .convert(params.principal)
      .onSuccess((principal) =>
        values.scopes.convert(params.scopes).onSuccess((scopes) =>
          values.scopes.convert(params.creationScopes ?? scopes).onSuccess((creationScopes) => {
            const access: AccessContext = new AccessContext({
              view: this._core.nextView(),
              principal,
              scopes,
              creationScopes,
              authorization: params.authorization,
              projector: params.projector ?? defaultTaskProjector,
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
