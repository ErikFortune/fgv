/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, captureResult, fail, failWithDetail, omit, succeed, succeedWithDetail } from '@fgv/ts-utils';
import { TaskConverters } from '../converters';
import {
  DeliveryId,
  IInclusionEntry,
  ITaskContext,
  ITaskContextBudget,
  ITaskContextEntry,
  ITaskContextInput,
  ITaskFailure,
  ITaskReference,
  ITaskSummary,
  ITaskUpdate,
  IUnresolvedTaskReference,
  TaskContextOmissionReason,
  TaskContextPresentation,
  TaskContextProjection,
  TaskContextSection,
  TaskId,
  TaskResult,
  TaskRevision,
  UpdateCategory,
  allUpdateCategories,
  defaultTaskContextBudget,
  isTerminalTaskStatus
} from '../types';
import { RecordValue, serializeRecord } from './escaping';
import { computeFramingReserve, framing, omissionLine, omissionReasonOrder, sectionOrder } from './framing';
import {
  INormalizedInput,
  IRevisionCandidate,
  InputNormalizer,
  allTaskResults,
  compareOrdinal
} from './normalize';

const invalidDetail: ITaskFailure = { code: 'invalid', retry: 'after-host-action' };

/**
 * The default {@link TaskContextProjection}: removes the source binding, which is raw
 * source-owned data and never model-visible, and changes nothing else.
 * @public
 */
export function defaultTaskContextProjection(summary: ITaskSummary): Result<ITaskSummary> {
  return succeed({ envelope: omit(summary.envelope, ['binding']) });
}

/**
 * Parameters for {@link TaskContextRenderer.create}.
 * @public
 */
export interface ITaskContextRendererCreateParams {
  /** Converters whose field bounds validate input. Defaults to `TaskConverters.create()`. */
  readonly converters?: TaskConverters;
  /** The disclosure projection. Defaults to {@link defaultTaskContextProjection}. */
  readonly projection?: TaskContextProjection;
}

interface ITaskItem {
  readonly type: 'task';
  readonly taskId: TaskId;
  readonly revision: TaskRevision;
  readonly summary: ITaskSummary;
  readonly current: boolean;
  readonly updates: ReadonlyArray<ITaskUpdate>;
  readonly depth: number;
  readonly rank: number;
  readonly section: TaskContextSection;
}

interface IUnresolvedItem {
  readonly type: 'unresolved';
  readonly taskId: TaskId;
  readonly reference: IUnresolvedTaskReference;
  readonly depth: number;
  readonly rank: number;
}

type Item = ITaskItem | IUnresolvedItem;

interface IRendered {
  readonly item: Item;
  readonly presentation: TaskContextPresentation;
  readonly line: string;
}

interface IProjectedCandidate {
  readonly candidate: IRevisionCandidate;
  readonly summary: ITaskSummary;
}

/**
 * Selection priority, most urgent first (design §9): outstanding required attention; terminal
 * outcomes; other material changes (assignment, observation, relationship, lifecycle — or any
 * required update); current open work; routine progress; unresolved diagnostics.
 */
function _rank(summary: ITaskSummary, current: boolean, updates: ReadonlyArray<ITaskUpdate>): number {
  const envelope: ITaskSummary['envelope'] = summary.envelope;
  const lifecycle: ITaskSummary['envelope']['lifecycle'] = envelope.lifecycle;
  const reasonAttention: ReadonlyArray<ITaskReference> =
    'reason' in lifecycle ? lifecycle.reason.attention ?? [] : [];
  if (
    updates.some((u) => u.required && u.category === 'attention') ||
    envelope.attention.length > 0 ||
    reasonAttention.length > 0
  ) {
    return 1;
  }
  if (isTerminalTaskStatus(lifecycle.status)) {
    return 2;
  }
  if (updates.some((u) => u.required || u.category !== 'progress')) {
    return 3;
  }
  return current ? 4 : 5;
}

const unresolvedRank: number = 6;

function _reference(reference: ITaskReference): RecordValue {
  return [reference.namespace, reference.key];
}

function _categories(updates: ReadonlyArray<ITaskUpdate>): ReadonlyArray<UpdateCategory> {
  return allUpdateCategories.filter((category) => updates.some((u) => u.category === category));
}

function _abbreviatable(item: ITaskItem): boolean {
  return (
    item.summary.envelope.description !== undefined || item.summary.envelope.progress?.summary !== undefined
  );
}

/**
 * One task revision as a data record. The field set is fixed here: kind-specific details,
 * the source binding, scopes and timestamps other than `notBefore` are never rendered.
 */
