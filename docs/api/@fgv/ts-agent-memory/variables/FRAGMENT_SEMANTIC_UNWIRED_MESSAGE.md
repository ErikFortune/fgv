[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / FRAGMENT\_SEMANTIC\_UNWIRED\_MESSAGE

# Variable: FRAGMENT\_SEMANTIC\_UNWIRED\_MESSAGE

> `const` **FRAGMENT\_SEMANTIC\_UNWIRED\_MESSAGE**: `string` = `'fragment recall: no fragment index is wired; wire an IFragmentSemanticBackend to enable sub-document search'`

The loud-degradation message a [FragmentSemanticRetriever](../classes/FragmentSemanticRetriever.md) returns when a
fragment query is issued but no [backend](../interfaces/IFragmentSemanticBackend.md) is
wired — the discovery surface NEVER answers a fragment query with a silent empty.
