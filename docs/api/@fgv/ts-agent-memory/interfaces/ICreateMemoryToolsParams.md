[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / ICreateMemoryToolsParams

# Interface: ICreateMemoryToolsParams

Parameters for [createMemoryTools](../functions/createMemoryTools.md).

## Remarks

**Scope isolation is constructor-fixed.** The [store](#property-store) is the sole scope authority — it is the
actor's own, pre-scoped memory root. No tool's `parametersSchema` declares a
`scope` (or any scope-widening) property, so an LLM cannot steer a tool at
another actor's memory.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-codecs"></a> `codecs?` | `readonly` | `ReadonlyMap`\<[`Kind`](../type-aliases/Kind.md), [`IIdentityCodec`](IIdentityCodec.md)\> | Per-kind identity codecs, used by `memory_write` to map the domain [EntityId](../type-aliases/EntityId.md) to the record's storage id (the store resolves codecs internally for `get` / `delete`, so read / delete do not need them). Absent → `memory_write` uses [ICreateMemoryToolsParams.defaultCodec \| defaultCodec](#property-defaultcodec), and fails loudly for a kind with no resolvable codec. The read-only default tool set needs no codecs. |
| <a id="property-defaultcodec"></a> `defaultCodec?` | `readonly` | [`IIdentityCodec`](IIdentityCodec.md) | Default identity codec for kinds without an explicit [codecs](#property-codecs) entry. |
| <a id="property-handlefor"></a> `handleFor?` | `readonly` | (`record`) => `string` | Optional host hook mapping a record to its agent-visible handle (an evocative mnemonic tag). When supplied, `memory_search` / `memory_context` / `memory_read` items use the returned handle as their display key; when absent the raw [MemoryId](../type-aliases/MemoryId.md) is used. Items carry their `id` and `scope` either way, and those, not the handle, are what links and context seeds take. |
| <a id="property-kinds"></a> `kinds?` | `readonly` | readonly [`Kind`](../type-aliases/Kind.md)[] | Optional whitelist of toolable kinds. When present, a tool `kind` argument outside this set is rejected. When absent, [registry.has](IBodyConverterRegistry.md#has) is the sole kind gate. |
| <a id="property-projectitem"></a> `projectItem?` | `readonly` | (`record`, `detail`) => [`IMemoryToolItemProjection`](IMemoryToolItemProjection.md) | Optional host projector mapping a record (and the requested detail tier) to its agent-visible [IMemoryToolItemProjection](IMemoryToolItemProjection.md). When supplied, every `memory_search` / `memory_context` / `memory_read` result item is produced by this callback — the host owns how much of the body a `'gist'` vs `'full'` result carries, so it can bound the default (`'gist'`) path. When absent, the built-in default projection is used (full body plus the [handleFor](#property-handlefor) handle), which ignores the detail tier — behavior is byte-identical to a build with no projector. The callback is guarded exactly like `handleFor`: a throw degrades to the default full-body projection for that item rather than failing the whole search. The hook does not own [id](IMemoryToolResultItem.md#property-id) or [scope](IMemoryToolResultItem.md#property-scope): the tool layer sets both on every item after the hook runs, so a value the hook returns is overwritten and one it omits is still present. |
| <a id="property-registry"></a> `registry` | `readonly` | [`IBodyConverterRegistry`](IBodyConverterRegistry.md) | Body converter registry — gates the toolable kinds via `has(kind)`. |
| <a id="property-retriever"></a> `retriever` | `readonly` | [`IMemoryRetriever`](IMemoryRetriever.md) | Retriever backing `memory_search` (and `memory_context` via link traversal). |
| <a id="property-store"></a> `store` | `readonly` | [`IMemoryStore`](IMemoryStore.md) | The pre-scoped memory store (the actor's own memory root). Sole scope authority — backs `memory_write` / `memory_read` / `memory_delete`. |
| <a id="property-tools"></a> `tools?` | `readonly` | readonly [`MemoryToolName`](../type-aliases/MemoryToolName.md)[] | The per-tool enable subset. Defaults to [DEFAULT\_MEMORY\_TOOLS](../variables/DEFAULT_MEMORY_TOOLS.md) (the read-only set). Name `memory_write` / `memory_delete` here to opt into the mutating tools. |
