/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import {
  IStopIntent,
  IStopLatch,
  ITaskCommitRecord,
  ITaskRecordDraft,
  OperationId,
  TaskId,
  isLatchingStopState
} from '../types';
import { utf8Length } from './layout';

/**
 * One marked stop command a task record holds: which intent's attempt it is.
 * @internal
 */
export interface IMarkedStopCommand {
  readonly operationId: OperationId;
  readonly rootId: TaskId;
  readonly intentId: OperationId;
  /** Whether its outcome is recorded: an unsettled one may still be sent. */
  readonly settled: boolean;
}

/**
 * The coordination projection of one latching intent — what stays resident (design § 7): its
 * identity, mode, each target's current key and whether it is confirmed, and its encoded size. Target
 * evidence is read from the root's record on demand, never held here.
 * @internal
 */
export interface ILatchingIntent {
  readonly id: OperationId;
  readonly rootId: TaskId;
  readonly mode: IStopIntent['mode'];
  readonly bytes: number;
  readonly targets: ReadonlyArray<{
    readonly taskId: TaskId;
    readonly operationId: OperationId;
    readonly confirmed: boolean;
  }>;
}

/**
 * What one task record contributes to the stop book: the latching intents it is the root of, and the
 * marked stop commands it holds.
 * @internal
 */
export interface IStopContent {
  readonly latching: ReadonlyArray<ILatchingIntent>;
  readonly marked: ReadonlyArray<IMarkedStopCommand>;
}

/**
 * The stop content of a record, or `undefined` when it has none. Archived records contribute nothing:
 * a latching intent never survives its root's archive, and a latched task cannot be archived.
 * @internal
 */
export function stopContentOf(record: ITaskCommitRecord | ITaskRecordDraft): IStopContent | undefined {
  if (record.recordType !== 'resolved' || record.archived) {
    return undefined;
  }
  const latching: ReadonlyArray<ILatchingIntent> = (record.stops ?? [])
    .filter((intent) => isLatchingStopState(intent.state))
    .map((intent) => ({
      id: intent.id,
      rootId: intent.rootId,
      mode: intent.mode,
      // The canonical encoding's length: only key order differs from `JSON.stringify`.
      bytes: utf8Length(JSON.stringify(intent)),
      targets: intent.targets.map((target) => ({
        taskId: target.taskId,
        operationId: target.operationId,
        confirmed: target.state === 'confirmed'
      }))
    }));
  const marked: IMarkedStopCommand[] = [];
  for (const op of record.operations) {
    if (op.type === 'command' && op.stop !== undefined) {
      marked.push({
        operationId: op.operationId,
        rootId: op.stop.rootId,
        intentId: op.stop.intentId,
        settled: op.dispatch === 'settled'
      });
    }
  }
  return latching.length === 0 && marked.length === 0 ? undefined : { latching, marked };
}

/**
 * The per-task facts the ledger derives a task's stop reservation from.
 * @internal
 */
export interface IStopFacts {
  /** Unlanded attempts that target this task: each will add one stop command to its record. */
  readonly unlandedOn: number;
  /** Unlanded attempts of latching intents rooted here, whichever task each targets. */
  readonly unlandedOf: number;
  /** Latching intents rooted here: each still owes its release (or settle) path. */
  readonly latching: number;
  /** The targets of those intents, together. */
  readonly intentTargets: number;
  /** Their current encoded bytes, together. */
  readonly intentBytes: number;
}

const noFacts: IStopFacts = { unlandedOn: 0, unlandedOf: 0, latching: 0, intentTargets: 0, intentBytes: 0 };

/**
 * A live attempt: the current attempt of one target of a latching intent. It is **funded** — holds a
 * reservation — while it could still land: not landed yet, its target not archived (a tombstone takes
 * no command), and its target not confirmed (a confirmed target needs no command; one that later
 * leaves the stopped set gets a new attempt, which is new admission).
 */
