[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Tasks](../README.md) / isTaskRefEntity

# Function: isTaskRefEntity()

> **isTaskRefEntity**(`invocation`): `invocation is ITaskRefEntity`

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:205](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L205)

Type guard for task ref - discriminates by presence of `taskId`

## Parameters

### invocation

[`ITaskEntityInvocation`](../../../type-aliases/ITaskEntityInvocation.md)

The task invocation to check

## Returns

`invocation is ITaskRefEntity`

True if the invocation is a task reference
