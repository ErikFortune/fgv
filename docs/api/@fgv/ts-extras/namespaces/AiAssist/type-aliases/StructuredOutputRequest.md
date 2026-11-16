[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / StructuredOutputRequest

# Type Alias: StructuredOutputRequest

> **StructuredOutputRequest** = [`ISchemaStructuredOutputRequest`](../interfaces/ISchemaStructuredOutputRequest.md) \| [`IJsonObjectStructuredOutputRequest`](../interfaces/IJsonObjectStructuredOutputRequest.md)

A caller's structured-output intent.

## Remarks

A discriminated union rather than an optional `schema` whose absence means
*"json-object please"* — an absence that means something is the shape this repo
has been burned by (see `MemoryEmbedOutcome` in `@fgv/ts-agent-memory`, which
exists because a three-ways-ambiguous absence could not be read).

**The caller supplies intent; the response reports outcome.** A request never
needs to know whether the constraint will be honoured, because
`resolveProviderModel` resolves aliases and tiers at *call* time — a `tier`
request can cascade — so the concrete model that will serve a request is not
knowable to the caller up front. Requiring it to know would be unsound, which
is why the report rides on the response rather than being a lookup.