interface IAttempt {
  readonly rootId: TaskId;
  readonly intentId: OperationId;
  readonly taskId: TaskId;
  readonly confirmed: boolean;
  landed: boolean;
  funded: boolean;
}

/** The key of one intent. */
function _intentKey(rootId: TaskId, intentId: OperationId): string {
  return JSON.stringify([rootId, intentId]);
}

/**
 * The resident stop state (T9): every latching intent's latches and live attempts, derived from the
 * committed records and rebuilt with the index — so a latch is enforced from the moment a repository
 * opens, before it accepts any write.
 *
 * @remarks
 * A live attempt is **landed** once its target's record holds a command under the attempt's key that
 * carries the matching marker; the two sides may be indexed in either order. Nothing here is
 * persisted: open recomputes it from records, which is what makes the ledger's stop reservations
 * derived and discardable like every other ledger figure.
 * @internal
 */
export class StopBook {
  private readonly _retired: (taskId: TaskId) => boolean;
  private readonly _content: Map<TaskId, IStopContent> = new Map();
  private readonly _latches: Map<TaskId, Map<string, IStopLatch>> = new Map();
  private readonly _attempts: Map<OperationId, IAttempt> = new Map();
  private readonly _marked: Map<TaskId, Map<OperationId, IMarkedStopCommand>> = new Map();
  private readonly _unlandedOn: Map<TaskId, number> = new Map();
  private readonly _unlandedOf: Map<TaskId, number> = new Map();

  /**
   * @param retired - whether a task is archived. An archived task never un-archives, and a latched
   * task is never archived, so an attempt's answer is fixed for its lifetime — except while an open
   * pass is still indexing, which is what {@link StopBook.recount} is for.
   */
  public constructor(retired: (taskId: TaskId) => boolean) {
    this._retired = retired;
  }

  /**
   * Recomputes which attempts are funded, once every task is indexed: an open pass indexes a root
   * before some of its archived targets.
   */
  public recount(): void {
    this._unlandedOn.clear();
    this._unlandedOf.clear();
    for (const attempt of this._attempts.values()) {
      attempt.funded = !attempt.landed && !attempt.confirmed && !this._retired(attempt.taskId);
      if (attempt.funded) {
        this._bump(this._unlandedOn, attempt.taskId, 1);
        this._bump(this._unlandedOf, attempt.rootId, 1);
      }
    }
  }

  /** The latches a task is under. */
  public latches(taskId: TaskId): ReadonlyArray<IStopLatch> {
    return Array.from(this._latches.get(taskId)?.values() ?? []);
  }

  /** Whether any latching intent covers the task. */
  public isLatched(taskId: TaskId): boolean {
    return this._latches.has(taskId);
  }

  /** The live attempt under a command key, if one is, and whether it still holds a reservation. */
  public attempt(operationId: OperationId):
    | {
        readonly rootId: TaskId;
        readonly intentId: OperationId;
        readonly taskId: TaskId;
        readonly funded: boolean;
      }
    | undefined {
    const attempt: IAttempt | undefined = this._attempts.get(operationId);
    return attempt === undefined ? undefined : { ...attempt };
  }

  /**
   * Unsettled stop commands that name a latching intent and are not its live attempt on the task that
   * holds them. Storage admits a stop command only as its intent's funded attempt, and an attempt is
   * superseded only once its command has settled, so a record holding one was not written by this
   * repository — and it could be sent under authority no stop holds. A command whose intent no longer
   * latches is history, and never sent.
   */
  public strays(): ReadonlyArray<{ readonly taskId: TaskId; readonly command: IMarkedStopCommand }> {
    const strays: { readonly taskId: TaskId; readonly command: IMarkedStopCommand }[] = [];
    for (const [taskId, held] of this._marked) {
      for (const command of held.values()) {
        const latching: boolean = this.latchingOf(command.rootId).some((i) => i.id === command.intentId);
        const attempt: IAttempt | undefined = this._attempts.get(command.operationId);
        const own: boolean =
          attempt !== undefined &&
          attempt.taskId === taskId &&
          attempt.rootId === command.rootId &&
          attempt.intentId === command.intentId;
        if (!command.settled && latching && !own) {
          strays.push({ taskId, command });
        }
      }
    }
    return strays;
  }