function _taskRecord(item: ITaskItem, presentation: TaskContextPresentation): RecordValue {
  const envelope: ITaskSummary['envelope'] = item.summary.envelope;
  const lifecycle: ITaskSummary['envelope']['lifecycle'] = envelope.lifecycle;
  const abbreviated: boolean = presentation === 'abbreviated';
  const progress: ITaskSummary['envelope']['progress'] = envelope.progress;
  return {
    task: envelope.id,
    revision: envelope.revision,
    kind: envelope.kind,
    title: envelope.title,
    status: lifecycle.status,
    reason:
      'reason' in lifecycle
        ? {
            code: lifecycle.reason.code,
            summary: lifecycle.reason.summary,
            attention: lifecycle.reason.attention?.map(_reference)
          }
        : undefined,
    notBefore: lifecycle.status === 'waiting' ? lifecycle.reason.notBefore : undefined,
    outcome:
      'outcome' in lifecycle && lifecycle.outcome !== undefined
        ? { summary: lifecycle.outcome.summary, artifacts: lifecycle.outcome.artifacts.map(_reference) }
        : undefined,
    progress: progress
      ? {
          phase: progress.phase,
          completed: progress.completed,
          total: progress.total,
          unit: progress.unit,
          summary: abbreviated ? undefined : progress.summary
        }
      : undefined,
    attention: envelope.attention.length > 0 ? envelope.attention.map(_reference) : undefined,
    responsible: envelope.responsibility ? _reference(envelope.responsibility) : undefined,
    parent: envelope.parentId,
    depth: item.depth,
    observation:
      envelope.observation.state === 'current'
        ? undefined
        : { state: envelope.observation.state, reason: envelope.observation.reason },
    changes: item.updates.length > 0 ? _categories(item.updates) : undefined,
    required: item.updates.some((u) => u.required) ? true : undefined,
    description: abbreviated ? undefined : envelope.description,
    abbreviated: abbreviated ? true : undefined
  };
}

/** An unresolved reference as a diagnostic record. Never its binding, never a revision. */
function _unresolvedRecord(item: IUnresolvedItem): RecordValue {
  return {
    unresolved: item.reference.id,
    kind: item.reference.kind,
    title: item.reference.title,
    reason: item.reference.reason,
    depth: item.depth
  };
}

function _line(item: Item, presentation: TaskContextPresentation): string {
  return serializeRecord(item.type === 'task' ? _taskRecord(item, presentation) : _unresolvedRecord(item));
}

/**
 * Depth of every node in the visible forest: the number of ancestors that are themselves
 * visible. A parent that was not supplied ends the chain — the renderer cannot know, and
 * does not guess, how deep the real tree is. A cycle is invalid input.
 */
function _depths(parents: ReadonlyMap<string, string | undefined>): TaskResult<ReadonlyMap<string, number>> {
  const depths: Map<string, number> = new Map<string, number>();
  for (const start of parents.keys()) {
    const chain: string[] = [];
    let base: number = -1;
    let cursor: string | undefined = start;
    while (cursor !== undefined) {
      const known: number | undefined = depths.get(cursor);
      if (known !== undefined) {
        base = known;
        break;
      }
      if (chain.includes(cursor)) {
        return failWithDetail(`task ${cursor}: parent chain forms a cycle`, invalidDetail);
      }
      chain.push(cursor);
      const parent: string | undefined = parents.get(cursor);
      cursor = parent !== undefined && parents.has(parent) ? parent : undefined;
    }
    chain.reverse().forEach((id: string, index: number) => depths.set(id, base + 1 + index));
  }
  return succeedWithDetail(depths);
}

function _compareItems(a: Item, b: Item): number {
  const revision = (item: Item): number => (item.type === 'task' ? item.revision : 0);
  return a.rank - b.rank || compareOrdinal(a.taskId, b.taskId) || revision(a) - revision(b);
}

/**
 * Renders task context: deterministic selection, bounded framed text, and an honest pure
 * inclusion receipt.
 *
 * @remarks
 * The renderer has no repository, no clock, no ID factory, no random source, no checkpoint
 * store and no logger — there is nothing for it to write to. Its only injected dependency is
 * the host's disclosure projection. Every input is validated before anything is rendered,
 * and every projection result is validated again.
 *
 * What a receipt claims is exactly what the text holds: an entry per rendered task revision,
 * and an update ID only where that update's complete payload was rendered.
 * @public
 */
export class TaskContextRenderer {
  /** The converters validating this renderer's input. */
  public readonly converters: TaskConverters;
  /**
   * Characters every rendering reserves for framing and the omission report before any
   * record is selected. A budget whose `maxChars` is below this is rejected.
   */
  public readonly framingReserve: number;
  private readonly _projection: TaskContextProjection;
  private readonly _normalizer: InputNormalizer;

