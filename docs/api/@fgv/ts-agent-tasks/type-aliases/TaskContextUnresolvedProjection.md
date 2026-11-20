[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskContextUnresolvedProjection

# Type Alias: TaskContextUnresolvedProjection

> **TaskContextUnresolvedProjection** = (`reference`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IContextUnresolvedReference`](IContextUnresolvedReference.md)\>

A host-supplied projection applied to every unresolved reference before it is rendered.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `reference` | [`IContextUnresolvedReference`](IContextUnresolvedReference.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IContextUnresolvedReference`](IContextUnresolvedReference.md)\>

## Remarks

The unresolved counterpart of [TaskContextProjection](TaskContextProjection.md), with the same contract: it
must be pure, its output is re-validated and must keep the input's `id`, `revision` and
`kind`, and a projection that fails or throws fails the render with no fallback. A host that
redacts task titles or hides parents redacts or hides them here too — the projected
`parentId` is the one the visible tree uses.
