[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / trustedKindAuthority

# Function: trustedKindAuthority()

> **trustedKindAuthority**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskAuthorization`](../interfaces/ITaskAuthorization.md)\>

A fixed `ITaskAuthorization` for a **trusted host principal** — the host itself acting on its own
tasks of one kind or scope.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`ITrustedKindAuthorityParams`](../interfaces/ITrustedKindAuthorityParams.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskAuthorization`](../interfaces/ITaskAuthorization.md)\>

## Remarks

**For trusted host principals only. Never bind it to a model-facing principal**, a tool, or any
principal acting for someone else: it answers from the request alone, with no notion of who is
asking, so it grants every listed action on everything it covers to whoever holds the view.

A request is allowed only when its action is listed, and:

- **A request naming a task** (or an unresolved registration) — in any role — needs that task's kind
  among `kinds`, when given, and *some* of that task's scopes among `scopes`, when given.
- **A request asking for scopes** — a creation or a subscription, which name no task, and a scope
  change, which asks for the scope set the task will carry — needs them matched by `scopeMatch`
  against `scopes`, besides passing the rule above when it also names a task. It is refused when
  `scopes` is omitted, and when it asks for no scope at all. A creation names no kind, so `kinds`
  does not constrain it: its scopes decide it.
- A request that names no task and asks for no scope is refused.

It **ignores** `role`, `command` and `targetResponsibility`: every listed action is allowed in every
role, for every command and toward any assignee. Under `scopeMatch: 'some'` a subscription over an
allowed scope plus another is allowed, and so accrues audience for tasks in that other scope it
cannot read — they are owed to it and withheld from it, never disclosed — and a scope change may
add scopes outside the authority while one allowed scope remains.

Fails when `kinds`, `scopes` or `actions` is an empty list — each would be a policy that silently
allows nothing (or, for `kinds`, reads like "any kind"). The parameters are copied: changing the
arrays afterwards changes nothing.
