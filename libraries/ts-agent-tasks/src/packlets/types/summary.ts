/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { IResponsibility, ITaskScope } from './common';
import { ITaskEnvelope } from './envelope';
import { TaskId, TaskKind, TaskRevision } from './ids';
import { ISourceBinding } from './source';

/**
 * The presentable part of a task: its envelope, without kind-specific details.
 *
 * @remarks
 * Details are never implicitly model-visible, so a summary carries none. A validated
 * {@link ITaskSnapshot} satisfies this shape structurally; where the context renderer
 * accepts one, it discards `details` explicitly at the boundary rather than rendering it.
 * @public
 */
export interface ITaskSummary {
  readonly envelope: ITaskEnvelope;
}

/**
 * A registered external task whose first usable observation has not arrived.
 *
 * @remarks
 * An unresolved reference has no lifecycle — none is invented for it — and so it carries
 * no revision a consumer could acknowledge. The renderer shows it only as a diagnostic,
 * never as a receipt entry, and never renders its `binding`.
 * @public
 */
export interface IUnresolvedTaskReference {
  readonly id: TaskId;
  readonly revision: TaskRevision;
  readonly kind: TaskKind;
  readonly detailVersion: number;
  readonly title: string;
  readonly parentId?: TaskId;
  readonly responsibility?: IResponsibility;
  readonly scopes: ReadonlyArray<ITaskScope>;
  readonly binding: ISourceBinding;
  readonly reason: string;
}
