[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / runTaskRepositoryConformance

# Function: runTaskRepositoryConformance()

> **runTaskRepositoryConformance**(`factory`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskRepositoryConformanceReport`](../interfaces/ITaskRepositoryConformanceReport.md)\>\>

Runs the behavioural conformance suite against a repository implementation.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `factory` | [`TaskRepositoryFactory`](../type-aliases/TaskRepositoryFactory.md) |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskRepositoryConformanceReport`](../interfaces/ITaskRepositoryConformanceReport.md)\>\>

## Remarks

A custom `ITaskRepository` — a host's own storage — must answer queries with the same
semantics as `FileTreeTaskRepository`: scope unions deduplicated before paging, lifecycle
classes, exact pages without a trailing empty one, cursors that refuse a different query and
go stale on change, due boundaries, owed updates that outlive open work and archive, archive
that removes a task from queries but not its identity or source binding, the complete child set
archived children included, list-completion candidates kept current by every commit, and a
rebuild that answers exactly as before. Framework-free: it succeeds with the report when every check
passes, and fails naming the checks that did not, so any test runner can assert it.

It checks behaviour, not data structures — the resident-index shape and work counters are the
built-in repository's own evidence, and no custom repository is held to them.
