/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { ITaskAccessRequest, ITaskAuthorization, ITaskScope, TaskAction, _taskScopeKey } from '../types';

/**
 * How {@link trustedKindAuthority} matches the scopes a request **asks for** — a creation's, a
 * subscription's, a scope change's targets — against the scopes it allows.
 *
 * @remarks
 * - `'every'` — every requested scope must be an allowed scope. The default.
 * - `'some'` — at least one requested scope must be an allowed scope. For a host whose tasks carry
 *   a per-instance scope (a conversation, a document) beside the kind's own: under `'every'` the
 *   instance scope is outside the allowed set and the creation is refused. It applies to a scope
 *   change too, so under `'some'` a change may **add scopes outside the authority** as long as one
 *   allowed scope remains.
 *
 * A request that names an existing task is always decided by *some* of that task's own scopes.
 * @public
 */
export type TrustedScopeMatch = 'every' | 'some';

/**
 * Parameters for {@link trustedKindAuthority}.
 * @public
 */
export interface ITrustedKindAuthorityParams {
  /** The task kinds the authority covers, matched exactly. Omitted: any kind. Never empty. */
  readonly kinds?: ReadonlyArray<string>;
  /**
   * The scopes the authority covers, matched by namespace and key. Never empty. Omitted: a request
   * that only names a task is decided on its kind alone, and every request that asks for scopes —
   * a creation, a subscription, a scope change — is refused, because there is no boundary to hold
   * them to.
   */
  readonly scopes?: ReadonlyArray<ITaskScope>;
  /** How requested scopes are matched. Defaults to `'every'`. */
  readonly scopeMatch?: TrustedScopeMatch;
  /** The actions the authority permits. Required and never empty: there is no default of "all". */
  readonly actions: ReadonlyArray<TaskAction>;
  /** The policy epoch the authority reports. It never changes: the answer never does. */
  readonly epoch: string;
}

/**
 * A fixed `ITaskAuthorization` for a **trusted host principal** — the host itself acting on its own
 * tasks of one kind or scope.
 *
 * @remarks
 * **For trusted host principals only. Never bind it to a model-facing principal**, a tool, or any
 * principal acting for someone else: it answers from the request alone, with no notion of who is
 * asking, so it grants every listed action on everything it covers to whoever holds the view.
 *
 * A request is allowed only when its action is listed, and:
 *
 * - **A request naming a task** (or an unresolved registration) — in any role — needs that task's kind
 *   among `kinds`, when given, and *some* of that task's scopes among `scopes`, when given.
 * - **A request asking for scopes** — a creation or a subscription, which name no task, and a scope
 *   change, which asks for the scope set the task will carry — needs them matched by `scopeMatch`
 *   against `scopes`, besides passing the rule above when it also names a task. It is refused when
 *   `scopes` is omitted, and when it asks for no scope at all. A creation names no kind, so `kinds`
 *   does not constrain it: its scopes decide it.
 * - A request that names no task and asks for no scope is refused.
 *
 * It **ignores** `role`, `command` and `targetResponsibility`: every listed action is allowed in every
 * role, for every command and toward any assignee. Under `scopeMatch: 'some'` a subscription over an
 * allowed scope plus another is allowed, and so accrues audience for tasks in that other scope it
 * cannot read — they are owed to it and withheld from it, never disclosed — and a scope change may
 * add scopes outside the authority while one allowed scope remains.
 *
 * Fails when `kinds`, `scopes` or `actions` is an empty list — each would be a policy that silently
 * allows nothing (or, for `kinds`, reads like "any kind"). The parameters are copied: changing the
 * arrays afterwards changes nothing.
 * @public
 */
export function trustedKindAuthority(params: ITrustedKindAuthorityParams): Result<ITaskAuthorization> {
  const empty: string | undefined =
    params.actions.length === 0
      ? 'actions'
      : params.kinds?.length === 0
      ? 'kinds'
      : params.scopes?.length === 0
      ? 'scopes'
      : undefined;
  if (empty !== undefined) {
    return fail(`trustedKindAuthority: ${empty} is empty; omit it or name at least one`);
  }
  const actions: ReadonlySet<TaskAction> = new Set(params.actions);
  const kinds: ReadonlySet<string> | undefined =
    params.kinds !== undefined ? new Set(params.kinds) : undefined;
  const scopes: ReadonlySet<string> | undefined =
    params.scopes !== undefined ? new Set(params.scopes.map(_taskScopeKey)) : undefined;
  const scopeMatch: TrustedScopeMatch = params.scopeMatch ?? 'every';
  const epoch: string = params.epoch;

  const allowed = (request: ITaskAccessRequest): boolean => {
    if (!actions.has(request.action)) {
      return false;
    }
    const subject = request.task !== undefined ? request.task.envelope : request.reference;
    if (subject !== undefined) {
      if (kinds !== undefined && !kinds.has(subject.kind)) {
        return false;
      }
      if (scopes !== undefined && !subject.scopes.some((scope) => scopes.has(_taskScopeKey(scope)))) {
        return false;
      }
    }
    // Nothing asked for: only a named task, already decided above.
    if (request.scopes === undefined) {
      return subject !== undefined;
    }
    const requested: ReadonlyArray<ITaskScope> = request.scopes;
    // Scopes asked for with no boundary to hold them to are refused.
    const inside = (scope: ITaskScope): boolean => scopes !== undefined && scopes.has(_taskScopeKey(scope));
    return (
      requested.length > 0 && (scopeMatch === 'every' ? requested.every(inside) : requested.some(inside))
    );
  };

  return succeed({
    check: async (request: ITaskAccessRequest): Promise<Result<boolean>> => succeed(allowed(request)),
    policyEpoch: (): string => epoch
  });
}
