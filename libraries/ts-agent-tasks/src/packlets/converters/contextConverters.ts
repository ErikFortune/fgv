/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters as JsonConverters, JsonValue } from '@fgv/ts-json-base';
import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import {
  IInclusionEntry,
  ITaskContextBudget,
  ITaskContextInput,
  ITaskEnvelope,
  ITaskFieldBounds,
  ITaskInclusionReceipt,
  ITaskSummary,
  ITaskUpdate,
  IUnresolvedTaskReference,
  SubscriptionId,
  TaskInputCompleteness,
  UpdateCategory,
  UpdateId,
  allUpdateCategories,
  taskContextLimits
} from '../types';
import { IEnvelopeConverters } from './envelopeConverters';
import { IIdentityConverters } from './identityConverters';
import {
  boundedArrayOf,
  boundedSingleLine,
  boundedText,
  nonNegativeSafeInteger,
  positiveSafeInteger,
  taskRevision
} from './primitives';
import { IValueConverters } from './valueConverters';

/**
 * Converters for task summaries, updates and the pure context surface.
 * @public
 */
export interface IContextConverters {
  /** A strict `{ envelope }` summary. A `details` field is a failure here. */
  readonly summary: Converter<ITaskSummary>;
  /**
   * A summary, or a snapshot reduced to one. `details` is accepted and discarded — the one
   * place a snapshot's details are dropped, and they are dropped because they are never
   * implicitly model-visible.
   */
  readonly presentable: Converter<ITaskSummary>;
  readonly updateCategory: Converter<UpdateCategory>;
  readonly update: Converter<ITaskUpdate>;
  readonly unresolvedReference: Converter<IUnresolvedTaskReference>;
  readonly completeness: Converter<TaskInputCompleteness>;
  readonly input: Converter<ITaskContextInput>;
  /** Shape only. The renderer additionally rejects a `maxChars` below its framing reserve. */
  readonly budget: Converter<ITaskContextBudget>;
  readonly inclusionEntry: Converter<IInclusionEntry>;
  readonly receipt: Converter<ITaskInclusionReceipt>;
}

function _uniqueSubscriptions(value: ReadonlyArray<SubscriptionId>): Result<ReadonlyArray<SubscriptionId>> {
  const seen: Set<string> = new Set<string>();
  for (const id of value) {
    if (seen.has(id)) {
      return fail(`update audience: duplicate subscription id '${id}'`);
    }
    seen.add(id);
  }
  return succeed(value);
}

function _strictlyAscending(ids: ReadonlyArray<UpdateId>): boolean {
  return ids.every((id, index) => index === 0 || ids[index - 1] < id);
}

function _compareEntries(a: IInclusionEntry, b: IInclusionEntry): number {
  if (a.taskId !== b.taskId) {
    return a.taskId < b.taskId ? -1 : 1;
  }
  return a.revision - b.revision;
}

/**
 * Builds the {@link IContextConverters}.
 * @public
 */
