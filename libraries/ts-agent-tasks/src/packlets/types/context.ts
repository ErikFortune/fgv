/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { DeliveryId, TaskId, TaskKind, TaskRevision, UpdateId } from './ids';
import { ITaskSummary, IUnresolvedTaskReference } from './summary';
import { ITaskUpdate } from './updates';

/**
 * Bounds on one rendered task context.
 *
 * @remarks
 * `maxChars` counts UTF-16 code units of the *whole* rendered text, framing and omission
 * report included. The renderer reserves the framing before selecting anything, and rejects
 * a budget too small to hold it. No token count is claimed.
 * @public
 */
export interface ITaskContextBudget {
  /** Maximum number of rendered items: task revisions plus unresolved diagnostics. */
  readonly maxItems: number;
  /** Maximum depth in the visible task tree. Roots of the visible forest are depth 0. */
  readonly maxDepth: number;
  /** Maximum length of the rendered text, in UTF-16 code units. */
  readonly maxChars: number;
}

/**
 * The default {@link ITaskContextBudget}: 20 items, depth 3, 8,000 characters.
 * @public
 */
export const defaultTaskContextBudget: ITaskContextBudget = {
  maxItems: 20,
  maxDepth: 3,
  maxChars: 8000
};

/**
 * Fixed ceilings on context input and output, independent of any budget.
 * @public
 */
export interface ITaskContextLimits {
  /** Largest `maxItems` a budget may request, and so the most entries a receipt can hold. */
  readonly maxItems: number;
  /** Most entries accepted in each of the input's `tasks`, `updates` and `unresolved`. */
  readonly maxInputEntries: number;
}

/**
 * The {@link ITaskContextLimits} every renderer and receipt converter applies.
 * @public
 */
export const taskContextLimits: ITaskContextLimits = {
  maxItems: 200,
  maxInputEntries: 10000
};

/**
 * One task revision a rendered context actually included.
 *
 * @remarks
 * `updateIds` names only the updates whose *complete* bounded payload was rendered. An item
 * shown in abbreviated form keeps its revision here and carries no update IDs: an abbreviated
 * presentation is not delivery of what it abbreviated.
 * @public
 */
export interface IInclusionEntry {
  readonly taskId: TaskId;
  readonly revision: TaskRevision;
  readonly updateIds: ReadonlyArray<UpdateId>;
}

/**
 * A pure description of what one rendered context included.
 *
 * @remarks
 * A receipt is a value, not a checkpoint and not proof of delivery. Producing one writes
 * nothing. It is canonical: entries are ordered by task ID then revision, update IDs are
 * ordered within an entry, and neither repeats — so two receipts describing the same
 * inclusion are identical. `deliveryId` is echoed from the input when one was supplied; the
 * renderer never mints one and never authenticates one.
 * @public
 */
export interface ITaskInclusionReceipt {
  readonly version: 1;
  readonly deliveryId?: DeliveryId;
  readonly included: ReadonlyArray<IInclusionEntry>;
}

/**
 * Whether a context input is the whole of what its host selected, or a page of it.
 * @public
 */
export type TaskInputCompleteness = 'complete' | 'partial';

/**
 * What a host hands the renderer: already-authorized, already-selected task values.
 *
 * @remarks
 * `tasks` is current state, at most one revision per task; duplicates of the same revision
 * (overlapping scope selections, typically) collapse, and a conflict fails. `updates` are
 * change payloads the host is presenting, and are the only source of update IDs — a
 * snapshot-only host that supplies none gets a receipt with none. Snapshots are accepted in
 * `tasks`; their details are discarded, never rendered.
 * @public
 */
export interface ITaskContextInput {
  readonly tasks: ReadonlyArray<ITaskSummary>;
  readonly unresolved?: ReadonlyArray<IUnresolvedTaskReference>;
  readonly updates?: ReadonlyArray<ITaskUpdate>;
  readonly deliveryId?: DeliveryId;
  readonly completeness: TaskInputCompleteness;
}

/**
 * Where a rendered task revision appears.
 *
 * @remarks
 * `attention` holds anything carrying outstanding attention; `updates` holds other revisions
 * presented as changes; `current` holds current state carrying no change.
 * @public
 */
export type TaskContextSection = 'attention' | 'updates' | 'current';

/**
 * Whether an item was rendered in full, or with its descriptive prose abbreviated.
 * @public
 */
export type TaskContextPresentation = 'complete' | 'abbreviated';

/**
 * One rendered task revision, as structured data alongside the text.
 * @public
 */
export interface ITaskContextEntry {
  /** The projected summary that was rendered. */
  readonly summary: ITaskSummary;
  readonly section: TaskContextSection;
  readonly presentation: TaskContextPresentation;
  /** Depth in the visible task tree. */
  readonly depth: number;
  /** The update IDs this entry delivered — the same list as its receipt entry. */
  readonly updateIds: ReadonlyArray<UpdateId>;
}

/**
 * Why something visible was not rendered, or why the rendering is not exhaustive.
 * @public
 */
export type TaskContextOmissionReason = 'items' | 'depth' | 'text' | 'partial-input';

/**
 * What a rendered context left out of what it was given.
 *
 * @remarks
 * Counts cover only what the host supplied. Nothing hidden is counted, and nothing is
 * inferred about what an omitted or unsupplied item would have said.
 * @public
 */
export interface ITaskContextOmissions {
  /** Supplied items (task revisions and unresolved diagnostics) not rendered in any form. */
  readonly visibleItems: number;
  /** Required updates whose IDs are absent from the receipt — omitted or abbreviated. */
  readonly requiredUpdates: number;
  /** Items rendered in abbreviated form. */
  readonly abbreviated: number;
  /** The distinct reasons that applied, in a fixed order. */
  readonly reasons: ReadonlyArray<TaskContextOmissionReason>;
  /** True only when the input was complete and every supplied item was rendered. */
  readonly exhaustive: boolean;
}

/**
 * One unresolved reference as rendered: exactly the fields the text shows, and no more.
 *
 * @remarks
 * Deliberately not an {@link IUnresolvedTaskReference}: that carries the source binding and
 * the registration record's revision, neither of which is ever presented. The structured view
 * discloses no more than the text does.
 * @public
 */
export interface ITaskContextDiagnostic {
  readonly id: TaskId;
  readonly kind: TaskKind;
  readonly title: string;
  readonly reason: string;
  readonly depth: number;
}

/**
 * A rendered task context: framed text, its structured view, and an inclusion receipt.
 * @public
 */
export interface ITaskContext {
  /** The framed, escaped context text. Task prose inside it is data, not instruction. */
  readonly text: string;
  /** The task revisions rendered, in render order. */
  readonly entries: ReadonlyArray<ITaskContextEntry>;
  /** The unresolved references rendered as diagnostics, reduced to what the text shows. */
  readonly diagnostics: ReadonlyArray<ITaskContextDiagnostic>;
  readonly receipt: ITaskInclusionReceipt;
  readonly omissions: ITaskContextOmissions;
}

/**
 * A host-supplied projection applied to every task revision before it is rendered.
 *
 * @remarks
 * This is the seam where a host establishes what may be disclosed — redacting a
 * description, dropping artifacts, hiding a parent. It must be pure for rendering to stay
 * deterministic. Its output is re-validated, and must keep the input's `id`, `revision` and
 * `kind`. A projection that fails or throws fails the render; there is no fallback to the
 * unprojected value.
 * @public
 */
export type TaskContextProjection = (summary: ITaskSummary) => Result<ITaskSummary>;
