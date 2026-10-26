/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, succeed } from '@fgv/ts-utils';
import { ITaskAccessRequest, ITaskAuthorization, ITaskScope, TaskAction } from '../types';

/**
 * How {@link trustedKindAuthority} matches the scopes a request **asks for** — a creation's, a
 * subscription's, a scope change's targets — against the scopes it allows.
 *
 * @remarks
 * - `'every'` — every requested scope must be an allowed scope. The default.
 * - `'some'` — at least one requested scope must be an allowed scope. For a host whose tasks carry
 *   a per-instance scope (a conversation, a document) beside the kind's own: under `'every'` the
 *   instance scope is outside the allowed set and the creation is refused.
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
  /** The task kinds the authority covers, matched exactly. Omitted: any kind. */
  readonly kinds?: ReadonlyArray<string>;
  /**
   * The scopes the authority covers, matched by namespace and key. Omitted: any scope a task
   * already carries — and then no request that names no task (a creation, a subscription) is
   * allowed, because there is nothing to decide it by.
   */
  readonly scopes?: ReadonlyArray<ITaskScope>;
  /** How requested scopes are matched. Defaults to `'every'`. */
  readonly scopeMatch?: TrustedScopeMatch;
  /** The actions the authority permits. Required: there is no default of "all". */
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
 *   change's targets — needs them matched by `scopeMatch` against `scopes`. It is refused when
 *   `scopes` is omitted, and when it asks for no scope at all. A creation names no kind, so `kinds`
 *   does not constrain it: its scopes decide it.
 * - A request that names no task and asks for no scope is refused.
 *
 * The parameters are copied: changing the arrays afterwards changes nothing.
 * @public
 */
export function trustedKindAuthority(params: ITrustedKindAuthorityParams): ITaskAuthorization {
  const actions: ReadonlySet<TaskAction> = new Set(params.actions);
  const kinds: ReadonlySet<string> | undefined =
    params.kinds !== undefined ? new Set(params.kinds) : undefined;
  const scopes: ReadonlySet<string> | undefined =
    params.scopes !== undefined ? new Set(params.scopes.map(_key)) : undefined;
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
      if (scopes !== undefined && !subject.scopes.some((scope) => scopes.has(_key(scope)))) {
        return false;
      }
    }
    // Nothing asked for, or no boundary to hold it to: only a named task, already decided above.
    if (request.scopes === undefined || scopes === undefined) {
      return subject !== undefined;
    }
    const requested: ReadonlyArray<ITaskScope> = request.scopes;
    const inside = (scope: ITaskScope): boolean => scopes.has(_key(scope));
    return requested.length > 0 && (scopeMatch === 'every' ? requested.every(inside) : requested.some(inside));
  };

  return {
    check: async (request: ITaskAccessRequest): Promise<Result<boolean>> => succeed(allowed(request)),
    policyEpoch: (): string => epoch
  };
}

/** A collision-free key for a scope. */
function _key(scope: ITaskScope): string {
  return JSON.stringify([scope.namespace, scope.key]);
}
