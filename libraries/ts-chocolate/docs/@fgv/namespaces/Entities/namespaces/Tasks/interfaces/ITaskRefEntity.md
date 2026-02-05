[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Tasks](../README.md) / ITaskRefEntity

# Interface: ITaskRefEntity

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:113](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L113)

Represents a step's reference to a reusable task with parameter values.

## Properties

### params

> `readonly` **params**: `Record`\<`string`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:125](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L125)

Parameter values to pass to the task template.
Keys are variable names, values can be primitives or nested objects.
Common values are flat (e.g., temp: 45)
Complex data can be dotted (e.g., ingredient: name: 'chocolate', type: 'dark')

***

### taskId

> `readonly` **taskId**: [`TaskId`](../../../../../../type-aliases/TaskId.md)

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:117](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L117)

Full task ID (collectionId.baseTaskId)
