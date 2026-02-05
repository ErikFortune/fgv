[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Tasks](../README.md) / isTaskRefEntity

# Function: isTaskRefEntity()

> **isTaskRefEntity**(`invocation`): `invocation is ITaskRefEntity`

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:205](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L205)

Type guard for task ref - discriminates by presence of `taskId`

## Parameters

### invocation

[`ITaskEntityInvocation`](../../../type-aliases/ITaskEntityInvocation.md)

The task invocation to check

## Returns

`invocation is ITaskRefEntity`

True if the invocation is a task reference
