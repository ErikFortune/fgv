/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { TaskBroker } from '../broker';
import {
  DeliveryId,
  IBoundTaskDelivery,
  IBoundTaskDeliveryParams,
  IPreparedTaskContext,
  ITaskContext,
  ITaskContextBudget,
  ITaskEnvelope,
  ITaskInclusionReceipt,
  ITaskUpdate,
  Instant,
  PageCursor,
  TaskId,
  TaskRevision,
  UpdateCategory,
  UpdateId,
  defaultTaskContextBudget,
  isTerminalTaskStatus,
  maxTaskPageLimit
} from '../types';
import { ITaskHostWriteGuard, guarded } from './hostWriteGuard';

/**
 * How many renders in a row {@link TaskDeliveryPump.next} clears as stale before it gives up, when
 * the host names none.
 * @public
 */
export const defaultMaxStaleRenders: number = 20;

/**
 * Parameters for {@link TaskDeliveryPump.create}.
 * @public
 */
export interface ITaskDeliveryPumpParams {
  /** The broker the subscription lives in. Its disposals go through it. */
  readonly broker: TaskBroker;
  /**
   * The binding the pump delivers under — one principal, its authorization, and the subscription
   * and consumer it drains. The same binding authorizes every disposal, so the pump can end only
   * obligations that principal may end.
   */
  readonly delivery: IBoundTaskDeliveryParams;
  /** The gate every pump write passes through; see {@link ITaskHostWriteGuard}. */
  readonly guard?: ITaskHostWriteGuard;
  /**
   * The depth and text bound of each render. Its item bound is always 1: one task revision is the
   * unit the pump decides. Defaults to `defaultTaskContextBudget`'s depth and text bounds.
   */
  readonly budget?: Partial<Omit<ITaskContextBudget, 'maxItems'>>;
  /** How many stale renders in a row a pass clears before it fails. Defaults to {@link defaultMaxStaleRenders}. */
  readonly maxStaleRenders?: number;
}

/**
 * One owed task revision, as the pump presents it.
 * @public
 */
export interface ITaskDeliveryEntry {
  readonly taskId: TaskId;
  readonly revision: TaskRevision;
  /** The task as of this revision, projected for the pump's principal. */
  readonly envelope: ITaskEnvelope;
  /** Whether this revision is a terminal state — the task's outcome. */
  readonly terminal: boolean;
  /** The categories of the updates this revision owes, ascending. */
  readonly categories: ReadonlyArray<UpdateCategory>;
  /** The updates this revision owes, which acknowledging or disposing of it discharges. */
  readonly updateIds: ReadonlyArray<UpdateId>;
}

/**
 * One prepared delivery: an issued receipt over exactly one owed task revision.
 * @public
 */
export interface IPreparedTaskDelivery {
  readonly deliveryId: DeliveryId;
  readonly expiresAt: Instant;
  readonly entry: ITaskDeliveryEntry;
  /** The receipt `prepare` issued. Acknowledge it only after the host's own work has committed. */
  readonly receipt: ITaskInclusionReceipt;
  /** The rendered context, for a host that presents it as it is. */
  readonly context: ITaskContext;
}

/**
 * How a prepared delivery was discharged.
 * @public
 */
export interface ITaskDeliveryDischarge {
  readonly prepared: IPreparedTaskDelivery;
  readonly outcome: 'acknowledged' | 'disposed';
  /** The ids this call added to the subscription's history. */
  readonly discharged: ReadonlyArray<UpdateId>;
  /** The ids that were already in the history — a replay, or a decision made elsewhere first. */
  readonly alreadyDischarged: ReadonlyArray<UpdateId>;
  /** The older owed revisions of the same task disposed after a terminal discharge. */
  readonly superseded: ReadonlyArray<UpdateId>;
  /**
   * The follow-up steps that did not complete **after** the decision committed: the receipt not
   * released (it stays issued until it expires, pinning only what is already discharged), or the
   * superseded revisions not disposed (they stay owed and are cleared by a later pass). The
   * decision itself stands either way.
   */
  readonly issues: ReadonlyArray<string>;
}

/** Records a follow-up step's failure as an issue; the step's outcome is otherwise not needed. */
function _noted<T>(result: Result<T>, issues: string[]): Result<T> {
  if (result.isFailure()) {
    issues.push(result.message);
  }
  return result;
}

/** One render's outcome: a delivery, nothing owed, or a stale render and what clearing it ended. */
type _Render =
  | { readonly state: 'prepared'; readonly prepared: IPreparedTaskDelivery }
  | { readonly state: 'none' }
  | { readonly state: 'stale'; readonly taskId: TaskId; readonly cleared: number };

