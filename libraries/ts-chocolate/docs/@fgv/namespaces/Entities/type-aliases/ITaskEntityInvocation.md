[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / ITaskEntityInvocation

# Type Alias: ITaskEntityInvocation

> **ITaskEntityInvocation** = [`IInlineTaskEntity`](../interfaces/IInlineTaskEntity.md) \| [`ITaskRefEntity`](../namespaces/Tasks/interfaces/ITaskRefEntity.md)

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:197](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L197)

A task invocation - either a reference to a library task or an inline task definition.
Discriminated by the presence of `task` (inline) vs `taskId` (ref).
