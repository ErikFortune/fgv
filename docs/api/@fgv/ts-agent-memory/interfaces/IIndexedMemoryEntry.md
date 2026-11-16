[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IIndexedMemoryEntry

# Interface: IIndexedMemoryEntry

What the index HOLDS and what every index read returns: a record's scope and
its [IMemoryEnvelope](IMemoryEnvelope.md), and **no body**.

## Remarks

The index is a derived *selection* structure, and selection has never needed a
body — every filter the store and the retrievers apply reads envelope fields
(`scope` / `kind` / `tags` / `contentHash` / `provenance` / `links` /
`temporal` / `updated` / `seq` / `rank`). Returning whole records made every
conforming index hold every body by construction, which was the store's
resident-memory ceiling; returning envelopes removes it from the contract
rather than from one implementation.

A caller that needs the body **materializes it explicitly** — through
[IMemoryStore.getById](IMemoryStore.md#getbyid), or an `IMemoryRecordResolver` where one is
wired. That is deliberately visible: a lazy `body` getter would have kept
every call site compiling while turning a memory read into a file read behind
an unchanged type, which is a silent performance cliff rather than a migration.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-envelope"></a> `envelope` | `readonly` | [`IMemoryEnvelope`](IMemoryEnvelope.md) | The record's envelope. No body — see the remarks. |
| <a id="property-scope"></a> `scope` | `readonly` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) | The scope the record is stored under. |
