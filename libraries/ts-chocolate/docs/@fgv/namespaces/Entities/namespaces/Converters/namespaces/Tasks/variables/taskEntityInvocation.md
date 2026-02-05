[**@fgv/ts-chocolate**](../../../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../../../README.md) / [Entities](../../../../../README.md) / [Converters](../../../README.md) / [Tasks](../README.md) / taskEntityInvocation

# Variable: taskEntityInvocation

> `const` **taskEntityInvocation**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskEntityInvocation`](../../../../../type-aliases/ITaskEntityInvocation.md)\>

Defined in: [ts-chocolate/src/packlets/entities/tasks/converters.ts:125](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/tasks/converters.ts#L125)

Converter for [ITaskEntityInvocation](../../../../../type-aliases/ITaskEntityInvocation.md)
(union of [IInlineTaskEntity](../../../../../interfaces/IInlineTaskEntity.md)
or [ITaskRefEntity](../../../../Tasks/interfaces/ITaskRefEntity.md)).
Discriminates by the presence of `task` (inline) vs `taskId` (ref).
