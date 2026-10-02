/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { IResponsibility, ITaskReference, ITaskScope, ParentStopPolicy, ITaskProgress } from './common';
import { Instant, TaskId, TaskKind, TaskRevision } from './ids';
import { TaskLifecycle } from './lifecycle';
import { ISourceBinding, ObservationHealth, RecoveryDeclaration } from './source';

/**
 * The common, bounded envelope carried by every task regardless of its kind.
 *
 * @remarks
 * Four things version independently and are spelled separately here: `schemaVersion`
 * (this envelope), `detailVersion` (the kind's detail schema), the source binding's
 * own `referenceVersion`, and the repository storage format. V1 writes only
 * `schemaVersion: 1`.
 *
 * Metadata ownership is likewise explicit: `parentId`, `responsibility`, `scopes`,
 * `stopPolicy` and `binding` are catalog-owned, while `lifecycle`, `progress` and
 * `attention` are execution fields a source projection may carry.
 * @public
 */
export interface ITaskEnvelope {
  readonly schemaVersion: 1;
  readonly id: TaskId;
  readonly kind: TaskKind;
  readonly detailVersion: number;
  readonly revision: TaskRevision;
  readonly title: string;
  readonly description?: string;
  readonly parentId?: TaskId;
  readonly stopPolicy: ParentStopPolicy;
  readonly responsibility?: IResponsibility;
  readonly scopes: ReadonlyArray<ITaskScope>;
  readonly lifecycle: TaskLifecycle;
  readonly progress?: ITaskProgress;
  readonly attention: ReadonlyArray<ITaskReference>;
  readonly binding?: ISourceBinding;
  readonly recovery: RecoveryDeclaration;
  readonly observation: ObservationHealth;
  readonly createdAt: Instant;
  readonly changedAt: Instant;
}

/**
 * A task envelope plus its kind-specific details.
 *
 * @remarks
 * At the heterogeneous boundary `T` is `JsonValue` — validated JSON, and deliberately
 * not a promise of any particular application type. A typed snapshot is obtained by
 * decoding through a registered {@link ITaskKindHandle}, never by a caller asserting
 * the type it wants.
 * @public
 */
export interface ITaskSnapshot<T = JsonValue> {
  readonly envelope: ITaskEnvelope;
  readonly details: T;
}
