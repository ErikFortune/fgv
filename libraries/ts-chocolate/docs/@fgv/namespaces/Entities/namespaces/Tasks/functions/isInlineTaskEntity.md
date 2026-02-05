[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Tasks](../README.md) / isInlineTaskEntity

# Function: isInlineTaskEntity()

> **isInlineTaskEntity**(`invocation`): `invocation is IInlineTaskEntity`

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:215](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L215)

Type guard for inline task - discriminates by presence of `task`

## Parameters

### invocation

[`ITaskEntityInvocation`](../../../type-aliases/ITaskEntityInvocation.md)

The task invocation to check

## Returns

`invocation is IInlineTaskEntity`

True if the invocation is an inline task
