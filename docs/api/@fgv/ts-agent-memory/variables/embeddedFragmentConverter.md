[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / embeddedFragmentConverter

# Variable: embeddedFragmentConverter

> `const` **embeddedFragmentConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IEmbeddedFragment`](../interfaces/IEmbeddedFragment.md)\>

Converter for an [IEmbeddedFragment](../interfaces/IEmbeddedFragment.md), and the boundary that enforces the
fragment-identifiability invariant: **at least one of `locator` / `fragmentId`
must be present.**

## Remarks

The invariant lives here rather than in the type. A conditional-required union
(`{ locator; fragmentId? } | { locator?; fragmentId }`) was considered and
declined: it costs at every construction site and buys nothing at the read site,
where each field reads as `… | undefined` either way. What it must not cost is
identifiability — a fragment carrying neither identity cannot be resolved back to
anything by a consumer holding the query hit, so it is rejected here.
