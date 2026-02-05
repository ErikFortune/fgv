[Home](../../../README.md) > [Converters](../../README.md) > [Tasks](../README.md) > taskEntityInvocation

# Variable: taskEntityInvocation

Converter for Entities.Tasks.ITaskEntityInvocation | ITaskEntityInvocation
(union of Entities.Tasks.IInlineTaskEntity | IInlineTaskEntity
or Entities.Tasks.ITaskRefEntity | ITaskRefEntity).
Discriminates by the presence of `task` (inline) vs `taskId` (ref).

## Type

`Converter<ITaskEntityInvocation>`
