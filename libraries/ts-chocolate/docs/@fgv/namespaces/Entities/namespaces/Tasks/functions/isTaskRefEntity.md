[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Tasks](../README.md) / isTaskRefEntity

# Function: isTaskRefEntity()

> **isTaskRefEntity**(`invocation`): `invocation is ITaskRefEntity`

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:205](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L205)

Type guard for task ref - discriminates by presence of `taskId`

## Parameters

### invocation

[`ITaskEntityInvocation`](../../../type-aliases/ITaskEntityInvocation.md)

The task invocation to check

## Returns

`invocation is ITaskRefEntity`

True if the invocation is a task reference