  /** The latching intents a task is the root of. */
  public latchingOf(rootId: TaskId): ReadonlyArray<ILatchingIntent> {
    return this._content.get(rootId)?.latching ?? [];
  }

  /** The facts a task's stop reservation is derived from. */
  public facts(taskId: TaskId): IStopFacts {
    const latching: ReadonlyArray<ILatchingIntent> = this.latchingOf(taskId);
    const unlandedOn: number = this._unlandedOn.get(taskId) ?? 0;
    const unlandedOf: number = this._unlandedOf.get(taskId) ?? 0;
    if (latching.length === 0 && unlandedOn === 0 && unlandedOf === 0) {
      return noFacts;
    }
    return {
      unlandedOn,
      unlandedOf,
      latching: latching.length,
      intentTargets: latching.reduce((total, intent) => total + intent.targets.length, 0),
      intentBytes: latching.reduce((total, intent) => total + intent.bytes, 0)
    };
  }

  /** Every task whose stop facts are not empty: roots of latching intents and unlanded targets. */
  public holders(): ReadonlyArray<TaskId> {
    return Array.from(
      new Set([...this._content.keys(), ...this._unlandedOn.keys(), ...this._unlandedOf.keys()])
    );
  }

  /** Unlanded attempts targeting a task. */
  public unlandedOn(taskId: TaskId): number {
    return this._unlandedOn.get(taskId) ?? 0;
  }

  /**
   * A command key `content` would make a live attempt that another root's intent already holds as
   * one — which a record this release wrote never does.
   */
  public collision(taskId: TaskId, content: IStopContent | undefined): OperationId | undefined {
    for (const intent of content?.latching ?? []) {
      for (const target of intent.targets) {
        const held: IAttempt | undefined = this._attempts.get(target.operationId);
        if (held !== undefined && (held.rootId !== taskId || held.intentId !== intent.id)) {
          return target.operationId;
        }
      }
    }
    return undefined;
  }

  /**
   * Replaces one task's contribution and returns every task whose facts may have changed.
   * `undefined` removes it.
   */
  public put(taskId: TaskId, content: IStopContent | undefined): ReadonlySet<TaskId> {
    const touched: Set<TaskId> = new Set<TaskId>([taskId]);
    const previous: IStopContent | undefined = this._content.get(taskId);
    if (previous !== undefined) {
      this._content.delete(taskId);
      for (const intent of previous.latching) {
        this._removeIntent(intent, touched);
      }
      for (const marked of previous.marked) {
        this._removeMarked(taskId, marked, touched);
      }
    }
    if (content !== undefined) {
      this._content.set(taskId, content);
      for (const marked of content.marked) {
        this._addMarked(taskId, marked, touched);
      }
      for (const intent of content.latching) {
        this._addIntent(intent, touched);
      }
    }
    return touched;
  }

  /**
   * What replacing one task's contribution would do, without doing it: the facts of every touched task
   * after the change. The book is left exactly as it was.
   */
  public preview(taskId: TaskId, content: IStopContent | undefined): ReadonlyMap<TaskId, IStopFacts> {
    const previous: IStopContent | undefined = this._content.get(taskId);
    const touched: ReadonlySet<TaskId> = this.put(taskId, content);
    const after: Map<TaskId, IStopFacts> = new Map();
    for (const id of touched) {
      after.set(id, this.facts(id));
    }
    this.put(taskId, previous);
    return after;
  }

  private _bump(map: Map<TaskId, number>, id: TaskId, by: number): void {
    const next: number = (map.get(id) ?? 0) + by;
    if (next === 0) {
      map.delete(id);
    } else {
      map.set(id, next);
    }
  }