  private constructor(converters: TaskConverters, projection: TaskContextProjection) {
    this.converters = converters;
    this.framingReserve = computeFramingReserve();
    this._projection = projection;
    this._normalizer = new InputNormalizer();
  }

  /**
   * Creates a renderer. Pure: builds converters when none are supplied, and nothing else.
   */
  public static create(params?: ITaskContextRendererCreateParams): Result<TaskContextRenderer> {
    const converters: Result<TaskConverters> =
      params?.converters !== undefined ? succeed(params.converters) : TaskConverters.create();
    return converters.onSuccess((c) =>
      captureResult(() => new TaskContextRenderer(c, params?.projection ?? defaultTaskContextProjection))
    );
  }

  /**
   * Renders `input` within `budget` (default {@link defaultTaskContextBudget}).
   *
   * @remarks
   * Fails `invalid` for malformed input, an impossible budget, a failing projection or a
   * cyclic parent chain; fails `conflict` when the input describes one revision two ways, or
   * carries two current revisions of one task.
   */
  public render(input: ITaskContextInput, budget?: ITaskContextBudget): TaskResult<ITaskContext> {
    return this._budget(budget ?? defaultTaskContextBudget).onSuccess((validBudget) =>
      this.converters.context.input
        .convert(input)
        .withErrorFormat((message: string) => `task context input: ${message}`)
        .withFailureDetail(invalidDetail)
        .onSuccess((valid) =>
          this._normalizer
            .normalize(valid)
            .onSuccess((normalized) => this._items(normalized))
            .onSuccess((items) => succeedWithDetail(this._render(items, valid, validBudget)))
        )
    );
  }

  private _budget(budget: ITaskContextBudget): TaskResult<ITaskContextBudget> {
    return this.converters.context.budget
      .convert(budget)
      .onSuccess((valid) =>
        valid.maxChars < this.framingReserve
          ? fail<ITaskContextBudget>(
              `maxChars ${valid.maxChars} is below the framing reserve of ${this.framingReserve}`
            )
          : succeed(valid)
      )
      .withErrorFormat((message: string) => `task context budget: ${message}`)
      .withFailureDetail(invalidDetail);
  }

  private _project(candidate: IRevisionCandidate): TaskResult<IProjectedCandidate> {
    const label: string = `task ${candidate.taskId}@${candidate.revision}`;
    // `captureResult`: the projection is host code, and a throw must fail the render rather
    // than escape it. There is no fallback to the unprojected value.
    return captureResult(() => this._projection({ envelope: candidate.envelope }))
      .onSuccess((projected) => projected)
      .onSuccess((projected) => this.converters.context.summary.convert(projected))
      .onSuccess((summary) => {
        const envelope: ITaskSummary['envelope'] = summary.envelope;
        if (
          envelope.id !== candidate.taskId ||
          envelope.revision !== candidate.revision ||
          envelope.kind !== candidate.envelope.kind
        ) {
          return fail<IProjectedCandidate>(
            `projection changed identity to ${envelope.kind} ${envelope.id}@${envelope.revision}`
          );
        }
        return succeed({ candidate, summary });
      })
      .withErrorFormat((message: string) => `${label}: projection failed: ${message}`)
      .withFailureDetail(invalidDetail);
  }

  private _items(normalized: INormalizedInput): TaskResult<ReadonlyArray<Item>> {
    return allTaskResults(normalized.revisions.map((c) => this._project(c))).onSuccess((projected) => {
      // A task's place in the tree comes from its newest supplied revision, which is its
      // current state when that was supplied: no update may be newer than current state.
      // `projected` is in ascending revision order, so the last one per task wins.
      const representative: Map<string, ITaskSummary> = new Map<string, ITaskSummary>();
      for (const p of projected) {
        representative.set(p.candidate.taskId, p.summary);
      }
      const parents: Map<string, string | undefined> = new Map<string, string | undefined>();
      for (const [taskId, summary] of representative) {
        parents.set(taskId, summary.envelope.parentId);
      }
      for (const reference of normalized.unresolved) {
        parents.set(reference.id, reference.parentId);
      }
      return _depths(parents).onSuccess((depths) => {
        const depthOf = (taskId: string): number => depths.get(taskId) ?? 0;
        const items: Item[] = projected.map(({ candidate, summary }): Item => {
          const rank: number = _rank(summary, candidate.current, candidate.updates);
          const section: TaskContextSection =
            rank === 1 ? 'attention' : candidate.updates.length > 0 ? 'updates' : 'current';
          return {
            type: 'task',
            taskId: candidate.taskId,
            revision: candidate.revision,
            summary,
            current: candidate.current,
            updates: candidate.updates,
            depth: depthOf(candidate.taskId),
            rank,
            section
          };
        });
        for (const reference of normalized.unresolved) {
          items.push({
            type: 'unresolved',
            taskId: reference.id,
            reference,
            depth: depthOf(reference.id),
            rank: unresolvedRank
          });
        }
        return succeedWithDetail<ReadonlyArray<Item>, ITaskFailure>(items.sort(_compareItems));
      });
    });
  }

