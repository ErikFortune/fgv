/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { Result } from '@fgv/ts-utils';
import { IResponsibility, ITaskScope } from './common';
import { ITaskEnvelope, ITaskSnapshot } from './envelope';
import { ITaskSummary, IUnresolvedTaskReference } from './summary';

/**
 * Everything a bound principal can ask to do, each checked separately.
 * @remarks
 * Scopes, hierarchy, responsibility, source binding and command receipts grant none of these.
 *
 * `acknowledge` and `dispose-obligation` are asked in two forms. Naming a task, they ask about that
 * task. Naming **no task**, carrying only a subscription's selection `scopes`, they ask whether the
 * principal may acknowledge, or dispose of obligations, **for any task in those scopes** —
 * `IBoundTaskDelivery.disposeWithheld` asks this for both actions, and `closeSubscription` for
 * `dispose-obligation`. See {@link ITaskAccessRequest}.
 * @public
 */
export type TaskAction =
  | 'read'
  | 'create'
  | 'update-tracked'
  | 'command'
  | 'reassign'
  | 'change-scopes'
  | 'reparent'
  | 'subscribe'
  | 'acknowledge'
  | 'stop'
  | 'release-stop'
  | 'complete-list'
  | 'dispose-obligation'
  | 'archive';

/**
 * Every {@link TaskAction}.
 * @public
 */
export const allTaskActions: ReadonlyArray<TaskAction> = [
  'read',
  'create',
  'update-tracked',
  'command',
  'reassign',
  'change-scopes',
  'reparent',
  'subscribe',
  'acknowledge',
  'stop',
  'release-stop',
  'complete-list',
  'dispose-obligation',
  'archive'
];

/**
 * Which task an access request is about, relative to the operation.
 * @remarks
 * A relationship operation authorizes the child and both affected parents explicitly, so a
 * policy can tell "may move this task" from "may move a task under this one" from "may take a
 * task out from under this one".
 * @public
 */
export type TaskAccessRole = 'subject' | 'parent' | 'previous-parent' | 'new-parent' | 'stop-target';

/**
 * One question put to a host's authorization policy.
 * @remarks
 * `task` is the envelope-only summary — never details — so a policy decides from the same
 * resident data a warm query holds. An unresolved registration is described by its `reference`
 * instead. A `create` subject has neither: `scopes` and `targetResponsibility` describe the task
 * it would be. A `change-scopes` request carries its subject **and** `scopes`: the complete scope
 * set the task will carry once the change commits. A `subscribe` request, and a `dispose-obligation`
 * over a whole subscription, carry the subscription's selection scopes. `targetResponsibility` is
 * `'unassigned'` for an explicit unassignment.
 *
 * **A missing `task` is never a grant.** An `acknowledge` or `dispose-obligation` request with no
 * `task` and no `reference`, only `scopes`, asks the broadest question — may this principal
 * acknowledge, or dispose, for **any** task in those scopes — and is what lets a delivery end
 * obligations for tasks it can no longer be shown (`disposeWithheld`) or close a subscription with
 * its obligations (`closeSubscription`). A policy must answer it on the scopes alone, and must not
 * read the absent task as "nothing to check". A policy that grants it at the scope level but denies
 * particular tasks still lets that binding end those tasks' obligations unseen.
 * @public
 */
export interface ITaskAccessRequest {
  readonly action: TaskAction;
  readonly role: TaskAccessRole;
  readonly task?: ITaskSummary;
  readonly reference?: IUnresolvedTaskReference;
  readonly command?: string;
  readonly targetResponsibility?: IResponsibility | 'unassigned';
  readonly scopes?: ReadonlyArray<ITaskScope>;
}

/**
 * A host's current policy for one principal.
 * @remarks
 * Created by the host for one principal: there is no principal or scope override anywhere in a
 * request. `check` may be asynchronous, so it runs outside the serialized writer; the broker
 * captures `policyEpoch()` with each check and refuses to commit if the epoch has changed by the
 * time it holds the writer. A check that fails or throws is a denial.
 * @public
 */
export interface ITaskAuthorization {
  check(request: ITaskAccessRequest): Promise<Result<boolean>>;
  policyEpoch(): string;
}

/**
 * A task envelope as a bound view presents it.
 * @remarks
 * There is no `binding` member: a view has no way to emit a source binding at all, whatever its
 * projector returns — the projected value is strictly converted, and an extra property fails the
 * call. Outcome artifact references are removed by the default projector.
 * @public
 */
export type IProjectedTaskEnvelope = Omit<ITaskEnvelope, 'binding'>;

/**
 * A task summary as a bound view presents it.
 * @public
 */
export interface IProjectedTaskSummary {
  readonly envelope: IProjectedTaskEnvelope;
}

/**
 * An unresolved registration as a bound view presents it: no binding.
 * @public
 */
export type IProjectedUnresolvedReference = Omit<IUnresolvedTaskReference, 'binding'>;

/**
 * Turns authorized data into what a view may show.
 * @remarks
 * Runs only on data the principal is already authorized to read. Its output is validated, not
 * trusted: a projection that fails, throws, carries a property the projected shape lacks, or
 * describes a different task or revision **fails the call**. Nothing falls back to the
 * unprojected value.
 * `details`, when present, is the only way a view exposes kind details; without it a view
 * exposes none.
 * @public
 */
export interface ITaskProjector {
  envelope(envelope: ITaskEnvelope): Result<IProjectedTaskEnvelope>;
  details?(snapshot: ITaskSnapshot): Result<JsonValue>;
}

/**
 * What a bound view's `inspect` returns.
 * @remarks
 * `commands` are evaluated for this call against the current lifecycle and the current policy;
 * nothing about authority is cached in a record.
 * @public
 */
export type TaskInspection =
  | {
      readonly state: 'resolved';
      readonly envelope: IProjectedTaskEnvelope;
      readonly details?: JsonValue;
      readonly archived: boolean;
      readonly commands: ReadonlyArray<string>;
    }
  | { readonly state: 'unresolved'; readonly reference: IProjectedUnresolvedReference };
