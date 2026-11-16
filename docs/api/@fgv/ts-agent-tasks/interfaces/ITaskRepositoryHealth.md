[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskRepositoryHealth

# Interface: ITaskRepositoryHealth

Health of a repository's committed view.

## Remarks

`unavailable` means the repository is fenced: a write's outcome is unknown, a record no
longer agrees with what was committed, or an index update failed after its record committed.
Every further operation fails until the host rebuilds the indexes
([ITaskRepository.rebuildIndexes](ITaskRepository.md#rebuildindexes)) or closes and reopens — both re-read what is actually
on disk. `rebuilding` is the window in which a rebuild has released the old index and not yet
published the new one; queries are fenced throughout it. `generation` advances on every
committed change and on every rebuild.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-generation"></a> `generation` | `readonly` | `number` |
| <a id="property-issues"></a> `issues` | `readonly` | readonly `string`[] |
| <a id="property-state"></a> `state` | `readonly` | `"closed"` \| `"ready"` \| `"unavailable"` \| `"rebuilding"` |
