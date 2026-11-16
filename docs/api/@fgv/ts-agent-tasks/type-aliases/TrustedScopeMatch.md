[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TrustedScopeMatch

# Type Alias: TrustedScopeMatch

> **TrustedScopeMatch** = `"every"` \| `"some"`

How [trustedKindAuthority](../functions/trustedKindAuthority.md) matches the scopes a request **asks for** — a creation's, a
subscription's, a scope change's targets — against the scopes it allows.

## Remarks

- `'every'` — every requested scope must be an allowed scope. The default.
- `'some'` — at least one requested scope must be an allowed scope. For a host whose tasks carry
  a per-instance scope (a conversation, a document) beside the kind's own: under `'every'` the
  instance scope is outside the allowed set and the creation is refused. It applies to a scope
  change too, so under `'some'` a change may **add scopes outside the authority** as long as one
  allowed scope remains.

A request that names an existing task is always decided by *some* of that task's own scopes.
