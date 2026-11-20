[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryStoreDurabilityOptions

# Interface: IMemoryStoreDurabilityOptions

How [FileTreeMemoryStore.create](../classes/FileTreeMemoryStore.md#create) treats its root's atomic-write capability.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-require"></a> `require?` | `readonly` | [`MemoryDurabilityRequirement`](../type-aliases/MemoryDurabilityRequirement.md) | Refuse to open unless the root can write every record atomically at this guarantee or a stronger one. Absent, the store opens on any mutable root: it writes atomically at the strongest guarantee the root offers, or degrades to plain writes and says so in [FileTreeMemoryStore.durability](../classes/FileTreeMemoryStore.md#durability). |
