[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskContextProjection

# Type Alias: TaskContextProjection

> **TaskContextProjection** = (`summary`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskSummary`](../interfaces/ITaskSummary.md)\>

A host-supplied projection applied to every task revision before it is rendered.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `summary` | [`ITaskSummary`](../interfaces/ITaskSummary.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskSummary`](../interfaces/ITaskSummary.md)\>

## Remarks

This is the seam where a host establishes what may be disclosed — redacting a
description, dropping artifacts, hiding a parent. It must be pure for rendering to stay
deterministic. Its output is re-validated, and must keep the input's `id`, `revision` and
`kind`. A projection that fails or throws fails the render; there is no fallback to the
unprojected value.