/**
 * A host-driven pump over one subscription's delivery: one owed task revision at a time, prepared,
 * then acknowledged, abandoned or disposed of by the host.
 *
 * @remarks
 * **No timers and no resident loop.** Every method is one bounded operation the host calls.
 *
 * **It never acknowledges on its own.** {@link TaskDeliveryPump.next} issues a receipt; only the
 * host's {@link TaskDeliveryPump.acknowledge}, after its own work has committed, discharges it. An
 * obligation ends only by acknowledgement or by a recorded disposal — never by expiry, never by
 * being skipped.
 *
 * **At-least-once, not exactly-once.** A prepared revision that is neither acknowledged nor
 * disposed of stays owed and is presented again — after an abandonment, a crash, or a host that
 * simply never decided. Exactly-once is not this helper's property: it is at-least-once here plus a
 * host whose work for a revision is findable by `(taskId, revision)`, so that a revision presented
 * again after its work committed (and before its acknowledgement did) is recognized and
 * acknowledged rather than done twice.
 *
 * **A receipt a crash leaves behind.** A process stopped between `next` and its decision leaves
 * that receipt issued, and nothing after a restart holds it. The revision is presented again and
 * can be acknowledged as usual, but **disposing of it is refused until the stale receipt expires**
 * (the broker's `receiptLifetimeMs`), because the broker never disposes of what an issued receipt
 * names. Until then {@link TaskDeliveryPump.dispose} fails and the revision is presented again;
 * nothing is lost. A host that knows it is the subscription's only consumer can end the wait
 * itself: list `IBoundTaskDelivery.issued()` at start-up and abandon what was issued before it.
 *
 * **Writes.** Every write — issuing, releasing and acknowledging receipts, disposals — goes through
 * the optional {@link ITaskHostWriteGuard}, one guarded unit per method call; the broker's own
 * `writeGuard`, if any, still wraps each section inside. See {@link ITaskHostWriteGuard} for how
 * the two compose.
 * @public
 */
export class TaskDeliveryPump {
  private readonly _broker: TaskBroker;
  private readonly _delivery: IBoundTaskDelivery;
  private readonly _binding: IBoundTaskDeliveryParams;
  private readonly _guard: ITaskHostWriteGuard | undefined;
  private readonly _budget: ITaskContextBudget;
  private readonly _maxStaleRenders: number;

  private constructor(params: {
    readonly broker: TaskBroker;
    readonly delivery: IBoundTaskDelivery;
    readonly binding: IBoundTaskDeliveryParams;
    readonly guard: ITaskHostWriteGuard | undefined;
    readonly budget: ITaskContextBudget;
    readonly maxStaleRenders: number;
  }) {
    this._broker = params.broker;
    this._delivery = params.delivery;
    this._binding = params.binding;
    this._guard = params.guard;
    this._budget = params.budget;
    this._maxStaleRenders = params.maxStaleRenders;
  }

  /**
   * Creates a pump over one subscription's delivery. Fails when the broker refuses the binding, or
   * `maxStaleRenders` is not a positive safe integer.
   */
  public static create(params: ITaskDeliveryPumpParams): Result<TaskDeliveryPump> {
    const maxStaleRenders: number = params.maxStaleRenders ?? defaultMaxStaleRenders;
    if (!Number.isSafeInteger(maxStaleRenders) || maxStaleRenders < 1) {
      return fail(`TaskDeliveryPump.create: maxStaleRenders must be a positive safe integer`);
    }
    const budget: ITaskContextBudget = {
      maxItems: 1,
      maxDepth: params.budget?.maxDepth ?? defaultTaskContextBudget.maxDepth,
      maxChars: params.budget?.maxChars ?? defaultTaskContextBudget.maxChars
    };
    return params.broker.bindDelivery(params.delivery).asResult.onSuccess((delivery) =>
      succeed(
        new TaskDeliveryPump({
          broker: params.broker,
          delivery,
          binding: params.delivery,
          guard: params.guard,
          budget,
          maxStaleRenders
        })
      )
    );
  }

  /** The bound delivery the pump drains — for `pending` and `issued` reads. */
  public get delivery(): IBoundTaskDelivery {
    return this._delivery;
  }

  /**
   * Prepares the next owed task revision — or answers `undefined` when nothing this principal may
   * see is owed.
   *
   * @remarks
   * One render, of one item, ordered by the package's priority (outstanding attention, then
   * terminal outcomes, then other changes). A render can present a task's **current** state without
   * any owed update — the subscription is owed older revisions of it, which the current state
   * supersedes. That render is released, and every owed update of the task older than the rendered
   * revision is disposed of as superseded; then the pass renders again. Each round must clear
   * something: a render that clears nothing — say a revision too large for the text bound, which
   * renders abbreviated and so delivers nothing — fails loudly rather than being presented forever,
   * and so does a pass that clears more than `maxStaleRenders` renders in a row.
   */
  public next(): Promise<Result<IPreparedTaskDelivery | undefined>> {
    return guarded(this._guard, () => this._next());
  }

