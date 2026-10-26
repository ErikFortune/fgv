/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { MessageAggregator, Result, fail, succeed } from '@fgv/ts-utils';
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
 *
 * @remarks
 * Decide it by handing **this object** back to the pump that prepared it. The pump decides from what
 * it recorded when it prepared it, never from the object's fields, so a copy or an edited entry is
 * refused rather than trusted.
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
 * How a prepared delivery was decided.
 * @public
 */
export type TaskDeliveryOutcome = 'acknowledged' | 'disposed';

/**
 * How a prepared delivery was discharged.
 * @public
 */
export interface ITaskDeliveryDischarge {
  readonly prepared: IPreparedTaskDelivery;
  readonly outcome: TaskDeliveryOutcome;
  /** The ids this call added to the subscription's history. */
  readonly discharged: ReadonlyArray<UpdateId>;
  /** The ids that were already in the history — a replay, or a decision made elsewhere first. */
  readonly alreadyDischarged: ReadonlyArray<UpdateId>;
  /** The older owed revisions of the same task disposed after a terminal discharge. */
  readonly superseded: ReadonlyArray<UpdateId>;
  /**
   * The follow-up steps that did not complete **after** the decision committed: the receipt not
   * released (it stays issued until it expires, occupying a receipt slot and pinning what it names),
   * or the superseded revisions not disposed (they stay owed and are presented on their own). The
   * decision itself stands either way.
   */
  readonly issues: ReadonlyArray<string>;
}