  private _render(
    items: ReadonlyArray<Item>,
    input: ITaskContextInput,
    budget: ITaskContextBudget
  ): ITaskContext {
    const available: number = budget.maxChars - this.framingReserve;
    const rendered: IRendered[] = [];
    const omitted: Set<TaskContextOmissionReason> = new Set<TaskContextOmissionReason>();
    let omittedItems: number = 0;
    let omittedRequired: number = 0;
    let used: number = 0;

    for (const item of items) {
      const choice: IRendered | TaskContextOmissionReason = this._choose(
        item,
        rendered.length,
        used,
        available,
        budget
      );
      if (typeof choice === 'string') {
        omitted.add(choice);
        omittedItems++;
      } else {
        rendered.push(choice);
        used += choice.line.length + 1;
      }
      const delivered: boolean = typeof choice !== 'string' && choice.presentation === 'complete';
      if (item.type === 'task' && !delivered) {
        omittedRequired += item.updates.filter((u) => u.required).length;
      }
    }

    if (input.completeness === 'partial') {
      omitted.add('partial-input');
    }
    const reasons: ReadonlyArray<TaskContextOmissionReason> = omissionReasonOrder.filter((r) =>
      omitted.has(r)
    );
    const abbreviated: number = rendered.filter((r) => r.presentation === 'abbreviated').length;
    const exhaustive: boolean = input.completeness === 'complete' && omittedItems === 0;

    const lines: string[] = [framing.open, framing.preamble];
    const entries: ITaskContextEntry[] = [];
    for (const section of sectionOrder) {
      lines.push(framing.sections[section]);
      for (const r of rendered) {
        if (r.item.type === 'task' && r.item.section === section) {
          lines.push(r.line);
          entries.push({
            summary: r.item.summary,
            section,
            presentation: r.presentation,
            depth: r.item.depth,
            updateIds: r.presentation === 'complete' ? r.item.updates.map((u) => u.id) : []
          });
        }
      }
    }
    lines.push(framing.diagnostics);
    const diagnostics: IUnresolvedTaskReference[] = [];
    for (const r of rendered) {
      if (r.item.type === 'unresolved') {
        lines.push(r.line);
        diagnostics.push(r.item.reference);
      }
    }
    lines.push(
      framing.omissions,
      omissionLine({
        omittedItems,
        omittedRequiredUpdates: omittedRequired,
        abbreviated,
        reasons,
        input: input.completeness,
        exhaustive
      }),
      framing.close
    );

    return {
      text: lines.map((line) => `${line}\n`).join(''),
      entries,
      diagnostics,
      receipt: this._receipt(entries, input.deliveryId),
      omissions: {
        visibleItems: omittedItems,
        requiredUpdates: omittedRequired,
        abbreviated,
        reasons,
        exhaustive
      }
    };
  }

  private _choose(
    item: Item,
    count: number,
    used: number,
    available: number,
    budget: ITaskContextBudget
  ): IRendered | TaskContextOmissionReason {
    if (count >= budget.maxItems) {
      return 'items';
    }
    if (item.depth > budget.maxDepth) {
      return 'depth';
    }
    const fits = (line: string): boolean => used + line.length + 1 <= available;
    const full: string = _line(item, 'complete');
    if (fits(full)) {
      return { item, presentation: 'complete', line: full };
    }
    // Abbreviation drops descriptive prose behind a visible marker. It keeps the revision in
    // the receipt and never its update IDs: an abbreviated payload is not a delivered one.
    if (item.type === 'task' && _abbreviatable(item)) {
      const short: string = _line(item, 'abbreviated');
      if (fits(short)) {
        return { item, presentation: 'abbreviated', line: short };
      }
    }
    return 'text';
  }

  private _receipt(
    entries: ReadonlyArray<ITaskContextEntry>,
    deliveryId: DeliveryId | undefined
  ): ITaskContext['receipt'] {
    const included: IInclusionEntry[] = entries
      .map((e) => ({
        taskId: e.summary.envelope.id,
        revision: e.summary.envelope.revision,
        updateIds: e.updateIds
      }))
      .sort((a, b) => compareOrdinal(a.taskId, b.taskId) || a.revision - b.revision);
    return deliveryId !== undefined ? { version: 1, deliveryId, included } : { version: 1, included };
  }
}
