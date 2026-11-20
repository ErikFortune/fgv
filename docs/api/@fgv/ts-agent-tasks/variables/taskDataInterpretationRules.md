[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / taskDataInterpretationRules

# Variable: taskDataInterpretationRules

> `const` **taskDataInterpretationRules**: `string`

Fixed, trusted rules telling a model how to read the task context that follows them.

## Remarks

Placed in the stable prefix by [taskPromptTemplate](../functions/taskPromptTemplate.md), before any host slot, so that the
instruction to treat task records as data is itself frozen text and never part of the volatile
per-request value. The renderer's own framing (`<task-context version="1">` and its preamble)
repeats the rule inside the slot.
