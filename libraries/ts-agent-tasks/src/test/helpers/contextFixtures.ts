/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonObject, JsonValue } from '@fgv/ts-json-base';
import { ITaskContext, ITaskContextInput, ITaskInclusionReceipt } from '../../index';

/** A valid envelope, as wire JSON, for task `id` at `revision`, with `extra` merged over it. */
export function envelope(id: string, revision: number, extra: JsonObject = {}): JsonObject {
  return {
    schemaVersion: 1,
    id,
    kind: 'fgv.tracked',
    detailVersion: 1,
    revision,
    title: `task ${id}`,
    stopPolicy: 'none',
    scopes: [{ namespace: 'project', key: 'alpha' }],
    lifecycle: { status: 'running' },
    attention: [],
    recovery: 'not-recoverable',
    observation: { state: 'current', observedAt: '2026-09-22T12:00:00.000Z' },
    createdAt: '2026-09-22T11:00:00.000Z',
    changedAt: '2026-09-22T12:00:00.000Z',
    ...extra
  };
}

/** A summary wrapping {@link envelope}. */
export function summary(id: string, revision: number, extra: JsonObject = {}): JsonObject {
  return { envelope: envelope(id, revision, extra) };
}

/** An update of `category` for task `id` at `revision`, carrying the matching summary. */
export function update(
  updateId: string,
  id: string,
  revision: number,
  category: string,
  required: boolean,
  extra: JsonObject = {}
): JsonObject {
  return {
    id: updateId,
    taskId: id,
    revision,
    category,
    required,
    snapshot: summary(id, revision, extra),
    audience: ['sub-1']
  };
}

/** An unresolved reference for task `id`. */
export function unresolved(id: string, extra: JsonObject = {}): JsonObject {
  return {
    id,
    revision: 1,
    kind: 'acme.job',
    detailVersion: 1,
    title: `pending registration ${id}`,
    scopes: [],
    binding: { sourceId: 'source-a', referenceVersion: 1, reference: { job: id } },
    reason: 'no first observation yet',
    ...extra
  };
}

/**
 * Builds context input from wire JSON. The renderer validates it, so a JSON object is
 * passed through `unknown` exactly as a host's untyped payload would be.
 */
export function input(parts: {
  tasks?: JsonValue[];
  updates?: JsonValue[];
  unresolved?: JsonValue[];
  completeness?: string;
  deliveryId?: string;
}): ITaskContextInput {
  const value: JsonObject = {
    tasks: parts.tasks ?? [],
    completeness: parts.completeness ?? 'complete'
  };
  if (parts.updates) {
    value.updates = parts.updates;
  }
  if (parts.unresolved) {
    value.unresolved = parts.unresolved;
  }
  if (parts.deliveryId) {
    value.deliveryId = parts.deliveryId;
  }
  return value as unknown as ITaskContextInput;
}

/** One parsed data record from a rendered context, with the section it appeared under. */
export interface IParsedRecord {
  readonly section: string;
  readonly record: Record<string, JsonValue>;
}

/**
 * Parses a rendered context's text back into its records, independently of the renderer's
 * own structured output. Lines starting `{` are records; lines starting `[` open a section.
 */
export function parseRecords(context: ITaskContext): IParsedRecord[] {
  const records: IParsedRecord[] = [];
  let section: string = '';
  for (const line of context.text.split('\n')) {
    if (line.startsWith('[')) {
      section = line;
    } else if (line.startsWith('{')) {
      records.push({ section, record: JSON.parse(line) as Record<string, JsonValue> });
    }
  }
  return records;
}

/**
 * Derives, from the text alone, the receipt the text justifies: one entry per rendered task
 * record, and — only for records not marked abbreviated — the given update IDs.
 */
export function receiptFromText(
  context: ITaskContext,
  updateIdsFor: (taskId: string, revision: number) => string[]
): ITaskInclusionReceipt['included'] {
  return parseRecords(context)
    .filter((r) => r.record.task !== undefined)
    .map((r) => {
      const taskId: string = r.record.task as string;
      const revision: number = r.record.revision as number;
      return {
        taskId,
        revision,
        updateIds: r.record.abbreviated === true ? [] : updateIdsFor(taskId, revision)
      };
    })
    .sort((a, b) =>
      a.taskId < b.taskId ? -1 : a.taskId > b.taskId ? 1 : a.revision - b.revision
    ) as unknown as ITaskInclusionReceipt['included'];
}
