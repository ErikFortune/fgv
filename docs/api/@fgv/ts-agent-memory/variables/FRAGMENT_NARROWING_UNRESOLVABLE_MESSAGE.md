[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / FRAGMENT\_NARROWING\_UNRESOLVABLE\_MESSAGE

# Variable: FRAGMENT\_NARROWING\_UNRESOLVABLE\_MESSAGE

> `const` **FRAGMENT\_NARROWING\_UNRESOLVABLE\_MESSAGE**: `string` = `'fragment recall: a record narrowing was supplied but no identity resolver is wired; pass one to FragmentSemanticRetriever.create'`

The loud-degradation message returned when a query carries a record narrowing but
no [IIdentityResolver](../interfaces/IIdentityResolver.md) is wired to resolve it.

## Remarks

Deliberately a `Failure` rather than a silently-global search: answering a scoped
question with an unscoped result is the failure this narrowing exists to remove.
