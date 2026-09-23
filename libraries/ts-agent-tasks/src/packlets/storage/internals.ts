/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { TaskId } from '../types';
import { ITaskRepository } from './model';
import { IScanEvidence } from './openRepository';
import { ITaskProjection } from './projection';
import { RecordReadCounts } from './recordStore';
import { IVisitCounter } from './sortedKeys';
import { TaskIndex } from './taskIndex';
import { MaterializationGate } from './workingSet';

/**
 * A read-only view of one repository's resident structures and work counters.
 *
 * @remarks
 * This is the evidence surface for the query-performance and residency gates: record reads by
 * kind, index entries visited, the most record parses ever in flight, the scan's per-pass reads,
 * and the projection shape itself. It is deliberately not exported from the package — it is
 * reached only by importing this module directly, which the package's tests and `perf/` harness
 * do. Nothing here is a contract.
 * @internal
 */
export interface IRepositoryInspection {
  readonly reads: Readonly<RecordReadCounts>;
  readonly visits: Readonly<IVisitCounter>;
  readonly gate: MaterializationGate;
  readonly index: TaskIndex | undefined;
  readonly projections: ReadonlyMap<TaskId, ITaskProjection>;
  readonly evidence: IScanEvidence;
  readonly cursorHandles: number;
  readonly cache: { readonly entries: number; readonly charge: number };
}

const inspectors: WeakMap<object, () => IRepositoryInspection> = new WeakMap();

/**
 * Registers a repository's inspector. Called by the repository's constructor.
 * @internal
 */
export function registerInspector(repository: object, inspect: () => IRepositoryInspection): void {
  inspectors.set(repository, inspect);
}

/**
 * Inspects a repository this package constructed; `undefined` for any other implementation.
 * @internal
 */
export function inspectRepository(repository: ITaskRepository): IRepositoryInspection | undefined {
  return inspectors.get(repository)?.();
}
