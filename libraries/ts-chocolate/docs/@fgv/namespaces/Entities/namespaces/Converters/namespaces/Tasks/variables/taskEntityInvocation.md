[**@fgv/ts-chocolate**](../../../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../../../README.md) / [Entities](../../../../../README.md) / [Converters](../../../README.md) / [Tasks](../README.md) / taskEntityInvocation

# Variable: taskEntityInvocation

> `const` **taskEntityInvocation**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskEntityInvocation`](../../../../../type-aliases/ITaskEntityInvocation.md)\>

Defined in: [ts-chocolate/src/packlets/entities/tasks/converters.ts:125](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/tasks/converters.ts#L125)

Converter for [ITaskEntityInvocation](../../../../../type-aliases/ITaskEntityInvocation.md)
(union of [IInlineTaskEntity](../../../../../interfaces/IInlineTaskEntity.md)
or [ITaskRefEntity](../../../../Tasks/interfaces/ITaskRefEntity.md)).
Discriminates by the presence of `task` (inline) vs `taskId` (ref).