export function buildContextConverters(
  bounds: ITaskFieldBounds,
  ids: IIdentityConverters,
  values: IValueConverters,
  envelopes: IEnvelopeConverters
): IContextConverters {
  const summary: Converter<ITaskSummary> = Converters.strictObject<ITaskSummary>({
    envelope: envelopes.envelope
  });

  const presentable: Converter<ITaskSummary> = Converters.strictObject<{
    envelope: ITaskEnvelope;
    details?: JsonValue;
  }>({
    envelope: envelopes.envelope,
    details: JsonConverters.jsonValue.optional()
  }).map((value) => succeed<ITaskSummary>({ envelope: value.envelope }));

  const updateCategory: Converter<UpdateCategory> =
    Converters.enumeratedValue<UpdateCategory>(allUpdateCategories);

  const update: Converter<ITaskUpdate> = Converters.strictObject<ITaskUpdate>({
    id: ids.updateId,
    taskId: ids.taskId,
    revision: taskRevision,
    category: updateCategory,
    required: Converters.boolean,
    snapshot: summary,
    // Bounded by the shared reference bound, as a capacity claim's audience is: the
    // closeout arithmetic reserves that many links per payload.
    audience: boundedArrayOf(ids.subscriptionId, bounds.maxReferences, 'update audience').withConstraint(
      _uniqueSubscriptions
    ),
    coalesced: Converters.strictObject<{ fromRevision: ITaskUpdate['revision'] }>({
      fromRevision: taskRevision
    }).optional()
  }).withConstraint((value: ITaskUpdate): Result<ITaskUpdate> => {
    // The payload must be the state the update names. An update for revision 3 carrying a
    // revision-4 snapshot would render one thing and be receipted as another.
    const envelope: ITaskEnvelope = value.snapshot.envelope;
    if (envelope.id !== value.taskId || envelope.revision !== value.revision) {
      return fail(
        `update ${value.id}: names ${value.taskId}@${value.revision} but carries ${envelope.id}@${envelope.revision}`
      );
    }
    if (value.coalesced !== undefined) {
      if (value.required) {
        return fail(`update ${value.id}: a required update never coalesces`);
      }
      if (value.coalesced.fromRevision >= value.revision) {
        return fail(`update ${value.id}: it can only supersede earlier revisions`);
      }
    }
    return succeed(value);
  });

  const unresolvedReference: Converter<IUnresolvedTaskReference> =
    Converters.strictObject<IUnresolvedTaskReference>({
      id: ids.taskId,
      revision: taskRevision,
      kind: ids.taskKind,
      detailVersion: positiveSafeInteger,
      title: boundedSingleLine(bounds.maxTitleLength, 'title'),
      parentId: ids.taskId.optional(),
      responsibility: values.responsibility.optional(),
      scopes: values.scopes,
      binding: values.sourceBinding,
      reason: boundedText(bounds.maxSummaryLength, 'unresolved reason')
    });

  const completeness: Converter<TaskInputCompleteness> = Converters.enumeratedValue<TaskInputCompleteness>([
    'complete',
    'partial'
  ]);

  const max: number = taskContextLimits.maxInputEntries;
  const input: Converter<ITaskContextInput> = Converters.strictObject<ITaskContextInput>({
    tasks: boundedArrayOf(presentable, max, 'context tasks'),
    unresolved: boundedArrayOf(unresolvedReference, max, 'context unresolved references').optional(),
    updates: boundedArrayOf(update, max, 'context updates').optional(),
    deliveryId: ids.deliveryId.optional(),
    completeness
  });

  const budget: Converter<ITaskContextBudget> = Converters.strictObject<ITaskContextBudget>({
    maxItems: positiveSafeInteger.withConstraint((value: number): Result<number> => {
      if (value > taskContextLimits.maxItems) {
        return fail(`maxItems: ${value} exceeds the limit of ${taskContextLimits.maxItems}`);
      }
      return succeed(value);
    }),
    maxDepth: nonNegativeSafeInteger,
    maxChars: positiveSafeInteger
  });

  const inclusionEntry: Converter<IInclusionEntry> = Converters.strictObject<IInclusionEntry>({
    taskId: ids.taskId,
    revision: taskRevision,
    // At most one update per category per task revision, so a revision can deliver at most
    // one update of each category.
    updateIds: boundedArrayOf(ids.updateId, allUpdateCategories.length, 'inclusion update ids')
  }).withConstraint((value: IInclusionEntry): Result<IInclusionEntry> => {
    if (!_strictlyAscending(value.updateIds)) {
      return fail(`inclusion ${value.taskId}@${value.revision}: update ids must be unique and ascending`);
    }
    return succeed(value);
  });

  const receipt: Converter<ITaskInclusionReceipt> = Converters.strictObject<ITaskInclusionReceipt>({
    version: Converters.literal<1>(1),
    deliveryId: ids.deliveryId.optional(),
    included: boundedArrayOf(inclusionEntry, taskContextLimits.maxItems, 'receipt entries')
  }).withConstraint((value: ITaskInclusionReceipt): Result<ITaskInclusionReceipt> => {
    // Canonical order makes a receipt a value: two receipts describing the same inclusion
    // are identical, and a reordered one is not quietly equivalent. Strictly ascending also
    // rules out a repeated (task, revision).
    const seen: Set<string> = new Set<string>();
    for (let i = 0; i < value.included.length; i++) {
      const entry: IInclusionEntry = value.included[i];
      if (i > 0 && _compareEntries(value.included[i - 1], entry) >= 0) {
        return fail(
          `receipt: entry ${entry.taskId}@${entry.revision} is out of order or repeated; entries must be unique and ascending`
        );
      }
      // An update ID names exactly one (task, revision, category), so it cannot be
      // delivered by two entries.
      for (const updateId of entry.updateIds) {
        if (seen.has(updateId)) {
          return fail(`receipt: update id '${updateId}' appears in more than one entry`);
        }
        seen.add(updateId);
      }
    }
    return succeed(value);
  });

  return {
    summary,
    presentable,
    updateCategory,
    update,
    unresolvedReference,
    completeness,
    input,
    budget,
    inclusionEntry,
    receipt
  };
}
