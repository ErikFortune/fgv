[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskRepositoryManifest

# Interface: ITaskRepositoryManifest

The repository manifest (`repository.json`): format, identity, the stored capacity
policy, and the flat inventory of records that must exist.

## Remarks

The inventory is **not** a projection of task status. It names records and pending
registration intents, which is what makes a missing accepted record detectable. It is
rewritten on registration only — never on an ordinary task mutation, and not on archive
(the archived record is itself the tombstone).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-consumers"></a> `consumers` | `readonly` | readonly [`ITaskConsumerInventoryEntry`](../type-aliases/ITaskConsumerInventoryEntry.md)[] | - |
| <a id="property-formatversion"></a> `formatVersion` | `readonly` | `1` | - |
| <a id="property-initializedmode"></a> `initializedMode?` | `readonly` | [`TaskRepositoryDurability`](../type-aliases/TaskRepositoryDurability.md) | The durability the repository was initialized in. A repository initialized `process-crash` opens as `session` only on an explicit opt-in (`allowSessionOverDurable`). Absent from a manifest written before the field existed; such a repository opens in either mode, as it always did. |
| <a id="property-manifestrevision"></a> `manifestRevision` | `readonly` | `number` | - |
| <a id="property-profile"></a> `profile` | `readonly` | [`ITaskCapacityProfile`](ITaskCapacityProfile.md) | - |
| <a id="property-repositoryid"></a> `repositoryId` | `readonly` | `string` | - |
| <a id="property-sources"></a> `sources` | `readonly` | readonly [`ITaskInventoryEntry`](../type-aliases/ITaskInventoryEntry.md)[] | - |
| <a id="property-tasks"></a> `tasks` | `readonly` | readonly [`ITaskInventoryEntry`](../type-aliases/ITaskInventoryEntry.md)[] | - |
