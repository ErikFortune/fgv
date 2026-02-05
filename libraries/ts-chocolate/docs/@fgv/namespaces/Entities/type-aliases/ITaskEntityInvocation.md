[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / ITaskEntityInvocation

# Type Alias: ITaskEntityInvocation

> **ITaskEntityInvocation** = [`IInlineTaskEntity`](../interfaces/IInlineTaskEntity.md) \| [`ITaskRefEntity`](../namespaces/Tasks/interfaces/ITaskRefEntity.md)

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:197](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L197)

A task invocation - either a reference to a library task or an inline task definition.
Discriminated by the presence of `task` (inline) vs `taskId` (ref).