  /**
   * Discharges a prepared delivery — only once the host's own work for it has committed — then
   * releases its receipt and, for a terminal revision, disposes of the task's older owed revisions.
   *
   * @remarks
   * Fails, with nothing discharged, when the acknowledgement does not commit: the revision stays
   * owed and is presented again. Once it commits the call succeeds, and anything after it that did
   * not complete is listed in {@link ITaskDeliveryDischarge.issues}.
   */
  public acknowledge(prepared: IPreparedTaskDelivery): Promise<Result<ITaskDeliveryDischarge>> {
    return guarded(this._guard, async () => {
      const acknowledged = await this._delivery.acknowledge(prepared.receipt);
      if (acknowledged.isFailure()) {
        return fail(`delivery pump: acknowledging ${this._label(prepared)}: ${acknowledged.message}`);
      }
      const issues: string[] = [];
      _noted(await this._release(prepared.deliveryId), issues);
      return succeed(
        await this._afterDischarge(
          prepared,
          'acknowledged',
          acknowledged.value.newlyAcknowledged,
          [...acknowledged.value.alreadyAcknowledged],
          issues
        )
      );
    });
  }

  /** Releases a prepared delivery unprocessed. What it named stays owed and is presented again. */
  public abandon(prepared: IPreparedTaskDelivery): Promise<Result<DeliveryId>> {
    return guarded(this._guard, async () =>
      (await this._release(prepared.deliveryId)).withErrorFormat(
        (message) => `delivery pump: abandoning ${this._label(prepared)}: ${message}`
      )
    );
  }

  /**
   * Ends a prepared delivery's obligations without acknowledging them, recording `reason` in the
   * subscription's history — the receipt released first, since the broker refuses to dispose of
   * what an issued receipt names; then, for a terminal revision, the task's older owed revisions
   * disposed of too.
   *
   * @remarks
   * Fails, with nothing disposed, when the release or the disposal does not commit; the revision
   * stays owed and is presented again. A receipt a crash left issued over the same revision makes
   * the disposal fail until it expires — see the class remarks.
   */
  public dispose(prepared: IPreparedTaskDelivery, reason: string): Promise<Result<ITaskDeliveryDischarge>> {
    return guarded(this._guard, async () => {
      const disposed = await (
        await this._release(prepared.deliveryId)
      ).thenOnSuccess(async () => this._dispose(prepared.entry.updateIds, reason));
      if (disposed.isFailure()) {
        return fail(`delivery pump: disposing of ${this._label(prepared)}: ${disposed.message}`);
      }
      return succeed(
        await this._afterDischarge(
          prepared,
          'disposed',
          disposed.value.newlyDisposed,
          disposed.value.alreadyDischarged,
          []
        )
      );
    });
  }

  /** {@link TaskDeliveryPump.next}, inside the guard. */
  private async _next(): Promise<Result<IPreparedTaskDelivery | undefined>> {
    for (let round = 0; round < this._maxStaleRenders; round++) {
      const rendered = await this._renderOnce();
      if (rendered.isFailure()) {
        return fail(rendered.message);
      }
      const found: _Render = rendered.value;
      if (found.state === 'prepared') {
        return succeed(found.prepared);
      }
      if (found.state === 'none') {
        return succeed(undefined);
      }
      if (found.cleared === 0) {
        return fail(
          `delivery pump: task ${found.taskId} renders without what it is owed, and nothing older was ` +
            `cleared; it cannot be delivered within this budget`
        );
      }
    }
    return fail(`delivery pump: more than ${this._maxStaleRenders} stale renders in a row`);
  }

  /** One render: a delivery, nothing owed, or a stale render cleared. */
  private async _renderOnce(): Promise<Result<_Render>> {
    return (await this._owed()).thenOnSuccess(async (owed) =>
      owed.length === 0
        ? succeed<_Render>({ state: 'none' })
        : (await this._delivery.prepare(this._budget)).asResult
            .withErrorFormat((message) => `delivery pump: preparing: ${message}`)
            .thenOnSuccess(async (prepared) => this._fromRender(prepared))
    );
  }