/**
 * A host-driven pump over one subscription's delivery: one owed task revision at a time, prepared,
 * then acknowledged, abandoned or disposed of by the host.
 *
 * @remarks
 * **No timers and no resident loop.** Every method is one bounded operation the host calls.
 *
 * **Only what is owed is rendered.** The pump prepares in `'owed-only'` mode
 * (`ITaskPrepareOptions`): each owed revision renders from its own snapshot and no current task
 * state is a candidate, so a task the subscription is owed nothing for — one whose attention or
 * outcome was already acknowledged, a waiting task with attention references — can never take the
 * one render slot. Owed revisions are presented by the renderer's priority: attention, then terminal
 * outcomes, then other changes.
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
 * **Receipts a crash leaves behind — release them at start-up.** A process stopped between `next`
 * and its decision leaves that receipt issued, and nothing after a restart holds it. Until it expires
 * (the broker's `receiptLifetimeMs`, 24 hours by default) it:
 *
 * - **pins every revision it names**: each is presented again and can be acknowledged, but
 *   {@link TaskDeliveryPump.dispose} of it fails;
 * - **blocks the superseded disposal** after a later terminal discharge of the same task (reported in
 *   `issues`), so those older revisions are presented one by one instead;
 * - **blocks the task's archive and `cleanup`'s pruning** of what it names, even once every revision
 *   is acknowledged — and **expiry alone does not end that**: an expired receipt stops pinning only
 *   when the next receipt issue or disposal on the subscription evicts it, or when it is abandoned;
 * - **occupies one of the subscription's outstanding-receipt slots** (32 by default), so repeated
 *   crashes leave `next` refused (`backpressure`) until some expire.
 *
 * Nothing is lost either way. **A host that is the subscription's only consumer should release them
 * at start-up**, before its first `next`:
 *
 * ```ts
 * for (const stale of (await pump.delivery.issued()).orThrow()) {
 *   await pump.delivery.abandon(stale.deliveryId);
 * }
 * ```
 *
 * **One pump per subscription.** Two pumps (or two processes) over one subscription are safe — each
 * id still ends in exactly one history list — but they present the same top revision, and each
 * one's receipt pins it against the other's disposal.
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
  /** What this pump prepared, by the object it handed out: the only source a decision reads. */
  private readonly _prepared: WeakMap<IPreparedTaskDelivery, IPreparedTaskDelivery> = new WeakMap();

  private constructor(params: {
    readonly broker: TaskBroker;
    readonly delivery: IBoundTaskDelivery;
    readonly binding: IBoundTaskDeliveryParams;
    readonly guard: ITaskHostWriteGuard | undefined;
    readonly budget: ITaskContextBudget;
  }) {
    this._broker = params.broker;
    this._delivery = params.delivery;
    this._binding = params.binding;
    this._guard = params.guard;
    this._budget = params.budget;
  }

  /** Creates a pump over one subscription's delivery. Fails when the broker refuses the binding. */
  public static create(params: ITaskDeliveryPumpParams): Result<TaskDeliveryPump> {
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
          budget
        })
      )
    );
  }

  /** The bound delivery the pump drains — for `pending`, `issued` and start-up `abandon`. */
  public get delivery(): IBoundTaskDelivery {
    return this._delivery;
  }

  /**
   * Prepares the next owed task revision — or answers `undefined` when nothing this principal may
   * see is owed.
   *
   * @remarks
   * One render of one owed revision. A render that delivers nothing although something is owed — an
   * owed revision too large for the text bound, which renders abbreviated or not at all — is
   * released and **fails loudly**, naming the revision, rather than being presented as if delivered.
   * It fails again on every call until the host raises `budget.maxChars` or ends those ids itself
   * (`TaskBroker.dispose`, with the ids the failure names).
   */
  public next(): Promise<Result<IPreparedTaskDelivery | undefined>> {
    return guarded(this._guard, () => this._next());
  }

  /**
   * Discharges a prepared delivery — only once the host's own work for it has committed — then
   * releases its receipt and, for a terminal revision, disposes of the task's older owed revisions.
   *
   * @remarks
   * Fails, with nothing discharged, when `prepared` is not an object this pump handed out, or the
   * acknowledgement does not commit: the revision stays owed and is presented again. Once it commits
   * the call succeeds, and anything after it that did not complete is listed in
   * {@link ITaskDeliveryDischarge.issues}.
   */
  public acknowledge(prepared: IPreparedTaskDelivery): Promise<Result<ITaskDeliveryDischarge>> {
    const label: string = this._label(prepared);
    return guarded(this._guard, async () =>
      (
        await this._recorded(prepared).thenOnSuccess(async (issued) => {
          const acknowledged = await this._delivery.acknowledge(issued.receipt);
          if (acknowledged.isFailure()) {
            return fail<ITaskDeliveryDischarge>(acknowledged.message);
          }
          this._prepared.delete(prepared);
          const issues: MessageAggregator = new MessageAggregator();
          (await this._release(issued.deliveryId)).aggregateError(issues);
          return succeed(
            await this._afterDischarge(
              prepared,
              issued,
              'acknowledged',
              acknowledged.value.newlyAcknowledged,
              acknowledged.value.alreadyAcknowledged,
              issues
            )
          );
        })
      ).withErrorFormat((message) => `delivery pump: acknowledging ${label}: ${message}`)
    );
  }

  /** Releases a prepared delivery unprocessed. What it named stays owed and is presented again. */
  public abandon(prepared: IPreparedTaskDelivery): Promise<Result<DeliveryId>> {
    const label: string = this._label(prepared);
    return guarded(this._guard, async () =>
      (
        await this._recorded(prepared).thenOnSuccess(async (issued) =>
          (
            await this._release(issued.deliveryId)
          ).onSuccess((released) => {
            this._prepared.delete(prepared);
            return succeed(released);
          })
        )
      ).withErrorFormat((message) => `delivery pump: abandoning ${label}: ${message}`)
    );
  }

  /**
   * Ends a prepared delivery's obligations without acknowledging them, recording `reason` in the
   * subscription's history — the receipt released first, since the broker refuses to dispose of
   * what an issued receipt names; then, for a terminal revision, the task's older owed revisions
   * disposed of too.
   *
   * @remarks
   * Fails, with nothing disposed, when `prepared` is not an object this pump handed out, or the
   * release or the disposal does not commit; the revision stays owed and is presented again. A
   * disposal that fails **after** the release has already given up the receipt: `prepared` can no
   * longer be decided, and the revision comes back from the next `next`. A receipt a crash left
   * issued over the same revision makes the disposal fail until it expires — see the class remarks.
   */
  public dispose(prepared: IPreparedTaskDelivery, reason: string): Promise<Result<ITaskDeliveryDischarge>> {
    const label: string = this._label(prepared);
    return guarded(this._guard, async () =>
      (
        await this._recorded(prepared).thenOnSuccess(async (issued) =>
          (
            await (
              await this._release(issued.deliveryId)
            ).thenOnSuccess(async () => {
              // Released: whatever the disposal does, this object no longer names a held receipt.
              this._prepared.delete(prepared);
              return this._dispose(issued.entry.updateIds, reason);
            })
          ).thenOnSuccess(async (disposed) => {
            return succeed(
              await this._afterDischarge(
                prepared,
                issued,
                'disposed',
                disposed.newlyDisposed,
                disposed.alreadyDischarged,
                new MessageAggregator()
              )
            );
          })
        )
      ).withErrorFormat((message) => `delivery pump: disposing of ${label}: ${message}`)
    );
  }

  /** {@link TaskDeliveryPump.next}, inside the guard. */
  private async _next(): Promise<Result<IPreparedTaskDelivery | undefined>> {
    const first = await this._delivery.pending({ limit: 1 });
    if (first.isFailure()) {
      return fail(`delivery pump: reading what is owed: ${first.message}`);
    }
    // A first page holding nothing and pointing nowhere: nothing is owed. A page that is empty but
    // continues (its update withheld from this principal) may still have something visible after it.
    if (first.value.updates.length === 0 && first.value.nextCursor === undefined) {
      return succeed(undefined);
    }
    return (await this._delivery.prepare(this._budget, { currentState: 'owed-only' })).asResult
      .withErrorFormat((message) => `delivery pump: preparing: ${message}`)
      .thenOnSuccess(async (prepared) => this._fromRender(prepared));
  }

  /** What one prepared render comes to. */
  private async _fromRender(
    prepared: IPreparedTaskContext
  ): Promise<Result<IPreparedTaskDelivery | undefined>> {
    const { context, deliveryId } = prepared;
    const rendered = context.entries[0];
    if (rendered === undefined || rendered.updateIds.length === 0) {
      // Only owed revisions are candidates. None rendered and none omitted: nothing visible is owed.
      // Otherwise the one candidate did not fit the budget, and presenting it would deliver nothing.
      const nothingVisible: boolean = rendered === undefined && context.omissions.visibleItems === 0;
      const what: string =
        rendered === undefined
          ? 'an owed revision that does not fit the render budget'
          : `${rendered.summary.envelope.id}@${rendered.summary.envelope.revision}, which renders abbreviated`;
      return (await this._release(deliveryId)).onSuccess(() =>
        nothingVisible
          ? succeed(undefined)
          : fail<IPreparedTaskDelivery | undefined>(
              `delivery pump: ${what}; it cannot be delivered within this budget — raise maxChars or dispose of it`
            )
      );
    }
    const envelope: ITaskEnvelope = rendered.summary.envelope;
    const looked: Result<ReadonlyArray<UpdateCategory>> = await this._categoriesOf(rendered.updateIds);
    if (looked.isFailure()) {
      // Nothing is handed out, so nothing may stay held: release the receipt, then report.
      return (await this._release(deliveryId)).onSuccess(() =>
        fail<IPreparedTaskDelivery | undefined>(`delivery pump: ${looked.message}`)
      );
    }
    return looked.onSuccess((categories) => {
      const issued: IPreparedTaskDelivery = {
        deliveryId,
        expiresAt: prepared.expiresAt,
        receipt: context.receipt,
        context,
        entry: {
          taskId: envelope.id,
          revision: envelope.revision,
          envelope,
          terminal: isTerminalTaskStatus(envelope.lifecycle.status),
          categories,
          updateIds: [...rendered.updateIds]
        }
      };
      // The host gets a frozen copy; the pump keeps its own record to decide from.
      const handed: IPreparedTaskDelivery = Object.freeze({
        ...issued,
        entry: Object.freeze({ ...issued.entry })
      });
      this._prepared.set(handed, issued);
      return succeed<IPreparedTaskDelivery | undefined>(handed);
    });
  }

  /** What this pump recorded when it prepared `prepared`, or a refusal for anything else. */
  private _recorded(prepared: IPreparedTaskDelivery): Result<IPreparedTaskDelivery> {
    const issued: IPreparedTaskDelivery | undefined = this._prepared.get(prepared);
    return issued !== undefined ? succeed(issued) : fail(`not a delivery this pump prepared`);
  }

  /**
   * The discharge record — and, after a terminal revision is discharged, the disposal of the task's
   * older owed revisions, which say nothing the outcome does not. Only older ones: a terminal task
   * takes no newer revision while it is owed anything.
   */
  private async _afterDischarge(
    handed: IPreparedTaskDelivery,
    issued: IPreparedTaskDelivery,
    outcome: TaskDeliveryOutcome,
    discharged: ReadonlyArray<UpdateId>,
    alreadyDischarged: ReadonlyArray<UpdateId>,
    issues: MessageAggregator
  ): Promise<ITaskDeliveryDischarge> {
    let superseded: ReadonlyArray<UpdateId> = [];
    if (issued.entry.terminal) {
      (await this._disposeSuperseded(issued.entry.taskId, issued.entry.revision))
        .onSuccess((cleared) => {
          superseded = cleared;
          return succeed(cleared);
        })
        .aggregateError(issues);
    }
    return { prepared: handed, outcome, discharged, alreadyDischarged, superseded, issues: issues.messages };
  }

  /** Disposes of every owed update of `taskId` older than `revision`; answers those newly ended. */
  private async _disposeSuperseded(
    taskId: TaskId,
    revision: TaskRevision
  ): Promise<Result<ReadonlyArray<UpdateId>>> {
    // Read to the end: only after a terminal discharge, and the task's revisions are not assumed
    // to be contiguous in the listing.
    return (await this._owedUntil(() => false))
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
        result.withErrorFormat((message) => `clearing superseded revisions of ${taskId}: ${message}`)
      );
  }

  /** The categories of `updateIds`, ascending, read from what is owed only as far as needed. */
  private async _categoriesOf(
    updateIds: ReadonlyArray<UpdateId>
  ): Promise<Result<ReadonlyArray<UpdateCategory>>> {
    const wanted: Set<UpdateId> = new Set(updateIds);
    const found: Set<UpdateCategory> = new Set();
    return (
      await this._owedUntil((update) => {
        if (wanted.delete(update.id)) {
          found.add(update.category);
        }
        return wanted.size === 0;
      })
    ).onSuccess(() => succeed([...found].sort()));
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
      (message) => `releasing receipt ${deliveryId}: ${message}`
    );
  }

  /**
   * The owed updates this principal may see, page by page, until `done` answers true for one or the
   * pages end. Owed updates are ordered by task, revision and category.
   */
  private async _owedUntil(
    done: (update: ITaskUpdate) => boolean
  ): Promise<Result<ReadonlyArray<ITaskUpdate>>> {
    const owed: ITaskUpdate[] = [];
    let cursor: PageCursor | undefined = undefined;
    do {
      const page = await this._delivery.pending({
        limit: maxTaskPageLimit,
        ...(cursor !== undefined ? { cursor } : {})
      });
      if (page.isFailure()) {
        return fail(`reading what is owed: ${page.message}`);
      }
      for (const update of page.value.updates) {
        owed.push(update);
        if (done(update)) {
          return succeed(owed);
        }
      }
      cursor = page.value.nextCursor;
    } while (cursor !== undefined);
    return succeed(owed);
  }

  /** A prepared delivery's name in messages: from the pump's record, never from the object's fields. */
  private _label(prepared: IPreparedTaskDelivery): string {
    const issued: IPreparedTaskDelivery | undefined = this._prepared.get(prepared);
    return issued !== undefined ? `${issued.entry.taskId}@${issued.entry.revision}` : 'a delivery';
  }
}