  private _landed(attempt: IAttempt, operationId: OperationId): boolean {
    const marked: IMarkedStopCommand | undefined = this._marked.get(attempt.taskId)?.get(operationId);
    return marked !== undefined && marked.rootId === attempt.rootId && marked.intentId === attempt.intentId;
  }

  private _addIntent(intent: ILatchingIntent, touched: Set<TaskId>): void {
    const key: string = _intentKey(intent.rootId, intent.id);
    const latch: IStopLatch = { rootId: intent.rootId, intentId: intent.id, mode: intent.mode };
    touched.add(intent.rootId);
    for (const target of intent.targets) {
      let latches: Map<string, IStopLatch> | undefined = this._latches.get(target.taskId);
      if (latches === undefined) {
        latches = new Map();
        this._latches.set(target.taskId, latches);
      }
      latches.set(key, latch);
      const attempt: IAttempt = {
        rootId: intent.rootId,
        intentId: intent.id,
        taskId: target.taskId,
        confirmed: target.confirmed,
        landed: false,
        funded: false
      };
      attempt.landed = this._landed(attempt, target.operationId);
      attempt.funded = !attempt.landed && !attempt.confirmed && !this._retired(target.taskId);
      this._attempts.set(target.operationId, attempt);
      if (attempt.funded) {
        this._bump(this._unlandedOn, target.taskId, 1);
        this._bump(this._unlandedOf, intent.rootId, 1);
        touched.add(target.taskId);
      }
    }
  }

  private _removeIntent(intent: ILatchingIntent, touched: Set<TaskId>): void {
    const key: string = _intentKey(intent.rootId, intent.id);
    touched.add(intent.rootId);
    for (const target of intent.targets) {
      // Latched when this intent was added: a removal only ever mirrors an earlier add.
      const latches: Map<string, IStopLatch> = this._latches.get(target.taskId)!;
      latches.delete(key);
      if (latches.size === 0) {
        this._latches.delete(target.taskId);
      }
      const attempt: IAttempt | undefined = this._attempts.get(target.operationId);
      this._attempts.delete(target.operationId);
      if (attempt !== undefined && attempt.funded) {
        this._bump(this._unlandedOn, target.taskId, -1);
        this._bump(this._unlandedOf, intent.rootId, -1);
        touched.add(target.taskId);
      }
    }
  }

  private _addMarked(taskId: TaskId, marked: IMarkedStopCommand, touched: Set<TaskId>): void {
    let held: Map<OperationId, IMarkedStopCommand> | undefined = this._marked.get(taskId);
    if (held === undefined) {
      held = new Map();
      this._marked.set(taskId, held);
    }
    held.set(marked.operationId, marked);
    const attempt: IAttempt | undefined = this._attempts.get(marked.operationId);
    if (
      attempt !== undefined &&
      !attempt.landed &&
      attempt.taskId === taskId &&
      this._landed(attempt, marked.operationId)
    ) {
      attempt.landed = true;
      if (attempt.funded) {
        attempt.funded = false;
        this._bump(this._unlandedOn, taskId, -1);
        this._bump(this._unlandedOf, attempt.rootId, -1);
        touched.add(attempt.rootId);
      }
    }
  }

  private _removeMarked(taskId: TaskId, marked: IMarkedStopCommand, touched: Set<TaskId>): void {
    // Held when this command was added: a removal only ever mirrors an earlier add.
    const held: Map<OperationId, IMarkedStopCommand> = this._marked.get(taskId)!;
    held.delete(marked.operationId);
    if (held.size === 0) {
      this._marked.delete(taskId);
    }
    const attempt: IAttempt | undefined = this._attempts.get(marked.operationId);
    if (attempt !== undefined && attempt.landed && attempt.taskId === taskId) {
      attempt.landed = false;
      attempt.funded = !attempt.confirmed && !this._retired(taskId);
      if (attempt.funded) {
        this._bump(this._unlandedOn, taskId, 1);
        this._bump(this._unlandedOf, attempt.rootId, 1);
        touched.add(attempt.rootId);
      }
    }
  }
}