  /** What one prepared render comes to. */
  private async _fromRender(prepared: IPreparedTaskContext): Promise<Result<_Render>> {
    const { context, deliveryId } = prepared;
    const rendered = context.entries[0];
    if (rendered === undefined) {
      // Something visible is owed, so a one-item render holds an entry; one that does not is
      // released, never presented.
      return (await this._release(deliveryId)).onSuccess(() =>
        fail<_Render>(`delivery pump: an update is owed and the render included nothing`)
      );
    }
    const envelope: ITaskEnvelope = rendered.summary.envelope;
    if (rendered.updateIds.length === 0) {
      return (await this._release(deliveryId))
        .thenOnSuccess(async () => this._disposeSuperseded(envelope.id, envelope.revision))
        .onSuccess((cleared) =>
          succeed<_Render>({ state: 'stale', taskId: envelope.id, cleared: cleared.length })
        );
    }
    return (await this._owed()).onSuccess((owed) => {
      const included: ReadonlySet<UpdateId> = new Set(rendered.updateIds);
      const categories: ReadonlySet<UpdateCategory> = new Set(
        owed.filter((update) => included.has(update.id)).map((update) => update.category)
      );
      return succeed<_Render>({
        state: 'prepared',
        prepared: {
          deliveryId,
          expiresAt: prepared.expiresAt,
          receipt: context.receipt,
          context,
          entry: {
            taskId: envelope.id,
            revision: envelope.revision,
            envelope,
            terminal: isTerminalTaskStatus(envelope.lifecycle.status),
            categories: [...categories].sort(),
            updateIds: rendered.updateIds
          }
        }
      });
    });
  }

  /**
   * The discharge record — and, after a terminal revision is discharged, the disposal of the task's
   * older owed revisions, which say nothing the outcome does not. Only older ones: a revision that
   * arrives later is never touched.
   */
  private async _afterDischarge(
    prepared: IPreparedTaskDelivery,
    outcome: ITaskDeliveryDischarge['outcome'],
    discharged: ReadonlyArray<UpdateId>,
    alreadyDischarged: ReadonlyArray<UpdateId>,
    issues: string[]
  ): Promise<ITaskDeliveryDischarge> {
    let superseded: ReadonlyArray<UpdateId> = [];
    if (prepared.entry.terminal) {
      _noted(await this._disposeSuperseded(prepared.entry.taskId, prepared.entry.revision), issues).onSuccess(
        (cleared) => {
          superseded = cleared;
          return succeed(cleared);
        }
      );
    }
    return { prepared, outcome, discharged, alreadyDischarged, superseded, issues };
  }

  /** Disposes of every owed update of `taskId` older than `revision`; answers those newly ended. */
  private async _disposeSuperseded(
    taskId: TaskId,
    revision: TaskRevision
  ): Promise<Result<ReadonlyArray<UpdateId>>> {
    return (await this._owed())
      .thenOnSuccess(async (owed) => {
        const stale: ReadonlyArray<UpdateId> = owed
          .filter((update) => update.taskId === taskId && update.revision < revision)
          .map((update) => update.id);
        return stale.length === 0
          ? succeed<ReadonlyArray<UpdateId>>([])
          : (await this._dispose(stale, `superseded by revision ${revision} of the same task`)).onSuccess(
              (disposed) => succeed(disposed.newlyDisposed)
            );
      })
      .then((result) =>
        result.withErrorFormat(
          (message) => `delivery pump: clearing superseded revisions of ${taskId}: ${message}`
        )
      );
  }

  /** Ends `updateIds` with `reason`, through the pump's own binding. */
  private async _dispose(
    updateIds: ReadonlyArray<UpdateId>,
    reason: string
  ): Promise<
    Result<{
      readonly newlyDisposed: ReadonlyArray<UpdateId>;
      readonly alreadyDischarged: ReadonlyArray<UpdateId>;
    }>
  > {
    return (
      await this._broker.dispose(this._binding, {
        subscriptionId: this._delivery.subscriptionId,
        updateIds: [...new Set(updateIds)].sort(),
        reason
      })
    ).asResult;
  }

  /** Releases an issued receipt. */
  private async _release(deliveryId: DeliveryId): Promise<Result<DeliveryId>> {
    return (await this._delivery.abandon(deliveryId)).asResult.withErrorFormat(
      (message) => `delivery pump: releasing receipt ${deliveryId}: ${message}`
    );
  }

  /** Every owed update this principal may see, across pages. */
  private async _owed(): Promise<Result<ReadonlyArray<ITaskUpdate>>> {
    const owed: ITaskUpdate[] = [];
    let cursor: PageCursor | undefined = undefined;
    do {
      const page = await this._delivery.pending({
        limit: maxTaskPageLimit,
        ...(cursor !== undefined ? { cursor } : {})
      });
      if (page.isFailure()) {
        return fail(`delivery pump: reading what is owed: ${page.message}`);
      }
      owed.push(...page.value.updates);
      cursor = page.value.nextCursor;
    } while (cursor !== undefined);
    return succeed(owed);
  }

  private _label(prepared: IPreparedTaskDelivery): string {
    return `${prepared.entry.taskId}@${prepared.entry.revision}`;
  }
}
