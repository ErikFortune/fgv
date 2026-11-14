[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / probeTaskRepositoryRoot

# Function: probeTaskRepositoryRoot()

> **probeTaskRepositoryRoot**(`root`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskRepositoryRootProbe`](../type-aliases/ITaskRepositoryRootProbe.md)\>

Asks a root which repository modes it can hold — the same question
`FileTreeTaskRepository.open` and `initialize` ask before they touch anything.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `root` | [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskRepositoryRootProbe`](../type-aliases/ITaskRepositoryRootProbe.md)\>

## Remarks

The capability inquiry is authoritative, not the guard: `FileTree.isAtomicDirectoryItem` only says
the methods exist. A root qualifies for a guarantee only when it reports `atomicReplace` **and**
lists that guarantee; a root that lists guarantees without `atomicReplace` qualifies for nothing.
There is one definition of this, and the repository's own binding uses it, so a host deciding a
mode in advance cannot reach a different answer than the repository will.

Fails for a root that is not a directory, and when the root cannot answer the inquiry. A root
without the capability succeeds with no mode and a `reason`.
